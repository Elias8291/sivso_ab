<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PeriodoVestuario extends Model
{
    protected $table = 'periodo_vestuario';

    protected $fillable = [
        'anio',
        'nombre',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'descripcion',
    ];

    protected $casts = [
        'anio'         => 'integer',
        'fecha_inicio' => 'date',
        'fecha_fin'    => 'date',
    ];

    public function estaAbierto(): bool
    {
        return $this->estado === 'abierto';
    }

    /** Devuelve el periodo actualmente abierto (si existe). */
    public static function activo(): ?self
    {
        return static::where('estado', 'abierto')->first();
    }
}
