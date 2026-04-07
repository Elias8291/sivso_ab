<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\ReadsSivsoCsv;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductoCotizadoFromCsvSeeder extends Seeder
{
    use ReadsSivsoCsv;

    public function run(): void
    {
        $rows = [];
        foreach ($this->sivsoCsvRows('09_producto_cotizado.csv') as $r) {
            $rows[] = [
                'id' => $this->sivsoToInt($r['id'] ?? '0'),
                'anio' => $this->sivsoToInt($r['anio'] ?? '0'),
                'producto_licitado_id' => $this->sivsoToInt($r['producto_licitado_id'] ?? '0'),
                'numero_partida' => $this->sivsoToInt($r['numero_partida'] ?? '0'),
                'partida_especifica' => $this->sivsoToInt($r['partida_especifica'] ?? '0'),
                'clave' => (string) $r['clave'],
                'descripcion' => (string) $r['descripcion'],
                'precio_unitario' => $this->sivsoDecimalOrNull($r['precio_unitario'] ?? null),
                'importe' => $this->sivsoDecimalOrNull($r['importe'] ?? null),
                'iva' => $this->sivsoDecimalOrNull($r['iva'] ?? null),
                'total' => $this->sivsoDecimalOrNull($r['total'] ?? null),
                'precio_alterno' => $this->sivsoDecimalOrNull($r['precio_alterno'] ?? null),
                'referencia_codigo' => $this->sivsoNullIfEmpty($r['referencia_codigo'] ?? null),
                'clasificacion_principal_id' => $this->sivsoToIntOrNull($r['clasificacion_principal_id'] ?? null),
            ];
        }

        if ($rows === []) {
            return;
        }

        $existing = DB::table('producto_cotizado')
            ->select('id', 'producto_licitado_id', 'clave', 'anio')
            ->get()
            ->keyBy('id');

        $normCl = static fn (mixed $c): string => trim((string) $c);

        foreach ($rows as &$row) {
            $id = $row['id'];
            if ($existing->has($id)) {
                $ex = $existing[$id];
                $same = (int) $ex->producto_licitado_id === (int) $row['producto_licitado_id']
                    && $normCl($ex->clave) === $normCl($row['clave'])
                    && (int) $ex->anio === (int) $row['anio'];
                if (! $same) {
                    unset($row['id']);
                }
            }
        }
        unset($row);

        $withId = [];
        $withoutId = [];
        foreach ($rows as $row) {
            if (array_key_exists('id', $row)) {
                $withId[] = $row;
            } else {
                $withoutId[] = $row;
            }
        }

        $uniqueBy = ['producto_licitado_id', 'clave', 'anio'];
        $update = [
            'numero_partida',
            'partida_especifica',
            'descripcion',
            'precio_unitario',
            'importe',
            'iva',
            'total',
            'precio_alterno',
            'referencia_codigo',
            'clasificacion_principal_id',
        ];

        DB::transaction(function () use ($withId, $withoutId, $uniqueBy, $update): void {
            foreach (array_chunk($withId, 500) as $chunk) {
                if ($chunk !== []) {
                    DB::table('producto_cotizado')->upsert($chunk, $uniqueBy, $update);
                }
            }
            foreach (array_chunk($withoutId, 500) as $chunk) {
                if ($chunk !== []) {
                    DB::table('producto_cotizado')->upsert($chunk, $uniqueBy, $update);
                }
            }
        });
    }
}
