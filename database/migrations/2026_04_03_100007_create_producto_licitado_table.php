<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_licitado', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('anio')->comment('Ejercicio fiscal del catalogo (mismo numero_partida puede repetirse en otro anio)');
            $table->unsignedInteger('numero_partida')->comment('Numero de partida presupuestal dentro del ejercicio');
            $table->integer('lote');
            $table->unsignedSmallInteger('partida_especifica');
            $table->string('codigo_catalogo', 30);
            $table->mediumText('descripcion');
            $table->integer('cantidad_propuesta');
            $table->string('unidad', 15);
            $table->string('marca', 30);
            $table->decimal('precio_unitario', 12, 2);
            $table->decimal('subtotal', 12, 2);
            $table->string('proveedor', 30);
            $table->string('medida', 5);
            $table->unsignedSmallInteger('clasificacion_principal_id')->nullable()->comment('Categoria principal (ver producto_licitado_clasificacion)');

            $table->unique(['anio', 'numero_partida'], 'uq_licitado_anio_partida');
            $table->index('anio', 'idx_licitado_anio');
            $table->index('numero_partida', 'idx_licitado_numero');
            $table->index('clasificacion_principal_id', 'idx_licitado_clas_principal');

            $table->foreign('clasificacion_principal_id', 'fk_licitado_clas_principal')
                ->references('id')
                ->on('clasificacion_bien')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_licitado');
    }
};
