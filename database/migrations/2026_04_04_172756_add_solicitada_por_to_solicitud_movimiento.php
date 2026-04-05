<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('solicitud_movimiento', function (Blueprint $table) {
            $table->unsignedBigInteger('solicitada_por')->nullable()->after('empleado_id');
            $table->foreign('solicitada_por')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('solicitud_movimiento', function (Blueprint $table) {
            $table->dropForeign(['solicitada_por']);
            $table->dropColumn('solicitada_por');
        });
    }
};
