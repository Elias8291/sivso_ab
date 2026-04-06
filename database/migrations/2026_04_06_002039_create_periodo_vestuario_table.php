<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periodo_vestuario', function (Blueprint $table) {
            $table->unsignedSmallInteger('id')->autoIncrement()->primary();
            $table->unsignedSmallInteger('anio');
            $table->string('nombre', 120);
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->enum('estado', ['proximo', 'abierto', 'cerrado'])->default('proximo');
            $table->text('descripcion')->nullable();
            $table->timestamps();

            $table->unique('anio', 'uq_periodo_anio');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periodo_vestuario');
    }
};
