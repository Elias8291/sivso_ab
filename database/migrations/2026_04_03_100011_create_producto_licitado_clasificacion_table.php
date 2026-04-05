<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_licitado_clasificacion', function (Blueprint $table) {
            $table->unsignedBigInteger('producto_licitado_id');
            $table->unsignedSmallInteger('clasificacion_id');
            $table->primary(['producto_licitado_id', 'clasificacion_id']);
            $table->index('clasificacion_id', 'idx_lic_clas');

            $table->foreign('producto_licitado_id', 'fk_liclas_lic')
                ->references('id')
                ->on('producto_licitado')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('clasificacion_id', 'fk_liclas_cla')
                ->references('id')
                ->on('clasificacion_bien')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_licitado_clasificacion');
    }
};
