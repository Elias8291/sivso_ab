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
            $table->enum('estado_anio_actual', ['pendiente', 'confirmado', 'cambio', 'baja'])
                ->default('pendiente')
                ->after('medida_anio_actual')
                ->comment('Estado de la asignación en el ejercicio actual');

            $table->text('observacion_anio_actual')
                ->nullable()
                ->after('estado_anio_actual')
                ->comment('Motivo de baja o nota del cambio');
        });
    }

    public function down(): void
    {
        Schema::table('asignacion_empleado_producto', function (Blueprint $table) {
            $table->dropColumn(['estado_anio_actual', 'observacion_anio_actual']);
        });
    }
};
