<?php

declare(strict_types=1);

namespace App\Http\Controllers\Estructura;

use App\Http\Controllers\Controller;
use App\Models\Delegacion;
use App\Models\Dependencia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class IndependienteController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $independientes = Delegacion::query()
            ->where('codigo', 'like', 'IND-%')
            ->with('dependenciaReferencia:ur,nombre')
            ->when($search, function ($query, $s): void {
                $query->where(function ($inner) use ($s): void {
                    $inner->where('codigo', 'like', "%{$s}%")
                        ->orWhereHas('dependenciaReferencia', function ($depQ) use ($s): void {
                            $depQ->where('nombre', 'like', "%{$s}%")
                                ->orWhere('ur', 'like', "%{$s}%");
                        });
                });
            })
            ->orderBy('codigo')
            ->paginate(20)
            ->withQueryString()
            ->through(static fn (Delegacion $row): array => [
                'codigo' => $row->codigo,
                'ur_referencia' => $row->ur_referencia,
                'referencia_nombre' => $row->dependenciaReferencia?->nombre,
            ]);

        $dependencias = Dependencia::query()
            ->orderBy('ur')
            ->get(['ur', 'nombre', 'nombre_corto']);

        return Inertia::render('Estructura/Independientes/Index', [
            'independientes' => $independientes,
            'dependenciasList' => $dependencias,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'codigo' => ['required', 'string', 'max:50', 'regex:/^IND-\d+$/', 'unique:delegacion,codigo'],
            'ur_referencia' => ['nullable', 'integer', 'exists:dependencia,ur'],
        ]);

        Delegacion::create([
            'codigo' => strtoupper(trim($validated['codigo'])),
            'ur_referencia' => $validated['ur_referencia'] ?: null,
        ]);

        return redirect()->route('independientes.index');
    }

    public function update(Request $request, Delegacion $independiente): RedirectResponse
    {
        abort_unless(str_starts_with($independiente->codigo, 'IND-'), 404);

        $validated = $request->validate([
            'ur_referencia' => ['nullable', 'integer', 'exists:dependencia,ur'],
        ]);

        $independiente->update([
            'ur_referencia' => $validated['ur_referencia'] ?: null,
        ]);

        return redirect()->route('independientes.index');
    }

    public function destroy(Delegacion $independiente): RedirectResponse
    {
        abort_unless(str_starts_with($independiente->codigo, 'IND-'), 404);
        $independiente->delete();

        return redirect()->route('independientes.index');
    }
}
