<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Rbac\SyncRbacFromCatalogService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

final class SyncRbacFromCatalogCommand extends Command
{
    protected $signature = 'sivso:sync-rbac
                            {--assign-seed-users : Asigna roles a admin@example.com (Administrador SIVSO) y test@example.com (Delegado) si existen}';

    protected $description = 'Sincroniza permisos del catálogo SIVSO y roles base en la base de datos (Spatie)';

    public function handle(SyncRbacFromCatalogService $sync): int
    {
        $permissionsTable = config('permission.table_names.permissions');
        $rolesTable = config('permission.table_names.roles');

        if (! is_string($permissionsTable) || ! is_string($rolesTable)
            || ! Schema::hasTable($permissionsTable) || ! Schema::hasTable($rolesTable)) {
            $this->error('Faltan tablas de permisos. Ejecuta: php artisan migrate');

            return self::FAILURE;
        }

        $sync->syncCatalogAndSystemRoles();
        $this->info('Permisos del catálogo y roles base actualizados (Administrador SIVSO: todos; Delegado: mi delegación).');

        if ($this->option('assign-seed-users')) {
            $sync->assignSeedUsersIfPresent();
            $this->info('Usuarios seed (admin@example.com / test@example.com) sincronizados si existían.');
        }

        $this->comment('Otros roles (además de Administrador SIVSO y Delegado) no se tocan. En la tabla permissions solo se crean entradas del catálogo que falten.');

        return self::SUCCESS;
    }
}
