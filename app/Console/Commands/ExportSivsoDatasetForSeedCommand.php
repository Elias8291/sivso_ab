<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Exporta tablas SIVSO al formato CSV de database/seeders/excel_datos para versionar datos
 * (p. ej. ejercicio 2026) y volver a sembrar con SivsoDatasetSeeder.
 */
final class ExportSivsoDatasetForSeedCommand extends Command
{
    protected $signature = 'sivso:export-dataset-for-seed
                            {--dir= : Carpeta destino (por defecto database/seeders/excel_datos)}
                            {--anio= : Solo filas de ese año en tablas con columna anio (ej. 2026)}
                            {--empleado=asignacion : Con --anio: asignacion = solo empleados con asignación en ese año; all = todos los empleados}
                            {--xlsx= : Si PhpSpreadsheet está instalado, también escribe un .xlsx con una hoja por tabla (solo tablas con menos de 60000 filas)}';

    protected $description = 'Exporta la base actual a CSV (mismo formato que los seeders SIVSO). Úsalo donde ya tengas 2026 cargado; luego commit de los CSV y php artisan db:seed.';

    public function handle(): int
    {
        $dirOpt = $this->option('dir');
        $dir = is_string($dirOpt) && $dirOpt !== ''
            ? (str_contains($dirOpt, DIRECTORY_SEPARATOR) || (strlen($dirOpt) > 1 && $dirOpt[1] === ':') ? $dirOpt : base_path($dirOpt))
            : database_path('seeders/excel_datos');

        if (! is_dir($dir) && ! mkdir($dir, 0755, true) && ! is_dir($dir)) {
            $this->error('No se pudo crear el directorio: '.$dir);

            return self::FAILURE;
        }

        $anioOpt = $this->option('anio');
        $anio = is_string($anioOpt) && $anioOpt !== '' ? (int) $anioOpt : null;
        $empleadoMode = (string) $this->option('empleado');
        if (! in_array($empleadoMode, ['asignacion', 'all'], true)) {
            $this->error('--empleado debe ser asignacion o all.');

            return self::FAILURE;
        }

        $required = [
            'dependencia',
            'delegacion',
            'dependencia_delegacion',
            'clasificacion_bien',
            'empleado',
            'producto_licitado',
            'producto_cotizado',
            'asignacion_empleado_producto',
        ];
        foreach ($required as $t) {
            if (! Schema::hasTable($t)) {
                $this->error("Falta la tabla [{$t}].");

                return self::FAILURE;
            }
        }

        if ($anio !== null) {
            $this->info("Filtro año={$anio}; empleados: {$empleadoMode}.");
        } else {
            $this->info('Exportación completa (sin filtro por año).');
        }

        $this->exportDependencia($dir);
        $this->exportDelegacion($dir);
        $this->exportClasificacionBien($dir);
        $this->exportDependenciaDelegacion($dir);
        $this->exportEmpleado($dir, $anio, $empleadoMode);
        $this->exportDelegadoCsv($dir);
        $this->exportDelegadoDelegacionCsv($dir);
        $this->exportProductoLicitado($dir, $anio);
        $this->exportProductoCotizado($dir, $anio);
        $licIds = $anio !== null
            ? DB::table('producto_licitado')->where('anio', $anio)->pluck('id')->all()
            : null;
        $cotIds = $anio !== null
            ? DB::table('producto_cotizado')->where('anio', $anio)->pluck('id')->all()
            : null;
        $this->exportProductoLicitadoClasificacion($dir, $licIds);
        $this->exportProductoCotizadoClasificacion($dir, $cotIds);
        $this->exportCupo($dir, $anio);
        $this->exportAsignacion($dir, $anio);

        $this->newLine();
        $this->info('CSV escritos en: '.$dir);
        $this->line('Siguiente: revisá los archivos, hacé commit, y en destino `php artisan db:seed --class=Database\\\\Seeders\\\\SivsoDatasetSeeder`.');
        $xlsxDelegados = $dir.'/sivso_delegados.xlsx';
        if (Schema::hasTable('delegado') && is_readable($xlsxDelegados)) {
            $this->warn('Si existe sivso_delegados.xlsx en la misma carpeta, el seeder usa el Excel para delegados (no 05/06 CSV). Renombrá o borrá el .xlsx si querés forzar CSV.');
        }

        $xlsxOpt = $this->option('xlsx');
        if (is_string($xlsxOpt) && $xlsxOpt !== '') {
            return $this->writeXlsxBundle($dir, $xlsxOpt);
        }

        return self::SUCCESS;
    }

