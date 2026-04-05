<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asignacion_empleado_producto', function (Blueprint $table) {
            $table->string('medida_anio_actual', 10)
                ->nullable()
                ->after('talla_anio_actual')
                ->comment('Medida numérica actualizada para el ejercicio en curso');
        });
    }

    public function down(): void
    {
        Schema::table('asignacion_empleado_producto', function (Blueprint $table) {
            $table->dropColumn('medida_anio_actual');
        });
    }
};
