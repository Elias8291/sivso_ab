<?php

declare(strict_types=1);

namespace App\Services\Delegado;

use App\Events\SivsoNotificacion;
use App\Models\SolicitudMovimiento;
use App\Models\User;
use App\Notifications\NuevaSolicitudNotification;
use Illuminate\Support\Facades\DB;

final class NotificarAdminsNuevaSolicitudService
{
    public function notify(SolicitudMovimiento $solicitud): void
    {
        $solicitud->load('empleado');
        $notification = new NuevaSolicitudNotification($solicitud);

        $admins = User::query()->where('is_super_admin', true)->get();
        if ($admins->isEmpty()) {
            return;
        }

        $sentAt = now();

        foreach ($admins as $admin) {
            $admin->notify($notification);
        }

        $adminIds = $admins->pluck('id')->all();
        $morphClass = (new User)->getMorphClass();

        $rows = DB::table('notifications')
            ->where('notifiable_type', $morphClass)
            ->whereIn('notifiable_id', $adminIds)
            ->where('type', NuevaSolicitudNotification::class)
            ->where('created_at', '>=', $sentAt)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get(['id', 'notifiable_id']);

        /** @var array<int, string> $idByUserId */
        $idByUserId = [];
        foreach ($rows as $row) {
            $uid = (int) $row->notifiable_id;
            if (! isset($idByUserId[$uid])) {
                $idByUserId[$uid] = (string) $row->id;
            }
        }

        foreach ($admins as $admin) {
            $payload = array_merge($notification->toArray($admin), [
                'id' => $idByUserId[$admin->id] ?? null,
            ]);
            broadcast(new SivsoNotificacion($payload, $admin->id));
        }
    }
}
