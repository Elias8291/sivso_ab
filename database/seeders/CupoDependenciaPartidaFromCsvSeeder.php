<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class CupoDependenciaPartidaFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('12_cupo_dependencia_partida.csv') as $r) {
            $rows[] = [
                'ur' => $this->sivsoToInt($r['ur'] ?? '0'),
                'numero_partida' => $this->sivsoToInt($r['numero_partida'] ?? '0'),
                'partida_especifica' => $this->sivsoToInt($r['partida_especifica'] ?? '0'),
                'anio' => $this->sivsoToInt($r['anio'] ?? '0'),
                'monto_limite' => (string) $r['monto_limite'],
            ];
        }
        $this->sivsoUpsertChunks(
            'cupo_dependencia_partida',
            $rows,
            ['ur', 'numero_partida', 'partida_especifica', 'anio'],
            ['monto_limite'],
        );
    }
}
