<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dependencia_delegacion', function (Blueprint $table) {
            $table->unsignedInteger('ur');
            $table->string('delegacion_codigo', 30);
            $table->primary(['ur', 'delegacion_codigo']);

            $table->foreign('ur')
                ->references('ur')
                ->on('dependencia')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('delegacion_codigo', 'fk_dd_del')
                ->references('codigo')
                ->on('delegacion')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dependencia_delegacion');
    }
};
