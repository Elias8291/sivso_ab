<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Support\SivsoPermissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->when($search, function ($query, string $search): void {
                $query->where('name', 'like', '%'.$search.'%');
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
                'guard_name' => $permission->guard_name,
                'es_del_catalogo' => in_array($permission->name, SivsoPermissions::names(), true),
            ]);

        return Inertia::render('Admin/Permissions/Index', [
            'permissions' => $permissions,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permissions', 'name')->where('guard_name', 'web'),
            ],
            'guard_name' => ['nullable', 'string', 'max:50'],
        ]);

        Permission::query()->create([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->route('permissions.index');
    }

    public function update(Request $request, Permission $permission): RedirectResponse
    {
        if ($permission->guard_name !== 'web') {
            return redirect()->route('permissions.index')->withErrors([
                'permission' => 'Solo se pueden editar permisos del guard web.',
            ]);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('permissions', 'name')
                    ->where('guard_name', 'web')
                    ->ignore($permission->id),
            ],
            'guard_name' => ['nullable', 'string', 'max:50'],
        ]);

        $eraCatalogo = in_array($permission->name, SivsoPermissions::names(), true);
        if ($eraCatalogo && $validated['name'] !== $permission->name) {
            return redirect()->route('permissions.index')->withErrors([
                'permission' => 'Los permisos del catálogo base no se pueden renombrar (afectaría rutas y menús).',
            ]);
        }

        $permission->update([
            'name' => $validated['name'],
            'guard_name' => $validated['guard_name'] ?? 'web',
        ]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->route('permissions.index');
    }

    public function destroy(Permission $permission): RedirectResponse
    {
        if ($permission->guard_name !== 'web') {
            return redirect()->route('permissions.index')->withErrors([
                'permission' => 'No se puede eliminar este permiso.',
            ]);
        }

        if (in_array($permission->name, SivsoPermissions::names(), true)) {
            return redirect()->route('permissions.index')->withErrors([
                'permission' => 'No se pueden eliminar permisos del catálogo base del sistema.',
            ]);
        }

        $permission->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->route('permissions.index');
    }
}
