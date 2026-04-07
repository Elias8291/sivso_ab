<?php

declare(strict_types=1);

namespace App\Http\Controllers\Estructura;

use App\Http\Controllers\Controller;
use App\Models\Delegacion;
use App\Models\Dependencia;
use App\Support\SivsoVestuario;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class IndependienteController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $anio = SivsoVestuario::anioReferencia();

        $vestuarioPorEmpleado = DB::table('asignacion_empleado_producto')
            ->select([
                'empleado_id',
                DB::raw('COUNT(*) as total_prendas'),
                DB::raw("SUM(CASE WHEN estado_anio_actual IN ('confirmado','cambio') THEN 1 ELSE 0 END) as confirmadas"),
                DB::raw("SUM(CASE WHEN estado_anio_actual = 'baja' THEN 1 ELSE 0 END) as bajas"),
            ])
            ->where('anio', $anio)
            ->groupBy('empleado_id');

        $stats = DB::table('empleado as e')
            ->leftJoinSub($vestuarioPorEmpleado, 'v', 'v.empleado_id', '=', 'e.id')
            ->select([
                'e.delegacion_codigo',
                DB::raw('COUNT(DISTINCT e.id) as total_empleados'),
                DB::raw("SUM(CASE
                    WHEN COALESCE(v.total_prendas, 0) > 0
                     AND COALESCE(v.confirmadas, 0) >= (COALESCE(v.total_prendas, 0) - COALESCE(v.bajas, 0))
                    THEN 1 ELSE 0 END) as empleados_actualizados"),
            ])
            ->where('e.estado_delegacion', 'activo')
            ->groupBy('e.delegacion_codigo')
            ->get()
            ->keyBy('delegacion_codigo');

        $independientes = Delegacion::query()
            ->where('codigo', 'like', 'IND-%')
            ->with('dependenciaReferencia:ur,nombre')
            ->when($search, function ($query, $s): void {
                $query->where(function ($inner) use ($s): void {
                    $inner->where('codigo', 'like', "%{$s}%")
                        ->orWhereHas('dependenciaReferencia', function ($depQ) use ($s): void {
                            $depQ->where('nombre', 'like', "%{$s}%")
                                ->orWhere('ur', 'like', "%{$s}%");
                        });
                });
            })
            ->orderBy('codigo')
            ->paginate(20)
            ->withQueryString()
            ->through(function (Delegacion $row) use ($stats): array {
                $s = $stats->get($row->codigo);
                return [
                    'codigo' => $row->codigo,
                    'ur_referencia' => $row->ur_referencia,
                    'referencia_nombre' => $row->dependenciaReferencia?->nombre,
                    'total_empleados' => (int) ($s?->total_empleados ?? 0),
                    'actualizados' => (int) ($s?->empleados_actualizados ?? 0),
                    'faltan' => max(0, (int) ($s?->total_empleados ?? 0) - (int) ($s?->empleados_actualizados ?? 0)),
                ];
            });

        $dependencias = Dependencia::query()
            ->orderBy('ur')
            ->get(['ur', 'nombre', 'nombre_corto']);

        return Inertia::render('Estructura/Independientes/Index', [
            'independientes' => $independientes,
            'dependenciasList' => $dependencias,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'codigo' => ['required', 'string', 'max:50', 'regex:/^IND-\d+$/', 'unique:delegacion,codigo'],
            'ur_referencia' => ['nullable', 'integer', 'exists:dependencia,ur'],
        ]);

        Delegacion::create([
            'codigo' => strtoupper(trim($validated['codigo'])),
            'ur_referencia' => $validated['ur_referencia'] ?: null,
        ]);

        return redirect()->route('independientes.index');
    }

    public function update(Request $request, Delegacion $independiente): RedirectResponse
    {
        abort_unless(str_starts_with($independiente->codigo, 'IND-'), 404);

        $validated = $request->validate([
            'ur_referencia' => ['nullable', 'integer', 'exists:dependencia,ur'],
        ]);

        $independiente->update([
            'ur_referencia' => $validated['ur_referencia'] ?: null,
        ]);

        return redirect()->route('independientes.index');
    }

    public function destroy(Delegacion $independiente): RedirectResponse
    {
        abort_unless(str_starts_with($independiente->codigo, 'IND-'), 404);
        $independiente->delete();

        return redirect()->route('independientes.index');
    }
}
