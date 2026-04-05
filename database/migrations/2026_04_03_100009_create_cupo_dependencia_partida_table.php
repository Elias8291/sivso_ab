<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cupo_dependencia_partida', function (Blueprint $table) {
            $table->unsignedInteger('ur');
            $table->unsignedInteger('numero_partida');
            $table->unsignedSmallInteger('partida_especifica');
            $table->unsignedSmallInteger('anio');
            $table->decimal('monto_limite', 15, 2);
            $table->primary(['ur', 'numero_partida', 'partida_especifica', 'anio']);

            $table->foreign('ur', 'fk_cupo_dep')
                ->references('ur')
                ->on('dependencia')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cupo_dependencia_partida');
    }
};
