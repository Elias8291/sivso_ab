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
            $table->string('talla_anio_actual', 10)
                ->nullable()
                ->after('talla')
                ->comment('Talla actualizada para el ejercicio en curso (se copia de anio anterior y se edita)');

            $table->timestamp('talla_actualizada_at')
                ->nullable()
                ->after('talla_anio_actual')
                ->comment('Última vez que se actualizó talla_anio_actual');
        });
    }

    public function down(): void
    {
        Schema::table('asignacion_empleado_producto', function (Blueprint $table) {
            $table->dropColumn(['talla_anio_actual', 'talla_actualizada_at']);
        });
    }
};
