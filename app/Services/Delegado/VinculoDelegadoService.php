<?php

declare(strict_types=1);

namespace App\Services\Delegado;

use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Coherencia entre usuario del sistema, empleado de catálogo y delegaciones asignadas al delegado.
 */
final class VinculoDelegadoService
{
    public function validarCoherencia(?User $user, ?Empleado $empleado, Delegado $delegado): void
    {
        if ($user !== null && $empleado !== null) {
            $nueUsuario   = $this->normalizarNue($user->nue);
            $nueEmpleado  = $this->normalizarNue($empleado->nue);

            if ($nueEmpleado !== null) {
                if ($nueUsuario === null) {
                    throw ValidationException::withMessages([
                        'user_id' => 'El usuario debe tener NUE registrado y coincidir con el empleado del catálogo.',
                    ]);
                }
                if ($nueUsuario !== $nueEmpleado) {
                    throw ValidationException::withMessages([
                        'user_id' => 'El NUE del usuario no coincide con el NUE del empleado vinculado.',
                    ]);
                }
            }
        }

        if ($empleado === null) {
            return;
        }

        $delegado->loadMissing('delegaciones');

        if ($delegado->delegaciones->isEmpty()) {
            return;
        }

        $codigos = $delegado->delegaciones->pluck('codigo')->all();

        if (! in_array($empleado->delegacion_codigo, $codigos, true)) {
            throw ValidationException::withMessages([
                'empleado_id' => sprintf(
                    'El empleado está en la delegación «%s», que no está entre las delegaciones asignadas a este delegado (%s).',
                    $empleado->delegacion_codigo,
                    implode(', ', $codigos),
                ),
            ]);
        }
    }

    private function normalizarNue(?string $nue): ?string
    {
        if ($nue === null || trim($nue) === '') {
            return null;
        }

        return strtoupper(trim($nue));
    }
}
