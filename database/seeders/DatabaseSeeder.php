<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        User::query()->updateOrCreate(
            ['rfc' => 'RAJE020226H97'],
            [
                'name' => 'Administrador',
                'email' => 'admin@example.com',
                'password' => 'Abisai1456',
                'must_change_password' => false,
                'activo' => true,
                'is_super_admin' => true,
            ],
        );

        $this->call(SivsoDatasetSeeder::class);

        $testUser = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'rfc' => 'XAXX010101000',
            'activo' => true,
            'is_super_admin' => false,
        ]);

        // Opcional: primer delegado → usuario de prueba + empleado de catálogo con el mismo NUE y delegación coherente.
        $primerDelegado = Delegado::query()->orderBy('id')->first();
        if ($primerDelegado && ! $primerDelegado->user_id) {
            $primerDelegado->update(['user_id' => $testUser->id]);
        }
        if ($primerDelegado && ! $primerDelegado->empleado_id && $primerDelegado->nue) {
            $primerDelegado->load('delegaciones');
            $emp = Empleado::query()->where('nue', $primerDelegado->nue)->first();
            if (
                $emp
                && $primerDelegado->delegaciones->pluck('codigo')->contains($emp->delegacion_codigo)
            ) {
                $primerDelegado->update(['empleado_id' => $emp->id]);
                if ($emp->nue) {
                    $testUser->update(['nue' => $emp->nue]);
                }
            }
        }

        $this->call(RbacSeeder::class);
    }
}
