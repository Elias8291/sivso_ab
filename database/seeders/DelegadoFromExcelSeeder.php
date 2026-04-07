<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Database\Seeders\Concerns\ReadsSivsoDelegadosExcel;
use Illuminate\Database\Seeder;

/**
 * Inserta id, nombre_completo y nue desde la hoja "delegado".
 * user_id y empleado_id pueden existir en el Excel como referencia; no se insertan
 * para evitar FK rotas al sembrar en una base nueva (DatabaseSeeder puede re-enlazar).
 */
class DelegadoFromExcelSeeder extends Seeder
{
    use ReadsSivsoCsv;
    use ReadsSivsoDelegadosExcel;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoDelegadosExcelRows('delegado') as $r) {
            $rows[] = [
                'id' => $this->sivsoToInt($r['id'] ?? '0'),
                'nombre_completo' => $this->sivsoNormalizeTexto((string) ($r['nombre_completo'] ?? '')),
                'nue' => $this->sivsoNullIfEmpty($r['nue'] ?? null),
            ];
        }
        $this->sivsoUpsertChunks('delegado', $rows, ['id'], ['nombre_completo', 'nue']);
    }
}
