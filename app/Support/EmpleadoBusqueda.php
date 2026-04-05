<?php

declare(strict_types=1);

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

/**
 * Búsqueda de empleados: insensible a acentos y por palabras (un apellido, varios términos, NUE).
 */
final class EmpleadoBusqueda
{
    private const ACENTOS = [
        'á' => 'a', 'à' => 'a', 'ä' => 'a', 'â' => 'a', 'ã' => 'a', 'å' => 'a', 'ā' => 'a',
        'é' => 'e', 'è' => 'e', 'ë' => 'e', 'ê' => 'e', 'ē' => 'e',
        'í' => 'i', 'ì' => 'i', 'ï' => 'i', 'î' => 'i', 'ī' => 'i',
        'ó' => 'o', 'ò' => 'o', 'ö' => 'o', 'ô' => 'o', 'õ' => 'o', 'ō' => 'o',
        'ú' => 'u', 'ù' => 'u', 'ü' => 'u', 'û' => 'u', 'ū' => 'u',
        'ñ' => 'n', 'ç' => 'c',
    ];

    /**
     * Normaliza texto para comparar (minúsculas, sin acentos ni marcas combinadas).
     */
    public static function plegar(string $texto): string
    {
        $texto = mb_strtolower(trim($texto), 'UTF-8');

        if (class_exists(\Normalizer::class)) {
            $n = \Normalizer::normalize($texto, \Normalizer::FORM_D);
            if (is_string($n)) {
                $texto = preg_replace('/\p{M}/u', '', $n) ?? $texto;
            }
        }

        return strtr($texto, self::ACENTOS);
    }

    /**
     * Expresión SQL que pliega acentos sobre una columna (SQLite y MySQL: replace en cadena).
     *
     * @param  non-empty-string  $columna  Nombre de columna sin prefijo de tabla (p. ej. "nombre").
     */
    public static function sqlColumnaPlegada(string $columna): string
    {
        $expr = "lower(trim(COALESCE({$columna}, '')))";
        foreach (self::ACENTOS as $desde => $hacia) {
            $expr = "replace({$expr},'" . str_replace("'", "''", $desde) . "','{$hacia}')";
        }

        return $expr;
    }

    /**
     * Aplica condiciones AND por cada palabra; cada palabra debe aparecer en algún campo relevante
     * o en el nombre completo concatenado (para frases con varios apellidos).
     *
     * @param  Builder<\App\Models\Empleado>  $query
     */
    public static function aplicarTerminos(Builder $query, string $busqueda): void
    {
        $terminos = self::extraerTerminos($busqueda);
        if ($terminos === []) {
            return;
        }

        $n   = self::sqlColumnaPlegada('nombre');
        $ap  = self::sqlColumnaPlegada('apellido_paterno');
        $am  = self::sqlColumnaPlegada('apellido_materno');
        $nue = self::sqlColumnaPlegada('nue');

        $driver = $query->getConnection()->getDriverName();
        $concat = $driver === 'mysql'
            ? "CONCAT({$n}, ' ', {$ap}, ' ', {$am})"
            : "({$n} || ' ' || {$ap} || ' ' || {$am})";

        $aplicados = 0;
        foreach ($terminos as $termino) {
            $pl = self::plegar($termino);
            if ($pl === '') {
                continue;
            }
            $aplicados++;
            $like = '%' . self::escapeLike($pl) . '%';

            $query->where(static function (Builder $w) use ($like, $n, $ap, $am, $nue, $concat): void {
                $w->whereRaw("{$n} LIKE ?", [$like])
                    ->orWhereRaw("{$ap} LIKE ?", [$like])
                    ->orWhereRaw("{$am} LIKE ?", [$like])
                    ->orWhereRaw("{$nue} LIKE ?", [$like])
                    ->orWhereRaw("{$concat} LIKE ?", [$like]);
            });
        }

        if ($aplicados === 0) {
            $query->whereRaw('1 = 0');
        }
    }

    /**
     * @return list<string>
     */
    private static function extraerTerminos(string $busqueda): array
    {
        $partes = preg_split('/\s+/u', trim($busqueda)) ?: [];
        $out    = [];
        foreach ($partes as $p) {
            $p = trim($p);
            if ($p !== '') {
                $out[] = $p;
            }
        }

        return $out;
    }

    private static function escapeLike(string $value): string
    {
        return str_replace(['%', '_'], ['\\%', '\\_'], $value);
    }
}
