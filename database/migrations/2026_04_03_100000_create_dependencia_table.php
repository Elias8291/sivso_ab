<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dependencia', function (Blueprint $table) {
            $table->unsignedInteger('ur');
            $table->string('nombre', 255);
            $table->string('nombre_corto', 120)->nullable();
            $table->primary('ur');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dependencia');
    }
};
