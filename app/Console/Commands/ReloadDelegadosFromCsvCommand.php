<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Database\Seeders\Concerns\SyncsSivsoAutoIncrements;
use Database\Seeders\DelegadoDelegacionFromCsvSeeder;
use Database\Seeders\DelegadoDelegacionFromExcelSeeder;
use Database\Seeders\DelegadoFromCsvSeeder;
use Database\Seeders\DelegadoFromExcelSeeder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Vuelve a cargar delegado + delegado_delegacion desde excel_datos.
 * Por defecto intenta conservar user_id y empleado_id por el mismo id de delegado.
 */
final class ReloadDelegadosFromCsvCommand extends Command
{
    use SyncsSivsoAutoIncrements;

    protected $signature = 'sivso:reload-delegados
                            {--force : Pone a NULL user_id y empleado_id en todos los delegados antes de borrar; no restaura vínculos}
                            {--excel : Carga desde database/seeders/excel_datos/sivso_delegados.xlsx (hojas delegado y delegado_delegacion)}
                            {--dry-run : Solo muestra conteos}';

    protected $description = 'Elimina y recarga delegado y delegado_delegacion desde CSV o sivso_delegados.xlsx';

    public function handle(): int
    {
        if (! Schema::hasTable('delegado') || ! Schema::hasTable('delegado_delegacion')) {
            $this->error('Faltan tablas delegado / delegado_delegacion.');

            return self::FAILURE;
        }

        $vinculos = DB::table('delegado')
            ->select(['id', 'user_id', 'empleado_id'])
            ->get()
            ->filter(static fn ($r): bool => $r->user_id !== null || $r->empleado_id !== null)
            ->keyBy('id');

        $nDelegado = DB::table('delegado')->count();
        $nPivot = DB::table('delegado_delegacion')->count();
        $this->info("Actual: delegado={$nDelegado}, delegado_delegacion={$nPivot}, filas con user_id o empleado_id: {$vinculos->count()}");

        if ($this->option('dry-run')) {
            return self::SUCCESS;
        }

        $useExcel = (bool) $this->option('excel');
        if ($useExcel) {
            $xlsx = database_path('seeders/excel_datos/sivso_delegados.xlsx');
            if (! is_readable($xlsx)) {
                $this->error('No existe o no se puede leer: '.$xlsx.' (usa sivso:export-delegados-excel o quita --excel).');

                return self::FAILURE;
            }
        }

        $fuente = $useExcel ? 'Excel (sivso_delegados.xlsx)' : 'CSV 05 y 06';
        if (! $this->confirm("¿Seguro? Se borrarán delegados y pivotes; luego se insertan desde {$fuente}.")) {
            return self::SUCCESS;
        }

        $preserve = [];
        if (! $this->option('force')) {
            foreach ($vinculos as $id => $row) {
                $preserve[(int) $id] = [
                    'user_id' => $row->user_id,
                    'empleado_id' => $row->empleado_id,
                ];
            }
        }

        $driver = DB::getDriverName();
        if ($driver === 'mysql' || $driver === 'mariadb') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
        }
        try {
            DB::table('delegado_delegacion')->delete();
            DB::table('delegado')->delete();
        } finally {
            if ($driver === 'mysql' || $driver === 'mariadb') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            }
        }

        $delegadoSeeder = $useExcel ? DelegadoFromExcelSeeder::class : DelegadoFromCsvSeeder::class;
        $pivotSeeder = $useExcel ? DelegadoDelegacionFromExcelSeeder::class : DelegadoDelegacionFromCsvSeeder::class;
        Artisan::call('db:seed', ['--class' => $delegadoSeeder, '--no-interaction' => true]);
        $this->output->write(Artisan::output());
        Artisan::call('db:seed', ['--class' => $pivotSeeder, '--no-interaction' => true]);
        $this->output->write(Artisan::output());

        $this->syncSivsoAutoIncrements(['delegado']);

        foreach ($preserve as $id => $cols) {
            $data = [];
            if (Schema::hasColumn('delegado', 'user_id')) {
                $data['user_id'] = $cols['user_id'];
            }
            if (Schema::hasColumn('delegado', 'empleado_id')) {
                $data['empleado_id'] = $cols['empleado_id'];
            }
            if ($data !== []) {
                DB::table('delegado')->where('id', $id)->update($data);
            }
        }

        if ($preserve !== []) {
            $this->info('Restaurados user_id / empleado_id en los ids que tenían vínculo antes del reload.');
        }

        $this->info('Listo. delegado='.DB::table('delegado')->count().', delegado_delegacion='.DB::table('delegado_delegacion')->count());

        return self::SUCCESS;
    }
}
