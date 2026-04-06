<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Delegado\MiDelegacionController;
use App\Models\Delegacion;
use App\Models\Delegado;
use App\Models\Dependencia;
use App\Models\Empleado;
use App\Models\PeriodoVestuario;
use App\Models\ProductoCotizado;
use App\Models\SolicitudMovimiento;
use App\Models\User;
use App\Support\SivsoPermissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

final class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        \assert($user instanceof User);

        if ($this->useDelegadoDashboard($user)) {
            return app(MiDelegacionController::class)->panel($request);
        }

        return Inertia::render('Dashboard', [
            'resumen_admin' => $this->resumenParaAdmin($user),
        ]);
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

    /**
     * Contadores según permisos de ver (null = no mostrar KPI).
     *
     * @return array<string, int|null>
     */
    private function resumenParaAdmin(User $user): array
    {
        $user->loadMissing('delegado');

        return [
            'mi_delegacion' => $user->can(SivsoPermissions::VER_MI_DELEGACION) && $user->delegado !== null
                ? $user->delegado->delegaciones()->count()
                : null,
            'empleados' => $user->can(SivsoPermissions::VER_EMPLEADOS)
                ? Empleado::query()->count()
                : null,
            'productos' => $user->can(SivsoPermissions::VER_PRODUCTOS)
                ? ProductoCotizado::query()->count()
                : null,
            'partidas' => $user->can(SivsoPermissions::VER_PARTIDAS)
                ? $this->countDistinctPartidas()
                : null,
            'dependencias' => $user->can(SivsoPermissions::VER_DEPENDENCIAS)
                ? Dependencia::query()->count()
                : null,
            'delegaciones' => $user->can(SivsoPermissions::VER_DELEGACIONES)
                ? Delegacion::query()->count()
                : null,
            'delegados' => $user->can(SivsoPermissions::VER_DELEGADOS)
                ? Delegado::query()->count()
                : null,
            'periodos' => $user->can(SivsoPermissions::VER_PERIODOS)
                ? PeriodoVestuario::query()->count()
                : null,
            'usuarios' => $user->can(SivsoPermissions::VER_USUARIOS)
                ? User::query()->count()
                : null,
            'roles' => $user->can(SivsoPermissions::VER_ROLES)
                ? Role::query()->count()
                : null,
            'permisos' => $user->can(SivsoPermissions::VER_PERMISOS)
                ? Permission::query()->count()
                : null,
            'solicitudes_totales' => $user->can(SivsoPermissions::VER_SOLICITUDES)
                ? SolicitudMovimiento::query()->count()
                : null,
            'solicitudes_pendientes' => $user->can(SivsoPermissions::VER_SOLICITUDES)
                ? SolicitudMovimiento::query()->where('estado', 'pendiente')->count()
                : null,
        ];
    }

    private function countDistinctPartidas(): int
    {
        return (int) DB::query()->fromSub(
            DB::table('producto_licitado')->select('anio', 'numero_partida')->distinct(),
            'p',
        )->count();
    }

}
