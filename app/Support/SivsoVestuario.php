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
     * Año efectivo para resolver producto_cotizado por clave: el **mayor** `anio` presente
     * en la tabla (DPPP más reciente). Si solo se miraba el año del .env y había datos de 2025,
     * se devolvía 2025 aunque ya existieran filas de 2026 — los joins nunca buscaban en 2026.
     * Si no hay cotizados, se usa el año configurado.
     */
    public static function anioCatalogoResuelto(): int
    {
        if (self::$cachedCatalogoResuelto !== null) {
            return self::$cachedCatalogoResuelto;
        }

        $configured = (int) config('sivso.vestuario.anio_referencia');
        $maxAnio = DB::table('producto_cotizado')->max('anio');

        if ($maxAnio === null) {
            return self::$cachedCatalogoResuelto = $configured;
        }

        return self::$cachedCatalogoResuelto = (int) $maxAnio;
    }

    /**
     * Año de asignaciones a usar en Mi delegación / vestuario: si hay filas en
     * varios ejercicios, usar el año con mayor volumen de filas para evitar que
     * unos pocos registros del año nuevo oculten la mayoría del padrón.
     */
    public static function anioAsignacionesVestuario(): int
    {
        if (self::$cachedAnioAsignacionesVestuario !== null) {
            return self::$cachedAnioAsignacionesVestuario;
        }

        $anioMasPoblado = DB::table('asignacion_empleado_producto')
            ->select('anio', DB::raw('COUNT(*) as total'))
            ->groupBy('anio')
            ->orderByDesc('total')
            ->orderByDesc('anio')
            ->value('anio');

        if ($anioMasPoblado !== null) {
            return self::$cachedAnioAsignacionesVestuario = (int) $anioMasPoblado;
        }

        return self::$cachedAnioAsignacionesVestuario = self::anioReferencia();
    }
}
