<?php

declare(strict_types=1);

namespace App\Services\Solicitudes;

use App\Models\AsignacionEmpleadoProducto;
use App\Models\Empleado;
use App\Models\SolicitudMovimiento;
use Illuminate\Support\Collection;

final class AltaSustitutoPorBajaService
{
    /**
     * Crea el empleado sustituto y reasigna las prendas con recurso aprobado en la resolución.
     *
     * @param  Collection<int, int>  $idsAsignacionesConRecurso
     */
    public function ejecutar(
        SolicitudMovimiento $solicitud,
        Empleado $empleadoSale,
        Collection $idsAsignacionesConRecurso,
    ): Empleado {
        $raw = $solicitud->sustituto;
        if (! is_array($raw)) {
            throw new \InvalidArgumentException('La solicitud no incluye datos del sustituto.');
        }

        $nombre = trim((string) ($raw['nombre'] ?? ''));
        $apPat = trim((string) ($raw['apellido_paterno'] ?? ''));
        $apMat = trim((string) ($raw['apellido_materno'] ?? ''));
        $sexo = $raw['sexo'] ?? null;
        $nue = isset($raw['nue']) ? trim((string) $raw['nue']) : '';
        $nue = $nue !== '' ? $nue : null;

        if ($nombre === '' || $apPat === '') {
            throw new \InvalidArgumentException('Nombre y primer apellido del sustituto son obligatorios.');
        }
        if (! in_array($sexo, ['M', 'F'], true)) {
            throw new \InvalidArgumentException('Sexo del sustituto inválido.');
        }

        $nuevo = Empleado::query()->create([
            'nue' => $nue,
            'nombre' => $nombre,
            'apellido_paterno' => $apPat,
            'apellido_materno' => $apMat !== '' ? $apMat : '',
            'sexo' => $sexo,
            'ur' => $empleadoSale->ur,
            'delegacion_codigo' => $empleadoSale->delegacion_codigo,
            'estado_delegacion' => 'activo',
            'observacion_delegacion' => 'Alta por sustitución aprobada (solicitud #'.$solicitud->id.').',
        ]);

        if ($idsAsignacionesConRecurso->isNotEmpty()) {
            AsignacionEmpleadoProducto::query()
                ->whereIn('id', $idsAsignacionesConRecurso->all())
                ->update([
                    'empleado_id' => $nuevo->id,
                    'talla_anio_actual' => null,
                    'medida_anio_actual' => null,
                    'estado_anio_actual' => 'pendiente',
                    'observacion_anio_actual' => 'Reasignada por sustitución; confirme tallas según vestuario del sustituto.',
                    'talla_actualizada_at' => null,
                ]);
        }

        return $nuevo;
    }
}
