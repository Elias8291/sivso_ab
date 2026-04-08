<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\SolicitudMovimiento;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MovimientoDelegacionDestinoNotification extends Notification
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
        $nombre = $empleado
            ? strtoupper(trim("{$empleado->apellido_paterno} {$empleado->apellido_materno} {$empleado->nombre}"))
            : 'Empleado';

        return [
            'tipo' => 'movimiento_destino',
            'titulo' => 'Empleado transferido a tu delegación',
            'cuerpo' => "{$nombre} fue transferido a delegación {$this->solicitud->delegacion_destino}.",
            'url' => '/mi-delegacion?delegacion_codigo='.$this->solicitud->delegacion_destino,
            'decision' => 'aprobada',
            'tipo_sol' => 'cambio',
        ];
    }
}
