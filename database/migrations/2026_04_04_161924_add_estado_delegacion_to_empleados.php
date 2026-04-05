<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleado', function (Blueprint $table) {
            $table->enum('estado_delegacion', ['activo', 'baja', 'cambio'])
                ->default('activo')
                ->after('id')
                ->comment('Estado del empleado en su delegación para el ejercicio actual');

            $table->text('observacion_delegacion')
                ->nullable()
                ->after('estado_delegacion')
                ->comment('Motivo de baja o nota de cambio');
        });
    }

    public function down(): void
    {
        Schema::table('empleado', function (Blueprint $table) {
            $table->dropColumn(['estado_delegacion', 'observacion_delegacion']);
        });
    }
};
