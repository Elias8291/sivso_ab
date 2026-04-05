<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('empleado', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('legacy_empleado_id')->nullable()->comment('copiasivso.empleados.id (traza y migración 1:1)');
            $table->string('nue', 15)->nullable();
            $table->string('nombre', 80);
            $table->string('apellido_paterno', 80);
            $table->string('apellido_materno', 80);
            $table->unsignedInteger('ur');
            $table->string('delegacion_codigo', 30);

            $table->unique('legacy_empleado_id', 'uq_empleado_legacy');
            $table->index('ur', 'idx_empleado_ur');
            $table->index('delegacion_codigo', 'idx_empleado_deleg');
            $table->index(['nue', 'ur'], 'idx_empleado_nue_ur');

            $table->foreign('ur', 'fk_emp_dep')
                ->references('ur')
                ->on('dependencia')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->foreign('delegacion_codigo', 'fk_emp_del')
                ->references('codigo')
                ->on('delegacion')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('empleado');
    }
};
