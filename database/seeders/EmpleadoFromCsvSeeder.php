<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class EmpleadoFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('07_empleado.csv') as $r) {
            $rows[] = [
                'id' => $this->sivsoToInt($r['id'] ?? '0'),
                'legacy_empleado_id' => $this->sivsoToIntOrNull($r['legacy_empleado_id'] ?? null),
                'nue' => $this->sivsoNullIfEmpty($r['nue'] ?? null),
                'nombre' => $this->sivsoNormalizeTexto((string) ($r['nombre'] ?? '')),
                'apellido_paterno' => $this->sivsoNormalizeTexto((string) ($r['apellido_paterno'] ?? '')),
                'apellido_materno' => $this->sivsoNormalizeTexto((string) ($r['apellido_materno'] ?? '')),
                'ur' => $this->sivsoToInt($r['ur'] ?? '0'),
                'delegacion_codigo' => $this->sivsoNormalizeDelegacionCodigo((string) ($r['delegacion_codigo'] ?? '')),
            ];
        }
        $this->sivsoInsertChunks('empleado', $rows, 1000);
    }
}
