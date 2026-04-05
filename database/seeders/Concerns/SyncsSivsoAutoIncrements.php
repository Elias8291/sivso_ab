<?php

declare(strict_types=1);

namespace Database\Seeders\Concerns;

use Illuminate\Support\Facades\DB;

trait SyncsSivsoAutoIncrements
{
    /**
     * @param  list<string>  $tables
     */
    protected function syncSivsoAutoIncrements(array $tables): void
    {
        $driver = DB::getDriverName();

        foreach ($tables as $table) {
            $max = DB::table($table)->max('id');
            if ($max === null) {
                continue;
            }

            $next = (int) $max + 1;

            if ($driver === 'mysql' || $driver === 'mariadb') {
                DB::statement('ALTER TABLE `'.$table.'` AUTO_INCREMENT = '.$next);
            } elseif ($driver === 'sqlite') {
                $exists = DB::table('sqlite_sequence')->where('name', $table)->exists();
                if ($exists) {
                    DB::table('sqlite_sequence')->where('name', $table)->update(['seq' => $max]);
                } else {
                    DB::table('sqlite_sequence')->insert(['name' => $table, 'seq' => $max]);
                }
            }
        }
    }

    protected function syncClasificacionBienAutoIncrement(): void
    {
        $driver = DB::getDriverName();
        $max = DB::table('clasificacion_bien')->max('id');
        if ($max === null) {
            return;
        }

        $next = (int) $max + 1;

        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('ALTER TABLE `clasificacion_bien` AUTO_INCREMENT = '.$next);
        }
    }
}
