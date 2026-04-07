<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Importa filas de producto_cotizado desde el JSON DPPP (ej. DPPP.json año 2026).
 */
final class ImportProductoCotizadoFromDpppJsonCommand extends Command
{
    protected $signature = 'sivso:import-producto-cotizado-dppp
                            {path : Ruta absoluta al archivo DPPP.json}
                            {--anio= : Filtra solo este año (ej. 2026); por defecto el del primer registro}
                            {--dry-run : No escribe en BD, solo valida y cuenta}
                            {--fresh : Elimina filas de producto_cotizado del año indicado antes de importar (confirmación)}
                            {--force : Con --fresh, borra sin preguntar (útil en scripts/CI)}
                            {--strict-clasificacion : Falla si algún clasificacion_principal_id no existe en clasificacion_bien}';

    protected $description = 'Inserta/actualiza producto_cotizado desde JSON DPPP (upsert por producto_licitado_id + clave + anio; conviven varios años)';

    public function handle(): int
    {
        $path = (string) $this->argument('path');
        if (! is_readable($path)) {
            $this->error('No se puede leer el archivo: '.$path);

            return self::FAILURE;
        }

        if (! Schema::hasTable('producto_cotizado')) {
            $this->error('No existe la tabla producto_cotizado. Ejecuta migraciones.');

            return self::FAILURE;
        }

        $raw = file_get_contents($path);
        if ($raw === false) {
            $this->error('No se pudo leer el contenido.');

            return self::FAILURE;
        }

        $data = json_decode($raw, true);
        if (! is_array($data)) {
            $this->error('JSON inválido o no es un array.');

            return self::FAILURE;
        }

        $anioFiltro = $this->option('anio');
        $anioFiltro = $anioFiltro !== null && $anioFiltro !== ''
            ? (int) $anioFiltro
            : null;

        $rows = [];
        foreach ($data as $i => $item) {
            if (! is_array($item)) {
                $this->warn('Índice '.$i.' ignorado: no es objeto.');

                continue;
            }

            $anio = (int) ($item['anio'] ?? 0);
            if ($anioFiltro !== null && $anio !== $anioFiltro) {
                continue;
            }

            $licId = (int) ($item['producto_licitado_id'] ?? 0);
            $clave = isset($item['clave']) ? trim((string) $item['clave']) : '';
            if ($licId < 1 || $clave === '') {
                $this->warn('Fila '.$i.' sin producto_licitado_id o clave válidos; omitida.');

                continue;
            }

            $ref = $this->parseNullableString($item['referencia_codigo'] ?? null);
            if ($ref === null || ! preg_match('/^PC\d+$/i', $ref)) {
                $this->warn("Fila {$i} clave={$clave}: referencia_codigo inválida o corrupta (JSON mal escapado). Omitida. Corrige el DPPP.json o reexporta.");

                continue;
            }
            $ref = strtoupper($ref);

            $precioU = $this->parseDecimalRequired($item['precio_unitario'] ?? null);
            $importe = $this->parseDecimalRequired($item['importe'] ?? null);
            $iva = $this->parseDecimalRequired($item['iva'] ?? null);
            $total = $this->parseDecimalRequired($item['total'] ?? null);
            if ($precioU === null || $importe === null || $iva === null || $total === null) {
                $this->warn("Fila {$i} clave={$clave}: montos numéricos inválidos (posible fila corrupta en JSON). Omitida.");

                continue;
            }

            $rows[] = [
                'anio' => $anio,
                'producto_licitado_id' => $licId,
                'numero_partida' => (int) ($item['numero_partida'] ?? 0),
                'partida_especifica' => (int) ($item['partida_especifica'] ?? 0),
                'clave' => $clave,
                'descripcion' => (string) ($item['descripcion'] ?? ''),
                'precio_unitario' => $precioU,
                'importe' => $importe,
                'iva' => $iva,
                'total' => $total,
                'precio_alterno' => $this->parseDecimal($item['precio_alterno'] ?? null),
                'referencia_codigo' => $ref,
                'clasificacion_principal_id' => $this->parseNullableInt($item['clasificacion_principal_id'] ?? null),
            ];
        }

        if ($rows === []) {
            $this->error('No hay filas para importar (revisa --anio o el contenido).');

            return self::FAILURE;
        }

        $this->info('Filas a procesar: '.count($rows));

        $strictClas = (bool) $this->option('strict-clasificacion');
        $clasificacionValida = null;
        if (Schema::hasTable('clasificacion_bien')) {
            $ids = DB::table('clasificacion_bien')->pluck('id')->map(static fn ($id): int => (int) $id)->all();
            $clasificacionValida = array_flip($ids);
        }

        $omitidosClasificacion = 0;
        if ($clasificacionValida !== null) {
            foreach ($rows as $i => $row) {
                $cid = $row['clasificacion_principal_id'];
                if ($cid === null || $cid === 0) {
                    $rows[$i]['clasificacion_principal_id'] = null;

                    continue;
                }
                if (! isset($clasificacionValida[$cid])) {
                    if ($strictClas) {
                        $this->error("clasificacion_principal_id={$cid} no existe en clasificacion_bien (fila índice {$i}, clave {$row['clave']}).");

                        return self::FAILURE;
                    }
                    $rows[$i]['clasificacion_principal_id'] = null;
                    $omitidosClasificacion++;
                }
            }
        } else {
            foreach ($rows as $i => $row) {
                $cid = $row['clasificacion_principal_id'];
                if ($cid === 0) {
                    $rows[$i]['clasificacion_principal_id'] = null;
                }
            }
        }
        if ($omitidosClasificacion > 0) {
            $this->warn("Se dejó clasificacion_principal_id en NULL en {$omitidosClasificacion} filas (id no encontrado en clasificacion_bien). Usa --strict-clasificacion para fallar en su lugar.");
        }

        $licIds = array_values(array_unique(array_column($rows, 'producto_licitado_id')));
        $existentes = DB::table('producto_licitado')->whereIn('id', $licIds)->pluck('id')->all();
        $faltantes = array_diff($licIds, $existentes);
        if ($faltantes !== []) {
            $this->error('Hay producto_licitado_id que no existen en producto_licitado: '.implode(', ', array_slice($faltantes, 0, 20))
                .(count($faltantes) > 20 ? '…' : ''));

            return self::FAILURE;
        }

        if ($this->option('dry-run')) {
            $this->info('Dry-run: no se escribió nada.');

            return self::SUCCESS;
        }

        if ($this->option('fresh')) {
            $anioBorrar = $anioFiltro ?? (int) ($rows[0]['anio'] ?? 0);
            if ($anioBorrar < 2000) {
                $this->error('No se pudo determinar el año para --fresh.');

                return self::FAILURE;
            }
            if (! $this->option('force') && ! $this->confirm("¿Borrar TODAS las filas de producto_cotizado con anio={$anioBorrar} antes de importar?", false)) {
                return self::SUCCESS;
            }
            $deleted = DB::table('producto_cotizado')->where('anio', $anioBorrar)->delete();
            $this->info("Eliminadas {$deleted} filas (anio={$anioBorrar}).");
        }

        $uniqueBy = ['producto_licitado_id', 'clave', 'anio'];
        $update = [
            'numero_partida',
            'partida_especifica',
            'descripcion',
            'precio_unitario',
            'importe',
            'iva',
            'total',
            'precio_alterno',
            'referencia_codigo',
            'clasificacion_principal_id',
        ];

        $chunkSize = 150;
        $total = 0;
        DB::transaction(function () use ($rows, $uniqueBy, $update, $chunkSize, &$total): void {
            foreach (array_chunk($rows, $chunkSize) as $chunk) {
                DB::table('producto_cotizado')->upsert($chunk, $uniqueBy, $update);
                $total += count($chunk);
            }
        });

        $this->info("Listo. Upsert aplicado a {$total} filas (clave única: producto_licitado_id + clave).");

        return self::SUCCESS;
    }

    private function parseDecimal(mixed $value): ?float
    {
        if ($value === null) {
            return null;
        }
        $s = trim((string) $value);
        if ($s === '' || strtoupper($s) === 'NULL') {
            return null;
        }

        return (float) $s;
    }

    /**
     * @return float|null null si no es un decimal válido (texto suelto, etc.)
     */
    private function parseDecimalRequired(mixed $value): ?float
    {
        if ($value === null) {
            return null;
        }
        $s = trim((string) $value);
        if ($s === '' || strtoupper($s) === 'NULL') {
            return null;
        }
        if (! is_numeric($s)) {
            return null;
        }

        return (float) $s;
    }

    private function parseNullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        $s = trim((string) $value);
        if ($s === '' || strtoupper($s) === 'NULL') {
            return null;
        }

        return $s;
    }

    private function parseNullableInt(mixed $value): ?int
    {
        if ($value === null) {
            return null;
        }
        $s = trim((string) $value);
        if ($s === '' || strtoupper($s) === 'NULL') {
            return null;
        }

        return (int) $s;
    }
}
