<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\SolicitudMovimiento;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SolicitudResueltaNotification extends Notification
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
        $resueltaPor = $this->solicitud->resueltaPor?->name ?? 'S.Administración';

        $aprobada = $this->solicitud->estado === 'aprobada';
        $esBaja   = $this->solicitud->tipo   === 'baja';

        $titulo = $aprobada
            ? ($esBaja ? 'Baja aprobada' : 'Cambio aprobado')
            : ($esBaja ? 'Baja rechazada' : 'Cambio rechazado');

        $cuerpo = $aprobada
            ? ($esBaja
                ? "La baja de {$nombre} fue aprobada por {$resueltaPor}."
                : "El cambio de {$nombre} a delegación {$this->solicitud->delegacion_destino} fue aprobado por {$resueltaPor}.")
            : ($esBaja
                ? "La solicitud de baja para {$nombre} fue rechazada por {$resueltaPor}."
                : "La solicitud de cambio para {$nombre} fue rechazada por {$resueltaPor}.");

        return [
            'tipo'    => 'solicitud_resuelta',
            'titulo'  => $titulo,
            'cuerpo'  => $cuerpo,
            'url'     => '/mi-delegacion',
            'decision'=> $this->solicitud->estado,
            'tipo_sol'=> $this->solicitud->tipo,
            'resuelta_por' => $resueltaPor,
        ];
    }
}
