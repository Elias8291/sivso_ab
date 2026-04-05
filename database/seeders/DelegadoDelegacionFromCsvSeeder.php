<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class DelegadoDelegacionFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('06_delegado_delegacion.csv') as $r) {
            $codigo = $this->sivsoNormalizeDelegacionCodigo((string) ($r['delegacion_codigo'] ?? ''));
            if ($codigo === '') {
                continue;
            }
            $rows[] = [
                'delegado_id' => $this->sivsoToInt($r['delegado_id'] ?? '0'),
                'delegacion_codigo' => $codigo,
            ];
        }
        $this->sivsoInsertChunks('delegado_delegacion', $rows);
    }
}
