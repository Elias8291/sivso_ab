<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class ProductoLicitadoFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('08_producto_licitado.csv') as $r) {
            $rows[] = [
                'id' => $this->sivsoToInt($r['id'] ?? '0'),
                'anio' => $this->sivsoToInt($r['anio'] ?? '0'),
                'numero_partida' => $this->sivsoToInt($r['numero_partida'] ?? '0'),
                'lote' => $this->sivsoToInt($r['lote'] ?? '0'),
                'partida_especifica' => $this->sivsoToInt($r['partida_especifica'] ?? '0'),
                'codigo_catalogo' => (string) $r['codigo_catalogo'],
                'descripcion' => (string) $r['descripcion'],
                'cantidad_propuesta' => $this->sivsoToInt($r['cantidad_propuesta'] ?? '0'),
                'unidad' => (string) $r['unidad'],
                'marca' => (string) $r['marca'],
                'precio_unitario' => (string) $r['precio_unitario'],
                'subtotal' => (string) $r['subtotal'],
                'proveedor' => (string) $r['proveedor'],
                'medida' => (string) $r['medida'],
                'clasificacion_principal_id' => $this->sivsoToIntOrNull($r['clasificacion_principal_id'] ?? null),
            ];
        }
        $this->sivsoUpsertChunks(
            'producto_licitado',
            $rows,
            ['id'],
            [
                'anio',
                'numero_partida',
                'lote',
                'partida_especifica',
                'codigo_catalogo',
                'descripcion',
                'cantidad_propuesta',
                'unidad',
                'marca',
                'precio_unitario',
                'subtotal',
                'proveedor',
                'medida',
                'clasificacion_principal_id',
            ],
            500,
        );
    }
}
