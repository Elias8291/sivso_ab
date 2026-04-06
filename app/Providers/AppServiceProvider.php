<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('login', function (Request $request): Limit {
            $rfc = Str::lower(trim((string) $request->input('rfc', 'sin-rfc')));
            $ip = (string) $request->ip();
            $attempts = max(1, (int) env('LOGIN_MAX_ATTEMPTS_PER_MINUTE', 10));

            return Limit::perMinute($attempts)->by($rfc.'|'.$ip);
        });

        Gate::before(function ($user, string $ability) {
            if (! $user instanceof User) {
                return null;
            }

            if ($user->isSuperAdmin()) {
                return true;
            }

            return null;
        });
    }
}
