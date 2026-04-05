<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AsignacionEmpleadoProducto extends Model
{
    public $timestamps = false;

    protected $table = 'asignacion_empleado_producto';

    protected $fillable = [
        'anio',
        'empleado_id',
        'producto_licitado_id',
        'producto_cotizado_id',
        'clave_partida_presupuestal',
        'cantidad',
        'talla',
        'talla_anio_actual',
        'medida_anio_actual',
        'estado_anio_actual',
        'observacion_anio_actual',
        'talla_actualizada_at',
    ];

    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    public function productoCotizado(): BelongsTo
    {
        return $this->belongsTo(ProductoCotizado::class, 'producto_cotizado_id');
    }
}
