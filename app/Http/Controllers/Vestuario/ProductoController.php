<?php

declare(strict_types=1);

namespace App\Http\Controllers\Vestuario;

use App\Http\Controllers\Controller;
use App\Support\SivsoVestuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class ProductoController extends Controller
{
    public function index(Request $request): Response
    {
        $anios = collect(
            DB::table('producto_licitado')->select('anio')
                ->union(DB::table('producto_cotizado')->select('anio'))
                ->distinct()
                ->pluck('anio')
        )
            ->map(static fn ($anio) => (int) $anio)
            ->sortDesc()
            ->values()
            ->all();

        $anio = $request->integer('anio');
        $catalogoResuelto = SivsoVestuario::anioCatalogoResuelto();
        if (! in_array($anio, $anios, true)) {
            $anio = in_array($catalogoResuelto, $anios, true) ? $catalogoResuelto : ($anios[0] ?? $catalogoResuelto);
        }

        $licitados = DB::table('producto_licitado as pl')
            ->leftJoin('clasificacion_bien as cb', 'cb.id', '=', 'pl.clasificacion_principal_id')
            ->select([
                'pl.id',
                'pl.anio',
                'pl.numero_partida',
                'pl.partida_especifica',
                'pl.codigo_catalogo',
                'pl.descripcion',
                'pl.cantidad_propuesta',
                'pl.unidad',
                'pl.marca',
                'pl.proveedor',
                'pl.medida',
                'pl.precio_unitario',
                'cb.nombre as categoria',
            ])
            ->where('pl.anio', $anio)
            ->orderByRaw('COALESCE(NULLIF(TRIM(pl.codigo_catalogo), \'\'), \'ZZZZZZ\') asc')
            ->orderBy('pl.descripcion')
            ->limit(1000)
            ->get()
            ->map(static fn ($row) => [
                'id' => (int) $row->id,
                'anio' => (int) $row->anio,
                'numero_partida' => (int) $row->numero_partida,
                'partida_especifica' => (int) $row->partida_especifica,
                'codigo_catalogo' => $row->codigo_catalogo,
                'descripcion' => $row->descripcion,
                'cantidad_propuesta' => (int) $row->cantidad_propuesta,
                'unidad' => $row->unidad,
                'marca' => $row->marca,
                'proveedor' => $row->proveedor,
                'medida' => $row->medida,
                'precio_unitario' => $row->precio_unitario !== null ? (float) $row->precio_unitario : null,
                'categoria' => $row->categoria,
            ])
            ->values()
            ->all();

        $cotizados = DB::table('producto_cotizado as pc')
            ->leftJoin('clasificacion_bien as cb', 'cb.id', '=', 'pc.clasificacion_principal_id')
            ->select([
                'pc.id',
                'pc.anio',
                'pc.numero_partida',
                'pc.partida_especifica',
                'pc.clave',
                'pc.descripcion',
                'pc.referencia_codigo',
                'pc.precio_unitario',
                'pc.total',
                'cb.nombre as categoria',
            ])
            ->where('pc.anio', $anio)
            ->orderByRaw('COALESCE(NULLIF(TRIM(pc.clave), \'\'), \'ZZZZZZ\') asc')
            ->orderBy('pc.descripcion')
            ->limit(1000)
            ->get()
            ->map(static fn ($row) => [
                'id' => (int) $row->id,
                'anio' => (int) $row->anio,
                'numero_partida' => (int) $row->numero_partida,
                'partida_especifica' => (int) $row->partida_especifica,
                'clave' => $row->clave,
                'descripcion' => $row->descripcion,
                'referencia_codigo' => $row->referencia_codigo,
                'precio_unitario' => $row->precio_unitario !== null ? (float) $row->precio_unitario : null,
                'total' => $row->total !== null ? (float) $row->total : null,
                'categoria' => $row->categoria,
            ])
            ->values()
            ->all();

        $categorias = DB::table('clasificacion_bien')
            ->select(['id', 'codigo', 'nombre'])
            ->orderBy('nombre')
            ->get()
            ->map(static fn ($row) => [
                'id' => (int) $row->id,
                'codigo' => $row->codigo,
                'nombre' => $row->nombre,
            ])
            ->values()
            ->all();

        return Inertia::render('Vestuario/Productos/Index', [
            'anio' => $anio,
            'anios_disponibles' => $anios,
            'licitados' => $licitados,
            'cotizados' => $cotizados,
            'categorias' => $categorias,
            'filters' => $request->only(['anio']),
        ]);
    }

    public function update(Request $request, string $tipo, int $id): JsonResponse
    {
        abort_unless(in_array($tipo, ['licitado', 'cotizado'], true), 404);

        $data = $request->validate([
            'clave' => ['required', 'string', 'max:120'],
            'descripcion' => ['required', 'string', 'max:255'],
            'categoria_id' => ['nullable', 'integer', 'exists:clasificacion_bien,id'],
        ]);

        if ($tipo === 'licitado') {
            DB::table('producto_licitado')
                ->where('id', $id)
                ->update([
                    'codigo_catalogo' => trim($data['clave']),
                    'descripcion' => trim($data['descripcion']),
                    'clasificacion_principal_id' => $data['categoria_id'] ?? null,
                    'updated_at' => now(),
                ]);
        } else {
            DB::table('producto_cotizado')
                ->where('id', $id)
                ->update([
                    'clave' => trim($data['clave']),
                    'descripcion' => trim($data['descripcion']),
                    'clasificacion_principal_id' => $data['categoria_id'] ?? null,
                    'updated_at' => now(),
                ]);
        }

        return response()->json([
            'data' => null,
            'message' => 'Producto actualizado correctamente.',
            'errors' => null,
        ]);
    }
}