    private function exportDependencia(string $dir): void
    {
        $headers = ['ur', 'nombre', 'nombre_corto'];
        $path = $dir.'/01_dependencia.csv';
        $q = DB::table('dependencia')->orderBy('ur');
        $this->line('01_dependencia.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportDelegacion(string $dir): void
    {
        $headers = ['codigo', 'ur_referencia'];
        $path = $dir.'/02_delegacion.csv';
        $q = DB::table('delegacion')->orderBy('codigo');
        $this->line('02_delegacion.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportClasificacionBien(string $dir): void
    {
        $headers = ['id', 'codigo', 'nombre'];
        $path = $dir.'/03_clasificacion_bien.csv';
        $q = DB::table('clasificacion_bien')->orderBy('id');
        $this->line('03_clasificacion_bien.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportDependenciaDelegacion(string $dir): void
    {
        $headers = ['ur', 'delegacion_codigo'];
        $path = $dir.'/04_dependencia_delegacion.csv';
        $q = DB::table('dependencia_delegacion')->orderBy('ur')->orderBy('delegacion_codigo');
        $this->line('04_dependencia_delegacion.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportEmpleado(string $dir, ?int $anio, string $empleadoMode): void
    {
        $headers = ['id', 'legacy_empleado_id', 'nue', 'nombre', 'apellido_paterno', 'apellido_materno', 'ur', 'delegacion_codigo'];
        $path = $dir.'/07_empleado.csv';
        $q = DB::table('empleado');
        if ($anio !== null && $empleadoMode === 'asignacion') {
            $ids = DB::table('asignacion_empleado_producto')->where('anio', $anio)->distinct()->pluck('empleado_id');
            $q->whereIn('id', $ids);
        }
        $q->orderBy('id');
        $this->line('07_empleado.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportDelegadoCsv(string $dir): void
    {
        if (! Schema::hasTable('delegado')) {
            return;
        }
        $base = ['id', 'nombre_completo', 'nue'];
        $extra = [];
        if (Schema::hasColumn('delegado', 'user_id')) {
            $extra[] = 'user_id';
        }
        if (Schema::hasColumn('delegado', 'empleado_id')) {
            $extra[] = 'empleado_id';
        }
        $headers = array_merge($base, $extra);
        $path = $dir.'/05_delegado.csv';
        $q = DB::table('delegado')->orderBy('id');
        $this->line('05_delegado.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportDelegadoDelegacionCsv(string $dir): void
    {
        if (! Schema::hasTable('delegado_delegacion')) {
            return;
        }
        $headers = ['delegado_id', 'delegacion_codigo'];
        $path = $dir.'/06_delegado_delegacion.csv';
        $q = DB::table('delegado_delegacion')->orderBy('delegado_id')->orderBy('delegacion_codigo');
        $this->line('06_delegado_delegacion.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportProductoLicitado(string $dir, ?int $anio): void
    {
        $headers = [
            'id', 'anio', 'numero_partida', 'lote', 'partida_especifica', 'codigo_catalogo', 'descripcion',
            'cantidad_propuesta', 'unidad', 'marca', 'precio_unitario', 'subtotal', 'proveedor', 'medida', 'clasificacion_principal_id',
        ];
        $path = $dir.'/08_producto_licitado.csv';
        $q = DB::table('producto_licitado');
        if ($anio !== null) {
            $q->where('anio', $anio);
        }
        $q->orderBy('id');
        $this->line('08_producto_licitado.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportProductoCotizado(string $dir, ?int $anio): void
    {
        $headers = [
            'id', 'anio', 'producto_licitado_id', 'numero_partida', 'partida_especifica', 'clave', 'descripcion',
            'precio_unitario', 'importe', 'iva', 'total', 'precio_alterno', 'referencia_codigo', 'clasificacion_principal_id',
        ];
        $path = $dir.'/09_producto_cotizado.csv';
        $q = DB::table('producto_cotizado');
        if ($anio !== null) {
            $q->where('anio', $anio);
        }
        $q->orderBy('id');
        $this->line('09_producto_cotizado.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportProductoLicitadoClasificacion(string $dir, ?array $licIds): void
    {
        if (! Schema::hasTable('producto_licitado_clasificacion')) {
            return;
        }
        $headers = ['producto_licitado_id', 'clasificacion_id'];
        $path = $dir.'/10_producto_licitado_clasificacion.csv';
        $q = DB::table('producto_licitado_clasificacion');
        if ($licIds !== null) {
            if ($licIds === []) {
                $this->writeEmptyCsv($path, $headers);
                $this->line('10_producto_licitado_clasificacion.csv: 0 filas.');

                return;
            }
            $q->whereIn('producto_licitado_id', $licIds);
        }
        $q->orderBy('producto_licitado_id')->orderBy('clasificacion_id');
        $this->line('10_producto_licitado_clasificacion.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportProductoCotizadoClasificacion(string $dir, ?array $cotIds): void
    {
        if (! Schema::hasTable('producto_cotizado_clasificacion')) {
            return;
        }
        $headers = ['producto_cotizado_id', 'clasificacion_id'];
        $path = $dir.'/11_producto_cotizado_clasificacion.csv';
        $q = DB::table('producto_cotizado_clasificacion');
        if ($cotIds !== null) {
            if ($cotIds === []) {
                $this->writeEmptyCsv($path, $headers);
                $this->line('11_producto_cotizado_clasificacion.csv: 0 filas.');

                return;
            }
            $q->whereIn('producto_cotizado_id', $cotIds);
        }
        $q->orderBy('producto_cotizado_id')->orderBy('clasificacion_id');
        $this->line('11_producto_cotizado_clasificacion.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportCupo(string $dir, ?int $anio): void
    {
        if (! Schema::hasTable('cupo_dependencia_partida')) {
            return;
        }
        $headers = ['ur', 'numero_partida', 'partida_especifica', 'anio', 'monto_limite'];
        $path = $dir.'/12_cupo_dependencia_partida.csv';
        $q = DB::table('cupo_dependencia_partida');
        if ($anio !== null) {
            $q->where('anio', $anio);
        }
        $q->orderBy('ur')->orderBy('numero_partida')->orderBy('partida_especifica')->orderBy('anio');
        $this->line('12_cupo_dependencia_partida.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    private function exportAsignacion(string $dir, ?int $anio): void
    {
        $headers = [
            'id', 'anio', 'empleado_id', 'producto_licitado_id', 'producto_cotizado_id', 'clave_partida_presupuestal',
            'cantidad', 'talla', 'cantidad_secundaria', 'clave_presupuestal', 'legacy_concentrado_id',
        ];
        $path = $dir.'/13_asignacion_empleado_producto.csv';
        $q = DB::table('asignacion_empleado_producto');
        if ($anio !== null) {
            $q->where('anio', $anio);
        }
        $q->orderBy('id');
        $this->line('13_asignacion_empleado_producto.csv: '.$this->countQuery($q).' filas.');
        $this->writeCsvFromQuery($path, $headers, $q);
    }

    /**
     * @param  list<string>  $headers
     */
    private function writeEmptyCsv(string $path, array $headers): void
    {
        $handle = fopen($path, 'wb');
        if ($handle === false) {
            throw new \RuntimeException('No se pudo escribir: '.$path);
        }
        try {
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers);
        } finally {
            fclose($handle);
        }
    }

    /**
     * @param  list<string>  $headers
     */
    private function writeCsvFromQuery(string $path, array $headers, Builder $query): void
    {
        $handle = fopen($path, 'wb');
        if ($handle === false) {
            throw new \RuntimeException('No se pudo escribir: '.$path);
        }
        try {
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers);

            $query->clone()->chunk(3000, function ($rows) use ($handle, $headers): void {
                foreach ($rows as $row) {
                    $line = [];
                    foreach ($headers as $h) {
                        $line[] = $this->csvScalar($row->{$h} ?? null);
                    }
                    fputcsv($handle, $line);
                }
            });
        } finally {
            fclose($handle);
        }
    }

    private function csvScalar(mixed $v): string
    {
        if ($v === null) {
            return '';
        }
        if (is_bool($v)) {
            return $v ? '1' : '0';
        }

        return (string) $v;
    }

    private function countQuery(Builder $query): int
    {
        return (int) $query->clone()->count();
    }

    private function writeXlsxBundle(string $dir, string $xlsxPath): int
    {
        if (! class_exists(Spreadsheet::class)) {
            $this->error('Para --xlsx hace falta phpoffice/phpspreadsheet (composer install).');

            return self::FAILURE;
        }

        $path = str_contains($xlsxPath, DIRECTORY_SEPARATOR) || (strlen($xlsxPath) > 1 && $xlsxPath[1] === ':')
            ? $xlsxPath
            : base_path($xlsxPath);

        $this->warn('Generando XLSX opcional (solo tablas pequeñas; el seeder usa los CSV).');

        $spreadsheet = new Spreadsheet;

        $files = [
            '01_dependencia' => $dir.'/01_dependencia.csv',
            '02_delegacion' => $dir.'/02_delegacion.csv',
            '03_clasificacion' => $dir.'/03_clasificacion_bien.csv',
            '04_dep_del' => $dir.'/04_dependencia_delegacion.csv',
            '05_delegado' => $dir.'/05_delegado.csv',
            '06_del_del' => $dir.'/06_delegado_delegacion.csv',
        ];

        $sheetIndex = 0;
        foreach ($files as $title => $csvFile) {
            if (! is_readable($csvFile)) {
                continue;
            }
            $rowCount = count(file($csvFile));
            if ($rowCount > 60000) {
                $this->line("Omitida hoja {$title} (>60k filas).");

                continue;
            }
            if ($sheetIndex === 0) {
                $sheet = $spreadsheet->getActiveSheet();
            } else {
                $sheet = $spreadsheet->createSheet();
            }
            $sheet->setTitle(substr((string) preg_replace('/[^A-Za-z0-9_]/', '_', $title), 0, 31));
            $this->csvToSheet($sheet, $csvFile);
            $sheetIndex++;
        }

        if ($sheetIndex === 0) {
            $this->error('No hay CSV legibles para armar el XLSX.');

            return self::FAILURE;
        }

        $spreadsheet->setActiveSheetIndex(0);
        (new Xlsx($spreadsheet))->save($path);
        $this->info('XLSX (parcial): '.$path);

        return self::SUCCESS;
    }

    private function csvToSheet(Worksheet $sheet, string $csvFile): void
    {
        $fh = fopen($csvFile, 'rb');
        if ($fh === false) {
            return;
        }
        $rowNum = 1;
        while (($data = fgetcsv($fh)) !== false) {
            $col = 1;
            foreach ($data as $cell) {
                $sheet->setCellValue([$col, $rowNum], $cell);
                $col++;
            }
            $rowNum++;
        }
        fclose($fh);
    }
}
