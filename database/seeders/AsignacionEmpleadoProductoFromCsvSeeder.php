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
        $map = $this->sivsoProductoCotizadoCsvIdToDbIdMap();
        $rows = [];
        foreach ($this->sivsoCsvRows('13_asignacion_empleado_producto.csv') as $r) {
            $csvPc = $this->sivsoToIntOrNull($r['producto_cotizado_id'] ?? null);
            $productoCotizadoId = null;
            if ($csvPc !== null && $csvPc > 0) {
                $productoCotizadoId = $map[$csvPc] ?? null;
                if ($productoCotizadoId === null) {
                    throw new \RuntimeException(
                        "asignacion_empleado_producto: no se resolvió producto_cotizado_id CSV 09 id={$csvPc} (¿falta fila en producto_cotizado para ese lic+clave+año?).",
                    );
                }
            }

            $rows[] = [
                'id' => $this->sivsoToInt($r['id'] ?? '0'),
                'anio' => $this->sivsoToInt($r['anio'] ?? '0'),
                'empleado_id' => $this->sivsoToInt($r['empleado_id'] ?? '0'),
                'producto_licitado_id' => $this->sivsoToInt($r['producto_licitado_id'] ?? '0'),
                'producto_cotizado_id' => $productoCotizadoId,
                'clave_partida_presupuestal' => $this->sivsoNullIfEmpty($r['clave_partida_presupuestal'] ?? null),
                'cantidad' => $this->sivsoToIntOrNull($r['cantidad'] ?? null),
                'talla' => $this->sivsoNullIfEmpty($r['talla'] ?? null),
                'cantidad_secundaria' => $this->sivsoToIntOrNull($r['cantidad_secundaria'] ?? null),
                'clave_presupuestal' => $this->sivsoToIntOrNull($r['clave_presupuestal'] ?? null),
                'legacy_concentrado_id' => $this->sivsoToIntOrNull($r['legacy_concentrado_id'] ?? null),
            ];
        }
        $this->sivsoUpsertChunks(
            'asignacion_empleado_producto',
            $rows,
            ['id'],
            [
                'anio',
                'empleado_id',
                'producto_licitado_id',
                'producto_cotizado_id',
                'clave_partida_presupuestal',
                'cantidad',
                'talla',
                'cantidad_secundaria',
                'clave_presupuestal',
                'legacy_concentrado_id',
            ],
            1000,
        );
    }
}
