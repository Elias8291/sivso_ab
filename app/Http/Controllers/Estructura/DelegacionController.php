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

class DelegacionController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $delegaciones = Delegacion::query()
            ->with('dependenciaReferencia:ur,nombre')
            ->when($search, function ($query, $search) {
                $query->where('codigo', 'like', "%{$search}%")
                      ->orWhereHas('dependenciaReferencia', function ($q) use ($search) {
                          $q->where('nombre', 'like', "%{$search}%")
                            ->orWhere('ur', 'like', "%{$search}%");
                      });
            })
            ->orderBy('codigo')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Delegacion $row) => [
                'codigo' => $row->codigo,
                'ur_referencia' => $row->ur_referencia,
                'referencia_nombre' => $row->dependenciaReferencia?->nombre,
            ]);

        $dependenciasList = Dependencia::query()
            ->orderBy('ur')
            ->get(['ur', 'nombre', 'nombre_corto']);

        return Inertia::render('Estructura/Delegaciones/Index', [
            'delegaciones' => $delegaciones,
            'dependenciasList' => $dependenciasList,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'codigo' => ['required', 'string', 'max:50', 'unique:delegacion,codigo'],
            'ur_referencia' => ['nullable', 'integer', 'exists:dependencia,ur'],
        ]);

        Delegacion::create([
            'codigo' => $validated['codigo'],
            'ur_referencia' => $validated['ur_referencia'] ?: null,
        ]);

        return redirect()->route('delegaciones.index');
    }

    public function update(Request $request, Delegacion $delegacion): RedirectResponse
    {
        $validated = $request->validate([
            'ur_referencia' => ['nullable', 'integer', 'exists:dependencia,ur'],
        ]);

        $delegacion->update([
            'ur_referencia' => $validated['ur_referencia'] ?: null,
        ]);

        return redirect()->route('delegaciones.index');
    }

    public function destroy(Delegacion $delegacion): RedirectResponse
    {
        $codigo = $delegacion->codigo;

        if (Empleado::query()->where('delegacion_codigo', $codigo)->exists()) {
            return redirect()->route('delegaciones.index')->withErrors([
                'delegacion' => 'No se puede eliminar: hay empleados en esta delegación.',
            ]);
        }

        if (DB::table('delegado_delegacion')->where('delegacion_codigo', $codigo)->exists()) {
            return redirect()->route('delegaciones.index')->withErrors([
                'delegacion' => 'No se puede eliminar: la delegación está asignada a delegados.',
            ]);
        }

        if (DB::table('dependencia_delegacion')->where('delegacion_codigo', $codigo)->exists()) {
            return redirect()->route('delegaciones.index')->withErrors([
                'delegacion' => 'No se puede eliminar: existe en la relación dependencia_delegacion.',
            ]);
        }

        $delegacion->delete();

        return redirect()->route('delegaciones.index');
    }
}
