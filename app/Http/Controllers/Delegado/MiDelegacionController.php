<?php

declare(strict_types=1);

namespace App\Http\Controllers\Delegado;

use App\Http\Controllers\Controller;
use App\Http\Requests\Delegado\ActualizarNueMiDelegacionRequest;
use App\Http\Requests\Delegado\ActualizarTallaMiDelegacionRequest;
use App\Http\Requests\Delegado\ActualizarTallasLoteMiDelegacionRequest;
use App\Http\Requests\Delegado\AgregarProductoMiDelegacionRequest;
use App\Http\Requests\Delegado\SolicitarMovimientoMiDelegacionRequest;
use App\Models\AsignacionEmpleadoProducto;
use App\Models\Delegacion;
use App\Models\Empleado;
use App\Models\PeriodoVestuario;
use App\Models\SolicitudMovimiento;
use App\Models\User;
use App\Services\Delegado\AcuseReciboVestuarioPdfService;
use App\Services\Delegado\MiDelegacionAccessService;
use App\Services\Delegado\NotificarAdminsNuevaSolicitudService;
use App\Services\Delegado\ProductosEmpleadoMiDelegacionService;
use App\Support\SivsoVestuario;
use App\Support\VestuarioCotizadoJoin;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Builder\Builder as QrCodeBuilder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

final class MiDelegacionController extends Controller
{
    public function __construct(
        private readonly MiDelegacionAccessService $access,
        private readonly NotificarAdminsNuevaSolicitudService $notificarAdminsNuevaSolicitud,
        private readonly ProductosEmpleadoMiDelegacionService $productosEmpleadoMiDelegacion,
    ) {}

    /** @var list<int> */
    private const PER_PAGE_OPCIONES = [10, 15, 20, 30, 50, 100];

    /** @var list<string> */
    private const FILTROS_VISTA = ['todos', 'listos', 'sin_empezar', 'bajas', 'sin_nue'];

    public function panel(Request $request): InertiaResponse
    {
        /** @var User $user */
        $user = $request->user();

        $codigosDelegacion = $this->access->delegacionCodigosPermitidos($user);
        $contexto = $this->access->contextoDelegadoParaVista($user, $codigosDelegacion);

        $resumenGlobal = $this->calcularResumenDesdeVestuario(
            $this->resumenVestuarioEmpleados($codigosDelegacion)
        );

        $delegacionesDetalle = [];
        $codigos = $contexto['delegaciones'] ?? [];
        if (count($codigos) > 1) {
            $nombres = DB::table('delegacion')
                ->whereIn('codigo', $codigos)
                ->pluck('ur_referencia', 'codigo')
                ->all();

            $filasPorDelegacion = $this->resumenVestuarioEmpleados($codigos);
            foreach ($codigos as $codigo) {
                $sub = $filasPorDelegacion->filter(
                    static fn (array $fila): bool => ($fila['delegacion_codigo'] ?? '') === $codigo
                )->values();
                $ur = $nombres[$codigo] ?? null;
                $nombre = ($ur !== null && $ur !== '')
                    ? sprintf('%s · Ref. UR %s', $codigo, $ur)
                    : $codigo;
                $delegacionesDetalle[] = [
                    'codigo' => $codigo,
                    'nombre' => $nombre,
                    'ur_referencia' => $ur,
                    ...$this->calcularResumenDesdeVestuario($sub),
                ];
            }
        }

        return Inertia::render('Delegado/Panel', [
            'resumen' => [
                ...$resumenGlobal,
                'anio_actual' => $this->anioCaptura(),
                'anio_ref' => $this->anioBase(),
            ],
            'delegaciones_detalle' => $delegacionesDetalle,
            'contexto' => $contexto,
            'periodo' => $this->periodoActualCached(),
            'mis_solicitudes' => $this->misSolicitudesParaPanel($user),
        ]);
    }

    /**
     * @return array{total: int, listos: int, sin_empezar: int, bajas: int, pct_completado: int}
     */
    private function calcularResumenDesdeVestuario(Collection $resumenVestuario): array
    {
        $total = $resumenVestuario->count();
        $listos = $resumenVestuario
            ->filter(static fn (array $fila) => $fila['total_prendas'] > 0 && $fila['confirmadas'] >= $fila['total_prendas'])
            ->count();
        $sinEmpezar = $resumenVestuario
            ->filter(static fn (array $fila) => $fila['total_prendas'] > 0 && $fila['confirmadas'] === 0)
            ->count();
        $bajas = $resumenVestuario
            ->filter(static fn (array $fila) => $fila['estado_delegacion'] === 'baja')
            ->count();

        return [
            'total' => $total,
            'listos' => $listos,
            'sin_empezar' => $sinEmpezar,
            'bajas' => $bajas,
            'pct_completado' => $total > 0 ? (int) round(($listos / $total) * 100) : 0,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function misSolicitudesParaPanel(User $user): array
    {
        return SolicitudMovimiento::query()
            ->where('solicitada_por', $user->id)
            ->with(['empleado:id,nombre,apellido_paterno,apellido_materno,nue'])
            ->latest()
            ->limit(12)
            ->get()
            ->map(static function (SolicitudMovimiento $s): array {
                $emp = $s->empleado;
                $nombreEmp = $emp !== null
                    ? trim(implode(' ', array_filter([
                        (string) $emp->nombre,
                        (string) $emp->apellido_paterno,
                        (string) $emp->apellido_materno,
                    ], static fn ($p) => $p !== '')))
                    : '—';

                return [
                    'id' => $s->id,
                    'tipo' => $s->tipo,
                    'estado' => $s->estado,
                    'delegacion_origen' => $s->delegacion_origen,
                    'delegacion_destino' => $s->delegacion_destino,
                    'empleado_label' => $nombreEmp !== '' ? $nombreEmp : '—',
                    'empleado_nue' => $emp?->nue,
                    'creado_relativo' => $s->created_at?->diffForHumans() ?? '',
                ];
            })
            ->values()
            ->all();
    }

    public function index(Request $request): InertiaResponse
    {
        /** @var User $user */
        $user = $request->user();

        $search = $request->input('search');
        $search = is_string($search) ? trim($search) : null;
        if ($search === '') {
            $search = null;
        }
        $filtro = $request->input('filtro', 'todos');
        if (! is_string($filtro) || ! in_array($filtro, self::FILTROS_VISTA, true)) {
            $filtro = 'todos';
        }

        $perPage = (int) $request->input('per_page', 20);
        if (! in_array($perPage, self::PER_PAGE_OPCIONES, true)) {
            $perPage = 20;
        }
        $delegacionCodigo = $request->input('delegacion_codigo');
        $delegacionCodigo = is_string($delegacionCodigo) ? trim($delegacionCodigo) : null;
        if ($delegacionCodigo === '') {
            $delegacionCodigo = null;
        }
        $modoVista = $request->input('modo');
        $modoVista = is_string($modoVista) ? trim($modoVista) : null;

        $codigosDelegacion = $this->access->delegacionCodigosPermitidos($user);
        $codigosFiltro = $codigosDelegacion;
        if ($delegacionCodigo !== null) {
            if (is_array($codigosDelegacion)) {
                $codigosFiltro = in_array($delegacionCodigo, $codigosDelegacion, true) ? [$delegacionCodigo] : [];
            } else {
                $codigosFiltro = [$delegacionCodigo];
            }
        }

        $contexto = $this->access->contextoDelegadoParaVista($user, $codigosFiltro);

        // Año base: el año anterior (donde ya hay prendas asignadas).
        // Año captura: el año actual (donde se crean los registros actualizados).
        $anioBase = $this->anioBase();
        $anioCaptura = $this->anioCaptura();

        // Orden: bajas al final; luego quienes ya tienen vestuario completo (año base → captura) al final;
        // alfabético entre iguales. Subquery acotado (misma lógica que el resumen). Los totales por fila
        // siguen calculándose solo para la página actual (pageStats).
        $vestOrdenSub = $this->subqueryVestuarioListoParaOrden($codigosFiltro, $search);

        $empleadosQuery = Empleado::query()
            ->with(['dependencia:ur,nombre_corto,nombre', 'delegacion:codigo'])
            ->when(is_array($codigosFiltro), fn ($q) => $q->whereIn('delegacion_codigo', $codigosFiltro))
            ->when($search !== null, function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('apellido_materno', 'like', "%{$search}%")
                        ->orWhere('nue', 'like', "%{$search}%");
                });
            })
            ->leftJoinSub($vestOrdenSub, 'vest_orden', 'vest_orden.empleado_id', '=', 'empleado.id')
            ->orderByRaw("CASE WHEN empleado.estado_delegacion = 'baja' THEN 1 ELSE 0 END ASC")
            ->orderByRaw('COALESCE(vest_orden.vest_listo, 0) ASC')
            ->orderBy('empleado.apellido_paterno')
            ->orderBy('empleado.apellido_materno')
            ->orderBy('empleado.nombre')
            ->select([
                'empleado.id',
                'empleado.nue',
                'empleado.nombre',
                'empleado.apellido_paterno',
                'empleado.apellido_materno',
                'empleado.ur',
                'empleado.delegacion_codigo',
                'empleado.estado_delegacion',
                'empleado.observacion_delegacion',
            ]);

