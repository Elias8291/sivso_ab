<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delegado', function (Blueprint $table) {
            $table->foreignId('empleado_id')
                ->nullable()
                ->after('user_id')
                ->constrained('empleado')
                ->nullOnDelete();

            $table->unique('empleado_id', 'delegado_empleado_id_unique');
        });
    }

    public function down(): void
    {
        Schema::table('delegado', function (Blueprint $table) {
            $table->dropUnique('delegado_empleado_id_unique');
            $table->dropForeign(['empleado_id']);
        });
    }
};
