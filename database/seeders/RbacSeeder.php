<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Services\Rbac\SyncRbacFromCatalogService;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    /**
     * Uso típico: `php artisan db:seed --class=RbacSeeder` cuando solo quieres refrescar permisos/roles
     * sin volver a cargar el dataset. En `DatabaseSeeder` ya se llama a sync al inicio y assign al final.
     */
    public function run(): void
    {
        $sync = app(SyncRbacFromCatalogService::class);
        $sync->syncCatalogAndSystemRoles();
        $sync->assignSeedUsersIfPresent();
    }
}
