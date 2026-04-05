<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Evento de notificación en tiempo real para un usuario específico.
 * Usa ShouldBroadcastNow para emitir INMEDIATAMENTE por WebSocket,
 * sin pasar por la queue.
 */
class SivsoNotificacion implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        private readonly array $payload,
        private readonly int   $userId,
    ) {}

    /** Canal privado del usuario destino. */
    public function broadcastOn(): array
    {
        return [new PrivateChannel("App.Models.User.{$this->userId}")];
    }

    /** Nombre del evento en el cliente (el punto inicial evita el prefijo del canal). */
    public function broadcastAs(): string
    {
        return 'sivso.notificacion';
    }

    public function broadcastWith(): array
    {
        return $this->payload;
    }
}
