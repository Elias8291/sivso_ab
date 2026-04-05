<?php

declare(strict_types=1);

namespace App\Http\Controllers\Estructura;

use App\Http\Controllers\Controller;
use App\Models\Dependencia;
use App\Models\Empleado;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DependenciaController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $dependencias = Dependencia::query()
            ->when($search, function ($query, $search) {
                $query->where('ur', 'like', "%{$search}%")
                      ->orWhere('nombre', 'like', "%{$search}%")
                      ->orWhere('nombre_corto', 'like', "%{$search}%");
            })
            ->orderBy('ur')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Dependencia $row) => [
                'ur' => $row->ur,
                'nombre' => $row->nombre,
                'nombre_corto' => $row->nombre_corto,
            ]);

        return Inertia::render('Estructura/Dependencias/Index', [
            'dependencias' => $dependencias,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ur' => ['required', 'integer', 'unique:dependencia,ur'],
            'nombre' => ['required', 'string', 'max:255'],
            'nombre_corto' => ['nullable', 'string', 'max:100'],
        ]);

        Dependencia::create($validated);

        return redirect()->route('dependencias.index');
    }

    public function update(Request $request, Dependencia $dependencia): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'nombre_corto' => ['nullable', 'string', 'max:100'],
        ]);

        $dependencia->update($validated);

        return redirect()->route('dependencias.index');
    }

    public function destroy(Dependencia $dependencia): RedirectResponse
    {
        $ur = $dependencia->ur;

        if (Empleado::query()->where('ur', $ur)->exists()) {
            return redirect()->route('dependencias.index')->withErrors([
                'dependencia' => 'No se puede eliminar: hay empleados asignados a esta dependencia.',
            ]);
        }

        if ($dependencia->delegaciones()->exists()) {
            return redirect()->route('dependencias.index')->withErrors([
                'dependencia' => 'No se puede eliminar: existen delegaciones con UR de referencia a esta dependencia.',
            ]);
        }

        if (DB::table('dependencia_delegacion')->where('ur', $ur)->exists()) {
            return redirect()->route('dependencias.index')->withErrors([
                'dependencia' => 'No se puede eliminar: la dependencia está vinculada en dependencia_delegacion.',
            ]);
        }

        $dependencia->delete();

        return redirect()->route('dependencias.index');
    }
}
