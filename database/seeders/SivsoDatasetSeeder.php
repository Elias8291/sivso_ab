<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\SyncsSivsoAutoIncrements;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

/**
 * Carga el dataset en database/seeders/excel_datos/*.csv
 * y, si existe, sivso_delegados.xlsx para delegación + delegados + pivote.
 *
 * Nota: 14_configuracion_sivso.csv no tiene tabla en las migraciones actuales (se eliminó configuracion_sivso);
 * usa config de aplicación o .env para el año de catálogo si aplica.
 */
class SivsoDatasetSeeder extends Seeder
{
    use SyncsSivsoAutoIncrements;

    public function run(): void
    {
        $required = [
            'dependencia',
            'delegacion',
            'clasificacion_bien',
            'empleado',
            'producto_licitado',
        ];

        foreach ($required as $table) {
            if (! Schema::hasTable($table)) {
                $this->command?->error("Falta la tabla [{$table}]. Ejecuta las migraciones antes de sembrar.");

                return;
            }
        }

        $delegadosExcel = database_path('seeders/excel_datos/sivso_delegados.xlsx');
        if (is_readable($delegadosExcel)) {
            $this->command?->info('Delegados/delegación: leyendo '.basename($delegadosExcel));
            $delegacionSeeder = DelegacionFromExcelSeeder::class;
            $delegadoSeeder = DelegadoFromExcelSeeder::class;
            $delegadoDelegacionSeeder = DelegadoDelegacionFromExcelSeeder::class;
        } else {
            $this->command?->warn('Sin sivso_delegados.xlsx: usando CSV 02_delegacion, 05_delegado, 06_delegado_delegacion. Genera el Excel con: php artisan sivso:export-delegados-excel');
            $delegacionSeeder = DelegacionFromCsvSeeder::class;
            $delegadoSeeder = DelegadoFromCsvSeeder::class;
            $delegadoDelegacionSeeder = DelegadoDelegacionFromCsvSeeder::class;
        }

        $this->call([
            DependenciaFromCsvSeeder::class,
            $delegacionSeeder,
            ClasificacionBienFromCsvSeeder::class,
            DependenciaDelegacionFromCsvSeeder::class,
            $delegadoSeeder,
            $delegadoDelegacionSeeder,
            EmpleadoFromCsvSeeder::class,
            ProductoLicitadoFromCsvSeeder::class,
            ProductoCotizadoFromCsvSeeder::class,
            ProductoLicitadoClasificacionFromCsvSeeder::class,
            ProductoCotizadoClasificacionFromCsvSeeder::class,
            CupoDependenciaPartidaFromCsvSeeder::class,
            AsignacionEmpleadoProductoFromCsvSeeder::class,
        ]);

        $this->syncClasificacionBienAutoIncrement();
        $this->syncSivsoAutoIncrements([
            'delegado',
            'empleado',
            'producto_licitado',
            'producto_cotizado',
            'asignacion_empleado_producto',
        ]);
    }
}
