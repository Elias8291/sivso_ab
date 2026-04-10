<?php

declare(strict_types=1);

namespace App\Services\Delegado;

use App\Models\Empleado;
use App\Models\User;

final class MiDelegacionAccessService
{
    /**
     * @return list<string>|null null = sin filtro (super admin); array vacío = usuario sin delegaciones asignadas
     */
    public function delegacionCodigosPermitidos(User $user): ?array
    {
        if ($user->is_super_admin) {
            return null;
        }

        $user->loadMissing('delegado.delegaciones');

        $delegado = $user->delegado;
        if (! $delegado || $delegado->delegaciones->isEmpty()) {
            return [];
        }

        return $delegado->delegaciones->pluck('codigo')->unique()->values()->all();
    }

    public function usuarioPuedeGestionarEmpleado(?User $user, ?Empleado $empleado): bool
    {
        if (! $user || ! $empleado) {
            return false;
        }

        if ($user->is_super_admin) {
            return true;
        }

        $codigos = $this->delegacionCodigosPermitidos($user);

        return $codigos !== []
            && in_array($empleado->delegacion_codigo, $codigos, true);
    }

    /**
     * @param  list<string>|null  $codigosDelegacion
     * @return array{modo: string, delegaciones: list<string>, delegado_nombre: string|null}
     */
    public function contextoDelegadoParaVista(User $user, ?array $codigosDelegacion): array
    {
        if ($user->is_super_admin) {
            return [
                'modo' => 'super_admin',
                'delegaciones' => [],
                'delegado_nombre' => null,
            ];
        }

        $user->loadMissing('delegado.delegaciones');
        $delegado = $user->delegado;

        if (! $delegado) {
            return [
                'modo' => 'sin_perfil',
                'delegaciones' => [],
                'delegado_nombre' => null,
            ];
        }

        $codigos = is_array($codigosDelegacion)
            ? $codigosDelegacion
            : $delegado->delegaciones->pluck('codigo')->unique()->values()->all();

        return [
            'modo' => 'delegado',
            'delegaciones' => $codigos,
            'delegado_nombre' => $delegado->nombre_completo,
        ];
    }
}
