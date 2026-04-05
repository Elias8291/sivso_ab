<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Database\Seeders\Concerns\ReadsSivsoDelegadosExcel;
use Illuminate\Database\Seeder;

class DelegacionFromExcelSeeder extends Seeder
{
    use ReadsSivsoCsv;
    use ReadsSivsoDelegadosExcel;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoDelegadosExcelRows('delegacion') as $r) {
            $codigo = $this->sivsoNormalizeDelegacionCodigo((string) ($r['codigo'] ?? ''));
            if ($codigo === '') {
                continue;
            }
            $rows[] = [
                'codigo' => $codigo,
                'ur_referencia' => $this->sivsoToIntOrNull($r['ur_referencia'] ?? null),
            ];
        }
        $this->sivsoInsertChunks('delegacion', $rows);
    }
}
