<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Support\SivsoDatasetNormalizer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Importa delegado + delegado_delegacion desde DB_CONCENT_DATABASE.
 *
 * - Si en origen existe la tabla configurada en delegado_delegacion_table: INSERT...SELECT plano.
 * - Si no (ej. concent_p): arma el pivote desde la columna legacy_delegacion_column en delegado.
 */
final class ImportDelegadosFromConcentCommand extends Command
{
    private const CHUNK = 500;

    protected $signature = 'sivso:import-delegados-from-concent
                            {--dry-run : Solo conteos y códigos huérfanos respecto al catálogo delegacion local}
                            {--force : Borra pivotes y delegados locales antes}
                            {--yes : No preguntar confirmaciones}';

    protected $description = 'Importa delegado y delegado_delegacion desde DB_CONCENT_DATABASE (MySQL)';

    public function handle(): int
    {
        $driver = DB::getDriverName();
        if (! in_array($driver, ['mysql', 'mariadb'], true)) {
            $this->error('Este comando solo funciona con MySQL/MariaDB en la conexión por defecto.');

            return self::FAILURE;
        }

        $sourceDb = (string) config('database.connections.concent_p.database', '');
        if ($sourceDb === '') {
            $this->error('Defina DB_CONCENT_DATABASE en .env (nombre de la base concent_p u origen).');

            return self::FAILURE;
        }

        try {
            DB::connection('concent_p')->getPdo();
        } catch (\Throwable $e) {
            $this->error('No se pudo conectar a concent_p: '.$e->getMessage());

            return self::FAILURE;
        }

        $delTable = (string) config('concent_import.delegado_table');
        $pivTable = (string) config('concent_import.delegado_delegacion_table');
        $hasPivotOnSource = Schema::connection('concent_p')->hasTable($pivTable);

        $this->info('Origen ['.$sourceDb.']: tabla delegado=`'.$delTable.'`. '
            .($hasPivotOnSource ? "Modo pivote: `{$pivTable}`." : 'Modo legacy: columna `'.(string) config('concent_import.legacy_delegacion_column').'` en delegado.'));

        if ($hasPivotOnSource) {
            return $this->importFromPivotTable($sourceDb, $delTable, $pivTable);
        }

        return $this->importFromLegacyDelegadoRow($delTable);
    }

    private function confirmOrYes(string $message): bool
    {
        if ($this->option('yes')) {
            return true;
        }

        return $this->confirm($message);
    }

    private function orphanReport(array $codigosOrigen): bool
    {
        $codigosCat = DB::table('delegacion')->pluck('codigo')->all();
        $catSet = array_fill_keys($codigosCat, true);
        $orphanCodes = array_values(array_filter(
            $codigosOrigen,
            static fn (string $c): bool => ! isset($catSet[$c]),
        ));

        if ($orphanCodes !== []) {
            $this->warn('Códigos en origen que NO existen en delegacion local ('.count($orphanCodes).'):');
            $this->line(Str::limit(implode(', ', $orphanCodes), 500));

            return false;
        }

        return true;
    }

