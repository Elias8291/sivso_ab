<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserStoreRequest;
use App\Http\Requests\Admin\UserUpdateRequest;
use App\Models\User;
use App\Support\AssignableWebRoles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $users = User::query()
            ->with('roles')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('rfc', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'rfc' => $user->rfc,
                'nue' => $user->nue,
                'activo' => (bool) $user->activo,
                'is_super_admin' => (bool) $user->is_super_admin,
                'roles' => $user->roles->pluck('name')->values()->all(),
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search']),
            'rolesDisponibles' => AssignableWebRoles::options(),
        ]);
    }

    public function store(UserStoreRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $roles = $validated['roles'] ?? [];
        unset($validated['roles'], $validated['password_confirmation']);

        $user = User::create($validated);
        $user->syncRoles($roles);

        return redirect()->route('users.index');
    }

    public function update(UserUpdateRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $roles = $validated['roles'] ?? [];
        unset($validated['roles'], $validated['password_confirmation']);

        if (($validated['password'] ?? null) === null || $validated['password'] === '') {
            unset($validated['password']);
        }

        $user->update($validated);
        $user->syncRoles($roles);

        return redirect()->route('users.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->id === $user->id) {
            return redirect()->route('users.index')->withErrors([
                'user' => 'No puedes eliminar tu propia cuenta.',
            ]);
        }

        $delegado = $user->delegado;
        if ($delegado !== null) {
            $delegado->update(['user_id' => null]);
        }

        $user->delete();

        return redirect()->route('users.index');
    }
}
