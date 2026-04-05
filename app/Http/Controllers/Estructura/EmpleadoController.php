<?php

declare(strict_types=1);

namespace App\Http\Controllers\Estructura;

use App\Http\Controllers\Controller;
use App\Models\Delegacion;
use App\Models\Dependencia;
use App\Models\Empleado;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class EmpleadoController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $empleados = Empleado::query()
            ->with(['dependencia:ur,nombre_corto', 'delegacion:codigo'])
            ->when($search, function ($query, $search) {
                $query->where('nombre', 'like', "%{$search}%")
                      ->orWhere('apellido_paterno', 'like', "%{$search}%")
                      ->orWhere('apellido_materno', 'like', "%{$search}%")
                      ->orWhere('nue', 'like', "%{$search}%");
            })
            ->orderBy('apellido_paterno')
            ->orderBy('apellido_materno')
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Empleado $e) => [
                'id' => $e->id,
                'nombre' => $e->nombre,
                'apellido_paterno' => $e->apellido_paterno,
                'apellido_materno' => $e->apellido_materno,
                'nue' => $e->nue,
                'ur' => $e->ur,
                'dependencia_nombre' => $e->dependencia?->nombre_corto,
                'delegacion_codigo' => $e->delegacion_codigo,
            ]);

        $dependenciasList = Dependencia::query()
            ->orderBy('ur')
            ->get(['ur', 'nombre', 'nombre_corto']);

        $delegacionesList = Delegacion::query()
            ->orderBy('codigo')
            ->get(['codigo']);

        return Inertia::render('Estructura/Empleados/Index', [
            'empleados' => $empleados,
            'dependenciasList' => $dependenciasList,
            'delegacionesList' => $delegacionesList,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:80'],
            'apellido_paterno' => ['required', 'string', 'max:80'],
            'apellido_materno' => ['nullable', 'string', 'max:80'],
            'nue' => ['nullable', 'string', 'max:15'],
            'ur' => ['required', 'integer', 'exists:dependencia,ur'],
            'delegacion_codigo' => ['required', 'string', 'exists:delegacion,codigo'],
        ]);

        Empleado::create($validated);

        return redirect()->route('empleados.index');
    }

    public function update(Request $request, Empleado $empleado): RedirectResponse
    {
        $validated = $request->validate([
            'nombre' => ['required', 'string', 'max:80'],
            'apellido_paterno' => ['required', 'string', 'max:80'],
            'apellido_materno' => ['nullable', 'string', 'max:80'],
            'nue' => ['nullable', 'string', 'max:15'],
            'ur' => ['required', 'integer', 'exists:dependencia,ur'],
            'delegacion_codigo' => ['required', 'string', 'exists:delegacion,codigo'],
        ]);

        $empleado->update($validated);

        return redirect()->route('empleados.index');
    }

    public function destroy(Empleado $empleado): RedirectResponse
    {
        try {
            DB::transaction(function () use ($empleado): void {
                $empleado->registroDelegado()->update(['empleado_id' => null]);
                $empleado->delete();
            });
        } catch (Throwable) {
            return redirect()->route('empleados.index')->withErrors([
                'empleado' => 'No se puede eliminar: existen asignaciones u otros registros vinculados a este empleado.',
            ]);
        }

        return redirect()->route('empleados.index');
    }
}
