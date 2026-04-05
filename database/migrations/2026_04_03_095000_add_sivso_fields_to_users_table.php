<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Usuarios de la aplicación (tabla users): campos SIVSO y super administrador.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('rfc', 20)->nullable()->after('name');
            $table->string('nue', 20)->nullable()->after('rfc');
            $table->boolean('must_change_password')->default(false)->after('password');
            $table->boolean('activo')->default(true)->after('must_change_password');
            $table->boolean('is_super_admin')->default(false)->after('activo');
            $table->index('rfc', 'idx_users_rfc');
            $table->index('nue', 'idx_users_nue');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_rfc');
            $table->dropIndex('idx_users_nue');
            $table->dropColumn(['rfc', 'nue', 'must_change_password', 'activo', 'is_super_admin']);
        });
    }
};
