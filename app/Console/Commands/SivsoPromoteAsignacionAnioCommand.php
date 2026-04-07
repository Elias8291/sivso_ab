<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\SivsoVestuario;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Alinea el ejercicio en asignacion_empleado_producto con el catálogo (p. ej. 2025 → 2026).
 * Sin esto, SivsoVestuario sigue usando 2025 si casi todas las filas tienen anio=2025.
 */
final class SivsoPromoteAsignacionAnioCommand extends Command
{
    protected $signature = 'sivso:promote-asignacion-anio
                            {from : Año actual en asignaciones (ej. 2025)}
                            {to : Año objetivo (ej. 2026)}
                            {--database : Actualizar la tabla asignacion_empleado_producto en la BD conectada}
                            {--seed-csv : Reescribir database/seeders/excel_datos/13_asignacion_empleado_producto.csv}
                            {--csv= : Ruta alternativa al CSV 13}';

    protected $description = 'Pasa el campo anio de las asignaciones al ejercicio del catálogo (BD y/o CSV de seed).';

    public function handle(): int
    {
        $from = (int) $this->argument('from');
        $to = (int) $this->argument('to');
        if ($from === $to) {
            $this->error('from y to deben ser distintos.');

            return self::FAILURE;
        }

        $doDb = $this->option('database');
        $doCsv = $this->option('seed-csv');

        if (! $doDb && ! $doCsv) {
            $this->error('Indicá --database y/o --seed-csv.');

            return self::FAILURE;
        }

        if ($doDb) {
            if (! Schema::hasTable('asignacion_empleado_producto')) {
                $this->error('No existe la tabla asignacion_empleado_producto.');

                return self::FAILURE;
            }
            $n = DB::table('asignacion_empleado_producto')->where('anio', $from)->update(['anio' => $to]);
            $this->info("Base de datos: {$n} filas actualizadas (anio {$from} → {$to}).");
            SivsoVestuario::resetCache();
        }

        if ($doCsv) {
            $csvOpt = $this->option('csv');
            $path = is_string($csvOpt) && $csvOpt !== ''
                ? (str_contains($csvOpt, DIRECTORY_SEPARATOR) || (strlen($csvOpt) > 1 && $csvOpt[1] === ':') ? $csvOpt : base_path($csvOpt))
                : database_path('seeders/excel_datos/13_asignacion_empleado_producto.csv');
            if (! is_readable($path)) {
                $this->error('No se encuentra o no se puede leer: '.$path);

                return self::FAILURE;
            }
            $changed = $this->rewriteAsignacionCsvAnio($path, $from, $to);
            $this->info("CSV: {$changed} filas de datos con anio {$from} → {$to} en {$path}");
        }

        $this->newLine();
        $this->line('Si usás caché de config: php artisan config:clear');

        return self::SUCCESS;
    }

    private function rewriteAsignacionCsvAnio(string $path, int $from, int $to): int
    {
        $tmp = $path.'.tmp';
        $in = fopen($path, 'rb');
        if ($in === false) {
            throw new \RuntimeException('No se pudo leer: '.$path);
        }
        $out = fopen($tmp, 'wb');
        if ($out === false) {
            fclose($in);
            throw new \RuntimeException('No se pudo escribir: '.$tmp);
        }

        fwrite($out, "\xEF\xBB\xBF");
        $changed = 0;
        $header = fgetcsv($in);
        if ($header === false) {
            fclose($in);
            fclose($out);
            throw new \RuntimeException('CSV vacío: '.$path);
        }
        fputcsv($out, $header);
        $anioIdx = array_search('anio', $header, true);
        if ($anioIdx === false) {
            fclose($in);
            fclose($out);
            @unlink($tmp);
            throw new \RuntimeException('El CSV no tiene columna "anio".');
        }

        while (($row = fgetcsv($in)) !== false) {
            if (isset($row[$anioIdx]) && (int) $row[$anioIdx] === $from) {
                $row[$anioIdx] = (string) $to;
                $changed++;
            }
            fputcsv($out, $row);
        }
        fclose($in);
        fclose($out);

        if (! rename($tmp, $path)) {
            @unlink($tmp);
            throw new \RuntimeException('No se pudo reemplazar el CSV.');
        }

        return $changed;
    }
}
