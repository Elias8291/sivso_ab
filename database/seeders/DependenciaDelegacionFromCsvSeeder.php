<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class DependenciaDelegacionFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('04_dependencia_delegacion.csv') as $r) {
            $codigo = $this->sivsoNormalizeDelegacionCodigo((string) ($r['delegacion_codigo'] ?? ''));
            if ($codigo === '') {
                continue;
            }
            $rows[] = [
                'ur' => $this->sivsoToInt($r['ur'] ?? '0'),
                'delegacion_codigo' => $codigo,
            ];
        }
        $this->sivsoInsertChunks('dependencia_delegacion', $rows);
    }
}
