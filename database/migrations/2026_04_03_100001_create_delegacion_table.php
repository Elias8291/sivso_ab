<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delegacion', function (Blueprint $table) {
            $table->string('codigo', 30);
            $table->unsignedInteger('ur_referencia')->nullable()->comment('UR de referencia administrativa (el N:M real está en dependencia_delegacion)');
            $table->primary('codigo');

            $table->foreign('ur_referencia')
                ->references('ur')
                ->on('dependencia')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delegacion');
    }
};
