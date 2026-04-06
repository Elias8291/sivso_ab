<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Delegado\MiDelegacionController;
use App\Models\User;
use App\Support\SivsoPermissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    /**
     * Punto único de entrada tras el login. Cada perfil puede resolver a una página distinta.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        \assert($user instanceof User);

        if ($this->useDelegadoDashboard($user)) {
            return app(MiDelegacionController::class)->panel($request);
        }

        // Aquí se pueden añadir más ramas por rol (p. ej. solo estructura, solo lectura, etc.).
        return Inertia::render('Dashboard');
    }

    /**
     * Delegados (perfil vinculado o rol) con permiso de ver su delegación, excl. administradores globales.
     */
    private function useDelegadoDashboard(User $user): bool
    {
        if ($user->is_super_admin) {
            return false;
        }
        if ($user->hasRole(SivsoPermissions::ROLE_ADMIN_SIVSO)) {
            return false;
        }
        if (! $user->can(SivsoPermissions::VER_MI_DELEGACION)) {
            return false;
        }

        $user->loadMissing('delegado');

        if ($user->delegado !== null) {
            return true;
        }

        return $user->hasRole(SivsoPermissions::ROLE_DELEGADO);
    }
}
