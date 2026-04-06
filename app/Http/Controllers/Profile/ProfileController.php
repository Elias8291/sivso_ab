<?php

declare(strict_types=1);

namespace App\Http\Controllers\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Profile/Edit', [
            'profile' => [
                'name' => $user->name,
                'email' => $user->email,
                'rfc' => $user->rfc,
                'nue' => $user->nue,
                'must_change_password' => (bool) $user->must_change_password,
                'is_super_admin' => (bool) $user->is_super_admin,
                'roles' => $user->getRoleNames()->values()->all(),
            ],
        ]);
    }

    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $mustChangePassword = ! (bool) $user->must_change_password;
        $validated = $request->validated();

        unset($validated['password_confirmation']);

        if (($validated['password'] ?? null) === null || $validated['password'] === '') {
            unset($validated['password']);
        } else {
            $validated['must_change_password'] = true;
        }

        $user->update($validated);

        if ($mustChangePassword && array_key_exists('must_change_password', $validated) && $validated['must_change_password'] === true) {
            return redirect()
                ->route('dashboard')
                ->with('status', 'Contraseña actualizada correctamente.');
        }

        return redirect()
            ->route('profile.edit')
            ->with('status', 'Datos actualizados correctamente.');
    }
}
