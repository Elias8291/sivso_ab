<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Services\Rbac\SyncRbacFromCatalogService;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $sync = app(SyncRbacFromCatalogService::class);
        $sync->syncCatalogAndSystemRoles();
        $sync->assignSeedUsersIfPresent();
    }
}
