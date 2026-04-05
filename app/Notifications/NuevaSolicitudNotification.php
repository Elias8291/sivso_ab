<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\SolicitudMovimiento;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NuevaSolicitudNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly SolicitudMovimiento $solicitud) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $empleado = $this->solicitud->empleado;
        $nombre   = $empleado
            ? strtoupper(trim("{$empleado->apellido_paterno} {$empleado->apellido_materno} {$empleado->nombre}"))
            : 'Empleado';

        $esBaja = $this->solicitud->tipo === 'baja';

        return [
            'tipo'    => 'nueva_solicitud',
            'titulo'  => $esBaja ? 'Solicitud de baja' : 'Solicitud de cambio',
            'cuerpo'  => $esBaja
                ? "{$nombre} — baja solicitada en delegación {$this->solicitud->delegacion_origen}."
                : "{$nombre} — cambio a delegación {$this->solicitud->delegacion_destino} solicitado.",
            'url'     => '/solicitudes-movimiento',
            'decision'=> null,
            'tipo_sol'=> $this->solicitud->tipo,
        ];
    }
}
