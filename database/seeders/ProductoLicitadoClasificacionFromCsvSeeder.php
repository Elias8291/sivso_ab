<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class ProductoLicitadoClasificacionFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('10_producto_licitado_clasificacion.csv') as $r) {
            $rows[] = [
                'producto_licitado_id' => $this->sivsoToInt($r['producto_licitado_id'] ?? '0'),
                'clasificacion_id' => $this->sivsoToInt($r['clasificacion_id'] ?? '0'),
            ];
        }
        $this->sivsoInsertOrIgnoreChunks('producto_licitado_clasificacion', $rows, 1000);
    }
}
