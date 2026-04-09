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

        if (! $user) {
            return array_merge(parent::share($request), [
                'flash' => ['status' => $request->session()->get('status')],
                'auth' => [
                    'user' => null,
                    'is_super_admin' => false,
                    'is_sivso_administrator' => false,
                    'permissions' => [],
                    'delegado' => null,
                ],
                'notificaciones' => [],
            ]);
        }

        $user->loadMissing(['delegado.delegaciones', 'delegado.empleado:id,nue']);

        $delegado = null;
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

        $cacheKey = "user:{$user->id}:inertia_share";
        $cached = $request->attributes->get($cacheKey);
        if ($cached === null) {
            $cached = [
                'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                'is_sivso_administrator' => $user->hasRole(SivsoPermissions::ROLE_ADMIN_SIVSO),
            ];
            $request->attributes->set($cacheKey, $cached);
        }

        return array_merge(parent::share($request), [
            'flash' => ['status' => $request->session()->get('status')],
            'auth' => [
                'user' => $user->only('id', 'name', 'email', 'rfc', 'nue', 'is_super_admin'),
                'is_super_admin' => (bool) $user->is_super_admin,
                'is_sivso_administrator' => (bool) $cached['is_sivso_administrator'],
                'permissions' => $cached['permissions'],
                'delegado' => $delegado,
            ],
            'notificaciones' => fn () => $this->unreadNotifications($user),
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function unreadNotifications(\App\Models\User $user): array
    {
        return $user->unreadNotifications()
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
            ->all();
    }
}
