<?php

declare(strict_types=1);

namespace App\Services\Delegado;

use App\Support\SivsoVestuario;
use App\Support\VestuarioCotizadoJoin;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Licitados y cotizados por empleado/año para la ficha «Mi delegación».
 * Las clasificaciones de cotizados se resuelven en PHP (sin subconsultas correlacionadas en el SELECT principal).
 */
final class ProductosEmpleadoMiDelegacionService
{
    /**
     * @return array{licitados: list<array<string, mixed>>, cotizados: list<array<string, mixed>>}
     */
    public function licitadosYCotizados(int $empleadoId, int $anioConsulta, ?int $anioCatalogo = null): array
    {
        $anioCatalogo ??= SivsoVestuario::anioCatalogoResuelto();

        $parseClasifs = static function (?string $raw): array {
            if (! $raw) {
                return [];
            }

            return collect(explode(';;', $raw))
                ->map(function ($item) {
                    [$codigo, $nombre] = array_pad(explode('|', $item, 2), 2, '');

                    return ['codigo' => $codigo, 'nombre' => $nombre];
                })
                ->values()
                ->all();
        };

        $licitados = DB::table('asignacion_empleado_producto as aep')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id')
            ->leftJoin('producto_licitado as pl_cat', function ($join) use ($anioCatalogo): void {
                $join->on('pl_cat.numero_partida', '=', 'pl.numero_partida')
                    ->where('pl_cat.anio', '=', $anioCatalogo);
            })
            ->leftJoin('clasificacion_bien as cb', function ($join): void {
                $join->whereRaw('cb.id = COALESCE(pl_cat.clasificacion_principal_id, pl.clasificacion_principal_id)');
            })
            ->where('aep.empleado_id', $empleadoId)
            ->where('aep.anio', $anioConsulta)
            ->select([
                'aep.id                        as asignacion_id',
                DB::raw('COALESCE(pl_cat.id, pl.id) as id'),
                DB::raw('COALESCE(pl_cat.numero_partida, pl.numero_partida) as numero_partida'),
                DB::raw('COALESCE(pl_cat.partida_especifica, pl.partida_especifica) as partida_especifica'),
                DB::raw('COALESCE(pl_cat.codigo_catalogo, pl.codigo_catalogo) as codigo'),
                DB::raw('COALESCE(pl_cat.descripcion, pl.descripcion) as descripcion'),
                DB::raw('COALESCE(pl_cat.cantidad_propuesta, pl.cantidad_propuesta) as cantidad'),
                DB::raw('COALESCE(pl_cat.unidad, pl.unidad) as unidad'),
                DB::raw('COALESCE(pl_cat.marca, pl.marca) as marca'),
                DB::raw('COALESCE(pl_cat.proveedor, pl.proveedor) as proveedor'),
                DB::raw('COALESCE(pl_cat.medida, pl.medida) as medida'),
                'cb.codigo                      as categoria_codigo',
                'cb.nombre                      as categoria',
                'aep.clave_partida_presupuestal as clave_rubro',
                'aep.cantidad                   as cantidad_asignada',
                'aep.talla',
                'aep.estado_anio_actual         as estado',
            ])
            ->selectRaw(
                '(SELECT GROUP_CONCAT(CONCAT(cb2.codigo,"|",cb2.nombre) ORDER BY cb2.nombre SEPARATOR ";;") '.
                ' FROM producto_licitado_clasificacion plc2 '.
                ' JOIN clasificacion_bien cb2 ON cb2.id = plc2.clasificacion_id '.
                ' WHERE plc2.producto_licitado_id = COALESCE(pl_cat.id, pl.id)) AS clasificaciones_raw'
            )
            ->orderByRaw('COALESCE(pl_cat.numero_partida, pl.numero_partida)')
            ->get()
            ->map(function ($r) use ($parseClasifs) {
                $arr = (array) $r;
                $arr['clasificaciones'] = $parseClasifs($arr['clasificaciones_raw'] ?? null);
                unset($arr['clasificaciones_raw']);

                return $arr;
            })
            ->values()
            ->all();

        $cotizadosQuery = DB::table('asignacion_empleado_producto as aep')
            ->join('producto_licitado as pl', 'pl.id', '=', 'aep.producto_licitado_id');
        VestuarioCotizadoJoin::applyCotizadoResuelto($cotizadosQuery, 'aep', $anioCatalogo);
        $cotizadosQuery->leftJoin('clasificacion_bien as cb', function ($join): void {
            $join->whereRaw('cb.id = '.VestuarioCotizadoJoin::coalesceClasificacionPrincipalPreferAsignacionFksql());
        })
            ->where('aep.empleado_id', $empleadoId)
            ->where('aep.anio', $anioConsulta)
            ->select([
                'aep.id                        as asignacion_id',
                'pl.id                         as _pl_id',
                DB::raw(VestuarioCotizadoJoin::cotizadoIdPreferAsignacionFksql().' as id'),
                DB::raw(VestuarioCotizadoJoin::coalesceNumeroPartidaPreferAsignacionFksql().' as numero_partida'),
                DB::raw(VestuarioCotizadoJoin::coalescePartidaEspecificaPreferAsignacionFksql().' as partida_especifica'),
                DB::raw(VestuarioCotizadoJoin::coalesceClavePreferAsignacionFksql().' as codigo'),
                DB::raw(VestuarioCotizadoJoin::coalesceDescripcionPreferAsignacionFksql().' as descripcion'),
                DB::raw('COALESCE(pl_cat.cantidad_propuesta, pl.cantidad_propuesta) as cantidad'),
                DB::raw('COALESCE(pl_cat.unidad, pl.unidad) as unidad'),
                DB::raw('COALESCE(pl_cat.marca, pl.marca) as marca'),
                DB::raw('COALESCE(pl_cat.medida, pl.medida) as medida'),
                'cb.codigo                      as categoria_codigo',
                'cb.nombre                      as categoria',
                'aep.clave_partida_presupuestal as clave_rubro',
                'aep.cantidad                   as cantidad_asignada',
                'aep.talla',
                'aep.estado_anio_actual         as estado',
            ])
            ->orderByRaw(VestuarioCotizadoJoin::coalesceNumeroPartidaPreferAsignacionFksql());

        $cotRows = $cotizadosQuery->get();

        $cotizadoIds = $cotRows
            ->pluck('id')
            ->filter(static fn ($v): bool => $v !== null && $v !== '')
            ->map(static fn ($v): int => (int) $v)
            ->unique()
            ->values()
            ->all();

        $licitadoIds = $cotRows
            ->pluck('_pl_id')
            ->filter(static fn ($v): bool => $v !== null && $v !== '')
            ->map(static fn ($v): int => (int) $v)
            ->unique()
            ->values()
            ->all();

        $clasifsPorCotizado = $this->clasificacionesPorCotizadoIds($cotizadoIds);
        $clasifsPorLicitado = $this->clasificacionesPorLicitadoIds($licitadoIds);

        $cotizados = $cotRows
            ->map(function ($r) use ($clasifsPorCotizado, $clasifsPorLicitado) {
                $arr = (array) $r;
                $plId = isset($arr['_pl_id']) && $arr['_pl_id'] !== null && $arr['_pl_id'] !== ''
                    ? (int) $arr['_pl_id']
                    : null;
                unset($arr['_pl_id']);

                $cotId = isset($arr['id']) && $arr['id'] !== null && $arr['id'] !== ''
                    ? (int) $arr['id']
                    : null;

                $desdeCot = $cotId !== null ? ($clasifsPorCotizado[$cotId] ?? []) : [];
                $desdeLic = $plId !== null ? ($clasifsPorLicitado[$plId] ?? []) : [];
                // Si ya hay id cotizado resuelto, solo clasificaciones de cotizado (como el subselect SQL anterior).
                $arr['clasificaciones'] = $cotId !== null ? $desdeCot : $desdeLic;

                return $arr;
            })
            ->values()
            ->all();

        return [
            'licitados' => $licitados,
            'cotizados' => array_values($cotizados),
        ];
    }

