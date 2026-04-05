<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class ProductoCotizadoClasificacionFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('11_producto_cotizado_clasificacion.csv') as $r) {
            $rows[] = [
                'producto_cotizado_id' => $this->sivsoToInt($r['producto_cotizado_id'] ?? '0'),
                'clasificacion_id' => $this->sivsoToInt($r['clasificacion_id'] ?? '0'),
            ];
        }
        $this->sivsoInsertChunks('producto_cotizado_clasificacion', $rows, 1000);
    }
}
