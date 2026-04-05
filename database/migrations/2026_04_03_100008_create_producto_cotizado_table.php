<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_cotizado', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('anio')->comment('Debe coincidir con producto_licitado.anio (cotizacion posterior a licitacion)');
            $table->unsignedBigInteger('producto_licitado_id')->comment('Licitacion base: insertar cotizado solo despues de existir esta fila');
            $table->unsignedInteger('numero_partida')->comment('Denormalizado desde licitado');
            $table->unsignedSmallInteger('partida_especifica')->comment('Denormalizado desde licitado');
            $table->string('clave', 30)->comment('clave2025, estable por ejercicio, unica por fila licitado+clave');
            $table->mediumText('descripcion');
            $table->decimal('precio_unitario', 12, 2)->nullable();
            $table->decimal('importe', 12, 2)->nullable();
            $table->decimal('iva', 12, 2)->nullable();
            $table->decimal('total', 12, 2)->nullable();
            $table->decimal('precio_alterno', 12, 2)->nullable()->comment('concentrado.precio_unitario_propuesta u otro precio auxiliar');
            $table->string('referencia_codigo', 32)->nullable()->comment('Unico PC{id}, NOT NULL tras migrar');
            $table->unsignedSmallInteger('clasificacion_principal_id')->nullable()->comment('Categoria principal (ver producto_cotizado_clasificacion)');

            $table->unique('referencia_codigo', 'uq_cotizado_referencia');
            $table->unique(['producto_licitado_id', 'clave'], 'uq_cotizado_lic_clave');
            $table->index(['anio', 'numero_partida'], 'idx_cotizado_anio_partida');
            $table->index('clave', 'idx_cotizado_clave');
            $table->index('partida_especifica', 'idx_cotizado_partida_especifica');
            $table->index('clasificacion_principal_id', 'idx_cotizado_clas_principal');

            $table->foreign('producto_licitado_id', 'fk_cotizado_lic')
                ->references('id')
                ->on('producto_licitado')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('clasificacion_principal_id', 'fk_cotizado_clas_principal')
                ->references('id')
                ->on('clasificacion_bien')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_cotizado');
    }
};
