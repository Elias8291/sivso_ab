<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Support\SivsoPermissions;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * @var string
     */
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $delegado = null;
        if ($user) {
            $user->loadMissing(['delegado.delegaciones', 'delegado.empleado:id,nue']);
            if ($user->delegado) {
                $delegado = [
                    'nombre_completo' => $user->delegado->nombre_completo,
                    'delegaciones' => $user->delegado->delegaciones->pluck('codigo')->values()->all(),
                    'empleado' => $user->delegado->empleado
                        ? [
                            'id' => $user->delegado->empleado->id,
                            'nue' => $user->delegado->empleado->nue,
                        ]
                        : null,
                ];
            }
        }

        $notificaciones = $user
            ? $user->unreadNotifications()
                ->latest()
                ->limit(15)
                ->get()
                ->map(fn ($n) => [
                    'id' => $n->id,
                    'tipo' => $n->data['tipo'] ?? null,
                    'titulo' => $n->data['titulo'] ?? '',
                    'cuerpo' => $n->data['cuerpo'] ?? '',
                    'url' => $n->data['url'] ?? null,
                    'decision' => $n->data['decision'] ?? null,
                    'tipo_sol' => $n->data['tipo_sol'] ?? null,
                    'created_at' => $n->created_at->diffForHumans(),
                ])
                ->values()
            : collect();

        return array_merge(parent::share($request), [
            'flash' => [
                'status' => $request->session()->get('status'),
            ],
            'auth' => [
                'user' => $user
                    ? $user->only('id', 'name', 'email', 'rfc', 'nue', 'is_super_admin')
                    : null,
                'is_super_admin' => (bool) ($user?->is_super_admin ?? false),
                'is_sivso_administrator' => (bool) ($user?->hasRole(SivsoPermissions::ROLE_ADMIN_SIVSO) ?? false),
                'permissions' => $user
                    ? $user->getAllPermissions()->pluck('name')->values()->all()
                    : [],
                'delegado' => $delegado,
            ],
            'notificaciones' => $notificaciones,
        ]);
    }
}