    /**
     * @param  list<int>  $ids
     * @return array<int, list<array{codigo: string, nombre: string}>>
     */
    private function clasificacionesPorCotizadoIds(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        $rows = DB::table('producto_cotizado_clasificacion as pcc')
            ->join('clasificacion_bien as cb', 'cb.id', '=', 'pcc.clasificacion_id')
            ->whereIn('pcc.producto_cotizado_id', $ids)
            ->orderBy('pcc.producto_cotizado_id')
            ->orderBy('cb.nombre')
            ->select(['pcc.producto_cotizado_id', 'cb.codigo', 'cb.nombre'])
            ->get();

        return $this->agruparClasificacionesPorFk($rows, 'producto_cotizado_id');
    }

    /**
     * @param  list<int>  $ids
     * @return array<int, list<array{codigo: string, nombre: string}>>
     */
    private function clasificacionesPorLicitadoIds(array $ids): array
    {
        if ($ids === []) {
            return [];
        }

        $rows = DB::table('producto_licitado_clasificacion as plc')
            ->join('clasificacion_bien as cb', 'cb.id', '=', 'plc.clasificacion_id')
            ->whereIn('plc.producto_licitado_id', $ids)
            ->orderBy('plc.producto_licitado_id')
            ->orderBy('cb.nombre')
            ->select(['plc.producto_licitado_id', 'cb.codigo', 'cb.nombre'])
            ->get();

        return $this->agruparClasificacionesPorFk($rows, 'producto_licitado_id');
    }

    /**
     * @param  Collection<int, object>  $rows
     * @return array<int, list<array{codigo: string, nombre: string}>>
     */
    private function agruparClasificacionesPorFk(Collection $rows, string $fkColumn): array
    {
        $out = [];
        foreach ($rows as $row) {
            $kid = (int) $row->{$fkColumn};
            $out[$kid] ??= [];
            $out[$kid][] = [
                'codigo' => (string) $row->codigo,
                'nombre' => (string) $row->nombre,
            ];
        }

        return $out;
    }
}
