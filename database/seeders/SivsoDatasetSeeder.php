<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Concerns\SyncsSivsoAutoIncrements;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

/**
 * Carga el dataset exportado en database/seeders/excel_datos/*.csv
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

        $this->call([
            DependenciaFromCsvSeeder::class,
            DelegacionFromCsvSeeder::class,
            ClasificacionBienFromCsvSeeder::class,
            DependenciaDelegacionFromCsvSeeder::class,
            DelegadoFromCsvSeeder::class,
            DelegadoDelegacionFromCsvSeeder::class,
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
