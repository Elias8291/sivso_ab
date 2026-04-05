<?php

declare(strict_types=1);

namespace App\Http\Controllers\Vestuario;

use App\Http\Controllers\Controller;
use App\Models\Delegacion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ResumenVestuarioController extends Controller
{
    /** Años disponibles para el filtro */
    private const ANIOS_DISPONIBLES = [2024, 2025, 2026];

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $anio      = (int) $request->input('anio', 2025);
        $delegacion = $request->input('delegacion'); // null = todas

        if (! in_array($anio, self::ANIOS_DISPONIBLES, true)) {
            $anio = 2025;
        }

        // Códigos permitidos según el rol
        $codigosPermitidos = $this->codigosPermitidos($user);

        // Si el usuario solo tiene acceso a ciertas delegaciones,
        // ignorar el filtro manual si intenta acceder a otras
        if (is_array($codigosPermitidos)) {
            if ($delegacion && ! in_array($delegacion, $codigosPermitidos, true)) {
                $delegacion = null;
            }
        }

        // ── Query principal: agrupado por categoría → producto ──────────
        $filas = DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->join('producto_cotizado as pc', 'pc.id', '=', 'aep.producto_cotizado_id')
            ->leftJoin('clasificacion_bien as cb', 'cb.id', '=', 'pc.clasificacion_principal_id')
            ->select([
                DB::raw('COALESCE(cb.nombre, "Sin clasificación") as categoria'),
                DB::raw('COALESCE(cb.codigo, "NINGUNA")           as categoria_codigo'),
                'pc.clave',
                'pc.descripcion',
                DB::raw('COUNT(*)                                                                              as total'),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'confirmado' THEN 1 ELSE 0 END)               as confirmadas"),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'pendiente'  THEN 1 ELSE 0 END)               as pendientes"),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'baja'       THEN 1 ELSE 0 END)               as bajas"),
            ])
            ->where('aep.anio', $anio)
            ->where('e.estado_delegacion', 'activo')
            ->whereNotNull('aep.producto_cotizado_id')
            ->when(is_array($codigosPermitidos), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosPermitidos))
            ->when($delegacion, fn ($q) => $q->where('e.delegacion_codigo', $delegacion))
            ->groupBy('cb.nombre', 'cb.codigo', 'pc.clave', 'pc.descripcion')
            ->orderBy('categoria')
            ->orderByDesc('total')
            ->get();

        // ── Agrupar en categorías con sus productos ──────────────────────
        $categorias = $filas
            ->groupBy('categoria')
            ->map(function ($items, $catNombre) {
                $productos = $items->map(fn ($r) => [
                    'clave'       => $r->clave,
                    'descripcion' => $r->descripcion,
                    'total'       => (int) $r->total,
                    'confirmadas' => (int) $r->confirmadas,
                    'pendientes'  => (int) $r->pendientes,
                    'bajas'       => (int) $r->bajas,
                    'porcentaje'  => $r->total > 0 ? round(($r->confirmadas / $r->total) * 100) : 0,
                ])->values()->all();

                $total      = array_sum(array_column($productos, 'total'));
                $confirmadas = array_sum(array_column($productos, 'confirmadas'));
                $pendientes  = array_sum(array_column($productos, 'pendientes'));

                return [
                    'nombre'      => $catNombre,
                    'codigo'      => $items->first()->categoria_codigo,
                    'total'       => $total,
                    'confirmadas' => $confirmadas,
                    'pendientes'  => $pendientes,
                    'porcentaje'  => $total > 0 ? round(($confirmadas / $total) * 100) : 0,
                    'productos'   => $productos,
                ];
            })
            ->values()
            ->all();

        // ── Totales globales ─────────────────────────────────────────────
        $globalTotal      = (int) $filas->sum('total');
        $globalConfirm    = (int) $filas->sum('confirmadas');
        $globalPendientes = (int) $filas->sum('pendientes');

        // Delegaciones para el filtro (según acceso)
        $delegacionesOpciones = Delegacion::query()
            ->when(
                is_array($codigosPermitidos),
                fn ($q) => $q->whereIn('codigo', $codigosPermitidos),
            )
            ->orderBy('codigo')
            ->get(['codigo'])
            ->pluck('codigo')
            ->all();

        return Inertia::render('Vestuario/Resumen', [
            'categorias'           => $categorias,
            'resumen'              => [
                'total'       => $globalTotal,
                'confirmadas' => $globalConfirm,
                'pendientes'  => $globalPendientes,
                'porcentaje'  => $globalTotal > 0 ? round(($globalConfirm / $globalTotal) * 100) : 0,
            ],
            'anio'                 => $anio,
            'anios_disponibles'    => self::ANIOS_DISPONIBLES,
            'delegacion_activa'    => $delegacion,
            'delegaciones_opciones'=> $delegacionesOpciones,
            'filters'              => $request->only(['anio', 'delegacion']),
        ]);
    }

    /** @return list<string>|null  null = sin restricción (admin) */
    private function codigosPermitidos(User $user): ?array
    {
        if ($user->is_super_admin || $user->hasRole('Administrador SIVSO')) {
            return null;
        }

        $user->loadMissing('delegado.delegaciones');
        $delegado = $user->delegado;

        if (! $delegado || $delegado->delegaciones->isEmpty()) {
            return [];
        }

        return $delegado->delegaciones->pluck('codigo')->unique()->values()->all();
    }
}
