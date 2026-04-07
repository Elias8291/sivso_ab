<?php

declare(strict_types=1);

namespace Database\Seeders\Concerns;

use App\Support\SivsoDatasetNormalizer;
use Generator;
use Illuminate\Support\Facades\DB;

trait ReadsSivsoCsv
{
    protected function sivsoCsvPath(string $basename): string
    {
        return database_path('seeders/excel_datos/'.$basename);
    }

    /**
     * @return Generator<int, array<string, string|null>>
     */
    protected function sivsoCsvRows(string $basename): Generator
    {
        $path = $this->sivsoCsvPath($basename);
        if (! is_readable($path)) {
            return;
        }

        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return;
        }

        try {
            $header = fgetcsv($handle);
            if ($header === false || $header === [null]) {
                return;
            }

            $header[0] = ltrim((string) $header[0], "\xEF\xBB\xBF");
            $header = array_map(static fn (string|int|null $h): string => trim((string) $h), $header);

            while (($row = fgetcsv($handle)) !== false) {
                if ($row === [null] || $row === false) {
                    continue;
                }

                $assoc = [];
                foreach ($header as $i => $key) {
                    $val = $row[$i] ?? null;
                    if ($val === null || $val === '') {
                        $assoc[$key] = null;
                    } else {
                        $assoc[$key] = is_string($val) ? $val : (string) $val;
                    }
                }

                if ($this->sivsoRowIsEmpty($assoc)) {
                    continue;
                }

                yield $assoc;
            }
        } finally {
            fclose($handle);
        }
    }

    /**
     * @param  array<string, string|null>  $row
     */
    protected function sivsoRowIsEmpty(array $row): bool
    {
        foreach ($row as $v) {
            if ($v !== null && $v !== '') {
                return false;
            }
        }

        return true;
    }

    protected function sivsoNullIfEmpty(?string $v): ?string
    {
        if ($v === null || $v === '') {
            return null;
        }

        return $v;
    }

    /**
     * @see SivsoDatasetNormalizer::delegacionCodigo()
     */
    protected function sivsoNormalizeDelegacionCodigo(?string $v): string
    {
        return SivsoDatasetNormalizer::delegacionCodigo($v);
    }

    /**
     * @see SivsoDatasetNormalizer::texto()
     */
    protected function sivsoNormalizeTexto(?string $v): string
    {
        return SivsoDatasetNormalizer::texto($v);
    }

    protected function sivsoToInt(?string $v): int
    {
        return (int) (string) $v;
    }

    protected function sivsoToIntOrNull(?string $v): ?int
    {
        $s = $this->sivsoNullIfEmpty($v);

        return $s === null ? null : (int) $s;
    }

    protected function sivsoDecimalOrNull(?string $v): ?string
    {
        return $this->sivsoNullIfEmpty($v);
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     */
    protected function sivsoInsertChunks(string $table, array $rows, int $chunkSize = 500): void
    {
        if ($rows === []) {
            return;
        }

        foreach (array_chunk($rows, $chunkSize) as $chunk) {
            DB::table($table)->insert($chunk);
        }
    }

    /**
     * Inserta u omite filas duplicadas (sin actualizar). Útil para tablas puente con solo PK compuesta.
     *
     * @param  list<array<string, mixed>>  $rows
     */
    protected function sivsoInsertOrIgnoreChunks(string $table, array $rows, int $chunkSize = 500): void
    {
        if ($rows === []) {
            return;
        }

        foreach (array_chunk($rows, $chunkSize) as $chunk) {
            DB::table($table)->insertOrIgnore($chunk);
        }
    }

    /**
     * INSERT … ON DUPLICATE KEY UPDATE para re-sembrar sobre datos existentes sin error 1062.
     *
     * @param  list<array<string, mixed>>  $rows
     * @param  list<string>  $uniqueBy  Columnas de la clave única / primaria
     * @param  list<string>  $update  Columnas a actualizar si ya existe la fila
     */
    protected function sivsoUpsertChunks(
        string $table,
        array $rows,
        array $uniqueBy,
        array $update,
        int $chunkSize = 500,
    ): void {
        if ($rows === []) {
            return;
        }

        foreach (array_chunk($rows, $chunkSize) as $chunk) {
            DB::table($table)->upsert($chunk, $uniqueBy, $update);
        }
    }

    /**
     * Índice del CSV 09: id de fila en el CSV → metadatos para localizar la fila en BD
     * (mismo criterio que el único producto_cotizado: licitado + clave + año).
     *
     * @return array<int, array{producto_licitado_id: int, clave: string, anio: int}>
     */
    protected function sivsoProductoCotizado09IndexByCsvId(): array
    {
        $idx = [];
        foreach ($this->sivsoCsvRows('09_producto_cotizado.csv') as $r) {
            $id = $this->sivsoToInt($r['id'] ?? '0');
            if ($id < 1) {
                continue;
            }
            $idx[$id] = [
                'producto_licitado_id' => $this->sivsoToInt($r['producto_licitado_id'] ?? '0'),
                'clave' => trim((string) ($r['clave'] ?? '')),
                'anio' => $this->sivsoToInt($r['anio'] ?? '0'),
            ];
        }

        return $idx;
    }

    /**
     * Mapea el id de fila del CSV 09 al `producto_cotizado.id` real en BD (varios ejercicios conviven).
     *
     * @return array<int, int> csv09_id => producto_cotizado.id
     */
    protected function sivsoProductoCotizadoCsvIdToDbIdMap(): array
    {
        static $cache = null;
        if ($cache !== null) {
            return $cache;
        }

        $index = $this->sivsoProductoCotizado09IndexByCsvId();
        $rows = DB::table('producto_cotizado')->get(['id', 'producto_licitado_id', 'clave', 'anio']);
        $byTriple = [];
        foreach ($rows as $row) {
            $k = (int) $row->producto_licitado_id.'|'.trim((string) $row->clave).'|'.(int) $row->anio;
            $byTriple[$k] = (int) $row->id;
        }

        $map = [];
        foreach ($index as $csvId => $meta) {
            $k = $meta['producto_licitado_id'].'|'.trim($meta['clave']).'|'.$meta['anio'];
            if (isset($byTriple[$k])) {
                $map[$csvId] = $byTriple[$k];
            }
        }

        $cache = $map;

        return $cache;
    }
}
