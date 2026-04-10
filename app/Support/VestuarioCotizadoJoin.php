<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Database\Query\Builder;

/**
 * Resuelve producto_cotizado del año de catálogo (p. ej. 2026) usando una clave de negocio estable
 * y buscando esa misma clave en producto_cotizado con anio = catálogo.
 *
 * Orden de la clave de búsqueda (para alinear asignaciones 2025 con DPPP 2026):
 * 1) `clave_partida_presupuestal` en la asignación (AC04, AC102… del concentrado / ejercicio de la fila)
 * 2) `pc_old.clave` (producto_cotizado apuntado por la FK, puede ser otro año)
 * 3) `pl.codigo_catalogo` (licitado de la asignación)
 *
 * Resolución del catálogo vigente:
 * a) Preferido: mismo numero_partida en el año de catálogo (pl_cat) + clave en pc_cat ligado a ese licitado.
 * b) Si no hay pl_cat o no hay fila: cualquier producto_cotizado del año de catálogo con esa clave (MIN id).
 *
 * Requiere join `producto_licitado as pl` con `pl.id = aep.producto_licitado_id`.
 *
 * Tras `applyCotizadoResuelto`, el alias `pc_old` es la fila en `producto_cotizado` apuntada por
 * `asignacion_empleado_producto.producto_cotizado_id` (left join).
 *
 * Los métodos `*PreferAsignacionFksql()` priorizan esa FK para listados «cotizados» por empleado;
 * los métodos sin sufijo priorizan catálogo (vestuario / resúmenes alineados al ejercicio vigente).
 */
final class VestuarioCotizadoJoin
{
    /**
     * Expresión SQL: clave con la que se busca en `producto_cotizado` del año de catálogo (p. ej. 2026).
     *
     * @param  string  $aepAlias  Alias de asignacion_empleado_producto (p. ej. aep).
     */
    public static function claveBusquedaCatalogoExpr(string $aepAlias): string
    {
        return 'TRIM(COALESCE(NULLIF(TRIM('.$aepAlias.'.clave_partida_presupuestal), \'\'), NULLIF(TRIM(pc_old.clave), \'\'), pl.codigo_catalogo))';
    }

    /**
     * @param  string  $aepAlias  Alias de asignacion_empleado_producto (p. ej. aep).
     */
    public static function applyCotizadoResuelto(Builder $query, string $aepAlias, int $anioCatalogo): void
    {
        $claveExpr = self::claveBusquedaCatalogoExpr($aepAlias);

        $query->leftJoin('producto_cotizado as pc_old', 'pc_old.id', '=', "{$aepAlias}.producto_cotizado_id")
            ->leftJoin('producto_licitado as pl_cat', function ($join) use ($anioCatalogo): void {
                $join->on('pl_cat.numero_partida', '=', 'pl.numero_partida')
                    ->where('pl_cat.anio', '=', $anioCatalogo);
            })
            ->leftJoin('producto_cotizado as pc_cat', function ($join) use ($anioCatalogo, $claveExpr): void {
                $join->where('pc_cat.anio', '=', $anioCatalogo)
                    ->whereRaw('TRIM(pc_cat.clave) = '.$claveExpr)
                    ->whereNotNull('pl_cat.id')
                    ->whereColumn('pc_cat.producto_licitado_id', 'pl_cat.id');
            })
            ->leftJoin('producto_cotizado as pc_cat_fb', function ($join) use ($anioCatalogo, $claveExpr): void {
                $join->where('pc_cat_fb.anio', '=', $anioCatalogo)
                    ->whereRaw('TRIM(pc_cat_fb.clave) = '.$claveExpr)
                    ->whereRaw(
                        'pc_cat_fb.id = (
                        SELECT MIN(pc2.id) FROM producto_cotizado pc2
                        WHERE pc2.anio = ?
                        AND TRIM(pc2.clave) = '.$claveExpr.'
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

    /** Id de `producto_cotizado` para UI «cotizados»: primero la FK de la asignación, luego resolución por catálogo. */
    public static function cotizadoIdPreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.id, pc_cat.id, pc_cat_fb.id)';
    }

    /**
     * Precio unitario contractual preferido; si no hay fila cotizada resuelta, muestra el del licitado (catálogo o fila de la asignación).
     */
    public static function coalescePrecioUnitarioSql(): string
    {
        return 'COALESCE(pc_cat.precio_unitario, pc_cat_fb.precio_unitario, pc_old.precio_unitario, pl_cat.precio_unitario, pl.precio_unitario)';
    }

    public static function coalescePrecioUnitarioPreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.precio_unitario, pc_cat.precio_unitario, pc_cat_fb.precio_unitario, pl_cat.precio_unitario, pl.precio_unitario)';
    }

    /**
     * Partida específica para vistas que listan cotizados junto al licitado de la asignación.
     */
    public static function coalescePartidaEspecificaSql(): string
    {
        return 'COALESCE(pc_cat.partida_especifica, pc_cat_fb.partida_especifica, pc_old.partida_especifica, pl_cat.partida_especifica, pl.partida_especifica)';
    }

    public static function coalescePartidaEspecificaPreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.partida_especifica, pc_cat.partida_especifica, pc_cat_fb.partida_especifica, pl_cat.partida_especifica, pl.partida_especifica)';
    }

    public static function coalesceClasificacionPrincipalIdSql(): string
    {
        return 'COALESCE(pc_cat.clasificacion_principal_id, pc_cat_fb.clasificacion_principal_id, pc_old.clasificacion_principal_id, pl_cat.clasificacion_principal_id, pl.clasificacion_principal_id)';
    }

    public static function coalesceClasificacionPrincipalPreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.clasificacion_principal_id, pc_cat.clasificacion_principal_id, pc_cat_fb.clasificacion_principal_id, pl_cat.clasificacion_principal_id, pl.clasificacion_principal_id)';
    }

    public static function coalesceDescripcionPreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.descripcion, pc_cat.descripcion, pc_cat_fb.descripcion, pl_cat.descripcion, pl.descripcion)';
    }

    public static function coalesceClavePreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.clave, pc_cat.clave, pc_cat_fb.clave, pl_cat.codigo_catalogo, pl.codigo_catalogo)';
    }

    public static function coalesceNumeroPartidaPreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.numero_partida, pc_cat.numero_partida, pc_cat_fb.numero_partida, pl_cat.numero_partida, pl.numero_partida)';
    }

    public static function coalesceImportePreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.importe, pc_cat.importe, pc_cat_fb.importe)';
    }

    public static function coalesceTotalPreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.total, pc_cat.total, pc_cat_fb.total)';
    }

    public static function coalesceReferenciaPreferAsignacionFksql(): string
    {
        return 'COALESCE(pc_old.referencia_codigo, pc_cat.referencia_codigo, pc_cat_fb.referencia_codigo)';
    }
}
