<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();
        if ($driver !== 'mysql' && $driver !== 'mariadb') {
            return;
        }

        DB::statement('DROP VIEW IF EXISTS v_cotizacion_con_licitacion');
        DB::statement(<<<'SQL'
CREATE VIEW v_cotizacion_con_licitacion AS
SELECT
  pc.id AS cotizado_id,
  pc.referencia_codigo,
  pc.clave AS clave_cotizada,
  pc.descripcion AS descripcion_cotizada,
  pc.precio_unitario,
  pc.precio_alterno,
  pc.anio,
  pl.id AS licitado_id,
  pl.numero_partida,
  pl.partida_especifica,
  pl.codigo_catalogo,
  pl.descripcion AS descripcion_licitacion,
  pl.precio_unitario AS precio_licitacion_unitario
FROM producto_cotizado pc
INNER JOIN producto_licitado pl ON pl.id = pc.producto_licitado_id
SQL);
    }

    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver !== 'mysql' && $driver !== 'mariadb') {
            return;
        }

        DB::statement('DROP VIEW IF EXISTS v_cotizacion_con_licitacion');
    }
};
