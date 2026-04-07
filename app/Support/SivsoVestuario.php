<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Support\Facades\DB;

/**
 * Año de vestuario efectivo: respeta SIVSO_VESTUARIO_ANIO, pero si no hay filas
 * en asignacion_empleado_producto para ese año, usa el mayor año con datos
 * (evita listados vacíos cuando el .env apunta a 2026 y la BD sigue en 2025).
 */
final class SivsoVestuario
{
    private static ?int $cachedReferencia = null;

    private static ?int $cachedCatalogoResuelto = null;

    private static ?int $cachedAnioAsignacionesVestuario = null;

    public static function anioReferencia(): int
    {
        if (self::$cachedReferencia !== null) {
            return self::$cachedReferencia;
        }

        $configured = (int) config('sivso.vestuario.anio_referencia');

        $hayDatos = DB::table('asignacion_empleado_producto')
            ->where('anio', $configured)
            ->exists();

        if ($hayDatos) {
            return self::$cachedReferencia = $configured;
        }

        $max = DB::table('asignacion_empleado_producto')->max('anio');

        return self::$cachedReferencia = $max !== null ? (int) $max : $configured;
    }

    /**
     * Etiquetas / PDF: si hubo fallback de año, alinear con el año de datos reales.
     */
    public static function anioActual(): int
    {
        $configuredRef = (int) config('sivso.vestuario.anio_referencia');
        $ref = self::anioReferencia();

        if ($ref !== $configuredRef) {
            return $ref;
        }

        return (int) config('sivso.vestuario.anio_actual');
    }

    public static function resetCache(): void
    {
        self::$cachedReferencia = null;
        self::$cachedCatalogoResuelto = null;
        self::$cachedAnioAsignacionesVestuario = null;
    }

    /**
     * Valor literal de SIVSO_VESTUARIO_ANIO en config (sin mirar la BD).
     */
    public static function anioCatalogoConfigurado(): int
    {
        return (int) config('sivso.vestuario.anio_referencia');
    }

    /**
     * Año efectivo para resolver producto_cotizado por clave: el configurado si hay filas
     * en producto_cotizado para ese año; si no, el mayor anio presente en esa tabla.
     * Así coincide con lo que ves al filtrar cotizados por año en catálogo.
     */
    public static function anioCatalogoResuelto(): int
    {
        if (self::$cachedCatalogoResuelto !== null) {
            return self::$cachedCatalogoResuelto;
        }

        $configured = (int) config('sivso.vestuario.anio_referencia');

        $hayCotizado = DB::table('producto_cotizado')
            ->where('anio', $configured)
            ->exists();

        if ($hayCotizado) {
            return self::$cachedCatalogoResuelto = $configured;
        }

        $max = DB::table('producto_cotizado')->max('anio');

        return self::$cachedCatalogoResuelto = $max !== null ? (int) $max : $configured;
    }

    /**
     * Año de asignaciones a usar en Mi delegación / vestuario: si hay filas en
     * asignacion_empleado_producto para el año de catálogo resuelto (p. ej. 2026 con DPPP),
     * se usa ese año; si no, el mismo criterio que anioReferencia() (asignaciones existentes).
     */
    public static function anioAsignacionesVestuario(): int
    {
        if (self::$cachedAnioAsignacionesVestuario !== null) {
            return self::$cachedAnioAsignacionesVestuario;
        }

        $cat = self::anioCatalogoResuelto();
        $hayAsignacionesCatalogo = DB::table('asignacion_empleado_producto')
            ->where('anio', $cat)
            ->exists();

        if ($hayAsignacionesCatalogo) {
            return self::$cachedAnioAsignacionesVestuario = $cat;
        }

        return self::$cachedAnioAsignacionesVestuario = self::anioReferencia();
    }
}
