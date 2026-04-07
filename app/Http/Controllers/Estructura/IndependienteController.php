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

        $stats = DB::table('empleado')
            ->select([
                'empleado.ur',
                DB::raw('COUNT(DISTINCT empleado.id) as total_empleados'),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'confirmado' THEN 1 ELSE 0 END) as confirmadas"),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'pendiente' THEN 1 ELSE 0 END) as pendientes"),
            ])
            ->leftJoin('asignacion_empleado_producto as aep', function ($join) use ($anio): void {
                $join->on('aep.empleado_id', '=', 'empleado.id')
                    ->where('aep.anio', '=', $anio);
            })
            ->where('empleado.estado_delegacion', 'activo')
            ->groupBy('empleado.ur')
            ->get()
            ->keyBy('ur');

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
                $ur = $row->ur_referencia !== null ? (string) $row->ur_referencia : null;
                $s = $ur !== null ? $stats->get($ur) : null;
                return [
                    'codigo' => $row->codigo,
                    'ur_referencia' => $row->ur_referencia,
                    'referencia_nombre' => $row->dependenciaReferencia?->nombre,
                    'total_empleados' => (int) ($s?->total_empleados ?? 0),
                    'actualizados' => (int) ($s?->confirmadas ?? 0),
                    'faltan' => (int) ($s?->pendientes ?? 0),
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