    /**
     * @return int self::SUCCESS|self::FAILURE only for dry-run shortcut when invalid
     */
    private function ensureDestEmptyOrForce(): ?int
    {
        if (! Schema::hasTable('delegado') || ! Schema::hasTable('delegado_delegacion')) {
            $this->error('Faltan tablas delegado / delegado_delegacion en la base destino.');

            return self::FAILURE;
        }

        if ($this->option('force')) {
            if (! $this->confirmOrYes('--force borrará delegados locales y pivotes. ¿Continuar?')) {
                return self::SUCCESS;
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            try {
                DB::table('delegado_delegacion')->delete();
                DB::table('delegado')->delete();
            } finally {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            }

            return null;
        }

        if (DB::table('delegado')->exists() || DB::table('delegado_delegacion')->exists()) {
            $this->error('La base destino ya tiene delegados. Use --force para reemplazar.');

            return self::FAILURE;
        }

        return null;
    }

    private function syncDelegadoAutoIncrement(): void
    {
        $max = DB::table('delegado')->max('id');
        if ($max !== null) {
            DB::statement('ALTER TABLE `delegado` AUTO_INCREMENT = '.((int) $max + 1));
        }
    }

    private function importFromPivotTable(string $sourceDb, string $delTable, string $pivTable): int
    {
        $concent = DB::connection('concent_p');
        $nSrcDel = (int) $concent->table($delTable)->count();
        $nSrcPiv = (int) $concent->table($pivTable)->count();
        $this->line("Filas: {$delTable}={$nSrcDel}, {$pivTable}={$nSrcPiv}");

        $codigosOrigen = $concent->table($pivTable)
            ->select('delegacion_codigo')
            ->distinct()
            ->pluck('delegacion_codigo')
            ->map(static fn ($c) => SivsoDatasetNormalizer::delegacionCodigo(is_string($c) ? $c : (string) $c))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $ok = $this->orphanReport($codigosOrigen);

        if ($this->option('dry-run')) {
            return $ok ? self::SUCCESS : self::FAILURE;
        }

        if (! $ok && ! $this->confirmOrYes('Hay códigos sin catálogo local. ¿Intentar importar de todos modos?')) {
            return self::FAILURE;
        }

        $early = $this->ensureDestEmptyOrForce();
        if ($early !== null) {
            return $early;
        }

        $targetDb = DB::connection()->getDatabaseName();
        $delCols = implode(', ', array_map(fn (string $c) => '`'.$c.'`', config('concent_import.delegado_columns')));
        $pivCols = implode(', ', array_map(fn (string $c) => '`'.$c.'`', config('concent_import.delegado_delegacion_columns')));
        $tDel = '`'.str_replace('`', '``', $targetDb).'`.`delegado`';
        $tPiv = '`'.str_replace('`', '``', $targetDb).'`.`delegado_delegacion`';
        $sDel = '`'.str_replace('`', '``', $sourceDb).'`.`'.str_replace('`', '``', $delTable).'`';
        $sPiv = '`'.str_replace('`', '``', $sourceDb).'`.`'.str_replace('`', '``', $pivTable).'`';

        DB::statement("INSERT INTO {$tDel} ({$delCols}) SELECT {$delCols} FROM {$sDel}");
        DB::statement("INSERT INTO {$tPiv} ({$pivCols}) SELECT {$pivCols} FROM {$sPiv}");

        $this->syncDelegadoAutoIncrement();
        $this->info('Importación terminada. delegado='.DB::table('delegado')->count().', delegado_delegacion='.DB::table('delegado_delegacion')->count());

        return self::SUCCESS;
    }

    private function importFromLegacyDelegadoRow(string $delTable): int
    {
        $colNombre = (string) config('concent_import.legacy_nombre_column');
        $colDel = (string) config('concent_import.legacy_delegacion_column');
        $colNue = config('concent_import.legacy_nue_column');

        $concent = DB::connection('concent_p');
        $nSrcDel = (int) $concent->table($delTable)->count();
        $this->line("Filas delegado en origen: {$nSrcDel}");

        $select = ['id', $colNombre, $colDel];
        if (is_string($colNue) && $colNue !== '') {
            $select[] = $colNue;
        }

        $rows = $concent->table($delTable)->select($select)->orderBy('id')->get();

        $codigosOrigen = $rows
            ->map(fn ($r) => SivsoDatasetNormalizer::delegacionCodigo($r->{$colDel} ?? null))
            ->filter()
            ->unique()
            ->values()
            ->all();

        $ok = $this->orphanReport($codigosOrigen);

        if ($this->option('dry-run')) {
            return $ok ? self::SUCCESS : self::FAILURE;
        }

        if (! $ok && ! $this->confirmOrYes('Hay códigos sin catálogo local. ¿Intentar importar de todos modos?')) {
            return self::FAILURE;
        }

        $early = $this->ensureDestEmptyOrForce();
        if ($early !== null) {
            return $early;
        }

        $delegadoRows = [];
        $pivotRows = [];
        foreach ($rows as $r) {
            $nombreRaw = SivsoDatasetNormalizer::texto($r->{$colNombre} ?? null);
            $delegadoRows[] = [
                'id' => (int) $r->id,
                'nombre_completo' => mb_strtoupper($nombreRaw, 'UTF-8'),
                'nue' => $this->legacyNueValue($r, $colNue),
            ];

            $cod = SivsoDatasetNormalizer::delegacionCodigo($r->{$colDel} ?? null);
            if ($cod !== '') {
                $pivotRows[] = [
                    'delegado_id' => (int) $r->id,
                    'delegacion_codigo' => $cod,
                ];
            }
        }

        foreach (array_chunk($delegadoRows, self::CHUNK) as $chunk) {
            DB::table('delegado')->insert($chunk);
        }
        foreach (array_chunk($pivotRows, self::CHUNK) as $chunk) {
            DB::table('delegado_delegacion')->insert($chunk);
        }

        $this->syncDelegadoAutoIncrement();
        $this->info('Importación terminada. delegado='.DB::table('delegado')->count().', delegado_delegacion='.DB::table('delegado_delegacion')->count());

        return self::SUCCESS;
    }

    private function legacyNueValue(object $r, mixed $colNue): ?string
    {
        if (! is_string($colNue) || $colNue === '') {
            return null;
        }
        $v = $r->{$colNue} ?? null;
        if ($v === null || $v === '') {
            return null;
        }

        return (string) $v;
    }
}
