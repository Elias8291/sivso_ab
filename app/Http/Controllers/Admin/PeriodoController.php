<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class PeriodoController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $empty = new LengthAwarePaginator([], 0, 15, 1, [
            'path' => request()->url(),
            'pageName' => 'page',
        ]);

        return Inertia::render('Admin/Periodos/Index', [
            'periodos' => $empty,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'ejercicio' => ['required', 'string', 'max:10'],
            'nombre' => ['required', 'string', 'max:255'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after_or_equal:fecha_inicio'],
        ]);

        // TODO: Crear periodo cuando exista la tabla de periodos.

        return redirect()->route('periodos.index');
    }
}
