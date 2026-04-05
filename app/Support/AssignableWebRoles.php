<?php

declare(strict_types=1);

namespace App\Support;

use Spatie\Permission\Models\Role;

final class AssignableWebRoles
{
    /**
     * @return list<array{name: string}>
     */
    public static function options(): array
    {
        return Role::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['name'])
            ->map(static fn (Role $r) => ['name' => $r->name])
            ->values()
            ->all();
    }
}
