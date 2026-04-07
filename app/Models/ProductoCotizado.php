<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class ProductoCotizado extends Model
{
    public $timestamps = false;

    protected $table = 'producto_cotizado';

    protected $fillable = [
        'anio',
        'producto_licitado_id',
        'numero_partida',
        'partida_especifica',
        'clave',
        'descripcion',
        'precio_unitario',
        'importe',
        'iva',
        'total',
        'precio_alterno',
        'referencia_codigo',
        'clasificacion_principal_id',
    ];
}
