<?php

declare(strict_types=1);

namespace App\Services\Rbac;

use App\Models\User;
use App\Support\SivsoPermissions;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class SyncRbacFromCatalogService
{
    public function __construct(
        private readonly PermissionRegistrar $permissionRegistrar,
    ) {}

    /**
     * Crea/actualiza permisos del catálogo y roles base (Administrador SIVSO, Delegado).
     * No modifica otros roles ni asignaciones de usuario salvo que se pida explícitamente.
     */
    public function syncCatalogAndSystemRoles(): void
    {
        $this->permissionRegistrar->forgetCachedPermissions();

        foreach (SivsoPermissions::catalog() as $row) {
            Permission::query()->firstOrCreate(
                ['name' => $row['name'], 'guard_name' => 'web'],
                [],
            );
        }

        $allPermissionNames = SivsoPermissions::names();

        /** @var Role $adminRole */
        $adminRole = Role::query()->firstOrCreate(
            ['name' => SivsoPermissions::ROLE_ADMIN_SIVSO, 'guard_name' => 'web'],
        );
        $adminRole->syncPermissions($allPermissionNames);

        /** @var Role $delegadoRole */
        $delegadoRole = Role::query()->firstOrCreate(
            ['name' => SivsoPermissions::ROLE_DELEGADO, 'guard_name' => 'web'],
        );
        $delegadoRole->syncPermissions([
            SivsoPermissions::VER_COTEJO_VESTUARIO,
        ]);

        $this->permissionRegistrar->forgetCachedPermissions();
    }

    /**
     * Solo para entornos de desarrollo / seeds: asigna roles por email si los usuarios existen.
     */
    public function assignSeedUsersIfPresent(): void
    {
        $admin = User::query()->where('email', 'admin@example.com')->first();
        if ($admin !== null) {
            $admin->syncRoles([SivsoPermissions::ROLE_ADMIN_SIVSO]);
        }

        $test = User::query()->where('email', 'test@example.com')->first();
        if ($test !== null) {
            $test->syncRoles([SivsoPermissions::ROLE_DELEGADO]);
        }

        $this->permissionRegistrar->forgetCachedPermissions();
    }
}
