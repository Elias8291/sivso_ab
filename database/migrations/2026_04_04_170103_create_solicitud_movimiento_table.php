<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitud_movimiento', function (Blueprint $table) {
            $table->id();

            $table->foreignId('empleado_id')
                ->constrained('empleado')
                ->cascadeOnDelete();

            $table->string('delegacion_origen', 30)
                ->comment('Delegación desde la que se solicita el movimiento');

            $table->string('delegacion_destino', 30)
                ->nullable()
                ->comment('Delegación destino (solo para tipo cambio)');

            $table->enum('tipo', ['baja', 'cambio'])
                ->comment('Tipo de movimiento solicitado');

            $table->enum('estado', ['pendiente', 'aprobada', 'rechazada'])
                ->default('pendiente');

            /* Campos que rellena el delegado al solicitar */
            $table->text('observacion_solicitante')->nullable();

            /* Campos que rellena S.Administración al resolver */
            $table->text('observacion_administracion')->nullable();

            $table->boolean('lleva_recurso')
                ->nullable()
                ->comment('¿El empleado se lleva el presupuesto de vestuario? (decide S.Admin)');

            $table->text('ajuste_recurso')
                ->nullable()
                ->comment('Nota sobre ajustes al recurso (añadir partidas, reducir, etc.)');

            $table->foreignId('resuelta_por')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('Usuario de S.Admin que aprobó o rechazó');

            $table->timestamp('resuelta_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitud_movimiento');
    }
};
