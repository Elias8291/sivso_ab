<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Database\Query\Builder;

/**
 * Resuelve producto_cotizado del año de catálogo (p. ej. 2026) usando la clave del registro
 * 2025: COALESCE(pc_old.clave, pl.codigo_catalogo) y buscando esa misma clave en producto_cotizado
 * con anio = catálogo (SivsoVestuario::anioCatalogoResuelto() según producto_cotizado en BD).
 *
 * 1) Preferido: mismo numero_partida en el año de catálogo (pl_cat) + clave en pc_cat ligado a ese licitado.
 * 2) Si no hay pl_cat o no hay fila: cualquier producto_cotizado del año de catálogo con esa clave (MIN id).
 *
 * Requiere join `producto_licitado as pl` con `pl.id = aep.producto_licitado_id`.
 */
final class VestuarioCotizadoJoin
{
    /**
     * @param  string  $aepAlias  Alias de asignacion_empleado_producto (p. ej. aep).
     */
    public static function applyCotizadoResuelto(Builder $query, string $aepAlias, int $anioCatalogo): void
    {
        $query->leftJoin('producto_cotizado as pc_old', 'pc_old.id', '=', "{$aepAlias}.producto_cotizado_id")
            ->leftJoin('producto_licitado as pl_cat', function ($join) use ($anioCatalogo): void {
                $join->on('pl_cat.numero_partida', '=', 'pl.numero_partida')
                    ->where('pl_cat.anio', '=', $anioCatalogo);
            })
            ->leftJoin('producto_cotizado as pc_cat', function ($join) use ($anioCatalogo): void {
                $join->where('pc_cat.anio', '=', $anioCatalogo)
                    ->whereRaw("TRIM(pc_cat.clave) = TRIM(COALESCE(NULLIF(TRIM(pc_old.clave), ''), pl.codigo_catalogo))")
                    ->whereNotNull('pl_cat.id')
                    ->whereColumn('pc_cat.producto_licitado_id', 'pl_cat.id');
            })
            ->leftJoin('producto_cotizado as pc_cat_fb', function ($join) use ($anioCatalogo): void {
                $join->where('pc_cat_fb.anio', '=', $anioCatalogo)
                    ->whereRaw("TRIM(pc_cat_fb.clave) = TRIM(COALESCE(NULLIF(TRIM(pc_old.clave), ''), pl.codigo_catalogo))")
                    ->whereRaw(
                        'pc_cat_fb.id = (
                        SELECT MIN(pc2.id) FROM producto_cotizado pc2
                        WHERE pc2.anio = ?
                        AND TRIM(pc2.clave) = TRIM(COALESCE(NULLIF(TRIM(pc_old.clave), \'\'), pl.codigo_catalogo))
                    )',
                        [$anioCatalogo]
                    )
                    ->whereNull('pc_cat.id');
            });
    }

    public static function coalesceDescripcionSql(): string
    {
        return 'COALESCE(pc_cat.descripcion, pc_cat_fb.descripcion, pl_cat.descripcion, pc_old.descripcion, pl.descripcion)';
    }

    public static function coalesceClaveSql(): string
    {
        return 'COALESCE(pc_cat.clave, pc_cat_fb.clave, pl_cat.codigo_catalogo, pc_old.clave, pl.codigo_catalogo)';
    }

    public static function cotizadoResueltoIdSql(): string
    {
        return 'COALESCE(pc_cat.id, pc_cat_fb.id, pc_old.id)';
    }

    public static function coalesceClasificacionPrincipalIdSql(): string
    {
        return 'COALESCE(pc_cat.clasificacion_principal_id, pc_cat_fb.clasificacion_principal_id, pc_old.clasificacion_principal_id)';
    }
}
