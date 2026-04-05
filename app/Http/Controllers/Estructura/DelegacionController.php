<?php

declare(strict_types=1);

namespace App\Http\Controllers\Estructura;

use App\Http\Controllers\Controller;
use App\Models\Delegacion;
use App\Models\Dependencia;
use App\Models\Empleado;
use App\Models\User;
use App\Notifications\AlertaVestuarioNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DelegacionController extends Controller
{
    private const ANIO_REFERENCIA = 2025;

    public function index(Request $request): Response
    {
        $search = $request->input('search');

        // Stats de progreso por delegación (una sola query eficiente)
        $stats = DB::table('empleado')
            ->select([
                'empleado.delegacion_codigo',
                DB::raw('COUNT(DISTINCT empleado.id) as total_empleados'),
                DB::raw('COUNT(aep.id) as total_asignaciones'),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'confirmado' THEN 1 ELSE 0 END) as confirmadas"),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'pendiente' THEN 1 ELSE 0 END) as pendientes"),
            ])
            ->leftJoin('asignacion_empleado_producto as aep', function ($join) {
                $join->on('aep.empleado_id', '=', 'empleado.id')
                    ->where('aep.anio', '=', self::ANIO_REFERENCIA);
            })
            ->where('empleado.estado_delegacion', 'activo')
            ->groupBy('empleado.delegacion_codigo')
            ->get()
            ->keyBy('delegacion_codigo');

        // Totales globales para las tarjetas de resumen
        $globalTotal       = $stats->sum('total_asignaciones');
        $globalConfirmadas = $stats->sum('confirmadas');
        $globalPendientes  = $stats->sum('pendientes');

        // Delegados por delegación (puede haber varios)
        $delegadosPor = DB::table('delegado_delegacion')
            ->join('delegado', 'delegado.id', '=', 'delegado_delegacion.delegado_id')
            ->select('delegado_delegacion.delegacion_codigo', 'delegado.nombre_completo')
            ->orderBy('delegado.nombre_completo')
            ->get()
            ->groupBy('delegacion_codigo')
            ->map(fn ($rows) => $rows->pluck('nombre_completo')->all());

        $delegaciones = Delegacion::query()
            ->with('dependenciaReferencia:ur,nombre')
            ->when($search, function ($query, $search) {
                $query->where('codigo', 'like', "%{$search}%")
                      ->orWhereHas('dependenciaReferencia', function ($q) use ($search) {
                          $q->where('nombre', 'like', "%{$search}%")
                            ->orWhere('ur', 'like', "%{$search}%");
                      });
            })
            ->orderBy('codigo')
            ->paginate(15)
            ->withQueryString()
            ->through(function (Delegacion $row) use ($stats, $delegadosPor) {
                $s = $stats->get($row->codigo);
                $total       = (int) ($s?->total_asignaciones ?? 0);
                $confirmadas = (int) ($s?->confirmadas ?? 0);
                $pendientes  = (int) ($s?->pendientes ?? 0);
                $porcentaje  = $total > 0 ? round(($confirmadas / $total) * 100) : 0;

                return [
                    'codigo'             => $row->codigo,
                    'ur_referencia'      => $row->ur_referencia,
                    'referencia_nombre'  => $row->dependenciaReferencia?->nombre,
                    'delegados'          => $delegadosPor->get($row->codigo, []),
                    'total_empleados'    => (int) ($s?->total_empleados ?? 0),
                    'total_asignaciones' => $total,
                    'confirmadas'        => $confirmadas,
                    'pendientes'         => $pendientes,
                    'porcentaje'         => $porcentaje,
                ];
            });

        $dependenciasList = Dependencia::query()
            ->orderBy('ur')
            ->get(['ur', 'nombre', 'nombre_corto']);

        return Inertia::render('Estructura/Delegaciones/Index', [
            'delegaciones'     => $delegaciones,
            'dependenciasList' => $dependenciasList,
            'filters'          => $request->only(['search']),
            'anio'             => self::ANIO_REFERENCIA,
            'resumen'          => [
                'total'       => (int) $globalTotal,
                'confirmadas' => (int) $globalConfirmadas,
                'pendientes'  => (int) $globalPendientes,
                'porcentaje'  => $globalTotal > 0
                    ? round(($globalConfirmadas / $globalTotal) * 100)
                    : 0,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'codigo' => ['required', 'string', 'max:50', 'unique:delegacion,codigo'],
            'ur_referencia' => ['nullable', 'integer', 'exists:dependencia,ur'],
        ]);

        Delegacion::create([
            'codigo' => $validated['codigo'],
            'ur_referencia' => $validated['ur_referencia'] ?: null,
        ]);

        return redirect()->route('delegaciones.index');
    }

    public function update(Request $request, Delegacion $delegacion): RedirectResponse
    {
        $validated = $request->validate([
            'ur_referencia' => ['nullable', 'integer', 'exists:dependencia,ur'],
        ]);

        $delegacion->update([
            'ur_referencia' => $validated['ur_referencia'] ?: null,
        ]);

        return redirect()->route('delegaciones.index');
    }

    public function destroy(Delegacion $delegacion): RedirectResponse
    {
        $codigo = $delegacion->codigo;

        if (Empleado::query()->where('delegacion_codigo', $codigo)->exists()) {
            return redirect()->route('delegaciones.index')->withErrors([
                'delegacion' => 'No se puede eliminar: hay empleados en esta delegación.',
            ]);
        }

        if (DB::table('delegado_delegacion')->where('delegacion_codigo', $codigo)->exists()) {
            return redirect()->route('delegaciones.index')->withErrors([
                'delegacion' => 'No se puede eliminar: la delegación está asignada a delegados.',
            ]);
        }

        if (DB::table('dependencia_delegacion')->where('delegacion_codigo', $codigo)->exists()) {
            return redirect()->route('delegaciones.index')->withErrors([
                'delegacion' => 'No se puede eliminar: existe en la relación dependencia_delegacion.',
            ]);
        }

        $delegacion->delete();

        return redirect()->route('delegaciones.index');
    }

    public function alertar(Delegacion $delegacion): JsonResponse
    {
        // IDs de usuarios vinculados a delegados de esta delegación
        $userIds = DB::table('delegado_delegacion')
            ->where('delegacion_codigo', $delegacion->codigo)
            ->join('delegado', 'delegado.id', '=', 'delegado_delegacion.delegado_id')
            ->whereNotNull('delegado.user_id')
            ->pluck('delegado.user_id');

        if ($userIds->isEmpty()) {
            return response()->json(
                ['message' => 'Esta delegación no tiene delegados con cuenta de usuario.'],
                422,
            );
        }

        $pendientes = (int) DB::table('empleado')
            ->leftJoin('asignacion_empleado_producto as aep', function ($join) {
                $join->on('aep.empleado_id', '=', 'empleado.id')
                    ->where('aep.anio', '=', self::ANIO_REFERENCIA);
            })
            ->where('empleado.delegacion_codigo', $delegacion->codigo)
            ->where('empleado.estado_delegacion', 'activo')
            ->where('aep.estado_anio_actual', 'pendiente')
            ->count();

        $users = User::whereIn('id', $userIds)->get();

        foreach ($users as $user) {
            $user->notify(new AlertaVestuarioNotification($delegacion, $pendientes));
        }

        return response()->json([
            'message'  => "Alerta enviada a {$users->count()} delegado(s).",
            'enviados' => $users->count(),
        ]);
    }
}
