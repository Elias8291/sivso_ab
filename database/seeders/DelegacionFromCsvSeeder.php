<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class DelegacionFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('02_delegacion.csv') as $r) {
            $codigo = $this->sivsoNormalizeDelegacionCodigo((string) ($r['codigo'] ?? ''));
            if ($codigo === '') {
                continue;
            }
            $rows[] = [
                'codigo' => $codigo,
                'ur_referencia' => $this->sivsoToIntOrNull($r['ur_referencia'] ?? null),
            ];
        }
        $this->sivsoUpsertChunks('delegacion', $rows, ['codigo'], ['ur_referencia']);
    }
}
