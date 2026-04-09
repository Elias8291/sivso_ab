<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Controllers\Delegado\MiDelegacionController;
use App\Models\User;
use App\Support\SivsoPermissions;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
     * Una sola query con sub-selects en vez de 13 COUNT individuales.
     *
     * @return array<string, int|null>
     */
    private function resumenParaAdmin(User $user): array
    {
        $user->loadMissing('delegado');

        $permMap = [
            'empleados'              => SivsoPermissions::VER_EMPLEADOS,
            'productos'              => SivsoPermissions::VER_PRODUCTOS,
            'partidas'               => SivsoPermissions::VER_PARTIDAS,
            'dependencias'           => SivsoPermissions::VER_DEPENDENCIAS,
            'delegaciones'           => SivsoPermissions::VER_DELEGACIONES,
            'delegados'              => SivsoPermissions::VER_DELEGADOS,
            'periodos'               => SivsoPermissions::VER_PERIODOS,
            'usuarios'               => SivsoPermissions::VER_USUARIOS,
            'roles'                  => SivsoPermissions::VER_ROLES,
            'permisos'               => SivsoPermissions::VER_PERMISOS,
            'solicitudes_totales'    => SivsoPermissions::VER_SOLICITUDES,
            'solicitudes_pendientes' => SivsoPermissions::VER_SOLICITUDES,
        ];

        $needed = [];
        foreach ($permMap as $key => $perm) {
            if ($user->can($perm)) {
                $needed[] = $key;
            }
        }

        $counts = [];
        if ($needed !== []) {
            $query = DB::query()->selectRaw('1');

            $subSelects = [
                'empleados'              => '(SELECT COUNT(*) FROM empleados)',
                'productos'              => '(SELECT COUNT(*) FROM producto_cotizado)',
                'partidas'               => '(SELECT COUNT(*) FROM (SELECT DISTINCT anio, numero_partida FROM producto_licitado) AS p)',
                'dependencias'           => '(SELECT COUNT(*) FROM dependencias)',
                'delegaciones'           => '(SELECT COUNT(*) FROM delegaciones)',
                'delegados'              => '(SELECT COUNT(*) FROM delegados)',
                'periodos'               => '(SELECT COUNT(*) FROM periodos_vestuario)',
                'usuarios'               => '(SELECT COUNT(*) FROM users)',
                'roles'                  => '(SELECT COUNT(*) FROM roles)',
                'permisos'               => '(SELECT COUNT(*) FROM permissions)',
                'solicitudes_totales'    => '(SELECT COUNT(*) FROM solicitudes_movimiento)',
                'solicitudes_pendientes' => "(SELECT COUNT(*) FROM solicitudes_movimiento WHERE estado = 'pendiente')",
            ];

            foreach ($needed as $key) {
                if (isset($subSelects[$key])) {
                    $query->selectRaw("{$subSelects[$key]} AS {$key}");
                }
            }

            $counts = (array) $query->first();
            unset($counts['1']);
        }

        $result = [];
        foreach (array_keys($permMap) as $key) {
            $result[$key] = isset($counts[$key]) ? (int) $counts[$key] : null;
        }

        $result['mi_delegacion'] = $user->can(SivsoPermissions::VER_MI_DELEGACION) && $user->delegado !== null
            ? $user->delegado->delegaciones()->count()
            : null;

        return $result;
    }

}
