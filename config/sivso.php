<?php

declare(strict_types=1);

$anioDefault = (int) date('Y');

return [

    /*
    |--------------------------------------------------------------------------
    | Vestuario (asignaciones + catálogo cotizado)
    |--------------------------------------------------------------------------
    |
    | Debe coincidir con asignacion_empleado_producto.anio y producto_cotizado.anio
    | (p. ej. DPPP importado para ese ejercicio).
    |
    */
    'vestuario' => [
        'anio_referencia' => (int) env('SIVSO_VESTUARIO_ANIO', (string) $anioDefault),
        'anio_actual' => (int) env(
            'SIVSO_VESTUARIO_ANIO_ACTUAL',
            env('SIVSO_VESTUARIO_ANIO', (string) $anioDefault)
        ),
    ],

];
