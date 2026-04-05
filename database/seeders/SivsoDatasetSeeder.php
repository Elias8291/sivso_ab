<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\SyncsSivsoAutoIncrements;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Carga el dataset en database/seeders/excel_datos/*.csv
 * y, si existe y PhpSpreadsheet está disponible, sivso_delegados.xlsx solo para
 * hojas «delegado» y «delegado_delegacion».
 *
 * La tabla delegacion siempre se llena con 02_delegacion.csv para que coincida con
 * 04_dependencia_delegacion.csv (el Excel puede traer un subconjunto y romper FK).
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
        $excelOk = is_readable($delegadosExcel) && class_exists(IOFactory::class);

        $delegacionSeeder = DelegacionFromCsvSeeder::class;

        if ($excelOk) {
            $this->command?->info('Delegados: '.basename($delegadosExcel).' (hojas delegado + delegado_delegacion). Catálogo delegacion: 02_delegacion.csv.');
            $delegadoSeeder = DelegadoFromExcelSeeder::class;
            $delegadoDelegacionSeeder = DelegadoDelegacionFromExcelSeeder::class;
        } else {
            if (is_readable($delegadosExcel) && ! class_exists(IOFactory::class)) {
                $this->command?->warn('Existe sivso_delegados.xlsx pero PhpSpreadsheet no está instalado (ejecuta `composer install`). Usando CSV 05 y 06 para delegados.');
            } else {
                $this->command?->warn('Sin sivso_delegados.xlsx o librería: delegados desde 05_delegado.csv y 06_delegado_delegacion.csv.');
            }
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
