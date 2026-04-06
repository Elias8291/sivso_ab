<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsurePasswordWasChanged
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user === null || (bool) $user->must_change_password) {
            return $next($request);
        }

        if ($request->routeIs('auth.password.change', 'auth.password.update', 'logout')) {
            return $next($request);
        }

        return new RedirectResponse(route('auth.password.change'));
    }
}
