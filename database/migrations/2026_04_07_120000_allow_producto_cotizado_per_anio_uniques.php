<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permite convivir cotizaciones de varios ejercicios: la misma clave bajo el mismo
 * producto_licitado_id puede repetirse con distinto anio (p. ej. 2025 y 2026).
 * La referencia PC{n} también se repite por año.
 *
 * Orden: primero se añade el nuevo único (lic, clave, anio) porque MySQL usa el
 * índice previo (lic, clave) como soporte de la FK fk_cotizado_lic sobre producto_licitado_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto_cotizado', function (Blueprint $table): void {
            $table->unique(
                ['producto_licitado_id', 'clave', 'anio'],
                'uq_cotizado_lic_clave_anio',
            );
        });

        Schema::table('producto_cotizado', function (Blueprint $table): void {
            $table->dropUnique('uq_cotizado_lic_clave');
        });

        Schema::table('producto_cotizado', function (Blueprint $table): void {
            $table->dropUnique('uq_cotizado_referencia');
        });

        Schema::table('producto_cotizado', function (Blueprint $table): void {
            $table->unique(
                ['anio', 'referencia_codigo'],
                'uq_cotizado_anio_referencia',
            );
        });
    }

    public function down(): void
    {
        Schema::table('producto_cotizado', function (Blueprint $table): void {
            $table->dropUnique('uq_cotizado_anio_referencia');
        });

        Schema::table('producto_cotizado', function (Blueprint $table): void {
            $table->unique('referencia_codigo', 'uq_cotizado_referencia');
        });

        Schema::table('producto_cotizado', function (Blueprint $table): void {
            $table->unique(['producto_licitado_id', 'clave'], 'uq_cotizado_lic_clave');
        });

        Schema::table('producto_cotizado', function (Blueprint $table): void {
            $table->dropUnique('uq_cotizado_lic_clave_anio');
        });
    }
};
