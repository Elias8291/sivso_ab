<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Misma lógica que Database\Seeders\Concerns\ReadsSivsoCsv para códigos y nombres.
 */
final class SivsoDatasetNormalizer
{
    public static function delegacionCodigo(?string $v): string
    {
        if ($v === null || $v === '') {
            return '';
        }

        $s = trim((string) $v);
        $s = preg_replace('/[\x{200B}\x{FEFF}]/u', '', $s) ?? $s;
        $s = str_replace(["\u{2013}", "\u{2014}", "\u{2212}", "\u{FF0D}"], '-', $s);

        if (class_exists(\Normalizer::class)) {
            $n = \Normalizer::normalize($s, \Normalizer::FORM_C);
            if (is_string($n)) {
                $s = $n;
            }
        }

        return $s;
    }

    public static function texto(?string $v): string
    {
        if ($v === null || $v === '') {
            return '';
        }

        $s = trim((string) $v);
        $s = preg_replace('/[\x{200B}\x{FEFF}]/u', '', $s) ?? $s;

        if (class_exists(\Normalizer::class)) {
            $n = \Normalizer::normalize($s, \Normalizer::FORM_C);
            if (is_string($n)) {
                $s = $n;
            }
        }

        return $s;
    }
}
