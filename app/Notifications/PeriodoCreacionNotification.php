<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PeriodoVestuario;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PeriodoCreacionNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly PeriodoVestuario $periodo,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $fechaInicio = $this->periodo->fecha_inicio?->format('d/m/Y') ?? '—';
        $fechaFin    = $this->periodo->fecha_fin?->format('d/m/Y') ?? '—';

        return [
            'tipo'   => 'periodo_creado',
            'titulo' => 'Nuevo período de vestuario creado',
            'cuerpo' => "Se ha registrado el período \"{$this->periodo->nombre}\" ({$this->periodo->anio}), del {$fechaInicio} al {$fechaFin}. Estará disponible una vez sea abierto.",
            'url'    => '/mi-delegacion',
        ];
    }
}
