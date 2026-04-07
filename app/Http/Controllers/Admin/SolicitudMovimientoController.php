<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Events\SivsoNotificacion;
use App\Http\Controllers\Controller;
use App\Models\AsignacionEmpleadoProducto;
use App\Models\SolicitudMovimiento;
use App\Models\User;
use App\Notifications\SolicitudResueltaNotification;
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
                'ajuste_recurso' => $s->ajuste_recurso,
                'observacion_solicitante' => $s->observacion_solicitante,
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

        $anio = SivsoVestuario::anioAsignacionesVestuario();
        $anioCatalogo = SivsoVestuario::anioCatalogoResuelto();

        $vestuario = DB::table('asignacion_empleado_producto as aep')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id');
        VestuarioCotizadoJoin::applyCotizadoResuelto($vestuario, 'aep', $anioCatalogo);
        $vestuario->where('aep.empleado_id', $empleado->id)
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

        return response()->json([
            'data' => [
                'empleado' => [
                    'id' => $empleado->id,
                    'nombre_completo' => strtoupper(trim("{$empleado->apellido_paterno} {$empleado->apellido_materno} {$empleado->nombre}")),
                    'nue' => $empleado->nue,
                    'ur' => $empleado->ur,
                    'delegacion' => $empleado->delegacion_codigo,
                ],
                'anio' => SivsoVestuario::anioAsignacionesVestuario(),
                'vestuario' => $vestuario,
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
                'ajuste_recurso' => $validated['ajuste_recurso'] ?? null,
                'observacion_administracion' => $validated['observacion_administracion'] ?? null,
                'resuelta_por' => Auth::id(),
                'resuelta_at' => now(),
            ]);

            if ($validated['decision'] === 'aprobada') {
                $empleado = $solicitud->empleado;

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

                    $empleado->update([
                        'delegacion_codigo' => $solicitud->delegacion_destino,
                        'estado_delegacion' => 'activo',
                        'observacion_delegacion' => "Transferido desde {$delegacionOrigen}. ".($solicitud->observacion_solicitante ?? ''),
                    ]);

                    if ($validated['lleva_recurso']) {
                        // El recurso va con el empleado: resetear tallas para nueva asignación
                        AsignacionEmpleadoProducto::where('empleado_id', $empleado->id)
                            ->where('anio', SivsoVestuario::anioReferencia())
                            ->update([
                                'talla_anio_actual' => null,
                                'medida_anio_actual' => null,
                                'estado_anio_actual' => 'pendiente',
                                'observacion_anio_actual' => 'Pendiente de vestuario nuevo (cambio de delegación aprobado).',
                                'talla_actualizada_at' => null,
                            ]);
                    }
                    // Si no lleva recurso: las asignaciones quedan asociadas al empleado
                    // pero la delegación origen puede reclamarlas. Eso se gestiona aparte.
                }
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

        return response()->json([
            'data' => ['id' => $solicitud->id, 'estado' => $validated['decision']],
            'message' => $validated['decision'] === 'aprobada'
                ? 'Solicitud aprobada y movimiento ejecutado.'
                : 'Solicitud rechazada.',
            'errors' => null,
        ]);
    }
}
