<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('acuse_recibo_tokens', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_token')->unique();
            $table->foreignId('empleado_id')->constrained('empleado')->cascadeOnDelete();
            $table->string('folio', 120);
            $table->json('snapshot');
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->unsignedInteger('access_count')->default(0);
            $table->timestamp('last_accessed_at')->nullable();
            $table->timestamps();

            $table->index(['empleado_id', 'folio']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('acuse_recibo_tokens');
    }
};
