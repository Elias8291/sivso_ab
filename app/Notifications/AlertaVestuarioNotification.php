<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Delegacion;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AlertaVestuarioNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Delegacion $delegacion,
        private readonly int $pendientes,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $cuerpo = $this->pendientes > 0
            ? "Tu delegación {$this->delegacion->codigo} tiene {$this->pendientes} talla(s) pendiente(s) de confirmar. Por favor, completa las actualizaciones a la brevedad."
            : "Recordatorio: revisa y confirma las tallas de tu delegación {$this->delegacion->codigo}.";

        return [
            'tipo'   => 'alerta_vestuario',
            'titulo' => '¡Apresúrate! Tallas pendientes',
            'cuerpo' => $cuerpo,
            'url'    => '/mi-delegacion',
        ];
    }
}
