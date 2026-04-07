<?php

declare(strict_types=1);

namespace App\Http\Controllers\Delegado;

use App\Events\SivsoNotificacion;
use App\Http\Controllers\Controller;
use App\Models\AsignacionEmpleadoProducto;
use App\Models\Delegacion;
use App\Models\Empleado;
use App\Models\PeriodoVestuario;
use App\Models\SolicitudMovimiento;
use App\Models\User;
use App\Notifications\NuevaSolicitudNotification;
use App\Services\Delegado\AcuseReciboVestuarioPdfService;
use App\Support\SivsoVestuario;
use App\Support\VestuarioCotizadoJoin;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class MiDelegacionController extends Controller
{
    /** @var list<int> */
    private const PER_PAGE_OPCIONES = [10, 15, 20, 30, 50, 100];

    /** @var list<string> */
    private const FILTROS_VISTA = ['todos', 'listos', 'sin_empezar', 'bajas', 'sin_nue'];

    public function panel(Request $request): InertiaResponse
    {
        /** @var User $user */
        $user = $request->user();

        $codigosDelegacion = $this->delegacionCodigosPermitidos($user);
        $contexto = $this->contextoDelegadoParaVista($user, $codigosDelegacion);

        $resumenVestuario = $this->resumenVestuarioEmpleados($codigosDelegacion);
        $total = $resumenVestuario->count();
        $listos = $resumenVestuario
            ->filter(static fn (array $fila) => $fila['total_prendas'] > 0 && $fila['confirmadas'] >= ($fila['total_prendas'] - $fila['bajas']))
            ->count();
        $sinEmpezar = $resumenVestuario
            ->filter(static fn (array $fila) => $fila['total_prendas'] > 0 && $fila['confirmadas'] === 0)
            ->count();
        $bajas = $resumenVestuario
            ->filter(static fn (array $fila) => $fila['estado_delegacion'] === 'baja')
            ->count();

        return Inertia::render('Delegado/Panel', [
            'resumen' => [
                'total' => $total,
                'listos' => $listos,
                'sin_empezar' => $sinEmpezar,
                'bajas' => $bajas,
                'pct_completado' => $total > 0 ? (int) round(($listos / $total) * 100) : 0,
                'anio_actual' => SivsoVestuario::anioActual(),
                'anio_ref' => SivsoVestuario::anioAsignacionesVestuario(),
            ],
            'contexto' => $contexto,
            'periodo' => $this->periodoActual(),
            'mis_solicitudes' => $this->misSolicitudesParaPanel($user),
            'solicitudes_count' => SolicitudMovimiento::query()
                ->where('solicitada_por', $user->id)
                ->count(),
        ]);
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

        $codigosDelegacion = $this->delegacionCodigosPermitidos($user);

        $contexto = $this->contextoDelegadoParaVista($user, $codigosDelegacion);

        $empleadosQuery = Empleado::query()
            ->with(['dependencia:ur,nombre_corto,nombre', 'delegacion:codigo'])
            ->whereHas('asignaciones', fn ($q) => $q->where('anio', SivsoVestuario::anioAsignacionesVestuario()))
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('delegacion_codigo', $codigosDelegacion))
            ->when($search !== null, function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                        ->orWhere('apellido_paterno', 'like', "%{$search}%")
                        ->orWhere('apellido_materno', 'like', "%{$search}%")
                        ->orWhere('nue', 'like', "%{$search}%");
                });
            })
            // En vista general, enviar bajas al final del listado.
            ->orderByRaw("CASE WHEN estado_delegacion = 'baja' THEN 1 ELSE 0 END ASC")
            ->orderBy('apellido_paterno')
            ->orderBy('apellido_materno')
            ->orderBy('nombre');

        $resumenVestuario = $this->resumenVestuarioEmpleados($codigosDelegacion, $search);
        $total = $resumenVestuario->count();
        $listos = $resumenVestuario
            ->filter(static fn (array $fila) => $fila['total_prendas'] > 0 && $fila['confirmadas'] >= ($fila['total_prendas'] - $fila['bajas']))
            ->count();
        $sinEmpezar = $resumenVestuario
            ->filter(static fn (array $fila) => $fila['total_prendas'] > 0 && $fila['confirmadas'] === 0)
            ->count();

        if ($filtro === 'bajas') {
            $empleadosQuery->where('estado_delegacion', 'baja');
        } elseif ($filtro === 'sin_nue') {
            $empleadosQuery->whereNull('nue');
        } elseif ($filtro === 'listos') {
            $idsListos = $resumenVestuario
                ->filter(static fn (array $fila) => $fila['total_prendas'] > 0 && $fila['confirmadas'] >= ($fila['total_prendas'] - $fila['bajas']))
                ->pluck('id')
                ->all();
            $this->restringirEmpleadosPorIds(
                $empleadosQuery,
                $idsListos
            );
        } elseif ($filtro === 'sin_empezar') {
            $idsSinEmpezar = $resumenVestuario
                ->filter(static fn (array $fila) => $fila['total_prendas'] > 0 && $fila['confirmadas'] === 0)
                ->pluck('id')
                ->all();
            $this->restringirEmpleadosPorIds(
                $empleadosQuery,
                $idsSinEmpezar
            );
        }

        $empleados = $empleadosQuery
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Empleado $e) => $this->mapEmpleadoParaVista($e));

        // Delegaciones disponibles para transferencias (agrupadas por UR)
        $delegaciones = Delegacion::query()
            ->select(['codigo', 'ur_referencia'])
            ->orderBy('codigo')
            ->get()
            ->map(fn ($d) => ['codigo' => $d->codigo, 'ur' => $d->ur_referencia])
            ->all();

        return Inertia::render('Delegado/MiDelegacion/Index', [
            'empleados' => $empleados,
            'delegaciones' => $delegaciones,
            'contexto' => $contexto,
            'resumen' => [
                'total' => $total,
                'listos' => $listos,
                'sin_empezar' => $sinEmpezar,
                'anio_ref' => SivsoVestuario::anioAsignacionesVestuario(),
                'anio_actual' => SivsoVestuario::anioActual(),
            ],
            'resumen_prendas' => $this->resumenPorCategoria($codigosDelegacion),
            'periodo' => $this->periodoActual(),
            'filters' => array_merge(
                $request->only(['search']),
                ['filtro' => $filtro, 'per_page' => $perPage],
            ),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapEmpleadoParaVista(Empleado $e): array
    {
        $anio = SivsoVestuario::anioAsignacionesVestuario();
        $anioCatalogo = SivsoVestuario::anioCatalogoResuelto();

        $asignacionesQuery = DB::table('asignacion_empleado_producto as aep')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id');
        VestuarioCotizadoJoin::applyCotizadoResuelto($asignacionesQuery, 'aep', $anioCatalogo);
        $asignaciones = $asignacionesQuery
            ->where('aep.empleado_id', $e->id)
            ->where('aep.anio', $anio)
            ->select([
                'aep.id',
                'aep.talla',
                'aep.talla_anio_actual',
                'aep.medida_anio_actual',
                'aep.estado_anio_actual',
                'aep.observacion_anio_actual',
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
                'talla_anterior' => $a->talla,
                'talla' => $a->talla_anio_actual ?? $a->talla,
                'medida' => $a->medida_anio_actual,
                'estado' => $a->estado_anio_actual ?? 'pendiente',
                'observacion' => $a->observacion_anio_actual,
                'talla_actualizada_at' => $a->talla_actualizada_at,
                'cantidad' => max(1, (int) ($a->cantidad ?? 1)),
            ])
            ->values()
            ->all();

        $confirmadas = collect($asignaciones)->whereIn('estado', ['confirmado', 'cambio'])->count();

        $solicitudPendiente = SolicitudMovimiento::where('empleado_id', $e->id)
            ->where('estado', 'pendiente')
            ->select(['id', 'tipo', 'delegacion_destino'])
            ->first();

        $fila = [
            'id' => $e->id,
            'nombre_completo' => strtoupper(trim("{$e->apellido_paterno} {$e->apellido_materno} {$e->nombre}")),
            'nue' => $e->nue,
            'ur' => $e->ur,
            'dependencia_nombre' => $e->dependencia?->nombre_corto ?? $e->dependencia?->nombre ?? 'Sin dependencia',
            'delegacion_codigo' => $e->delegacion_codigo,
            'estado_delegacion' => $e->estado_delegacion ?? 'activo',
            'observacion_delegacion' => $e->observacion_delegacion,
            'vestuario' => $asignaciones,
            'confirmadas' => $confirmadas,
            'total_prendas' => count($asignaciones),
            'solicitud_pendiente' => $solicitudPendiente ? [
                'id' => $solicitudPendiente->id,
                'tipo' => $solicitudPendiente->tipo,
                'delegacion_destino' => $solicitudPendiente->delegacion_destino,
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

        abort_unless($this->usuarioPuedeGestionarEmpleado($user, $empleadoModel), 403);

        $fila = $this->mapEmpleadoParaVista($empleadoModel);

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

        $contexto = $this->contextoDelegadoParaVista($user, $this->delegacionCodigosPermitidos($user));
        $delegadoNombre = $contexto['delegado_nombre'] ?? $user->name ?? 'DELEGADO';

        $service = new AcuseReciboVestuarioPdfService;

        return $service->stream(
            $empleadoModel,
            $delegadoNombre,
            $fila,
            SivsoVestuario::anioActual(),
            SivsoVestuario::anioAsignacionesVestuario(),
        );
    }

    /**
     * Vestuario completo: hay prendas y todas las que no están en baja quedaron confirmadas o en cambio.
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
     *
     * @param  list<string>|null  $codigosDelegacion
     * @return Collection<int, array{id:int, estado_delegacion:string, total_prendas:int, confirmadas:int, bajas:int}>
     */
    private function resumenVestuarioEmpleados(?array $codigosDelegacion, ?string $search = null): Collection
    {
        $anio = SivsoVestuario::anioAsignacionesVestuario();

        return DB::table('empleado as e')
            ->join('asignacion_empleado_producto as aep', function ($join) use ($anio): void {
                $join->on('aep.empleado_id', '=', 'e.id')
                    ->where('aep.anio', $anio);
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
                'e.estado_delegacion',
                DB::raw('COUNT(*) as total_prendas'),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual IN ('confirmado','cambio') THEN 1 ELSE 0 END) as confirmadas"),
                DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'baja' THEN 1 ELSE 0 END) as bajas"),
            ])
            ->groupBy('e.id', 'e.estado_delegacion')
            ->get()
            ->map(static fn ($row): array => [
                'id' => (int) $row->id,
                'estado_delegacion' => (string) ($row->estado_delegacion ?? 'activo'),
                'total_prendas' => (int) $row->total_prendas,
                'confirmadas' => (int) $row->confirmadas,
                'bajas' => (int) $row->bajas,
            ]);
    }

    /**
     * Actualiza la talla del año actual para una asignación.
     */
    public function actualizarTalla(Request $request, int $asignacionId): JsonResponse
    {
        $validated = $request->validate([
            'talla' => ['nullable', 'string', 'max:20'],
            'medida' => ['nullable', 'string', 'max:20'],
            'estado' => ['required', 'string', 'in:pendiente,confirmado,cambio,baja'],
            'observacion' => ['nullable', 'string', 'max:255'],
        ]);

        $asignacion = AsignacionEmpleadoProducto::query()->with('empleado')->findOrFail($asignacionId);
        abort_unless($this->usuarioPuedeGestionarEmpleado($request->user(), $asignacion->empleado), 403);
        $asignacion->update([
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
    public function actualizarTallasLote(Request $request, int $empleadoId): JsonResponse
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
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.talla' => ['nullable', 'string', 'max:20'],
            'items.*.medida' => ['nullable', 'string', 'max:20'],
        ]);

        $empleado = Empleado::findOrFail($empleadoId);
        abort_unless($this->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);

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
        foreach ($validated['items'] as $item) {
            $asignaciones[$item['id']]->update([
                'talla_anio_actual' => $item['talla'] ?? null,
                'medida_anio_actual' => $item['medida'] ?? null,
                'estado_anio_actual' => 'confirmado',
                'talla_actualizada_at' => $now,
            ]);
        }

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
    public function solicitarMovimiento(Request $request, int $empleadoId): JsonResponse
    {
        $validated = $request->validate([
            'tipo' => ['required', 'string', 'in:baja,cambio'],
            'observacion' => ['nullable', 'string', 'max:500'],
            'nueva_delegacion' => ['required_if:tipo,cambio', 'nullable', 'string', 'exists:delegacion,codigo'],
        ]);

        $empleado = Empleado::findOrFail($empleadoId);
        abort_unless($this->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);

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

        $solicitud = SolicitudMovimiento::create([
            'empleado_id' => $empleadoId,
            'solicitada_por' => Auth::id(),
            'delegacion_origen' => $empleado->delegacion_codigo,
            'delegacion_destino' => $validated['tipo'] === 'cambio' ? $validated['nueva_delegacion'] : null,
            'tipo' => $validated['tipo'],
            'estado' => 'pendiente',
            'observacion_solicitante' => $validated['observacion'] ?? null,
        ]);

        // Notificar a todos los administradores (super_admin) de la nueva solicitud.
        // notify() guarda en la tabla notifications (database).
        // SivsoNotificacion se emite inmediatamente por WebSocket (ShouldBroadcastNow, sin queue).
        $solicitud->load('empleado');
        $notification = new NuevaSolicitudNotification($solicitud);

        User::where('is_super_admin', true)
            ->get()
            ->each(function (User $admin) use ($notification) {
                $admin->notify($notification);
                $payload = array_merge($notification->toArray($admin), [
                    'id' => $admin->notifications()->latest()->first()?->id,
                ]);
                broadcast(new SivsoNotificacion($payload, $admin->id));
            });

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
        abort_unless($this->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);

        $estado = $empleado->estado_delegacion ?? 'activo';
        if (! in_array($estado, ['baja', 'cambio'], true)) {
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

    /**
     * Devuelve los productos licitados y cotizados de un empleado para el año de referencia.
     */
    public function productosEmpleado(Request $request, int $empleadoId): JsonResponse
    {
        $empleado = Empleado::findOrFail($empleadoId);
        abort_unless($this->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);
        $anioSolicitado = $request->integer('anio');
        $aniosDisponibles = DB::table('asignacion_empleado_producto')
            ->where('empleado_id', $empleadoId)
            ->distinct()
            ->orderByDesc('anio')
            ->pluck('anio')
            ->map(static fn ($anio) => (int) $anio)
            ->values()
            ->all();

        $anioConsulta = in_array($anioSolicitado, $aniosDisponibles, true)
            ? $anioSolicitado
            : ($aniosDisponibles[0] ?? SivsoVestuario::anioAsignacionesVestuario());

        $parseClasifs = static function (?string $raw): array {
            if (! $raw) {
                return [];
            }

            return collect(explode(';;', $raw))
                ->map(function ($item) {
                    [$codigo, $nombre] = array_pad(explode('|', $item, 2), 2, '');

                    return ['codigo' => $codigo, 'nombre' => $nombre];
                })
                ->values()
                ->all();
        };

        // Licitados — producto base de la licitación
        $licitados = DB::table('asignacion_empleado_producto as aep')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id')
            ->leftJoin('clasificacion_bien as cb', 'cb.id', '=', 'pl.clasificacion_principal_id')
            ->where('aep.empleado_id', $empleadoId)
            ->where('aep.anio', $anioConsulta)
            ->select([
                'aep.id                        as asignacion_id',
                'pl.id                         as id',
                'pl.numero_partida',
                'pl.partida_especifica',
                'pl.codigo_catalogo             as codigo',
                'pl.descripcion',
                'pl.cantidad_propuesta          as cantidad',
                'pl.unidad',
                'pl.marca',
                'pl.precio_unitario',
                'pl.proveedor',
                'pl.medida',
                'cb.codigo                      as categoria_codigo',
                'cb.nombre                      as categoria',
                'aep.clave_partida_presupuestal as clave_rubro',
                'aep.cantidad                   as cantidad_asignada',
                'aep.talla',
                'aep.estado_anio_actual         as estado',
            ])
            ->selectRaw(
                '(SELECT GROUP_CONCAT(CONCAT(cb2.codigo,"|",cb2.nombre) ORDER BY cb2.nombre SEPARATOR ";;") '.
                ' FROM producto_licitado_clasificacion plc2 '.
                ' JOIN clasificacion_bien cb2 ON cb2.id = plc2.clasificacion_id '.
                ' WHERE plc2.producto_licitado_id = pl.id) AS clasificaciones_raw'
            )
            ->orderBy('pl.numero_partida')
            ->get()
            ->map(function ($r) use ($parseClasifs) {
                $arr = (array) $r;
                $arr['clasificaciones'] = $parseClasifs($arr['clasificaciones_raw'] ?? null);
                unset($arr['clasificaciones_raw']);

                return $arr;
            })
            ->values()
            ->all();

        // Cotizados — producto contractual (prioriza producto_cotizado del año de catálogo por clave/partida)
        $anioCatalogo = SivsoVestuario::anioCatalogoResuelto();
        $cotizados = DB::table('asignacion_empleado_producto as aep')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id');
        VestuarioCotizadoJoin::applyCotizadoResuelto($cotizados, 'aep', $anioCatalogo);
        $cotizados->leftJoin('clasificacion_bien as cb', function ($join): void {
            $join->whereRaw('cb.id = '.VestuarioCotizadoJoin::coalesceClasificacionPrincipalIdSql());
        })
            ->where('aep.empleado_id', $empleadoId)
            ->where('aep.anio', $anioConsulta)
            ->whereRaw('('.VestuarioCotizadoJoin::cotizadoResueltoIdSql().') IS NOT NULL')
            ->select([
                'aep.id                        as asignacion_id',
                DB::raw(VestuarioCotizadoJoin::cotizadoResueltoIdSql().' as id'),
                DB::raw('COALESCE(pc_cat.numero_partida, pc_cat_fb.numero_partida, pc_old.numero_partida) as numero_partida'),
                DB::raw('COALESCE(pc_cat.partida_especifica, pc_cat_fb.partida_especifica, pc_old.partida_especifica) as partida_especifica'),
                DB::raw('COALESCE(pc_cat.clave, pc_cat_fb.clave, pc_old.clave) as codigo'),
                DB::raw('COALESCE(pc_cat.descripcion, pc_cat_fb.descripcion, pc_old.descripcion) as descripcion'),
                DB::raw('COALESCE(pc_cat.precio_unitario, pc_cat_fb.precio_unitario, pc_old.precio_unitario) as precio_unitario'),
                DB::raw('COALESCE(pc_cat.importe, pc_cat_fb.importe, pc_old.importe) as importe'),
                DB::raw('COALESCE(pc_cat.total, pc_cat_fb.total, pc_old.total) as total'),
                DB::raw('COALESCE(pc_cat.referencia_codigo, pc_cat_fb.referencia_codigo, pc_old.referencia_codigo) as referencia'),
                'cb.codigo                      as categoria_codigo',
                'cb.nombre                      as categoria',
                'aep.clave_partida_presupuestal as clave_rubro',
                'aep.cantidad                   as cantidad_asignada',
                'aep.talla_anio_actual          as talla',
                'aep.medida_anio_actual         as medida',
                'aep.estado_anio_actual         as estado',
            ])
            ->selectRaw(
                '(SELECT GROUP_CONCAT(CONCAT(cb2.codigo,"|",cb2.nombre) ORDER BY cb2.nombre SEPARATOR ";;") '.
                ' FROM producto_cotizado_clasificacion pcc2 '.
                ' JOIN clasificacion_bien cb2 ON cb2.id = pcc2.clasificacion_id '.
                ' WHERE pcc2.producto_cotizado_id = '.VestuarioCotizadoJoin::cotizadoResueltoIdSql().') AS clasificaciones_raw'
            )
            ->orderByRaw('COALESCE(pc_cat.numero_partida, pc_cat_fb.numero_partida, pc_old.numero_partida)')
            ->get()
            ->map(function ($r) use ($parseClasifs) {
                $arr = (array) $r;
                $arr['clasificaciones'] = $parseClasifs($arr['clasificaciones_raw'] ?? null);
                unset($arr['clasificaciones_raw']);

                return $arr;
            })
            ->values()
            ->all();

        return response()->json([
            'data' => [
                'empleado' => [
                    'id' => $empleado->id,
                    'nombre_completo' => strtoupper(trim("{$empleado->apellido_paterno} {$empleado->apellido_materno} {$empleado->nombre}")),
                    'nue' => $empleado->nue,
                ],
                'anio' => $anioConsulta,
                'anios_disponibles' => $aniosDisponibles,
                'licitados' => $licitados,
                'cotizados' => $cotizados,
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

        abort_unless($solicitud->empleado && $this->usuarioPuedeGestionarEmpleado($request->user(), $solicitud->empleado), 403);

        $solicitud->delete();

        return response()->json([
            'data' => null,
            'message' => 'Solicitud cancelada.',
            'errors' => null,
        ]);
    }

    /**
     * @return list<string>|null null = sin filtro (super admin); array vacío = usuario sin delegaciones asignadas
     */
    private function delegacionCodigosPermitidos(User $user): ?array
    {
        if ($user->is_super_admin) {
            return null;
        }

        $user->loadMissing('delegado.delegaciones');

        $delegado = $user->delegado;
        if (! $delegado || $delegado->delegaciones->isEmpty()) {
            return [];
        }

        return $delegado->delegaciones->pluck('codigo')->unique()->values()->all();
    }

    private function usuarioPuedeGestionarEmpleado(?User $user, ?Empleado $empleado): bool
    {
        if (! $user || ! $empleado) {
            return false;
        }

        if ($user->is_super_admin) {
            return true;
        }

        $codigos = $this->delegacionCodigosPermitidos($user);

        return $codigos !== []
            && in_array($empleado->delegacion_codigo, $codigos, true);
    }

    /**
     * Resumen de asignaciones agrupado por prenda (clave + descripción) para el año de referencia.
     * Incluye totales por año disponible en la delegación.
     *
     * @param  list<string>|null  $codigosDelegacion
     * @return list<array<string, mixed>>
     */
    private function resumenPorCategoria(?array $codigosDelegacion): array
    {
        $anio = SivsoVestuario::anioAsignacionesVestuario();
        $anioCatalogo = SivsoVestuario::anioCatalogoResuelto();

        $query = DB::table('asignacion_empleado_producto as aep')
            ->join('empleado as e', 'e.id', '=', 'aep.empleado_id')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id');
        VestuarioCotizadoJoin::applyCotizadoResuelto($query, 'aep', $anioCatalogo);
        $filas = $query->select([
            'aep.anio',
            DB::raw(VestuarioCotizadoJoin::coalesceClaveSql().' as clave'),
            DB::raw(VestuarioCotizadoJoin::coalesceDescripcionSql().' as descripcion'),
            DB::raw('COUNT(*) as total'),
            DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'confirmado' THEN 1 ELSE 0 END) as confirmadas"),
            DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'pendiente' THEN 1 ELSE 0 END) as pendientes"),
            DB::raw("SUM(CASE WHEN aep.estado_anio_actual = 'baja'      THEN 1 ELSE 0 END) as bajas"),
        ])
            ->where('e.estado_delegacion', 'activo')
            ->where('aep.anio', $anio)
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('e.delegacion_codigo', $codigosDelegacion))
            ->groupByRaw('aep.anio, '.VestuarioCotizadoJoin::coalesceClaveSql().', '.VestuarioCotizadoJoin::coalesceDescripcionSql())
            ->orderBy('aep.anio', 'desc')
            ->orderBy('total', 'desc')
            ->get();

        return $filas->map(fn ($row) => [
            'anio' => $row->anio,
            'clave' => $row->clave,
            'descripcion' => $row->descripcion,
            'total' => (int) $row->total,
            'confirmadas' => (int) $row->confirmadas,
            'pendientes' => (int) $row->pendientes,
            'bajas' => (int) $row->bajas,
            'porcentaje' => $row->total > 0 ? round(($row->confirmadas / $row->total) * 100) : 0,
        ])->values()->all();
    }

    /**
     * @param  list<string>|null  $codigosDelegacion
     * @return array{modo: string, delegaciones: list<string>, delegado_nombre: string|null}
     */
    private function contextoDelegadoParaVista(User $user, ?array $codigosDelegacion): array
    {
        if ($user->is_super_admin) {
            return [
                'modo' => 'super_admin',
                'delegaciones' => [],
                'delegado_nombre' => null,
            ];
        }

        $user->loadMissing('delegado.delegaciones');
        $delegado = $user->delegado;

        if (! $delegado) {
            return [
                'modo' => 'sin_perfil',
                'delegaciones' => [],
                'delegado_nombre' => null,
            ];
        }

        $codigos = is_array($codigosDelegacion)
            ? $codigosDelegacion
            : $delegado->delegaciones->pluck('codigo')->unique()->values()->all();

        return [
            'modo' => 'delegado',
            'delegaciones' => $codigos,
            'delegado_nombre' => $delegado->nombre_completo,
        ];
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
}
