<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class DelegadoFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('05_delegado.csv') as $r) {
            $rows[] = [
                'id' => $this->sivsoToInt($r['id'] ?? '0'),
                'nombre_completo' => $this->sivsoNormalizeTexto((string) ($r['nombre_completo'] ?? '')),
                'nue' => $this->sivsoNullIfEmpty($r['nue'] ?? null),
            ];
        }
        $this->sivsoInsertChunks('delegado', $rows);
    }
}
