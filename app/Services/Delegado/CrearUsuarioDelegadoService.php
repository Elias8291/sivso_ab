<?php

declare(strict_types=1);

namespace App\Services\Delegado;

use App\Models\User;

final class CrearUsuarioDelegadoService
{
    public function crear(string $name, string $email, string $password, ?string $rfc, ?string $nue): User
    {
        return User::query()->create([
            'name' => $name,
            'email' => $email,
            'rfc' => $rfc !== null && trim($rfc) !== '' ? trim($rfc) : null,
            'nue' => $nue !== null && trim((string) $nue) !== '' ? trim((string) $nue) : null,
            'password' => $password,
            'must_change_password' => true,
            'activo' => true,
            'is_super_admin' => false,
        ]);
    }
}
