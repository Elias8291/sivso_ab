<?php

declare(strict_types=1);

$anioDefault = (int) date('Y');

return [

    /*
    |--------------------------------------------------------------------------
    | Vestuario (asignaciones + catálogo cotizado)
    |--------------------------------------------------------------------------
    |
    | producto_cotizado: el año efectivo para resolver por clave es el mayor `anio` en esa tabla
    | (DPPP más reciente), no solo este valor, si hay varios ejercicios cargados.
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
