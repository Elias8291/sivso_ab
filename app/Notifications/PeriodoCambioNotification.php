<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\PeriodoVestuario;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PeriodoCambioNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly PeriodoVestuario $periodo,
        private readonly string $accion, // 'abierto' | 'cerrado'
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        if ($this->accion === 'abierto') {
            return [
                'tipo'   => 'periodo_abierto',
                'titulo' => '¡Período de vestuario abierto!',
                'cuerpo' => "El período \"{$this->periodo->nombre}\" ya está activo. Tienes hasta el {$this->periodo->fecha_fin->format('d/m/Y')} para actualizar las tallas de tu delegación.",
                'url'    => '/mi-delegacion',
            ];
        }

        return [
            'tipo'   => 'periodo_cerrado',
            'titulo' => 'Período de vestuario cerrado',
            'cuerpo' => "El período \"{$this->periodo->nombre}\" ha sido cerrado. Ya no es posible actualizar tallas de vestuario.",
            'url'    => '/mi-delegacion',
        ];
    }
}
