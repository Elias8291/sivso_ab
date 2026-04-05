<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delegado_delegacion', function (Blueprint $table) {
            $table->unsignedBigInteger('delegado_id');
            $table->string('delegacion_codigo', 30);
            $table->primary(['delegado_id', 'delegacion_codigo']);

            $table->foreign('delegado_id', 'fk_dld_del')
                ->references('id')
                ->on('delegado')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('delegacion_codigo', 'fk_dld_deleg')
                ->references('codigo')
                ->on('delegacion')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delegado_delegacion');
    }
};