        $resumen = $this->resumenMiDelegacion($codigosFiltro, $search);
        $total = $resumen['total'];
        $listos = $resumen['listos'];
        $sinEmpezar = $resumen['sin_empezar'];

        if ($filtro === 'bajas') {
            $empleadosQuery->where('estado_delegacion', 'baja');
        } else {
            $empleadosQuery->where(function ($q): void {
                $q->where('estado_delegacion', '!=', 'baja')
                    ->orWhereNull('estado_delegacion');
            });

            if ($filtro === 'sin_nue') {
                $empleadosQuery->whereNull('nue');
            } elseif ($filtro === 'listos') {
                $idsListos = $this->empleadosListosAnioActualIds($codigosFiltro, $search);
                $this->restringirEmpleadosPorIds($empleadosQuery, $idsListos);
            } elseif ($filtro === 'sin_empezar') {
                $idsSinEmpezar = $this->empleadosSinEmpezarAnioActualIds($codigosFiltro, $search);
                $this->restringirEmpleadosPorIds($empleadosQuery, $idsSinEmpezar);
            }
        }

        $empleadosPaginator = $empleadosQuery
            ->paginate($perPage)
            ->withQueryString();

        $pageIds = $empleadosPaginator->getCollection()->pluck('id')->map(static fn ($id): int => (int) $id)->all();
        $pageStats = $this->vestuarioStatsYRegistroCapturaPorEmpleadoIds($pageIds);
        $solicitudesPend = $this->solicitudesPendientesPorEmpleadoIds($pageIds);

        $empleadosPaginator->setCollection(
            $empleadosPaginator->getCollection()->map(
                fn (Empleado $e): array => $this->mapEmpleadoParaVistaIndex(
                    $e,
                    $pageStats[$e->id]['stat'] ?? ['total' => 0, 'bajas' => 0, 'confirmadas' => 0],
                    $pageStats[$e->id]['tiene_registro_captura'] ?? false,
                    $solicitudesPend[$e->id] ?? null,
                ),
            ),
        );

        // Delegaciones disponibles para transferencias (cacheado para evitar costo en cada request).
        $delegaciones = Cache::remember(Delegacion::CACHE_DELEGACIONES_OPCIONES_KEY, now()->addMinutes(15), function (): array {
            return Delegacion::query()
                ->select(['codigo', 'ur_referencia'])
                ->orderBy('codigo')
                ->get()
                ->map(fn ($d) => ['codigo' => $d->codigo, 'ur' => $d->ur_referencia])
                ->all();
        });

