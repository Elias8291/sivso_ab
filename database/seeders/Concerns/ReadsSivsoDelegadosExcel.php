<?php

declare(strict_types=1);

namespace Database\Seeders\Concerns;

use Generator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

trait ReadsSivsoDelegadosExcel
{
    protected function sivsoDelegadosExcelPath(): string
    {
        return database_path('seeders/excel_datos/sivso_delegados.xlsx');
    }

    /**
     * @return Generator<int, array<string, string|null>>
     */
    protected function sivsoDelegadosExcelRows(string $sheetName): Generator
    {
        $path = $this->sivsoDelegadosExcelPath();
        if (! is_readable($path)) {
            yield from [];

            return;
        }

        $spreadsheet = IOFactory::load($path);
        $sheet = $this->sivsoDelegadosFindSheet($spreadsheet, $sheetName);
        if ($sheet === null) {
            yield from [];

            return;
        }

        $matrix = $sheet->toArray(null, true, true, false);
        if ($matrix === []) {
            yield from [];

            return;
        }

        $headerRow = array_shift($matrix);
        if (! is_array($headerRow)) {
            yield from [];

            return;
        }

        $header = [];
        foreach ($headerRow as $h) {
            if ($h === null) {
                $header[] = '';

                continue;
            }
            $s = is_string($h) ? $h : (string) $h;
            $s = trim($s);
            if (str_starts_with($s, "\xEF\xBB\xBF")) {
                $s = trim(substr($s, 3));
            }
            $header[] = $s;
        }

        foreach ($matrix as $row) {
            if (! is_array($row)) {
                continue;
            }
            $assoc = [];
            foreach ($header as $i => $key) {
                if ($key === '') {
                    continue;
                }
                $cell = $row[$i] ?? null;
                $assoc[$key] = $this->sivsoDelegadosExcelCellToNullableString($cell);
            }
            if ($this->sivsoRowIsEmpty($assoc)) {
                continue;
            }

            yield $assoc;
        }
    }

    private function sivsoDelegadosExcelCellToNullableString(mixed $cell): ?string
    {
        if ($cell === null || $cell === '') {
            return null;
        }
        if (is_string($cell)) {
            $t = trim($cell);

            return $t === '' ? null : $t;
        }
        if (is_int($cell)) {
            return (string) $cell;
        }
        if (is_float($cell)) {
            if (floor($cell) === $cell && abs($cell) < 1e15 && abs($cell) < PHP_INT_MAX) {
                return (string) (int) $cell;
            }

            return trim(strtoupper((string) $cell)) ?: null;
        }

        $t = trim((string) $cell);

        return $t === '' ? null : $t;
    }

    private function sivsoDelegadosFindSheet(Spreadsheet $spreadsheet, string $wanted): ?Worksheet
    {
        $w = mb_strtolower(trim($wanted));
        foreach ($spreadsheet->getWorksheetIterator() as $sheet) {
            if (mb_strtolower($sheet->getTitle()) === $w) {
                return $sheet;
            }
        }

        return null;
    }
}
