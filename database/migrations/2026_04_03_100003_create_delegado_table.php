<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('delegado', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_completo', 240);
            $table->string('nue', 15)->nullable();
            $table->index('nue', 'idx_delegado_nue');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('delegado');
    }
};
