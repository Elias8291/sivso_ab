<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
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

        if ($user === null || ! Hash::check((string) $request->validated('password'), (string) $user->password)) {
            throw ValidationException::withMessages([
                'rfc' => __('Las credenciales no coinciden con nuestros registros.'),
            ]);
        }

        if (! $user->activo) {
            throw ValidationException::withMessages([
                'rfc' => __('Su cuenta está desactivada.'),
            ]);
        }

        Auth::login($user, (bool) $request->boolean('remember'));

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(): RedirectResponse
    {
        Auth::guard('web')->logout();

        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('home');
    }
}
