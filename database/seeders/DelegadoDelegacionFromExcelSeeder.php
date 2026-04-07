<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Database\Seeders\Concerns\ReadsSivsoDelegadosExcel;
use Illuminate\Database\Seeder;

class DelegadoDelegacionFromExcelSeeder extends Seeder
{
    use ReadsSivsoCsv;
    use ReadsSivsoDelegadosExcel;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoDelegadosExcelRows('delegado_delegacion') as $r) {
            $codigo = $this->sivsoNormalizeDelegacionCodigo((string) ($r['delegacion_codigo'] ?? ''));
            if ($codigo === '') {
                continue;
            }
            $rows[] = [
                'delegado_id' => $this->sivsoToInt($r['delegado_id'] ?? '0'),
                'delegacion_codigo' => $codigo,
            ];
        }
        $this->sivsoInsertOrIgnoreChunks('delegado_delegacion', $rows);
    }
}
