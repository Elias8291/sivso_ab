<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;

class AsignacionEmpleadoProductoFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('13_asignacion_empleado_producto.csv') as $r) {
            $rows[] = [
                'id' => $this->sivsoToInt($r['id'] ?? '0'),
                'anio' => $this->sivsoToInt($r['anio'] ?? '0'),
                'empleado_id' => $this->sivsoToInt($r['empleado_id'] ?? '0'),
                'producto_licitado_id' => $this->sivsoToInt($r['producto_licitado_id'] ?? '0'),
                'producto_cotizado_id' => $this->sivsoToIntOrNull($r['producto_cotizado_id'] ?? null),
                'clave_partida_presupuestal' => $this->sivsoNullIfEmpty($r['clave_partida_presupuestal'] ?? null),
                'cantidad' => $this->sivsoToIntOrNull($r['cantidad'] ?? null),
                'talla' => $this->sivsoNullIfEmpty($r['talla'] ?? null),
                'cantidad_secundaria' => $this->sivsoToIntOrNull($r['cantidad_secundaria'] ?? null),
                'clave_presupuestal' => $this->sivsoToIntOrNull($r['clave_presupuestal'] ?? null),
                'legacy_concentrado_id' => $this->sivsoToIntOrNull($r['legacy_concentrado_id'] ?? null),
            ];
        }
        $this->sivsoInsertChunks('asignacion_empleado_producto', $rows, 1000);
    }
}
