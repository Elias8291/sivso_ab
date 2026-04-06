<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Delegado\MiDelegacionController;
use App\Models\Delegacion;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\PeriodoVestuario;
use App\Models\SolicitudMovimiento;
use App\Models\User;
use App\Support\SivsoPermissions;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

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
            'periodo' => $this->periodoVigente(),
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
     * @return array<string, mixed>|null
     */
    private function periodoVigente(): ?array
    {
        $p = PeriodoVestuario::query()
            ->orderByRaw("FIELD(estado,'abierto','proximo','cerrado')")
            ->orderByDesc('anio')
            ->first();

        if (! $p) {
            return null;
        }

        return [
            'id' => $p->id,
            'nombre' => $p->nombre,
            'anio' => $p->anio,
            'fecha_inicio' => $p->fecha_inicio?->format('Y-m-d'),
            'fecha_fin' => $p->fecha_fin?->format('Y-m-d'),
            'estado' => $p->estado,
            'descripcion' => $p->descripcion,
        ];
    }

    /**
     * Contadores según permisos (null = no mostrar KPI).
     *
     * @return array{empleados: int|null, solicitudes_pendientes: int|null, delegaciones: int|null, delegados: int|null, usuarios: int|null}
     */
    private function resumenParaAdmin(User $user): array
    {
        return [
            'empleados' => $user->can(SivsoPermissions::VER_EMPLEADOS)
                ? Empleado::query()->count()
                : null,
            'solicitudes_pendientes' => $user->can(SivsoPermissions::VER_SOLICITUDES)
                ? SolicitudMovimiento::query()->where('estado', 'pendiente')->count()
                : null,
            'delegaciones' => $user->can(SivsoPermissions::VER_DELEGACIONES)
                ? Delegacion::query()->count()
                : null,
            'delegados' => $user->can(SivsoPermissions::VER_DELEGADOS)
                ? Delegado::query()->count()
                : null,
            'usuarios' => $user->can(SivsoPermissions::VER_USUARIOS)
                ? User::query()->count()
                : null,
        ];
    }
}
