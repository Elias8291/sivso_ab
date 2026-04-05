<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class ClasificacionBienFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('03_clasificacion_bien.csv') as $r) {
            $rows[] = [
                'id' => $this->sivsoToInt($r['id'] ?? '0'),
                'codigo' => (string) $r['codigo'],
                'nombre' => (string) $r['nombre'],
            ];
        }
        $this->sivsoInsertChunks('clasificacion_bien', $rows);
    }
}