        return Inertia::render('Delegado/MiDelegacion/Index', [
            'empleados' => $empleadosPaginator,
            'delegaciones' => $delegaciones,
            'contexto' => $contexto,
            'resumen' => [
                'total' => $total,
                'listos' => $listos,
                'sin_empezar' => $sinEmpezar,
                'anio_ref' => $anioBase,
                'anio_actual' => $anioCaptura,
            ],
            'periodo' => $this->periodoActualCached(),
            'filters' => array_merge(
                $request->only(['search']),
                ['filtro' => $filtro, 'per_page' => $perPage, 'delegacion_codigo' => $delegacionCodigo, 'modo' => $modoVista],
            ),
            'acuse_anios_disponibles' => $this->aniosAcuseDisponiblesCached($codigosFiltro, $search),
            'acuse_anio_default' => $anioCaptura,
            'presupuesto_baja_disponible' => $this->presupuestoBajaDisponible($codigosFiltro),
        ]);
    }

    /**
     * Listado de prendas para la vista.
     *
     * Sin año explícito (vista de delegación): muestra las prendas del año anterior
     * y marca como "confirmado" aquellas que ya tienen registro en el año actual.
     * De este modo el delegado ve qué prendas del padrón anterior ya fueron
     * actualizadas para el ejercicio en curso.
     *
     * Con año explícito (PDFs, historial): muestra los registros de ese año directamente.
     *
     * @return list<array<string, mixed>>
     */
    private function vestuarioListaParaEmpleado(Empleado $e, ?int $anio = null): array
    {
        $anioCatalogo = SivsoVestuario::anioCatalogoResuelto();

        // ── Modo histórico / PDF: mostrar el año solicitado directamente ────────
        if ($anio !== null) {
            $q = DB::table('asignacion_empleado_producto as aep')
                ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id');
            VestuarioCotizadoJoin::applyCotizadoResuelto($q, 'aep', $anioCatalogo);

            return $q
                ->where('aep.empleado_id', $e->id)
                ->where('aep.anio', $anio)
                ->select([
                    'aep.id',
                    'aep.talla as talla_anterior',
                    'aep.talla_anio_actual as talla',
                    'aep.medida_anio_actual as medida',
                    'aep.estado_anio_actual as estado',
                    'aep.observacion_anio_actual as observacion',
                    'aep.talla_actualizada_at',
                    'aep.cantidad',
                    DB::raw(VestuarioCotizadoJoin::coalesceDescripcionSql().' as prenda'),
                    DB::raw(VestuarioCotizadoJoin::coalesceClaveSql().' as clave'),
                ])
                ->orderBy('clave')
                ->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'prenda' => $a->prenda,
                    'clave' => $a->clave,
                    'talla_anterior' => $a->talla_anterior,
                    'talla' => $a->talla ?? $a->talla_anterior,
                    'medida' => $a->medida,
                    'estado' => $a->estado ?? 'pendiente',
                    'observacion' => $a->observacion,
                    'talla_actualizada_at' => $a->talla_actualizada_at,
                    'cantidad' => max(1, (int) ($a->cantidad ?? 1)),
                ])
                ->values()
                ->all();
        }

        // ── Modo delegación: año anterior como base, año actual como destino ───
        $anioCaptura = $this->anioCaptura();
        $anioBase = $anioCaptura - 1;

        $q = DB::table('asignacion_empleado_producto as aep')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id')
            ->leftJoin('asignacion_empleado_producto as aep_new', function ($join) use ($anioCaptura): void {
                $join->on('aep_new.empleado_id', '=', 'aep.empleado_id')
                    ->on('aep_new.producto_licitado_id', '=', 'aep.producto_licitado_id')
                    ->where('aep_new.anio', '=', $anioCaptura);
            });
        VestuarioCotizadoJoin::applyCotizadoResuelto($q, 'aep', $anioCatalogo);

        return $q
            ->where('aep.empleado_id', $e->id)
            ->where('aep.anio', $anioBase)
            ->select([
                'aep.id',
                'aep.talla as talla_anterior',
                'aep.cantidad',
                DB::raw('COALESCE(aep_new.talla_anio_actual, aep_new.talla, aep.talla) as talla'),
                DB::raw('aep_new.medida_anio_actual as medida'),
                DB::raw("CASE WHEN aep_new.id IS NOT NULL THEN 'confirmado' ELSE 'pendiente' END as estado"),
                DB::raw('aep_new.talla_actualizada_at as talla_actualizada_at'),
                DB::raw(VestuarioCotizadoJoin::coalesceDescripcionSql().' as prenda'),
                DB::raw(VestuarioCotizadoJoin::coalesceClaveSql().' as clave'),
            ])
            ->orderBy('clave')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'prenda' => $a->prenda,
                'clave' => $a->clave,
                'talla_anterior' => $a->talla_anterior,
                'talla' => $a->talla ?? $a->talla_anterior ?? '',
                'medida' => $a->medida,
                'estado' => $a->estado,
                'observacion' => null, // No se muestran observaciones en la vista de delegación.
                'talla_actualizada_at' => $a->talla_actualizada_at,
                'cantidad' => max(1, (int) ($a->cantidad ?? 1)),
            ])
            ->values()
            ->all();
    }

    /** Año de captura: el ejercicio en curso (donde se crean los registros definitivos). */
    private function anioCaptura(): int
    {
        return (int) date('Y');
    }

    /** Año base: el ejercicio anterior (fuente de prendas a actualizar). */
    private function anioBase(): int
    {
        return $this->anioCaptura() - 1;
    }

    /**
     * JSON al abrir «Ver vestuario»: devuelve las prendas del año anterior con
     * estado basado en la existencia de registros en el año actual.
     */
    public function vestuarioEmpleado(Request $request, int $empleadoId): JsonResponse
    {
        $empleado = Empleado::findOrFail($empleadoId);
        abort_unless($this->access->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);

        return response()->json([
            'data' => [
                'vestuario' => $this->vestuarioListaParaEmpleado($empleado),
                'anio_base' => $this->anioBase(),
                'anio_captura' => $this->anioCaptura(),
                'anio_catalogo' => SivsoVestuario::anioCatalogoResuelto(),
            ],
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Payload ligero para la lista de Mi delegación: sin detalle de prendas (se carga al abrir el panel).
     *
     * @param  array{total: int, bajas: int, confirmadas: int}  $stat
     * @param  array{id: int, tipo: string, delegacion_destino: string|null, baja_modo: string|null}|null  $solicitudPendiente
     * @return array<string, mixed>
     */
    private function mapEmpleadoParaVistaIndex(Empleado $e, array $stat, bool $tieneRegistroAnioActual, ?array $solicitudPendiente): array
    {
        $total = $stat['total'];
        $bajas = $stat['bajas'];
        $confirmadas = $stat['confirmadas'];
        $vestuarioListo = $total > 0 && $confirmadas >= ($total - $bajas);

        return [
            'id' => $e->id,
            'nombre_completo' => strtoupper(trim("{$e->apellido_paterno} {$e->apellido_materno} {$e->nombre}")),
            'nue' => $e->nue,
            'ur' => $e->ur,
            'dependencia_nombre' => $e->dependencia?->nombre ?? $e->dependencia?->nombre_corto ?? 'Sin dependencia',
            'delegacion_codigo' => $e->delegacion_codigo,
            'estado_delegacion' => $e->estado_delegacion ?? 'activo',
            'observacion_delegacion' => $e->observacion_delegacion,
            'vestuario' => [],
            'confirmadas' => $confirmadas,
            'total_prendas' => $total,
            'bajas_vestuario' => $bajas,
            'vestuario_listo' => $vestuarioListo,
            'tiene_registro_anio_actual' => $tieneRegistroAnioActual,
            'solicitud_pendiente' => $solicitudPendiente,
        ];
    }

    /**
     * Stats de vestuario (año base vs captura) + si el empleado ya tiene algún registro en año de captura.
     *
     * @param  list<int>  $empleadoIds
     * @return array<int, array{stat: array{total: int, bajas: int, confirmadas: int}, tiene_registro_captura: bool}>
     */
    private function vestuarioStatsYRegistroCapturaPorEmpleadoIds(array $empleadoIds): array
    {
        if ($empleadoIds === []) {
            return [];
        }

        $anioBase = $this->anioBase();
        $anioCaptura = $this->anioCaptura();

        $regSub = DB::table('asignacion_empleado_producto')
            ->where('anio', $anioCaptura)
            ->whereIn('empleado_id', $empleadoIds)
            ->groupBy('empleado_id')
            ->select('empleado_id');

        $rows = DB::table('asignacion_empleado_producto as aep_base')
            ->leftJoin('asignacion_empleado_producto as aep_new', function ($join) use ($anioCaptura): void {
                $join->on('aep_new.empleado_id', '=', 'aep_base.empleado_id')
                    ->on('aep_new.producto_licitado_id', '=', 'aep_base.producto_licitado_id')
                    ->where('aep_new.anio', '=', $anioCaptura);
            })
            ->leftJoinSub($regSub, 'reg', 'reg.empleado_id', '=', 'aep_base.empleado_id')
            ->where('aep_base.anio', $anioBase)
            ->whereIn('aep_base.empleado_id', $empleadoIds)
            ->groupBy('aep_base.empleado_id')
            ->selectRaw('aep_base.empleado_id, COUNT(aep_base.id) as total, SUM(CASE WHEN aep_new.id IS NOT NULL THEN 1 ELSE 0 END) as confirmadas, MAX(CASE WHEN reg.empleado_id IS NOT NULL THEN 1 ELSE 0 END) as tiene_registro_captura')
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $eid = (int) $row->empleado_id;
            $out[$eid] = [
                'stat' => [
                    'total' => (int) $row->total,
                    'bajas' => 0,
                    'confirmadas' => (int) $row->confirmadas,
                ],
                'tiene_registro_captura' => ((int) ($row->tiene_registro_captura ?? 0)) === 1,
            ];
        }

        return $out;
    }

    /**
     * Empleados "listos": todas las prendas del año anterior ya tienen
     * registro en el año actual.
     *
     * @param  list<string>|null  $codigosDelegacion
     * @return list<int>
     */
    private function empleadosListosAnioActualIds(?array $codigosDelegacion, ?string $search = null): array
    {
        $anioBase = $this->anioBase();
        $anioCaptura = $this->anioCaptura();

        return DB::table('asignacion_empleado_producto as aep_base')
            ->join('empleado as e', 'e.id', '=', 'aep_base.empleado_id')
            ->leftJoin('asignacion_empleado_producto as aep_new', function ($join) use ($anioCaptura): void {
                $join->on('aep_new.empleado_id', '=', 'aep_base.empleado_id')
                    ->on('aep_new.producto_licitado_id', '=', 'aep_base.producto_licitado_id')
                    ->where('aep_new.anio', '=', $anioCaptura);
            })
            ->where('aep_base.anio', $anioBase)
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->when($search !== null, function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('e.nombre', 'like', "%{$search}%")
                        ->orWhere('e.apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('e.apellido_materno', 'like', "%{$search}%")
                        ->orWhere('e.nue', 'like', "%{$search}%");
                });
            })
            ->groupBy('aep_base.empleado_id')
            ->havingRaw('COUNT(aep_base.id) > 0')
            ->havingRaw('SUM(CASE WHEN aep_new.id IS NOT NULL THEN 1 ELSE 0 END) >= COUNT(aep_base.id)')
            ->pluck('aep_base.empleado_id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param  list<string>|null  $codigosDelegacion
     * @return list<int>
     */
    private function empleadosSinEmpezarAnioActualIds(?array $codigosDelegacion, ?string $search = null): array
    {
        $anioBase = $this->anioBase();
        $anioCaptura = $this->anioCaptura();

        return DB::table('asignacion_empleado_producto as aep_base')
            ->join('empleado as e', 'e.id', '=', 'aep_base.empleado_id')
            ->leftJoin('asignacion_empleado_producto as aep_new', function ($join) use ($anioCaptura): void {
                $join->on('aep_new.empleado_id', '=', 'aep_base.empleado_id')
                    ->on('aep_new.producto_licitado_id', '=', 'aep_base.producto_licitado_id')
                    ->where('aep_new.anio', '=', $anioCaptura);
            })
            ->where('aep_base.anio', $anioBase)
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->when($search !== null, function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('e.nombre', 'like', "%{$search}%")
                        ->orWhere('e.apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('e.apellido_materno', 'like', "%{$search}%")
                        ->orWhere('e.nue', 'like', "%{$search}%");
                });
            })
            ->groupBy('aep_base.empleado_id')
            ->havingRaw('COUNT(aep_base.id) > 0')
            ->havingRaw('SUM(CASE WHEN aep_new.id IS NOT NULL THEN 1 ELSE 0 END) = 0')
            ->pluck('aep_base.empleado_id')
            ->map(static fn ($id): int => (int) $id)
            ->values()
            ->all();
    }

    /**
     * @param  list<string>|null  $codigosDelegacion
     * @return array{total:int,listos:int,sin_empezar:int}
     */
    private function resumenMiDelegacion(?array $codigosDelegacion, ?string $search = null): array
    {
        $anioBase = $this->anioBase();
        $anioCaptura = $this->anioCaptura();

        $porEmpleado = DB::table('asignacion_empleado_producto as aep_base')
            ->join('empleado as e', 'e.id', '=', 'aep_base.empleado_id')
            ->leftJoin('asignacion_empleado_producto as aep_new', function ($join) use ($anioCaptura): void {
                $join->on('aep_new.empleado_id', '=', 'aep_base.empleado_id')
                    ->on('aep_new.producto_licitado_id', '=', 'aep_base.producto_licitado_id')
                    ->where('aep_new.anio', '=', $anioCaptura);
            })
            ->where('aep_base.anio', $anioBase)
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->when($search !== null, function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('e.nombre', 'like', "%{$search}%")
                        ->orWhere('e.apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('e.apellido_materno', 'like', "%{$search}%")
                        ->orWhere('e.nue', 'like', "%{$search}%");
                });
            })
            ->groupBy('aep_base.empleado_id')
            ->selectRaw('aep_base.empleado_id, COUNT(aep_base.id) as total_prendas, SUM(CASE WHEN aep_new.id IS NOT NULL THEN 1 ELSE 0 END) as confirmadas');

        $agg = DB::query()
            ->fromSub($porEmpleado, 't')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN total_prendas > 0 AND confirmadas >= total_prendas THEN 1 ELSE 0 END) as listos')
            ->selectRaw('SUM(CASE WHEN total_prendas > 0 AND confirmadas = 0 THEN 1 ELSE 0 END) as sin_empezar')
            ->first();

        return [
            'total' => (int) ($agg->total ?? 0),
            'listos' => (int) ($agg->listos ?? 0),
            'sin_empezar' => (int) ($agg->sin_empezar ?? 0),
        ];
    }

    /**
     * Una fila por empleado: vest_listo = 1 si todas las prendas del año base tienen registro en el año de captura (misma regla que el resumen).
     *
     * @param  list<string>|null  $codigosDelegacion
     * @return \Illuminate\Database\Query\Builder
     */
    private function subqueryVestuarioListoParaOrden(?array $codigosDelegacion, ?string $search)
    {
        $anioBase = $this->anioBase();
        $anioCaptura = $this->anioCaptura();

        $porEmpleado = DB::table('asignacion_empleado_producto as aep_base')
            ->join('empleado as e', 'e.id', '=', 'aep_base.empleado_id')
            ->leftJoin('asignacion_empleado_producto as aep_new', function ($join) use ($anioCaptura): void {
                $join->on('aep_new.empleado_id', '=', 'aep_base.empleado_id')
                    ->on('aep_new.producto_licitado_id', '=', 'aep_base.producto_licitado_id')
                    ->where('aep_new.anio', '=', $anioCaptura);
            })
            ->where('aep_base.anio', $anioBase)
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->when($search !== null, function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('e.nombre', 'like', "%{$search}%")
                        ->orWhere('e.apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('e.apellido_materno', 'like', "%{$search}%")
                        ->orWhere('e.nue', 'like', "%{$search}%");
                });
            })
            ->groupBy('aep_base.empleado_id')
            ->selectRaw('aep_base.empleado_id, COUNT(aep_base.id) as total_prendas, SUM(CASE WHEN aep_new.id IS NOT NULL THEN 1 ELSE 0 END) as confirmadas');

        return DB::query()
            ->fromSub($porEmpleado, 't')
            ->selectRaw('t.empleado_id, CASE WHEN t.total_prendas > 0 AND t.confirmadas >= t.total_prendas THEN 1 ELSE 0 END as vest_listo');
    }

    /**
     * @param  list<int>  $empleadoIds
     * @return array<int, array{id: int, tipo: string, delegacion_destino: string|null, baja_modo: string|null}>
     */
    private function solicitudesPendientesPorEmpleadoIds(array $empleadoIds): array
    {
        if ($empleadoIds === []) {
            return [];
        }

        return SolicitudMovimiento::query()
            ->whereIn('empleado_id', $empleadoIds)
            ->where('estado', 'pendiente')
            ->orderBy('id')
            ->get(['id', 'empleado_id', 'tipo', 'delegacion_destino', 'baja_modo'])
            ->unique('empleado_id')
            ->mapWithKeys(static function (SolicitudMovimiento $s): array {
                return [
                    (int) $s->empleado_id => [
                        'id' => (int) $s->id,
                        'tipo' => (string) $s->tipo,
                        'delegacion_destino' => $s->delegacion_destino,
                        'baja_modo' => $s->baja_modo,
                    ],
                ];
            })
            ->all();
    }

    /**
     * Incluye el listado completo de prendas (joins a catálogo). Usar en PDF y vistas que necesiten detalle.
     *
     * @return array<string, mixed>
     */
    private function mapEmpleadoParaVista(Empleado $e, ?int $anio = null): array
    {
        $asignaciones = $this->vestuarioListaParaEmpleado($e, $anio);

        $confirmadas = collect($asignaciones)->whereIn('estado', ['confirmado', 'cambio'])->count();

        $solicitudPendiente = SolicitudMovimiento::where('empleado_id', $e->id)
            ->where('estado', 'pendiente')
            ->select(['id', 'tipo', 'delegacion_destino', 'baja_modo'])
            ->first();

        $fila = [
            'id' => $e->id,
            'nombre_completo' => strtoupper(trim("{$e->apellido_paterno} {$e->apellido_materno} {$e->nombre}")),
            'nue' => $e->nue,
            'ur' => $e->ur,
            'dependencia_nombre' => $e->dependencia?->nombre ?? $e->dependencia?->nombre_corto ?? 'Sin dependencia',
            'delegacion_codigo' => $e->delegacion_codigo,
            'estado_delegacion' => $e->estado_delegacion ?? 'activo',
            'observacion_delegacion' => $e->observacion_delegacion,
            'vestuario' => $asignaciones,
            'confirmadas' => $confirmadas,
            'total_prendas' => count($asignaciones),
            'bajas_vestuario' => collect($asignaciones)->where('estado', 'baja')->count(),
            'solicitud_pendiente' => $solicitudPendiente ? [
                'id' => $solicitudPendiente->id,
                'tipo' => $solicitudPendiente->tipo,
                'delegacion_destino' => $solicitudPendiente->delegacion_destino,
                'baja_modo' => $solicitudPendiente->baja_modo,
            ] : null,
        ];
        $fila['vestuario_listo'] = $this->empleadoVestuarioListo($fila);

        return $fila;
    }

    /**
     * PDF tipo acuse de recibo (solo si el vestuario está completo según reglas de negocio).
     */
    public function acuseReciboPdf(Request $request, int $empleado): Response
    {
        /** @var User $user */
        $user = $request->user();

        $empleadoModel = Empleado::query()
            ->with(['dependencia:ur,nombre_corto,nombre'])
            ->findOrFail($empleado);

        abort_unless($this->access->usuarioPuedeGestionarEmpleado($user, $empleadoModel), 403);

        $aniosDisponibles = DB::table('asignacion_empleado_producto')
            ->where('empleado_id', $empleadoModel->id)
            ->distinct()
            ->orderByDesc('anio')
            ->pluck('anio')
            ->map(static fn ($anio) => (int) $anio)
            ->values()
            ->all();
        $anioSolicitado = $request->integer('anio');
        $anioConsulta = in_array($anioSolicitado, $aniosDisponibles, true)
            ? $anioSolicitado
            : ($aniosDisponibles[0] ?? $this->anioCaptura());

        $fila = $this->mapEmpleadoParaVista($empleadoModel, $anioConsulta);

        if (! $this->empleadoVestuarioListo($fila)) {
            return response(
                'El vestuario de este empleado no está completo. Confirme todas las prendas antes de generar el acuse.',
                422,
                ['Content-Type' => 'text/plain; charset=UTF-8'],
            );
        }

        $tieneRenglones = collect($fila['vestuario'] ?? [])
            ->contains(fn ($v): bool => is_array($v) && in_array($v['estado'] ?? '', ['confirmado', 'cambio'], true));

        if (! $tieneRenglones) {
            return response(
                'No hay prendas confirmadas para incluir en el acuse.',
                422,
                ['Content-Type' => 'text/plain; charset=UTF-8'],
            );
        }

        $contexto = $this->access->contextoDelegadoParaVista($user, $this->access->delegacionCodigosPermitidos($user));
        $delegadoNombre = $contexto['delegado_nombre'] ?? $user->name ?? 'DELEGADO';

        $service = new AcuseReciboVestuarioPdfService;

        return $service->stream(
            $empleadoModel,
            $delegadoNombre,
            $fila,
            $anioConsulta,
            $anioConsulta,
        );
    }

    public function acuseReciboGeneralPdf(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $anioVestuario = $this->anioCaptura();
        $requestAnioActual = $request->duplicate(
            array_merge($request->query(), ['anio' => $anioVestuario, 'filtro' => 'todos']),
            $request->request->all()
        );
        [$query, $resumenVestuario, $contexto] = $this->buildEmpleadosQueryParaExport($requestAnioActual, $user);
        $query->whereHas('asignaciones', fn ($q) => $q->where('anio', $anioVestuario));
        $empleados = $query->get();
        $delegadoNombre = $contexto['delegado_nombre'] ?? $user->name ?? 'DELEGADO';
        $service = new AcuseReciboVestuarioPdfService;

        $acuses = $empleados
            ->map(function (Empleado $empleado) use ($anioVestuario, $delegadoNombre, $service): array {
                $fila = $this->mapEmpleadoParaVista($empleado, $anioVestuario);
                $data = $service->buildDocumentData(
                    $empleado,
                    (string) $delegadoNombre,
                    $fila,
                    $anioVestuario,
                    $anioVestuario
                );

                $data['qrDataUri'] = $this->qrDataUri(
                    'SIVSO|ACUSE_GENERAL|FOLIO:'.($data['folio'] ?? '').'|NUE:'.($data['nue'] ?? '').'|ANIO:'.$anioVestuario
                );

                return $data;
            })
            ->filter(fn (array $acuse): bool => count($acuse['lineas'] ?? []) > 0)
            ->values()
            ->all();

        if ($acuses === []) {
            return response(
                'No hay empleados con prendas confirmadas en el año actual para generar el acuse general.',
                422,
                ['Content-Type' => 'text/plain; charset=UTF-8'],
            );
        }

        $pdf = Pdf::loadView('pdf.acuse-recibo-general', [
            'acuses' => $acuses,
            'delegadoNombre' => $delegadoNombre,
            'anio' => $anioVestuario,
            'logoDataUri' => $this->logoDataUri(),
        ]);
        $pdf->setPaper('letter', 'portrait');
        $pdf->setOption('defaultFont', 'DejaVu Sans');

        return $pdf->stream('acuse-general-mi-delegacion-'.now()->format('Ymd-His').'.pdf');
    }

    public function listaEmpleadosPdf(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $codigosDelegacion = $this->access->delegacionCodigosPermitidos($user);

        $delegacionCodigo = $request->input('delegacion_codigo');
        $delegacionCodigo = is_string($delegacionCodigo) ? trim($delegacionCodigo) : null;
        if ($delegacionCodigo === '') {
            $delegacionCodigo = null;
        }

        $codigosFiltro = $codigosDelegacion;
        if ($delegacionCodigo !== null) {
            if (is_array($codigosDelegacion)) {
                $codigosFiltro = in_array($delegacionCodigo, $codigosDelegacion, true) ? [$delegacionCodigo] : [];
            } else {
                $codigosFiltro = [$delegacionCodigo];
            }
        }

        $contexto = $this->access->contextoDelegadoParaVista($user, $codigosFiltro);

        $search = $request->input('search');
        $search = is_string($search) ? trim($search) : null;
        if ($search === '') {
            $search = null;
        }

        $empleados = Empleado::query()
            ->when(is_array($codigosFiltro), fn ($q) => $q->whereIn('delegacion_codigo', $codigosFiltro))
            ->where(function ($q): void {
                $q->where('estado_delegacion', '!=', 'baja')
                    ->orWhereNull('estado_delegacion');
            })
            ->when($search !== null, function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('apellido_materno', 'like', "%{$search}%")
                        ->orWhere('nue', 'like', "%{$search}%");
                });
            })
            ->orderBy('apellido_paterno')
            ->orderBy('apellido_materno')
            ->orderBy('nombre')
            ->get();

        $filas = [];
        $n = 1;
        foreach ($empleados as $e) {
            $filas[] = [
                'no' => $n++,
                'nombre' => strtoupper(trim("{$e->apellido_paterno} {$e->apellido_materno} {$e->nombre}")),
                'nue' => (string) ($e->nue ?? '—'),
            ];
        }

        $delegacionesEtiqueta = isset($contexto['delegaciones']) && is_array($contexto['delegaciones']) && $contexto['delegaciones'] !== []
            ? implode(' · ', array_map(static fn ($c): string => strtoupper((string) $c), $contexto['delegaciones']))
            : '';

        $pdf = Pdf::loadView('pdf.lista-empleados', [
            'filas' => $filas,
            'delegadoNombre' => $contexto['delegado_nombre'] ?? $user->name ?? 'DELEGADO',
            'logoDataUri' => $this->logoDataUri(),
            'anioTitulo' => $this->anioCaptura(),
            'codigoDelegacion' => $delegacionesEtiqueta,
        ]);
        $pdf->setPaper('letter', 'portrait');
        $pdf->setOption('defaultFont', 'DejaVu Sans');

        return $pdf->stream('lista-empleados-mi-delegacion-'.now()->format('Ymd-His').'.pdf');
    }

    /**
     * @return array{0: Builder, 1: Collection<int, array{id:int, estado_delegacion:string, total_prendas:int, confirmadas:int, bajas:int}>, 2: array<string, mixed>, 3: int}
     */
    private function buildEmpleadosQueryParaExport(Request $request, User $user): array
    {
        $search = $request->input('search');
        $search = is_string($search) ? trim($search) : null;
        if ($search === '') {
            $search = null;
        }

        $filtro = $request->input('filtro', 'todos');
        if (! is_string($filtro) || ! in_array($filtro, self::FILTROS_VISTA, true)) {
            $filtro = 'todos';
        }

        $delegacionCodigo = $request->input('delegacion_codigo');
        $delegacionCodigo = is_string($delegacionCodigo) ? trim($delegacionCodigo) : null;
        if ($delegacionCodigo === '') {
            $delegacionCodigo = null;
        }

        $codigosDelegacion = $this->access->delegacionCodigosPermitidos($user);
        $codigosFiltro = $codigosDelegacion;
        if ($delegacionCodigo !== null) {
            if (is_array($codigosDelegacion)) {
                $codigosFiltro = in_array($delegacionCodigo, $codigosDelegacion, true) ? [$delegacionCodigo] : [];
            } else {
                $codigosFiltro = [$delegacionCodigo];
            }
        }
        $contexto = $this->access->contextoDelegadoParaVista($user, $codigosFiltro);

        $anioVestuario = $request->integer('anio');
        if ($anioVestuario < 2000 || $anioVestuario > 2100) {
            $anioVestuario = $this->anioCaptura();
        }
        $vestAgg = DB::table('asignacion_empleado_producto')
            ->selectRaw("empleado_id, COUNT(*) AS total_vest, SUM(CASE WHEN estado_anio_actual = 'baja' THEN 1 ELSE 0 END) AS nbaja, SUM(CASE WHEN estado_anio_actual IN ('confirmado','cambio') THEN 1 ELSE 0 END) AS nok")
            ->where('anio', $anioVestuario)
            ->groupBy('empleado_id');

        $empleadosQuery = Empleado::query()
            ->with(['dependencia:ur,nombre_corto,nombre', 'delegacion:codigo'])
            ->when(is_array($codigosFiltro), fn ($q) => $q->whereIn('delegacion_codigo', $codigosFiltro))
            ->when($search !== null, function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('apellido_materno', 'like', "%{$search}%")
                        ->orWhere('nue', 'like', "%{$search}%");
                });
            })
            ->leftJoinSub($vestAgg, 'vest_agg', 'vest_agg.empleado_id', '=', 'empleado.id')
            ->orderByRaw("CASE WHEN empleado.estado_delegacion = 'baja' THEN 1 ELSE 0 END ASC")
            ->orderByRaw('CASE WHEN COALESCE(vest_agg.total_vest, 0) > 0 AND COALESCE(vest_agg.nok, 0) >= (COALESCE(vest_agg.total_vest, 0) - COALESCE(vest_agg.nbaja, 0)) THEN 1 ELSE 0 END ASC')
            ->orderBy('empleado.apellido_paterno')
            ->orderBy('empleado.apellido_materno')
            ->orderBy('empleado.nombre')
            ->select('empleado.*');

        if ($filtro === 'bajas') {
            $empleadosQuery->where('estado_delegacion', 'baja');
        } elseif ($filtro === 'sin_nue') {
            $empleadosQuery->whereNull('nue');
        }

        // bajas = 0: la lógica basada en año no rastrea "bajas" de prenda individual;
        // "confirmada" = existe registro del año actual para esa prenda.
        return [$empleadosQuery, collect(), $contexto, $anioVestuario];
    }

    /**
     * @param  list<string>|null  $codigosDelegacion
     * @return list<int>
     */
    /**
     * @param  list<string>|null  $codigosDelegacion
     * @return list<int>
     */
    private function aniosAcuseDisponiblesCached(?array $codigosDelegacion, ?string $search = null): array
    {
        $key = 'mi-del:acuse-anios:'.md5(json_encode([$codigosDelegacion, $search], JSON_THROW_ON_ERROR));

        return Cache::remember($key, now()->addMinutes(15), function () use ($codigosDelegacion, $search): array {
            return $this->aniosAcuseDisponibles($codigosDelegacion, $search);
        });
    }

    private function aniosAcuseDisponibles(?array $codigosDelegacion, ?string $search = null): array
    {
        return DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->when($search !== null, function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('e.nombre', 'like', "%{$search}%")
                        ->orWhere('e.apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('e.apellido_materno', 'like', "%{$search}%")
                        ->orWhere('e.nue', 'like', "%{$search}%");
                });
            })
            ->distinct()
            ->orderByDesc('aep.anio')
            ->pluck('aep.anio')
            ->map(static fn ($anio) => (int) $anio)
            ->values()
            ->all();
    }

    /**
     * Vestuario completo: hay prendas y todas las que no están en baja quedaron confirmadas o en cambio.
     * Usado por los métodos PDF que consultan el año explícito con estado_anio_actual.
     *
     * @param  array{vestuario: list<array<string, mixed>>, confirmadas: int, total_prendas: int}  $fila
     */
    private function empleadoVestuarioListo(array $fila): bool
    {
        if ($fila['total_prendas'] === 0) {
            return false;
        }

        $enBaja = collect($fila['vestuario'])->where('estado', 'baja')->count();
        $requeridas = $fila['total_prendas'] - $enBaja;

        return $fila['confirmadas'] >= $requeridas;
    }

    /**
     * @param  list<int|string>  $ids
     */
    private function restringirEmpleadosPorIds(Builder $query, array $ids): void
    {
        if ($ids === []) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->whereIn('id', $ids);
    }

    /**
     * Resumen de vestuario por empleado para evitar N+1 al calcular métricas globales.
     * Usa el año anterior como base y el año actual como destino de actualización.
     *
     * @param  list<string>|null  $codigosDelegacion
     * @return Collection<int, array{id:int, delegacion_codigo:string, estado_delegacion:string, total_prendas:int, confirmadas:int, bajas:int}>
     */
    private function resumenVestuarioEmpleados(?array $codigosDelegacion, ?string $search = null): Collection
    {
        $anioBase = $this->anioBase();
        $anioCaptura = $this->anioCaptura();

        return DB::table('empleado as e')
            ->join('asignacion_empleado_producto as aep_base', function ($join) use ($anioBase): void {
                $join->on('aep_base.empleado_id', '=', 'e.id')
                    ->where('aep_base.anio', $anioBase);
            })
            ->leftJoin('asignacion_empleado_producto as aep_new', function ($join) use ($anioCaptura): void {
                $join->on('aep_new.empleado_id', '=', 'aep_base.empleado_id')
                    ->on('aep_new.producto_licitado_id', '=', 'aep_base.producto_licitado_id')
                    ->where('aep_new.anio', $anioCaptura);
            })
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->when($search !== null, function ($query) use ($search): void {
                $query->where(function ($q) use ($search): void {
                    $q->where('e.nombre', 'like', "%{$search}%")
                        ->orWhere('e.apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('e.apellido_materno', 'like', "%{$search}%")
                        ->orWhere('e.nue', 'like', "%{$search}%");
                });
            })
            ->select([
                'e.id',
                'e.delegacion_codigo',
                'e.estado_delegacion',
                DB::raw('COUNT(aep_base.id) as total_prendas'),
                DB::raw('SUM(CASE WHEN aep_new.id IS NOT NULL THEN 1 ELSE 0 END) as confirmadas'),
            ])
            ->groupBy('e.id', 'e.estado_delegacion', 'e.delegacion_codigo')
            ->get()
            ->map(static fn ($row): array => [
                'id' => (int) $row->id,
                'delegacion_codigo' => (string) ($row->delegacion_codigo ?? ''),
                'estado_delegacion' => (string) ($row->estado_delegacion ?? 'activo'),
                'total_prendas' => (int) $row->total_prendas,
                'confirmadas' => (int) $row->confirmadas,
                // bajas = 0: la nueva lógica basada en año no rastrea "baja" de prenda individual.
                'bajas' => 0,
            ]);
    }

    /**
     * Actualiza la talla del año actual para una asignación.
     */
    public function actualizarTalla(ActualizarTallaMiDelegacionRequest $request, int $asignacionId): JsonResponse
    {
        $validated = $request->validated();

        $asignacion = AsignacionEmpleadoProducto::query()->with('empleado')->findOrFail($asignacionId);
        abort_unless($this->access->usuarioPuedeGestionarEmpleado($request->user(), $asignacion->empleado), 403);

        $asignacionObjetivo = $this->resolverAsignacionObjetivoParaCapturaActual($asignacion);
        $asignacionObjetivo->update([
            'talla_anio_actual' => $validated['talla'],
            'medida_anio_actual' => $validated['medida'],
            'estado_anio_actual' => $validated['estado'],
            'observacion_anio_actual' => $validated['observacion'] ?? null,
            'talla_actualizada_at' => now(),
        ]);

        return response()->json([
            'data' => [
                'talla' => $validated['talla'],
                'medida' => $validated['medida'],
                'estado' => $validated['estado'],
                'observacion' => $validated['observacion'] ?? null,
            ],
            'message' => 'Vestuario actualizado correctamente.',
            'errors' => null,
        ]);
    }

    /**
     * Actualiza en bloque las tallas/medidas de todas las asignaciones de un empleado.
     * Recibe: { items: [{ id, talla, medida }] }
     */
    public function actualizarTallasLote(ActualizarTallasLoteMiDelegacionRequest $request, int $empleadoId): JsonResponse
    {
        // Verificar periodo activo
        $periodo = PeriodoVestuario::activo();
        if (! $periodo) {
            return response()->json([
                'data' => null,
                'message' => 'No hay un período de vestuario activo. Las actualizaciones están cerradas.',
                'errors' => null,
            ], 422);
        }

        $validated = $request->validated();

        $empleado = Empleado::findOrFail($empleadoId);
        abort_unless($this->access->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);

        $ids = array_column($validated['items'], 'id');

        // Verificar que todas las asignaciones pertenecen al empleado
        $asignaciones = AsignacionEmpleadoProducto::query()
            ->where('empleado_id', $empleadoId)
            ->whereIn('id', $ids)
            ->get()
            ->keyBy('id');

        if ($asignaciones->count() !== count($ids)) {
            return response()->json([
                'data' => null,
                'message' => 'Una o más asignaciones no pertenecen a este empleado.',
                'errors' => null,
            ], 422);
        }

        $now = now();
        DB::transaction(function () use ($validated, $asignaciones, $now): void {
            foreach ($validated['items'] as $item) {
                $asignacionObjetivo = $this->resolverAsignacionObjetivoParaCapturaActual($asignaciones[$item['id']]);
                $asignacionObjetivo->update([
                    'talla_anio_actual' => $item['talla'] ?? null,
                    'medida_anio_actual' => $item['medida'] ?? null,
                    'estado_anio_actual' => 'confirmado',
                    'talla_actualizada_at' => $now,
                ]);
            }
        });

        return response()->json([
            'data' => ['actualizadas' => count($validated['items'])],
            'message' => 'Vestuario actualizado correctamente.',
            'errors' => null,
        ]);
    }

    /**
     * El delegado envía una solicitud de baja o cambio.
     * S.Administración la revisará y ejecutará el movimiento real.
     */
    public function solicitarMovimiento(SolicitarMovimientoMiDelegacionRequest $request, int $empleadoId): JsonResponse
    {
        $validated = $request->validated();

        if ($validated['tipo'] === 'baja') {
            $modo = $validated['baja_modo'] ?? 'definitiva';
            $validated['baja_modo'] = $modo;
            if ($modo !== 'sustitucion') {
                $validated['sustituto'] = null;
            }
        } else {
            $validated['baja_modo'] = null;
            $validated['sustituto'] = null;
        }

        $empleado = Empleado::findOrFail($empleadoId);
        abort_unless($this->access->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);

        // Verificar que no tenga ya una solicitud pendiente del mismo tipo
        $existente = SolicitudMovimiento::where('empleado_id', $empleadoId)
            ->where('estado', 'pendiente')
            ->first();

        if ($existente) {
            return response()->json([
                'data' => null,
                'message' => 'Ya existe una solicitud pendiente para este empleado.',
                'errors' => ['solicitud' => 'Pendiente de resolución por S.Administración.'],
            ], 422);
        }

        if ($validated['tipo'] === 'baja' && ($validated['baja_modo'] ?? 'definitiva') === 'sustitucion' && isset($validated['sustituto']['nue'])) {
            $nueTrim = trim((string) $validated['sustituto']['nue']);
            if ($nueTrim !== '') {
                $ocupado = Empleado::query()
                    ->where('ur', $empleado->ur)
                    ->where('nue', $nueTrim)
                    ->exists();
                if ($ocupado) {
                    return response()->json([
                        'data' => null,
                        'message' => 'Ya existe un empleado con ese NUE en la misma UR.',
                        'errors' => ['sustituto.nue' => 'NUE duplicado en la UR.'],
                    ], 422);
                }
            }
        }

        $sustitutoPayload = null;
        if ($validated['tipo'] === 'baja' && ($validated['baja_modo'] ?? 'definitiva') === 'sustitucion' && isset($validated['sustituto']) && is_array($validated['sustituto'])) {
            $s = $validated['sustituto'];
            $nueSust = isset($s['nue']) ? trim((string) $s['nue']) : '';
            $nueSust = $nueSust !== '' ? $nueSust : null;
            $sustitutoPayload = [
                'nombre' => $s['nombre'],
                'apellido_paterno' => $s['apellido_paterno'],
                'apellido_materno' => $s['apellido_materno'] ?? '',
                'sexo' => $s['sexo'],
                'nue' => $nueSust,
            ];
        }

        $solicitud = SolicitudMovimiento::create([
            'empleado_id' => $empleadoId,
            'solicitada_por' => Auth::id(),
            'delegacion_origen' => $empleado->delegacion_codigo,
            'delegacion_destino' => $validated['tipo'] === 'cambio' ? $validated['nueva_delegacion'] : null,
            'tipo' => $validated['tipo'],
            'estado' => 'pendiente',
            'observacion_solicitante' => $validated['observacion'] ?? null,
            'baja_modo' => $validated['tipo'] === 'baja' ? ($validated['baja_modo'] ?? 'definitiva') : null,
            'sustituto' => $sustitutoPayload,
        ]);

        $this->notificarAdminsNuevaSolicitud->notify($solicitud);

        return response()->json([
            'data' => [
                'solicitud_id' => $solicitud->id,
                'tipo' => $solicitud->tipo,
                'estado' => $solicitud->estado,
            ],
            'message' => 'Solicitud enviada. S.Administración la revisará a la brevedad.',
            'errors' => null,
        ], 201);
    }

    /**
     * Marca de nuevo como activo al empleado en el listado (corrige baja/cambio marcados en datos).
     */
    public function reactivarEmpleado(Request $request, int $empleadoId): JsonResponse
    {
        $empleado = Empleado::findOrFail($empleadoId);
        abort_unless($this->access->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);

        $estado = $empleado->estado_delegacion ?? 'activo';
        if ($estado === 'baja') {
            return response()->json([
                'data' => null,
                'message' => 'Un empleado dado de baja no se puede reactivar.',
                'errors' => ['estado' => 'La baja es definitiva.'],
            ], 422);
        }
        if ($estado !== 'cambio') {
            return response()->json([
                'data' => null,
                'message' => 'El empleado ya está activo en la delegación.',
                'errors' => ['estado' => 'No aplica reactivación.'],
            ], 422);
        }

        $empleado->update([
            'estado_delegacion' => 'activo',
            'observacion_delegacion' => null,
        ]);

        return response()->json([
            'data' => null,
            'message' => 'Empleado reactivado en tu listado.',
            'errors' => null,
        ]);
    }

    public function actualizarNue(ActualizarNueMiDelegacionRequest $request, int $empleadoId): JsonResponse
    {
        $validated = $request->validated();

        /** @var User $user */
        $user = $request->user();
        $empleado = Empleado::query()->findOrFail($empleadoId);
        abort_unless($this->access->usuarioPuedeGestionarEmpleado($user, $empleado), 403);

        $nueTrim = trim($validated['nue']);
        abort_unless($nueTrim !== '', 422, 'El NUE no puede estar vacío.');

        $duplicado = Empleado::query()
            ->where('ur', $empleado->ur)
            ->where('nue', $nueTrim)
            ->where('id', '!=', $empleado->id)
            ->exists();

        if ($duplicado) {
            return response()->json([
                'data' => null,
                'message' => 'Ya existe un empleado con ese NUE en la misma UR.',
                'errors' => ['nue' => 'NUE duplicado en la UR.'],
            ], 422);
        }

        $empleado->update(['nue' => $nueTrim]);

        return response()->json([
            'data' => ['nue' => $empleado->nue],
            'message' => 'NUE actualizado correctamente.',
            'errors' => null,
        ]);
    }

    public function showEmpleado(Request $request, int $empleadoId): InertiaResponse
    {
        $empleado = Empleado::query()->with('dependencia')->findOrFail($empleadoId);
        abort_unless($this->access->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);

        $aniosConDatos = DB::table('asignacion_empleado_producto')
            ->where('empleado_id', $empleadoId)
            ->distinct()
            ->orderByDesc('anio')
            ->pluck('anio')
            ->map(static fn ($anio) => (int) $anio)
            ->values()
            ->all();

        // Garantizar que siempre haya al menos un año en el selector. Si el empleado
        // aún no tiene asignaciones, mostrar el año de referencia del sistema para que
        // el usuario vea el selector (con estado vacío) en lugar de una pantalla en blanco.
        $anioFallback = SivsoVestuario::anioAsignacionesVestuario();
        $aniosDisponibles = $aniosConDatos !== [] ? $aniosConDatos : [$anioFallback];

        return Inertia::render('Delegado/MiDelegacion/Empleado', [
            'empleado' => [
                'id' => $empleado->id,
                'nombre_completo' => strtoupper(trim("{$empleado->apellido_paterno} {$empleado->apellido_materno} {$empleado->nombre}")),
                'nue' => $empleado->nue,
                'ur' => $empleado->ur,
                'dependencia_nombre' => $empleado->dependencia?->nombre ?? $empleado->dependencia?->nombre_corto ?? null,
                'delegacion_codigo' => $empleado->delegacion_codigo,
                'estado_delegacion' => $empleado->estado_delegacion ?? 'activo',
            ],
            'anios_disponibles' => $aniosDisponibles,
            'anio_default' => $aniosConDatos[0] ?? $anioFallback,
        ]);
    }

    /**
     * Devuelve los productos licitados y cotizados de un empleado para el año de referencia.
     */
    public function productosEmpleado(Request $request, int $empleadoId): JsonResponse
    {
        $empleado = Empleado::findOrFail($empleadoId);
        abort_unless($this->access->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);
        $anioSolicitado = $request->integer('anio');
        $aniosConDatos = DB::table('asignacion_empleado_producto')
            ->where('empleado_id', $empleadoId)
            ->distinct()
            ->orderByDesc('anio')
            ->pluck('anio')
            ->map(static fn ($anio) => (int) $anio)
            ->values()
            ->all();

        $anioFallback = SivsoVestuario::anioAsignacionesVestuario();
        $aniosDisponibles = $aniosConDatos !== [] ? $aniosConDatos : [$anioFallback];

        $anioConsulta = in_array($anioSolicitado, $aniosDisponibles, true)
            ? $anioSolicitado
            : ($aniosConDatos[0] ?? $anioFallback);

        $anioCatalogo = SivsoVestuario::anioCatalogoResuelto();

        $listas = $this->productosEmpleadoMiDelegacion->licitadosYCotizados($empleadoId, $anioConsulta, $anioCatalogo);

        return response()->json([
            'data' => [
                'empleado' => [
                    'id' => $empleado->id,
                    'nombre_completo' => strtoupper(trim("{$empleado->apellido_paterno} {$empleado->apellido_materno} {$empleado->nombre}")),
                    'nue' => $empleado->nue,
                ],
                'anio' => $anioConsulta,
                'anios_disponibles' => $aniosDisponibles,
                'licitados' => $listas['licitados'],
                'cotizados' => $listas['cotizados'],
            ],
            'message' => null,
            'errors' => null,
        ]);
    }

    /**
     * Cancela una solicitud pendiente (el delegado se arrepiente).
     */
    public function cancelarSolicitud(Request $request, int $solicitudId): JsonResponse
    {
        $solicitud = SolicitudMovimiento::query()
            ->with('empleado')
            ->where('id', $solicitudId)
            ->where('estado', 'pendiente')
            ->firstOrFail();

        abort_unless($solicitud->empleado && $this->access->usuarioPuedeGestionarEmpleado($request->user(), $solicitud->empleado), 403);

        $solicitud->delete();

        return response()->json([
            'data' => null,
            'message' => 'Solicitud cancelada.',
            'errors' => null,
        ]);
    }

    private function periodoActualCached(): ?array
    {
        return Cache::remember(PeriodoVestuario::CACHE_PERIODO_MI_DELEGACION_KEY, now()->addSeconds(60), function (): ?array {
            return $this->periodoActual();
        });
    }

    private function periodoActual(): ?array
    {
        $p = PeriodoVestuario::orderByRaw("FIELD(estado,'abierto','proximo','cerrado')")
            ->orderByDesc('anio')
            ->first();

        if (! $p) {
            return null;
        }

        return [
            'id' => $p->id,
            'nombre' => $p->nombre,
            'anio' => $p->anio,
            'fecha_inicio' => $p->fecha_inicio?->format('Y-m-d'),
            'fecha_fin' => $p->fecha_fin?->format('Y-m-d'),
            'estado' => $p->estado,
            'descripcion' => $p->descripcion,
        ];
    }

    private function logoDataUri(): ?string
    {
        $path = public_path('images/stpeidceo-logo.png');
        if (! is_file($path) || ! is_readable($path)) {
            return null;
        }

        $contents = file_get_contents($path);
        if ($contents === false || $contents === '') {
            return null;
        }

        return 'data:image/png;base64,'.base64_encode($contents);
    }

    private function qrDataUri(string $data): string
    {
        $builder = new QrCodeBuilder(
            writer: new PngWriter,
            writerOptions: [],
            validateResult: false,
            data: $data,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: 132,
            margin: 2,
            roundBlockSizeMode: RoundBlockSizeMode::Margin,
        );

        return $builder->build()->getDataUri();
    }

    /**
     * Recurso disponible de bajas: plazas sin consumir + catálogo de productos.
     */
    public function recursoBajaDisponible(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $codigosDelegacion = $this->access->delegacionCodigosPermitidos($user);

        if ($codigosDelegacion === []) {
            return response()->json(['data' => ['presupuesto_total' => 0, 'presupuesto_usado' => 0, 'presupuesto_disponible' => 0, 'catalogo' => []], 'message' => '', 'errors' => null]);
        }

        $pool = (float) DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->join('producto_cotizado as pc', 'pc.id', '=', 'aep.producto_cotizado_id')
            ->where('e.estado_delegacion', 'baja')
            ->where('aep.estado_anio_actual', 'pendiente')
            ->where('aep.observacion_anio_actual', 'like', '%reasignación%')
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->sum(DB::raw('COALESCE(pc.precio_unitario, 0) * GREATEST(COALESCE(aep.cantidad, 1), 1)'));

        $usado = (float) DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->join('producto_cotizado as pc', 'pc.id', '=', 'aep.producto_cotizado_id')
            ->where('aep.observacion_anio_actual', 'like', '%Agregado con recurso de baja%')
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->sum(DB::raw('COALESCE(pc.precio_unitario, 0) * GREATEST(COALESCE(aep.cantidad, 1), 1)'));

        $disponible = round(max(0.0, $pool - $usado), 2);

        $anioCatalogo = SivsoVestuario::anioCatalogoResuelto();
        $catalogo = DB::table('producto_cotizado as pc')
            ->join('producto_licitado as pl', 'pl.id', '=', 'pc.producto_licitado_id')
            ->where('pc.anio', $anioCatalogo)
            ->select([
                'pc.id as producto_cotizado_id',
                'pl.id as producto_licitado_id',
                'pc.clave',
                'pc.descripcion',
                'pc.precio_unitario',
                'pl.numero_partida',
            ])
            ->orderBy('pc.clave')
            ->orderBy('pc.descripcion')
            ->get()
            ->map(fn ($r) => [
                'producto_cotizado_id' => (int) $r->producto_cotizado_id,
                'producto_licitado_id' => (int) $r->producto_licitado_id,
                'clave' => $r->clave,
                'descripcion' => $r->descripcion,
                'precio_unitario' => round((float) ($r->precio_unitario ?? 0), 2),
                'numero_partida' => $r->numero_partida,
            ])
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'presupuesto_total' => round($pool + $usado, 2),
                'presupuesto_usado' => round($usado, 2),
                'presupuesto_disponible' => $disponible,
                'catalogo' => $catalogo,
            ],
            'message' => '',
            'errors' => null,
        ]);
    }

    /**
     * Agrega un producto del catálogo a un empleado, consumiendo una plaza de baja.
     */
    public function agregarProductoEmpleado(AgregarProductoMiDelegacionRequest $request, int $empleadoId): JsonResponse
    {
        $validated = $request->validated();

        /** @var User $user */
        $user = $request->user();
        $codigosDelegacion = $this->access->delegacionCodigosPermitidos($user);

        $empleado = Empleado::query()->findOrFail($empleadoId);
        abort_unless($this->access->usuarioPuedeGestionarEmpleado($user, $empleado), 403);
        abort_unless($empleado->estado_delegacion !== 'baja', 422, 'No se puede asignar a un empleado dado de baja.');

        $pc = DB::table('producto_cotizado')->where('id', $validated['producto_cotizado_id'])->first();
        abort_unless($pc !== null, 422, 'Producto no encontrado en el catálogo.');

        $precioProducto = round((float) ($pc->precio_unitario ?? 0), 2);
        $disponible = $this->presupuestoBajaDisponible($codigosDelegacion);
        abort_unless($disponible >= $precioProducto, 422, 'Presupuesto insuficiente. Disponible: $'.number_format($disponible, 2).', producto: $'.number_format($precioProducto, 2));

        $anioCaptura = $this->anioCaptura();

        AsignacionEmpleadoProducto::query()->create([
            'anio' => $anioCaptura,
            'empleado_id' => $empleado->id,
            'producto_licitado_id' => (int) $pc->producto_licitado_id,
            'producto_cotizado_id' => (int) $pc->id,
            'clave_partida_presupuestal' => $pc->clave,
            'cantidad' => 1,
            'talla' => null,
            'talla_anio_actual' => null,
            'medida_anio_actual' => null,
            'estado_anio_actual' => 'pendiente',
            'observacion_anio_actual' => 'Agregado con recurso de baja.',
            'talla_actualizada_at' => null,
        ]);

        $nuevoDisponible = $this->presupuestoBajaDisponible($codigosDelegacion);

        return response()->json([
            'data' => ['presupuesto_disponible' => $nuevoDisponible],
            'message' => 'Producto agregado correctamente.',
            'errors' => null,
        ]);
    }

    private function presupuestoBajaDisponible(?array $codigosDelegacion): float
    {
        $pool = (float) DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->join('producto_cotizado as pc', 'pc.id', '=', 'aep.producto_cotizado_id')
            ->where('e.estado_delegacion', 'baja')
            ->where('aep.estado_anio_actual', 'pendiente')
            ->where('aep.observacion_anio_actual', 'like', '%reasignación%')
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->sum(DB::raw('COALESCE(pc.precio_unitario, 0) * GREATEST(COALESCE(aep.cantidad, 1), 1)'));

        $usado = (float) DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->join('producto_cotizado as pc', 'pc.id', '=', 'aep.producto_cotizado_id')
            ->where('aep.observacion_anio_actual', 'like', '%Agregado con recurso de baja%')
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->sum(DB::raw('COALESCE(pc.precio_unitario, 0) * GREATEST(COALESCE(aep.cantidad, 1), 1)'));

        return round(max(0.0, $pool - $usado), 2);
    }

    private function resolverAsignacionObjetivoParaCapturaActual(AsignacionEmpleadoProducto $asignacion): AsignacionEmpleadoProducto
    {
        $anioCaptura = (int) date('Y');
        if ((int) $asignacion->anio === $anioCaptura) {
            return $asignacion;
        }

        return AsignacionEmpleadoProducto::query()->firstOrCreate(
            [
                'anio' => $anioCaptura,
                'empleado_id' => $asignacion->empleado_id,
                'producto_licitado_id' => $asignacion->producto_licitado_id,
            ],
            [
                'producto_cotizado_id' => $asignacion->producto_cotizado_id,
                'clave_partida_presupuestal' => $asignacion->clave_partida_presupuestal,
                'cantidad' => $asignacion->cantidad,
                'talla' => $asignacion->talla,
                'talla_anio_actual' => $asignacion->talla_anio_actual,
                'medida_anio_actual' => $asignacion->medida_anio_actual,
                'estado_anio_actual' => $asignacion->estado_anio_actual ?? 'pendiente',
                'observacion_anio_actual' => $asignacion->observacion_anio_actual,
                'talla_actualizada_at' => $asignacion->talla_actualizada_at,
            ]
        );
    }
}
