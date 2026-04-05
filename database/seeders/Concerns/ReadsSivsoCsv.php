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
}
