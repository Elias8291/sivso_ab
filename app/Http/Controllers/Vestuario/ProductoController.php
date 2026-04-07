<?php

declare(strict_types=1);

namespace App\Http\Controllers\Vestuario;

use App\Http\Controllers\Controller;
use App\Support\SivsoVestuario;
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
            ->orderBy('pl.numero_partida')
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
            ->orderBy('pc.numero_partida')
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

        return Inertia::render('Vestuario/Productos/Index', [
            'anio' => $anio,
            'anios_disponibles' => $anios,
            'licitados' => $licitados,
            'cotizados' => $cotizados,
            'filters' => $request->only(['anio']),
        ]);
    }
}
