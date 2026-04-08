<?php

declare(strict_types=1);

namespace App\Http\Controllers\Vestuario;

use App\Http\Controllers\Controller;
use App\Models\Delegacion;
use App\Models\User;
use App\Support\SivsoPermissions;
use App\Support\SivsoVestuario;
use App\Support\VestuarioCotizadoJoin;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ResumenVestuarioController extends Controller
{
    /** @return list<int> */
    private function aniosDisponibles(): array
    {
        $ref = SivsoVestuario::anioActual();

        return [$ref - 2, $ref - 1, $ref, $ref + 1];
    }

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = Auth::user();
        abort_unless($user->can(SivsoPermissions::VER_COTEJO_VESTUARIO), 403);

        $anioDefault = SivsoVestuario::anioActual();
        $anio = (int) $request->input('anio', $anioDefault);
        $delegacion = $request->input('delegacion'); // null = todas

        if (! in_array($anio, $this->aniosDisponibles(), true)) {
            $anio = $anioDefault;
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

        // ── Query principal: agrupado por categoría → producto (cotizado resuelto al año de catálogo en .env)
        $anioCatalogo = SivsoVestuario::anioCatalogoResuelto();
        $filas = DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id');
        VestuarioCotizadoJoin::applyCotizadoResuelto($filas, 'aep', $anioCatalogo);
        $filas = $filas->leftJoin('clasificacion_bien as cb', function ($join): void {
            $join->whereRaw('cb.id = '.VestuarioCotizadoJoin::coalesceClasificacionPrincipalIdSql());
        })
            ->select([
                DB::raw('COALESCE(cb.nombre, "Sin clasificación") as categoria'),
                DB::raw('COALESCE(cb.codigo, "NINGUNA")           as categoria_codigo'),
                DB::raw(VestuarioCotizadoJoin::coalesceClaveSql().' as clave'),
                DB::raw(VestuarioCotizadoJoin::coalesceDescripcionSql().' as descripcion'),
                DB::raw('COUNT(*)                                                                              as total'),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'confirmado' THEN 1 ELSE 0 END)               as confirmadas"),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'pendiente'  THEN 1 ELSE 0 END)               as pendientes"),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'baja'       THEN 1 ELSE 0 END)               as bajas"),
            ])
            ->where('aep.anio', $anio)
            ->where('e.estado_delegacion', 'activo')
            ->whereRaw('('.VestuarioCotizadoJoin::cotizadoResueltoIdSql().') IS NOT NULL')
            ->when(is_array($codigosPermitidos), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosPermitidos))
            ->when($delegacion, fn ($q) => $q->where('e.delegacion_codigo', $delegacion))
            ->groupByRaw(
                'COALESCE(cb.nombre, "Sin clasificación"), COALESCE(cb.codigo, "NINGUNA"), '.
                VestuarioCotizadoJoin::coalesceClaveSql().', '.VestuarioCotizadoJoin::coalesceDescripcionSql()
            )
            ->orderBy('categoria')
            ->orderByDesc('total')
            ->get();

        // ── Agrupar en categorías con sus productos ──────────────────────
        $categorias = $filas
            ->groupBy('categoria')
            ->map(function ($items, $catNombre) {
                $productos = $items->map(fn ($r) => [
                    'clave' => $r->clave,
                    'descripcion' => $r->descripcion,
                    'total' => (int) $r->total,
                    'confirmadas' => (int) $r->confirmadas,
                    'pendientes' => (int) $r->pendientes,
                    'bajas' => (int) $r->bajas,
                    'porcentaje' => $r->total > 0 ? round(($r->confirmadas / $r->total) * 100) : 0,
                ])->values()->all();

                $total = array_sum(array_column($productos, 'total'));
                $confirmadas = array_sum(array_column($productos, 'confirmadas'));
                $pendientes = array_sum(array_column($productos, 'pendientes'));

                return [
                    'nombre' => $catNombre,
                    'codigo' => $items->first()->categoria_codigo,
                    'total' => $total,
                    'confirmadas' => $confirmadas,
                    'pendientes' => $pendientes,
                    'porcentaje' => $total > 0 ? round(($confirmadas / $total) * 100) : 0,
                    'productos' => $productos,
                ];
            })
            ->values()
            ->all();

        // ── Totales globales ─────────────────────────────────────────────
        $globalTotal = (int) $filas->sum('total');
        $globalConfirm = (int) $filas->sum('confirmadas');
        $globalPendientes = (int) $filas->sum('pendientes');

        // Empleados con actualización capturada en el año (para cotejo UR vs Delegación)
        $empleadosActualizados = DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->select([
                'e.id',
                'e.nue',
                'e.nombre',
                'e.apellido_paterno',
                'e.apellido_materno',
                'e.ur',
                'e.delegacion_codigo',
                DB::raw('COUNT(*) as prendas_actualizadas'),
                DB::raw('MAX(aep.talla_actualizada_at) as ultima_actualizacion'),
            ])
            ->where('aep.anio', $anio)
            ->whereNotNull('aep.talla_actualizada_at')
            ->when(is_array($codigosPermitidos), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosPermitidos))
            ->when($delegacion, fn ($q) => $q->where('e.delegacion_codigo', $delegacion))
            ->groupBy('e.id', 'e.nue', 'e.nombre', 'e.apellido_paterno', 'e.apellido_materno', 'e.ur', 'e.delegacion_codigo')
            ->orderByDesc('ultima_actualizacion')
            ->limit(600)
            ->get()
            ->map(static fn ($row) => [
                'id' => (int) $row->id,
                'nue' => $row->nue,
                'nombre_completo' => trim(implode(' ', array_filter([
                    (string) $row->apellido_paterno,
                    (string) $row->apellido_materno,
                    (string) $row->nombre,
                ]))),
                'ur' => $row->ur,
                'delegacion_codigo' => $row->delegacion_codigo,
                'prendas_actualizadas' => (int) $row->prendas_actualizadas,
                'ultima_actualizacion' => $row->ultima_actualizacion,
            ])
            ->values()
            ->all();

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
            'categorias' => $categorias,
            'resumen' => [
                'total' => $globalTotal,
                'confirmadas' => $globalConfirm,
                'pendientes' => $globalPendientes,
                'porcentaje' => $globalTotal > 0 ? round(($globalConfirm / $globalTotal) * 100) : 0,
            ],
            'anio' => $anio,
            'anios_disponibles' => $this->aniosDisponibles(),
            'delegacion_activa' => $delegacion,
            'delegaciones_opciones' => $delegacionesOpciones,
            'empleados_actualizados' => $empleadosActualizados,
            'filters' => $request->only(['anio', 'delegacion']),
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
