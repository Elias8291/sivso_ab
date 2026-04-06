<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\AcuseReciboToken;
use Illuminate\Http\Response;

final class AcuseReciboPublicController extends Controller
{
    /**
     * Muestra el acuse congelado al generar el PDF. Seguridad: URL firmada (middleware),
     * token opaco UUID, snapshot JSON en BD, límite de peticiones, cabeceras HTTP restrictivas.
     */
    public function show(string $token): Response
    {
        $record = AcuseReciboToken::query()->where('public_token', $token)->first();
        abort_if($record === null, 404);

        if (! $record->isValid()) {
            abort(410, 'Este enlace ha expirado o dejó de ser válido.');
        }

        $snapshot = $record->snapshot;
        abort_if(! is_array($snapshot) || ($snapshot['folio'] ?? '') !== $record->folio, 404);

        abort_if(($snapshot['schema_version'] ?? 0) < 1, 404);

        $record->increment('access_count');
        $record->forceFill(['last_accessed_at' => now()])->save();

        return response()
            ->view('web.acuse-recibo-vestuario', [
                'data' => $snapshot,
            ])
            ->withHeaders([
                'X-Frame-Options' => 'DENY',
                'X-Content-Type-Options' => 'nosniff',
                'Referrer-Policy' => 'no-referrer',
                'Permissions-Policy' => 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
                'Content-Security-Policy' => "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'self'",
            ]);
    }
}
