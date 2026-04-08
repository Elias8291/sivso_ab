<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asignacion_empleado_producto', function (Blueprint $table): void {
            $table->index(['anio', 'empleado_id'], 'idx_aep_anio_empleado');
        });
    }

    public function down(): void
    {
        Schema::table('asignacion_empleado_producto', function (Blueprint $table): void {
            $table->dropIndex('idx_aep_anio_empleado');
        });
    }
};
