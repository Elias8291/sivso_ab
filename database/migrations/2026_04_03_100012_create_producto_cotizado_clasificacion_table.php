<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_cotizado_clasificacion', function (Blueprint $table) {
            $table->unsignedBigInteger('producto_cotizado_id');
            $table->unsignedSmallInteger('clasificacion_id');
            $table->primary(['producto_cotizado_id', 'clasificacion_id']);
            $table->index('clasificacion_id', 'idx_cot_clas');

            $table->foreign('producto_cotizado_id', 'fk_cotlas_cot')
                ->references('id')
                ->on('producto_cotizado')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            $table->foreign('clasificacion_id', 'fk_cotlas_cla')
                ->references('id')
                ->on('clasificacion_bien')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_cotizado_clasificacion');
    }
};
