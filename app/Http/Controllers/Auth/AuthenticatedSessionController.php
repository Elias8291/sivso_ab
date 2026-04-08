<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\InitialPasswordUpdateRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Login');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $rfc = strtoupper(preg_replace('/\s+/', '', (string) $request->validated('rfc')));

        /** @var User|null $user */
        $user = User::query()->where('rfc', $rfc)->first();

        if ($user === null) {
            throw ValidationException::withMessages([
                'rfc' => __('No existe el RFC.'),
            ]);
        }

        if (! Hash::check((string) $request->validated('password'), (string) $user->password)) {
            throw ValidationException::withMessages([
                'password' => __('La contraseña es incorrecta.'),
            ]);
        }

        if (! $user->activo) {
            throw ValidationException::withMessages([
                'rfc' => __('Su cuenta está desactivada.'),
            ]);
        }

        Auth::login($user, (bool) $request->boolean('remember'));

        $request->session()->regenerate();

        if (! (bool) $user->must_change_password) {
            return redirect()->route('auth.password.change');
        }

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(): RedirectResponse
    {
        Auth::guard('web')->logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('home');
    }

    public function forcePasswordChange(): Response|RedirectResponse
    {
        /** @var User $user */
        $user = request()->user();

        if ((bool) $user->must_change_password) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('Auth/ForcePasswordChange');
    }

    public function updateInitialPassword(InitialPasswordUpdateRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if ((bool) $user->must_change_password) {
            return redirect()->route('dashboard');
        }

        $validated = $request->validated();

        $user->update([
            'password' => (string) $validated['password'],
            'must_change_password' => true,
        ]);

        return redirect()
            ->route('dashboard')
            ->with('status', 'Contraseña actualizada correctamente.');
    }
}
