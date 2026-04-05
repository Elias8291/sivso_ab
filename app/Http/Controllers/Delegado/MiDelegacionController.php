<?php

declare(strict_types=1);

namespace App\Http\Controllers\Delegado;

use App\Http\Controllers\Controller;
use App\Events\SivsoNotificacion;
use App\Models\AsignacionEmpleadoProducto;
use App\Models\Delegacion;
use App\Models\Empleado;
use App\Models\SolicitudMovimiento;
use App\Models\User;
use App\Notifications\NuevaSolicitudNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MiDelegacionController extends Controller
{
    private const ANIO_REFERENCIA = 2025; // año del que se copian asignaciones base
    private const ANIO_ACTUAL     = 2026; // año sobre el que se trabaja

    /** @var list<int> */
    private const PER_PAGE_OPCIONES = [10, 15, 20, 30, 50, 100];

    /** @var list<string> */
    private const FILTROS_VISTA = ['todos', 'listos', 'sin_empezar', 'bajas'];

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        $search = $request->input('search');
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
            ->whereHas('asignaciones', fn ($q) => $q->where('anio', self::ANIO_REFERENCIA))
            ->when(is_array($codigosDelegacion), fn ($q) => $q->whereIn('delegacion_codigo', $codigosDelegacion))
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                      ->orWhere('apellido_paterno', 'like', "%{$search}%")
                      ->orWhere('apellido_materno', 'like', "%{$search}%")
                      ->orWhere('nue', 'like', "%{$search}%");
                });
            })
            ->orderBy('apellido_paterno')
            ->orderBy('apellido_materno')
            ->orderBy('nombre');

        $total = (clone $empleadosQuery)->count();

        $filasResumen = (clone $empleadosQuery)->get()->map(fn (Empleado $e) => $this->mapEmpleadoParaVista($e));

        $listos = $filasResumen->filter(fn (array $fila) => $this->empleadoVestuarioListo($fila))->count();

        // Sin ninguna prenda confirmada aún (mismo criterio que el filtro «Sin empezar»)
        $sinEmpezar = $filasResumen->filter(
            fn (array $fila) => $fila['total_prendas'] > 0 && $fila['confirmadas'] === 0
        )->count();

        if ($filtro === 'bajas') {
            $empleadosQuery->where('estado_delegacion', 'baja');
        } elseif ($filtro === 'listos') {
            $this->restringirEmpleadosPorIds(
                $empleadosQuery,
                $filasResumen->filter(fn (array $f) => $this->empleadoVestuarioListo($f))->pluck('id')->all()
            );
        } elseif ($filtro === 'sin_empezar') {
            $this->restringirEmpleadosPorIds(
                $empleadosQuery,
                $filasResumen
                    ->filter(fn (array $f) => $f['total_prendas'] > 0 && $f['confirmadas'] === 0)
                    ->pluck('id')
                    ->all()
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
            'empleados'    => $empleados,
            'delegaciones' => $delegaciones,
            'contexto'     => $contexto,
            'resumen'      => [
                'total'       => $total,
                'listos'      => $listos,
                'sin_empezar' => $sinEmpezar,
                'anio_ref'    => self::ANIO_REFERENCIA,
                'anio_actual' => self::ANIO_ACTUAL,
            ],
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
        $asignaciones = AsignacionEmpleadoProducto::query()
            ->where('asignacion_empleado_producto.empleado_id', $e->id)
            ->where('asignacion_empleado_producto.anio', self::ANIO_REFERENCIA)
            ->whereNotNull('asignacion_empleado_producto.producto_cotizado_id')
            ->join('producto_cotizado', 'producto_cotizado.id', '=', 'asignacion_empleado_producto.producto_cotizado_id')
            ->select([
                'asignacion_empleado_producto.id',
                'asignacion_empleado_producto.talla',
                'asignacion_empleado_producto.talla_anio_actual',
                'asignacion_empleado_producto.medida_anio_actual',
                'asignacion_empleado_producto.estado_anio_actual',
                'asignacion_empleado_producto.observacion_anio_actual',
                'asignacion_empleado_producto.talla_actualizada_at',
                'asignacion_empleado_producto.cantidad',
                'producto_cotizado.descripcion as prenda',
                'producto_cotizado.clave as clave',
            ])
            ->get()
            ->map(fn ($a) => [
                'id'                   => $a->id,
                'prenda'               => $a->prenda,
                'clave'                => $a->clave,
                'talla_anterior'       => $a->talla,
                'talla'                => $a->talla_anio_actual ?? $a->talla,
                'medida'               => $a->medida_anio_actual,
                'estado'               => $a->estado_anio_actual ?? 'pendiente',
                'observacion'          => $a->observacion_anio_actual,
                'talla_actualizada_at' => $a->talla_actualizada_at,
            ])
            ->values()
            ->all();

        $confirmadas = collect($asignaciones)->whereIn('estado', ['confirmado', 'cambio'])->count();

        $solicitudPendiente = SolicitudMovimiento::where('empleado_id', $e->id)
            ->where('estado', 'pendiente')
            ->select(['id', 'tipo', 'delegacion_destino'])
            ->first();

        return [
            'id'                     => $e->id,
            'nombre_completo'        => strtoupper(trim("{$e->apellido_paterno} {$e->apellido_materno} {$e->nombre}")),
            'nue'                    => $e->nue,
            'ur'                     => $e->ur,
            'dependencia_nombre'     => $e->dependencia?->nombre_corto ?? $e->dependencia?->nombre ?? 'Sin dependencia',
            'delegacion_codigo'      => $e->delegacion_codigo,
            'estado_delegacion'      => $e->estado_delegacion ?? 'activo',
            'observacion_delegacion' => $e->observacion_delegacion,
            'vestuario'              => $asignaciones,
            'confirmadas'            => $confirmadas,
            'total_prendas'          => count($asignaciones),
            'solicitud_pendiente'    => $solicitudPendiente ? [
                'id'                 => $solicitudPendiente->id,
                'tipo'               => $solicitudPendiente->tipo,
                'delegacion_destino' => $solicitudPendiente->delegacion_destino,
            ] : null,
        ];
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
     * Actualiza la talla del año actual para una asignación.
     */
    public function actualizarTalla(Request $request, int $asignacionId): JsonResponse
    {
        $validated = $request->validate([
            'talla'       => ['nullable', 'string', 'max:20'],
            'medida'      => ['nullable', 'string', 'max:20'],
            'estado'      => ['required', 'string', 'in:pendiente,confirmado,cambio,baja'],
            'observacion' => ['nullable', 'string', 'max:255'],
        ]);

        $asignacion = AsignacionEmpleadoProducto::query()->with('empleado')->findOrFail($asignacionId);
        abort_unless($this->usuarioPuedeGestionarEmpleado($request->user(), $asignacion->empleado), 403);
        $asignacion->update([
            'talla_anio_actual'       => $validated['talla'],
            'medida_anio_actual'      => $validated['medida'],
            'estado_anio_actual'      => $validated['estado'],
            'observacion_anio_actual' => $validated['observacion'] ?? null,
            'talla_actualizada_at'    => now(),
        ]);

        return response()->json([
            'data'    => [
                'talla'       => $validated['talla'],
                'medida'      => $validated['medida'],
                'estado'      => $validated['estado'],
                'observacion' => $validated['observacion'] ?? null,
            ],
            'message' => 'Vestuario actualizado correctamente.',
            'errors'  => null,
        ]);
    }

    /**
     * El delegado envía una solicitud de baja o cambio.
     * S.Administración la revisará y ejecutará el movimiento real.
     */
    public function solicitarMovimiento(Request $request, int $empleadoId): JsonResponse
    {
        $validated = $request->validate([
            'tipo'              => ['required', 'string', 'in:baja,cambio'],
            'observacion'       => ['nullable', 'string', 'max:500'],
            'nueva_delegacion'  => ['required_if:tipo,cambio', 'nullable', 'string', 'exists:delegacion,codigo'],
        ]);

        $empleado = Empleado::findOrFail($empleadoId);
        abort_unless($this->usuarioPuedeGestionarEmpleado($request->user(), $empleado), 403);

        // Verificar que no tenga ya una solicitud pendiente del mismo tipo
        $existente = SolicitudMovimiento::where('empleado_id', $empleadoId)
            ->where('estado', 'pendiente')
            ->first();

        if ($existente) {
            return response()->json([
                'data'    => null,
                'message' => 'Ya existe una solicitud pendiente para este empleado.',
                'errors'  => ['solicitud' => 'Pendiente de resolución por S.Administración.'],
            ], 422);
        }

        $solicitud = SolicitudMovimiento::create([
            'empleado_id'             => $empleadoId,
            'solicitada_por'          => Auth::id(),
            'delegacion_origen'       => $empleado->delegacion_codigo,
            'delegacion_destino'      => $validated['tipo'] === 'cambio' ? $validated['nueva_delegacion'] : null,
            'tipo'                    => $validated['tipo'],
            'estado'                  => 'pendiente',
            'observacion_solicitante' => $validated['observacion'] ?? null,
        ]);

        // Notificar a todos los administradores (super_admin) de la nueva solicitud.
        // notify() guarda en la tabla notifications (database).
        // SivsoNotificacion se emite inmediatamente por WebSocket (ShouldBroadcastNow, sin queue).
        $solicitud->load('empleado');
        $notification = new NuevaSolicitudNotification($solicitud);

        User::where('is_super_admin', true)
            ->get()
            ->each(function (User $admin) use ($notification, $solicitud) {
                $admin->notify($notification);
                $payload = array_merge($notification->toArray($admin), [
                    'id' => $admin->notifications()->latest()->first()?->id,
                ]);
                broadcast(new SivsoNotificacion($payload, $admin->id));
            });

        return response()->json([
            'data'    => [
                'solicitud_id' => $solicitud->id,
                'tipo'         => $solicitud->tipo,
                'estado'       => $solicitud->estado,
            ],
            'message' => 'Solicitud enviada. S.Administración la revisará a la brevedad.',
            'errors'  => null,
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
                'data'    => null,
                'message' => 'El empleado ya está activo en la delegación.',
                'errors'  => ['estado' => 'No aplica reactivación.'],
            ], 422);
        }

        $empleado->update([
            'estado_delegacion'       => 'activo',
            'observacion_delegacion'  => null,
        ]);

        return response()->json([
            'data'    => null,
            'message' => 'Empleado reactivado en tu listado.',
            'errors'  => null,
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
            'data'    => null,
            'message' => 'Solicitud cancelada.',
            'errors'  => null,
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
     * @param  list<string>|null  $codigosDelegacion
     * @return array{modo: string, delegaciones: list<string>, delegado_nombre: string|null}
     */
    private function contextoDelegadoParaVista(User $user, ?array $codigosDelegacion): array
    {
        if ($user->is_super_admin) {
            return [
                'modo'             => 'super_admin',
                'delegaciones'     => [],
                'delegado_nombre'  => null,
            ];
        }

        $user->loadMissing('delegado.delegaciones');
        $delegado = $user->delegado;

        if (! $delegado) {
            return [
                'modo'             => 'sin_perfil',
                'delegaciones'     => [],
                'delegado_nombre'  => null,
            ];
        }

        $codigos = is_array($codigosDelegacion)
            ? $codigosDelegacion
            : $delegado->delegaciones->pluck('codigo')->unique()->values()->all();

        return [
            'modo'             => 'delegado',
            'delegaciones'     => $codigos,
            'delegado_nombre'  => $delegado->nombre_completo,
        ];
    }
}
