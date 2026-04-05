<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Support\SivsoPermissions;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

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
            SivsoPermissions::VER_MI_DELEGACION,
            SivsoPermissions::GESTIONAR_MI_DELEGACION,
        ]);

        $admin = User::query()->where('email', 'admin@example.com')->first();
        if ($admin !== null) {
            $admin->syncRoles([SivsoPermissions::ROLE_ADMIN_SIVSO]);
        }

        $test = User::query()->where('email', 'test@example.com')->first();
        if ($test !== null) {
            $test->syncRoles([SivsoPermissions::ROLE_DELEGADO]);
        }
    }
}
