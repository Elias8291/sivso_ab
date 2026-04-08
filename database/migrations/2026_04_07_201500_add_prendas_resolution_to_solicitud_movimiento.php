<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitud_movimiento', function (Blueprint $table): void {
            $table->enum('modo_prendas', ['todas', 'seleccion', 'ninguna'])
                ->nullable()
                ->after('lleva_recurso')
                ->comment('Cómo se resolvió el recurso de prendas');
            $table->unsignedInteger('prendas_resueltas_total')
                ->nullable()
                ->after('modo_prendas')
                ->comment('Cantidad de prendas incluidas en la resolución');
        });
    }

    public function down(): void
    {
        Schema::table('solicitud_movimiento', function (Blueprint $table): void {
            $table->dropColumn(['modo_prendas', 'prendas_resueltas_total']);
        });
    }
};
