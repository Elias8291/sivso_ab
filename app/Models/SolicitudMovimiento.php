<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SolicitudMovimiento extends Model
{
    protected $table = 'solicitud_movimiento';

    protected $fillable = [
        'empleado_id',
        'solicitada_por',
        'delegacion_origen',
        'delegacion_destino',
        'tipo',
        'estado',
        'observacion_solicitante',
        'observacion_administracion',
        'lleva_recurso',
        'modo_prendas',
        'prendas_resueltas_total',
        'ajuste_recurso',
        'resuelta_por',
        'resuelta_at',
    ];

    protected $casts = [
        'lleva_recurso' => 'boolean',
        'prendas_resueltas_total' => 'integer',
        'resuelta_at'   => 'datetime',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function solicitadaPor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'solicitada_por');
    }

    public function resueltaPor(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'resuelta_por');
    }

    public function isPendiente(): bool
    {
        return $this->estado === 'pendiente';
    }
}
