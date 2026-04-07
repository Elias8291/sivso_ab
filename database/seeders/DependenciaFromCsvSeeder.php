<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class DependenciaFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('01_dependencia.csv') as $r) {
            $rows[] = [
                'ur' => $this->sivsoToInt($r['ur'] ?? '0'),
                'nombre' => (string) $r['nombre'],
                'nombre_corto' => $this->sivsoNullIfEmpty($r['nombre_corto'] ?? null),
            ];
        }
        $this->sivsoUpsertChunks('dependencia', $rows, ['ur'], ['nombre', 'nombre_corto']);
    }
}
