<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asignacion_empleado_producto', function (Blueprint $table) {
            $table->id();
            $table->unsignedSmallInteger('anio')->comment('Ejercicio de la asignacion (coherente con producto_licitado)');
            $table->unsignedBigInteger('empleado_id');
            $table->unsignedBigInteger('producto_licitado_id');
            $table->unsignedBigInteger('producto_cotizado_id')->nullable()->comment('FK preferida: id de producto_cotizado (no usar solo clave)');
            $table->string('clave_partida_presupuestal', 120)->nullable()->comment('AC04, AC102… rubro interno');
            $table->integer('cantidad')->nullable();
            $table->string('talla', 10)->nullable();
            $table->integer('cantidad_secundaria')->nullable();
            $table->integer('clave_presupuestal')->nullable();
            $table->unsignedBigInteger('legacy_concentrado_id')->nullable()->comment('Traza a copiasivso.concentrado.id');

            $table->index('anio', 'idx_asig_anio');
            $table->index('empleado_id', 'idx_asig_emp');
            $table->index('producto_licitado_id', 'idx_asig_lic');
            $table->index('producto_cotizado_id', 'idx_asig_cot');

            $table->foreign('empleado_id', 'fk_asig_emp')
                ->references('id')
                ->on('empleado')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('producto_licitado_id', 'fk_asig_lic')
                ->references('id')
                ->on('producto_licitado')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('producto_cotizado_id', 'fk_asig_cot')
                ->references('id')
                ->on('producto_cotizado')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asignacion_empleado_producto');
    }
};
