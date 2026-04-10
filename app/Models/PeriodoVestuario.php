<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PeriodoVestuario extends Model
{
    public const CACHE_PERIODO_MI_DELEGACION_KEY = 'mi-del:periodo-vestuario:v1';

    protected $table = 'periodo_vestuario';

    protected static function booted(): void
    {
        static::saved(static function (): void {
            Cache::forget(self::CACHE_PERIODO_MI_DELEGACION_KEY);
        });

        static::deleted(static function (): void {
            Cache::forget(self::CACHE_PERIODO_MI_DELEGACION_KEY);
        });
    }

    protected $fillable = [
        'anio',
        'nombre',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'descripcion',
    ];

    protected $casts = [
        'anio' => 'integer',
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
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
