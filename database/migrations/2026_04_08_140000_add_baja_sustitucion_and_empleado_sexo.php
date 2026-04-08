<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empleado', function (Blueprint $table): void {
            $table->enum('sexo', ['M', 'F'])
                ->nullable()
                ->after('apellido_materno')
                ->comment('Sexo para catálogo de vestuario (hombre/mujer)');
        });

        Schema::table('solicitud_movimiento', function (Blueprint $table): void {
            $table->enum('baja_modo', ['definitiva', 'sustitucion'])
                ->nullable()
                ->after('observacion_solicitante')
                ->comment('Solo tipo baja: definitiva o llega sustituto');
            $table->json('sustituto')
                ->nullable()
                ->after('baja_modo')
                ->comment('Datos del nuevo empleado si baja_modo=sustitucion');
        });
    }

    public function down(): void
    {
        Schema::table('solicitud_movimiento', function (Blueprint $table): void {
            $table->dropColumn(['baja_modo', 'sustituto']);
        });

        Schema::table('empleado', function (Blueprint $table): void {
            $table->dropColumn('sexo');
        });
    }
};
