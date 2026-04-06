<?php

declare(strict_types=1);

namespace App\Http\Controllers\Vestuario;

use App\Http\Controllers\Controller;
use App\Models\Delegacion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class PartidaController extends Controller
{
    private const IVA_RATE = 0.16;
    private const PARTIDAS_ESPECIFICAS_OBJETIVO = [244, 246];

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $codigosPermitidos = $this->codigosPermitidos($user);

        $aniosDisponibles = DB::table('asignacion_empleado_producto')
            ->distinct()
            ->orderByDesc('anio')
            ->pluck('anio')
            ->map(static fn ($anio): int => (int) $anio)
            ->values()
            ->all();

        $anio = $request->integer('anio');
        if (! in_array($anio, $aniosDisponibles, true)) {
            $anio = $aniosDisponibles[0] ?? (int) now()->year;
        }

        $delegacion = $request->string('delegacion')->toString() ?: null;
        $ur = $request->integer('ur') ?: null;
        if (is_array($codigosPermitidos) && $delegacion !== null && ! in_array($delegacion, $codigosPermitidos, true)) {
            $delegacion = null;
        }

        $query = DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id')
            ->select([
                'pl.partida_especifica',
                'e.ur',
                DB::raw('COUNT(*) as asignaciones'),
                DB::raw('SUM(COALESCE(aep.cantidad, 1)) as piezas'),
                DB::raw('SUM(COALESCE(aep.cantidad, 1) * pl.precio_unitario) as subtotal_sin_iva'),
                DB::raw('SUM(COALESCE(aep.cantidad, 1) * pl.precio_unitario * 1.16) as total_con_iva'),
            ])
            ->where('aep.anio', $anio)
            ->where('pl.anio', $anio)
            ->whereIn('pl.partida_especifica', self::PARTIDAS_ESPECIFICAS_OBJETIVO)
            ->where('e.estado_delegacion', 'activo')
            ->when(is_array($codigosPermitidos), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosPermitidos))
            ->when($delegacion !== null, fn ($q) => $q->where('e.delegacion_codigo', $delegacion))
            ->when($ur !== null, fn ($q) => $q->where('e.ur', $ur))
            ->groupBy('pl.partida_especifica', 'e.ur')
            ->orderBy('pl.partida_especifica')
            ->orderBy('e.ur');

        $rows = $query->get()->map(static fn ($row): array => [
            'partida_especifica' => (int) $row->partida_especifica,
            'ur' => (int) $row->ur,
            'asignaciones' => (int) $row->asignaciones,
            'piezas' => (int) $row->piezas,
            'subtotal_sin_iva' => (float) $row->subtotal_sin_iva,
            'iva' => (float) $row->subtotal_sin_iva * self::IVA_RATE,
            'total_con_iva' => (float) $row->total_con_iva,
        ])->values();

        $resumen = [
            'registros' => $rows->count(),
            'piezas' => (int) $rows->sum('piezas'),
            'subtotal_sin_iva' => (float) $rows->sum('subtotal_sin_iva'),
            'iva' => (float) $rows->sum('iva'),
            'total_con_iva' => (float) $rows->sum('total_con_iva'),
            'iva_rate' => self::IVA_RATE,
        ];

        $ursDisponibles = DB::table('empleado')
            ->when(is_array($codigosPermitidos), fn ($q) => $q->whereIn('delegacion_codigo', $codigosPermitidos))
            ->distinct()
            ->orderBy('ur')
            ->pluck('ur')
            ->map(static fn ($value): int => (int) $value)
            ->values()
            ->all();

        $delegacionesOpciones = Delegacion::query()
            ->when(is_array($codigosPermitidos), fn ($q) => $q->whereIn('codigo', $codigosPermitidos))
            ->orderBy('codigo')
            ->pluck('codigo')
            ->values()
            ->all();

        return Inertia::render('Vestuario/Partidas/Index', [
            'anio' => $anio,
            'anios_disponibles' => $aniosDisponibles,
            'rows' => $rows->all(),
            'resumen' => $resumen,
            'ur_activa' => $ur,
            'delegacion_activa' => $delegacion,
            'urs_disponibles' => $ursDisponibles,
            'delegaciones_opciones' => $delegacionesOpciones,
            'partidas_especificas_fijas' => self::PARTIDAS_ESPECIFICAS_OBJETIVO,
            'filters' => $request->only(['anio', 'ur', 'delegacion']),
        ]);
    }

    /** @return list<string>|null */
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
