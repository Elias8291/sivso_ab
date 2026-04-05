<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

final class ExportSivsoDelegadosExcelCommand extends Command
{
    protected $signature = 'sivso:export-delegados-excel
                            {--path= : Ruta del .xlsx (por defecto database/seeders/excel_datos/sivso_delegados.xlsx)}';

    protected $description = 'Exporta delegacion, delegado y delegado_delegacion a .xlsx para el seeder';

    public function handle(): int
    {
        if (! Schema::hasTable('delegacion') || ! Schema::hasTable('delegado') || ! Schema::hasTable('delegado_delegacion')) {
            $this->error('Faltan tablas delegacion, delegado o delegado_delegacion.');

            return self::FAILURE;
        }

        $path = $this->option('path');
        if (! is_string($path) || $path === '') {
            $path = database_path('seeders/excel_datos/sivso_delegados.xlsx');
        } elseif (! str_contains($path, DIRECTORY_SEPARATOR) && (strlen($path) < 2 || $path[1] !== ':')) {
            $path = base_path($path);
        }

        $dir = dirname($path);
        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            $this->error('No se pudo crear el directorio: '.$dir);

            return self::FAILURE;
        }

        $spreadsheet = new Spreadsheet;
        $delegacionSheet = $spreadsheet->getActiveSheet();
        $delegacionSheet->setTitle('delegacion');
        $delegacionHeaders = ['codigo', 'ur_referencia'];
        $this->writeSheet(
            $delegacionSheet,
            $delegacionHeaders,
            DB::table('delegacion')->orderBy('codigo')->get()->map(static fn ($r) => [
                'codigo' => $r->codigo,
                'ur_referencia' => $r->ur_referencia,
            ]),
        );

        $delegadoHeaders = ['id', 'nombre_completo', 'nue'];
        if (Schema::hasColumn('delegado', 'user_id')) {
            $delegadoHeaders[] = 'user_id';
        }
        if (Schema::hasColumn('delegado', 'empleado_id')) {
            $delegadoHeaders[] = 'empleado_id';
        }
        $delegadoSheet = $spreadsheet->createSheet();
        $delegadoSheet->setTitle('delegado');
        $this->writeSheet(
            $delegadoSheet,
            $delegadoHeaders,
            DB::table('delegado')->orderBy('id')->get()->map(static function ($r) use ($delegadoHeaders): array {
                $out = [];
                foreach ($delegadoHeaders as $h) {
                    $out[$h] = $r->{$h} ?? null;
                }

                return $out;
            }),
        );

        $pivotSheet = $spreadsheet->createSheet();
        $pivotSheet->setTitle('delegado_delegacion');
        $this->writeSheet(
            $pivotSheet,
            ['delegado_id', 'delegacion_codigo'],
            DB::table('delegado_delegacion')->orderBy('delegado_id')->orderBy('delegacion_codigo')->get()->map(static fn ($r) => [
                'delegado_id' => $r->delegado_id,
                'delegacion_codigo' => $r->delegacion_codigo,
            ]),
        );

        $spreadsheet->setActiveSheetIndex(0);
        (new Xlsx($spreadsheet))->save($path);

        $this->info('Escrito: '.$path);
        $this->line(sprintf(
            'Filas: delegacion=%d, delegado=%d, delegado_delegacion=%d.',
            DB::table('delegacion')->count(),
            DB::table('delegado')->count(),
            DB::table('delegado_delegacion')->count(),
        ));
        $this->line('Si este archivo existe, SivsoDatasetSeeder lo usa en lugar de los CSV 02, 05 y 06.');

        return self::SUCCESS;
    }

    /**
     * @param  list<string>  $headers
     * @param  Collection<int, array<string, mixed>>  $rows
     */
    private function writeSheet(Worksheet $sheet, array $headers, Collection $rows): void
    {
        foreach ($headers as $i => $h) {
            $sheet->setCellValue([$i + 1, 1], $h);
        }
        $rowNum = 2;
        foreach ($rows as $record) {
            foreach ($headers as $i => $h) {
                $v = $record[$h] ?? null;
                $sheet->setCellValue([$i + 1, $rowNum], $v ?? '');
            }
            $rowNum++;
        }
    }
}
