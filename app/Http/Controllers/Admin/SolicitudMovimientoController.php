<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Events\SivsoNotificacion;
use App\Http\Controllers\Controller;
use App\Models\AsignacionEmpleadoProducto;
use App\Models\Delegacion;
use App\Models\SolicitudMovimiento;
use App\Models\User;
use App\Notifications\MovimientoDelegacionDestinoNotification;
use App\Notifications\SolicitudResueltaNotification;
use App\Services\Solicitudes\AltaSustitutoPorBajaService;
use App\Support\SivsoVestuario;
use App\Support\VestuarioCotizadoJoin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class SolicitudMovimientoController extends Controller
{
    public function index(Request $request): Response
    {
        $estado = $request->input('estado', 'pendiente');
        $search = $request->input('search');

        $solicitudes = SolicitudMovimiento::query()
            ->with(['empleado:id,nombre,apellido_paterno,apellido_materno,nue,ur,delegacion_codigo', 'resueltaPor:id,name'])
            ->when($estado !== 'todas', fn ($q) => $q->where('estado', $estado))
            ->when($search, function ($q, $s) {
                $q->whereHas('empleado', fn ($eq) => $eq->where('nombre', 'like', "%{$s}%")
                    ->orWhere('apellido_paterno', 'like', "%{$s}%")
                    ->orWhere('nue', 'like', "%{$s}%")
                );
            })
            ->orderByRaw("FIELD(estado, 'pendiente', 'aprobada', 'rechazada')")
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString()
            ->through(fn ($s) => [
                'id' => $s->id,
                'tipo' => $s->tipo,
                'estado' => $s->estado,
                'delegacion_origen' => $s->delegacion_origen,
                'delegacion_destino' => $s->delegacion_destino,
                'lleva_recurso' => $s->lleva_recurso,
                'modo_prendas' => $s->modo_prendas,
                'prendas_resueltas_total' => $s->prendas_resueltas_total,
                'ajuste_recurso' => $s->ajuste_recurso,
                'observacion_solicitante' => $s->observacion_solicitante,
                'baja_modo' => $s->baja_modo,
                'sustituto' => $s->sustituto,
                'observacion_administracion' => $s->observacion_administracion,
                'resuelta_por' => $s->resueltaPor?->name,
                'resuelta_at' => $s->resuelta_at?->format('d/m/Y H:i'),
                'created_at' => $s->created_at->format('d/m/Y H:i'),
                'empleado' => [
                    'id' => $s->empleado->id,
                    'nombre_completo' => strtoupper(trim("{$s->empleado->apellido_paterno} {$s->empleado->apellido_materno} {$s->empleado->nombre}")),
                    'nue' => $s->empleado->nue,
                    'ur' => $s->empleado->ur,
                    'delegacion' => $s->empleado->delegacion_codigo,
                ],
            ]);

        $totales = [
            'pendiente' => SolicitudMovimiento::where('estado', 'pendiente')->count(),
            'aprobada' => SolicitudMovimiento::where('estado', 'aprobada')->count(),
            'rechazada' => SolicitudMovimiento::where('estado', 'rechazada')->count(),
        ];

        return Inertia::render('Admin/SolicitudesMovimiento/Index', [
            'solicitudes' => $solicitudes,
            'totales' => $totales,
            'filters' => $request->only(['estado', 'search']),
        ]);
    }

    public function empleadoVestuario(int $solicitudId): JsonResponse
    {
        $solicitud = SolicitudMovimiento::query()
            ->with(['empleado:id,nombre,apellido_paterno,apellido_materno,nue,ur,delegacion_codigo'])
            ->findOrFail($solicitudId);

        $empleado = $solicitud->empleado;
        if (! $empleado) {
            return response()->json([
                'data' => null,
                'message' => 'No se encontró el empleado asociado a la solicitud.',
                'errors' => ['empleado' => 'Sin empleado asociado.'],
            ], 404);
        }

        $pack = $this->vestuarioAnioParaVistaResolver((int) $empleado->id);

        return response()->json([
            'data' => [
                'empleado' => [
                    'id' => $empleado->id,
                    'nombre_completo' => strtoupper(trim("{$empleado->apellido_paterno} {$empleado->apellido_materno} {$empleado->nombre}")),
                    'nue' => $empleado->nue,
                    'ur' => $empleado->ur,
                    'delegacion' => $empleado->delegacion_codigo,
                ],
                'anio' => $pack['anio'],
                'vestuario' => $pack['vestuario'],
            ],
            'message' => null,
            'errors' => null,
        ]);
    }

    public function resolver(Request $request, int $solicitudId): JsonResponse
    {
        $validated = $request->validate([
            'decision' => ['required', 'string', 'in:aprobada,rechazada'],
            'lleva_recurso' => ['nullable', 'boolean'],
            'modo_prendas' => ['nullable', 'string', 'in:todas,seleccion,ninguna'],
            'prendas_ids' => ['nullable', 'array'],
            'prendas_ids.*' => ['integer', 'distinct'],
            'ajuste_recurso' => ['nullable', 'string', 'max:500'],
            'observacion_administracion' => ['nullable', 'string', 'max:500'],
        ]);

        $solicitud = SolicitudMovimiento::where('id', $solicitudId)
            ->where('estado', 'pendiente')
            ->with(['empleado', 'solicitadaPor'])
            ->firstOrFail();

        DB::transaction(function () use ($solicitud, $validated) {
            // Registrar la resolución
            $solicitud->update([
                'estado' => $validated['decision'],
                'lleva_recurso' => $validated['lleva_recurso'] ?? null,
                'modo_prendas' => null,
                'prendas_resueltas_total' => null,
                'ajuste_recurso' => $validated['ajuste_recurso'] ?? null,
                'observacion_administracion' => $validated['observacion_administracion'] ?? null,
                'resuelta_por' => Auth::id(),
                'resuelta_at' => now(),
            ]);

            if ($validated['decision'] === 'aprobada') {
                $empleado = $solicitud->empleado;
                $anio = $this->anioResolverCoincideConVistaEmpleado((int) $empleado->id);

                $idsAsignaciones = AsignacionEmpleadoProducto::query()
                    ->where('empleado_id', $empleado->id)
                    ->where('anio', $anio)
                    ->pluck('id')
                    ->map(static fn ($id): int => (int) $id)
                    ->values();

                $modoPrendas = $validated['modo_prendas'] ?? 'todas';
                $idsSolicitadas = collect($validated['prendas_ids'] ?? [])->map(static fn ($id): int => (int) $id)->values();
                $idsValidas = $idsSolicitadas->intersect($idsAsignaciones)->values();

                $idsConRecurso = match ($modoPrendas) {
                    'ninguna' => collect(),
                    'seleccion' => $idsValidas,
                    default => $idsAsignaciones,
                };

                $idsSinRecurso = $idsAsignaciones->diff($idsConRecurso)->values();
                $totalPrendasResueltas = (int) $idsConRecurso->count();

                if ($solicitud->tipo === 'baja') {
                    /*
                     * BAJA APROBADA:
                     * El empleado sale. El recurso (producto_licitado_id) queda
                     * en la delegación origen. No se tocan las asignaciones.
                     */
                    $empleado->update([
                        'estado_delegacion' => 'baja',
                        'observacion_delegacion' => $solicitud->observacion_solicitante,
                    ]);

                    if ($idsConRecurso->isNotEmpty()) {
                        AsignacionEmpleadoProducto::query()
                            ->whereIn('id', $idsConRecurso->all())
                            ->update([
                                'estado_anio_actual' => 'pendiente',
                                'observacion_anio_actual' => 'Disponible para reasignación tras baja aprobada.',
                                'talla_actualizada_at' => null,
                            ]);
                    }
                    if ($idsSinRecurso->isNotEmpty()) {
                        AsignacionEmpleadoProducto::query()
                            ->whereIn('id', $idsSinRecurso->all())
                            ->update([
                                'estado_anio_actual' => 'baja',
                                'observacion_anio_actual' => 'Sin reasignación al resolver baja.',
                                'talla_actualizada_at' => null,
                            ]);
                    }

                    if (($solicitud->baja_modo ?? 'definitiva') === 'sustitucion' && is_array($solicitud->sustituto)) {
                        app(AltaSustitutoPorBajaService::class)->ejecutar(
                            $solicitud,
                            $empleado,
                            $idsConRecurso,
                        );
                    }

                } elseif ($solicitud->tipo === 'cambio') {
                    /*
                     * CAMBIO APROBADO:
                     * El empleado se mueve a la delegación destino.
                     * Si lleva_recurso=true: el recurso lo sigue (las asignaciones
                     *   se resetean para que la nueva delegación asigne vestuario nuevo).
                     * Si lleva_recurso=false: las asignaciones quedan en origen
                     *   y el empleado empieza desde cero en destino.
                     */
                    $delegacionOrigen = $empleado->delegacion_codigo;
                    $urOrigen = Delegacion::query()->where('codigo', $delegacionOrigen)->value('ur_referencia');
                    $urDestino = Delegacion::query()->where('codigo', $solicitud->delegacion_destino)->value('ur_referencia');
                    $esMismaUr = $urOrigen && $urDestino && $urOrigen === $urDestino;
                    $llevaRecurso = $esMismaUr ? true : (bool) ($validated['lleva_recurso'] ?? false);

                    $empleado->update([
                        'delegacion_codigo' => $solicitud->delegacion_destino,
                        'estado_delegacion' => 'activo',
                        'observacion_delegacion' => "Transferido desde {$delegacionOrigen}. ".($solicitud->observacion_solicitante ?? ''),
                    ]);

                    if ($llevaRecurso && $idsConRecurso->isNotEmpty()) {
                        // Prendas seleccionadas: acompañan al empleado y se reinician en destino.
                        AsignacionEmpleadoProducto::where('empleado_id', $empleado->id)
                            ->where('anio', $anio)
                            ->whereIn('id', $idsConRecurso->all())
                            ->update([
                                'talla_anio_actual' => null,
                                'medida_anio_actual' => null,
                                'estado_anio_actual' => 'pendiente',
                                'observacion_anio_actual' => 'Transferida en cambio de delegación aprobado; pendiente en destino.',
                                'talla_actualizada_at' => null,
                            ]);
                    }

                    if ($idsSinRecurso->isNotEmpty()) {
                        AsignacionEmpleadoProducto::where('empleado_id', $empleado->id)
                            ->where('anio', $anio)
                            ->whereIn('id', $idsSinRecurso->all())
                            ->update([
                                'estado_anio_actual' => 'baja',
                                'observacion_anio_actual' => 'Recurso no transferido; disponible en delegación origen.',
                                'talla_actualizada_at' => null,
                            ]);
                    }

                    $solicitud->update(['lleva_recurso' => $llevaRecurso]);
                }

                $solicitud->update([
                    'modo_prendas' => $modoPrendas,
                    'prendas_resueltas_total' => $totalPrendasResueltas,
                ]);
            }
        });

        // Notificar al delegado que envió la solicitud.
        // notify() guarda en DB; SivsoNotificacion emite por WebSocket sin queue.
        if ($solicitud->solicitadaPor instanceof User) {
            $solicitud->loadMissing(['empleado', 'resueltaPor']);
            $destinatario = $solicitud->solicitadaPor;
            $notification = new SolicitudResueltaNotification($solicitud);
            $destinatario->notify($notification);
            $payload = array_merge($notification->toArray($destinatario), [
                'id' => $destinatario->notifications()->latest()->first()?->id,
            ]);
            broadcast(new SivsoNotificacion($payload, $destinatario->id));
        }

        if ($validated['decision'] === 'aprobada' && $solicitud->tipo === 'cambio' && $solicitud->delegacion_destino) {
            $solicitud->loadMissing(['empleado']);
            $notificationDestino = new MovimientoDelegacionDestinoNotification($solicitud);
            User::query()
                ->whereHas('delegado.delegaciones', fn ($q) => $q->where('delegacion.codigo', $solicitud->delegacion_destino))
                ->get()
                ->each(function (User $user) use ($notificationDestino) {
                    $user->notify($notificationDestino);
                    $payload = array_merge($notificationDestino->toArray($user), [
                        'id' => $user->notifications()->latest()->first()?->id,
                    ]);
                    broadcast(new SivsoNotificacion($payload, $user->id));
                });
        }

        return response()->json([
            'data' => ['id' => $solicitud->id, 'estado' => $validated['decision']],
            'message' => $validated['decision'] === 'aprobada'
                ? 'Solicitud aprobada y movimiento ejecutado.'
                : 'Solicitud rechazada.',
            'errors' => null,
        ]);
    }

    /**
     * Años con filas en `asignacion_empleado_producto` para el empleado (más reciente primero).
     *
     * @return list<int>
     */
    private function aniosAsignacionesEmpleadoDesc(int $empleadoId): array
    {
        return DB::table('asignacion_empleado_producto')
            ->where('empleado_id', $empleadoId)
            ->distinct()
            ->orderByDesc('anio')
            ->pluck('anio')
            ->map(static fn ($a): int => (int) $a)
            ->values()
            ->all();
    }

    /**
     * Listado de prendas como en el modal Resolver (joins a catálogo / cotizado).
     *
     * @return list<array<string, mixed>>
     */
    private function mapearVestuarioEmpleadoParaAnio(int $empleadoId, int $anio): array
    {
        $anioCatalogo = SivsoVestuario::anioCatalogoResuelto();

        $query = DB::table('asignacion_empleado_producto as aep')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id');
        VestuarioCotizadoJoin::applyCotizadoResuelto($query, 'aep', $anioCatalogo);

        return $query->where('aep.empleado_id', $empleadoId)
            ->where('aep.anio', $anio)
            ->select([
                'aep.id',
                'aep.cantidad',
                'aep.talla',
                'aep.talla_anio_actual',
                'aep.medida_anio_actual',
                'aep.estado_anio_actual',
                DB::raw(VestuarioCotizadoJoin::coalesceDescripcionSql().' as prenda'),
                DB::raw(VestuarioCotizadoJoin::coalesceClaveSql().' as clave'),
            ])
            ->orderBy('clave')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'prenda' => $a->prenda,
                'clave' => $a->clave,
                'cantidad' => max(1, (int) ($a->cantidad ?? 1)),
                'talla' => $a->talla_anio_actual ?? $a->talla,
                'medida' => $a->medida_anio_actual,
                'estado' => $a->estado_anio_actual ?? 'pendiente',
            ])
            ->values()
            ->all();
    }

    /**
     * El año mostrado y las filas deben coincidir: se usa el ejercicio más reciente del empleado
     * que devuelve al menos una prenda con la consulta completa. Si no hay asignaciones en ningún año,
     * `anio` es null. Si hay filas crudas pero ninguna pasa el join, se devuelve el año más reciente y lista vacía.
     *
     * @return array{anio: int|null, vestuario: list<array<string, mixed>>}
     */
    private function vestuarioAnioParaVistaResolver(int $empleadoId): array
    {
        $anios = $this->aniosAsignacionesEmpleadoDesc($empleadoId);
        if ($anios === []) {
            return ['anio' => null, 'vestuario' => []];
        }

        foreach ($anios as $y) {
            $filas = $this->mapearVestuarioEmpleadoParaAnio($empleadoId, $y);
            if ($filas !== []) {
                return ['anio' => $y, 'vestuario' => $filas];
            }
        }

        return ['anio' => $anios[0], 'vestuario' => []];
    }

    /**
     * Mismo criterio de año que el modal, para que los IDs de prenda al aprobar coincidan con la vista.
     */
    private function anioResolverCoincideConVistaEmpleado(int $empleadoId): int
    {
        $pack = $this->vestuarioAnioParaVistaResolver($empleadoId);
        if ($pack['anio'] !== null) {
            return $pack['anio'];
        }

        return SivsoVestuario::anioAsignacionesVestuario();
    }
}
