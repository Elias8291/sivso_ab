<?php

declare(strict_types=1);

return [
    'delegado_table' => env('CONCENT_DELEGADO_TABLE', 'delegado'),
    'delegado_delegacion_table' => env('CONCENT_DELEGADO_DELEGACION_TABLE', 'delegado_delegacion'),

    /*
     * Esquema concent_p típico: una fila por delegado con columnas nombre + delegacion (sin tabla pivote).
     */
    'legacy_nombre_column' => env('CONCENT_LEGACY_NOMBRE_COLUMN', 'nombre'),
    'legacy_delegacion_column' => env('CONCENT_LEGACY_DELEGACION_COLUMN', 'delegacion'),
    'legacy_nue_column' => env('CONCENT_LEGACY_NUE_COLUMN') ?: null,

    /*
     * Modo plano: existe tabla delegado_delegacion en origen con (delegado_id, delegacion_codigo).
     */
    'delegado_columns' => ['id', 'nombre_completo', 'nue'],
    'delegado_delegacion_columns' => ['delegado_id', 'delegacion_codigo'],
];
