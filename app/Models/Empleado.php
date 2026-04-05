<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Empleado extends Model
{
    public $timestamps = false;

    protected $table = 'empleado';

    protected $fillable = [
        'nue',
        'nombre',
        'apellido_paterno',
        'apellido_materno',
        'ur',
        'delegacion_codigo',
        'estado_delegacion',
        'observacion_delegacion',
    ];

    /**
     * @return BelongsTo<Dependencia, $this>
     */
    public function dependencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class, 'ur', 'ur');
    }

    /**
     * @return BelongsTo<Delegacion, $this>
     */
    public function delegacion(): BelongsTo
    {
        return $this->belongsTo(Delegacion::class, 'delegacion_codigo', 'codigo');
    }

    public function asignaciones(): HasMany
    {
        return $this->hasMany(AsignacionEmpleadoProducto::class, 'empleado_id');
    }

    /**
     * @return HasOne<Delegado, $this>
     */
    public function registroDelegado(): HasOne
    {
        return $this->hasOne(Delegado::class, 'empleado_id');
    }

    public function getNombreCompletoAttribute(): string
    {
        return trim("{$this->nombre} {$this->apellido_paterno} {$this->apellido_materno}");
    }
}
