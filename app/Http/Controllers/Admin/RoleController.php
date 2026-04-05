<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\SivsoPermissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $roles = Role::query()
            ->where('guard_name', 'web')
            ->with(['permissions:id,name'])
            ->withCount('permissions')
            ->when($search, function ($query, string $search): void {
                $query->where('name', 'like', '%'.$search.'%');
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'guard_name' => $role->guard_name,
                'permissions_count' => $role->permissions_count,
                'permission_ids' => $role->permissions->pluck('id')->values()->all(),
                'permission_names' => $role->permissions->pluck('name')->values()->all(),
                'es_rol_protegido' => in_array($role->name, [
                    SivsoPermissions::ROLE_ADMIN_SIVSO,
                    SivsoPermissions::ROLE_DELEGADO,
                ], true),
            ]);

        $allPermissions = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (Permission $p) => [
                'id' => $p->id,
                'name' => $p->name,
            ])
            ->values();

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'allPermissions' => $allPermissions,
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
                Rule::unique('roles', 'name')->where('guard_name', 'web'),
            ],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role = Role::query()->create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        if (! empty($validated['permission_ids'])) {
            $role->syncPermissions($validated['permission_ids']);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->route('roles.index');
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        if ($role->guard_name !== 'web') {
            return redirect()->route('roles.index')->withErrors([
                'role' => 'Solo se pueden editar roles del guard web.',
            ]);
        }

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'name')
                    ->where('guard_name', 'web')
                    ->ignore($role->id),
            ],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        if (in_array($role->name, [
            SivsoPermissions::ROLE_ADMIN_SIVSO,
            SivsoPermissions::ROLE_DELEGADO,
        ], true) && $validated['name'] !== $role->name) {
            return redirect()->route('roles.index')->withErrors([
                'role' => 'No se puede renombrar este rol del sistema.',
            ]);
        }

        $role->update([
            'name' => $validated['name'],
        ]);

        if (array_key_exists('permission_ids', $validated)) {
            $role->syncPermissions($validated['permission_ids'] ?? []);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->route('roles.index');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->guard_name !== 'web') {
            return redirect()->route('roles.index')->withErrors([
                'role' => 'No se puede eliminar este rol.',
            ]);
        }

        if (in_array($role->name, [
            SivsoPermissions::ROLE_ADMIN_SIVSO,
            SivsoPermissions::ROLE_DELEGADO,
        ], true)) {
            return redirect()->route('roles.index')->withErrors([
                'role' => 'No se pueden eliminar los roles base «Administrador SIVSO» ni «Delegado».',
            ]);
        }

        $usuariosConRol = User::query()->whereHas('roles', static function ($query) use ($role): void {
            $query->where('roles.id', $role->id);
        })->count();

        if ($usuariosConRol > 0) {
            return redirect()->route('roles.index')->withErrors([
                'role' => "No se puede eliminar el rol: {$usuariosConRol} usuario(s) lo tienen asignado. Reasigna o quita el rol antes.",
            ]);
        }

        $role->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->route('roles.index');
    }
}
