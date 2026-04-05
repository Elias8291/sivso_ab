<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class ProductoCotizadoFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('09_producto_cotizado.csv') as $r) {
            $rows[] = [
                'id' => $this->sivsoToInt($r['id'] ?? '0'),
                'anio' => $this->sivsoToInt($r['anio'] ?? '0'),
                'producto_licitado_id' => $this->sivsoToInt($r['producto_licitado_id'] ?? '0'),
                'numero_partida' => $this->sivsoToInt($r['numero_partida'] ?? '0'),
                'partida_especifica' => $this->sivsoToInt($r['partida_especifica'] ?? '0'),
                'clave' => (string) $r['clave'],
                'descripcion' => (string) $r['descripcion'],
                'precio_unitario' => $this->sivsoDecimalOrNull($r['precio_unitario'] ?? null),
                'importe' => $this->sivsoDecimalOrNull($r['importe'] ?? null),
                'iva' => $this->sivsoDecimalOrNull($r['iva'] ?? null),
                'total' => $this->sivsoDecimalOrNull($r['total'] ?? null),
                'precio_alterno' => $this->sivsoDecimalOrNull($r['precio_alterno'] ?? null),
                'referencia_codigo' => $this->sivsoNullIfEmpty($r['referencia_codigo'] ?? null),
                'clasificacion_principal_id' => $this->sivsoToIntOrNull($r['clasificacion_principal_id'] ?? null),
            ];
        }
        $this->sivsoInsertChunks('producto_cotizado', $rows, 500);
    }
}
