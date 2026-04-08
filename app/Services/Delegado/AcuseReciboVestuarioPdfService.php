<?php

declare(strict_types=1);

namespace App\Services\Delegado;

use App\Models\AcuseReciboToken;
use App\Models\Empleado;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

final class AcuseReciboVestuarioPdfService
{
    /**
     * @param  array<string, mixed>  $fila  Salida de mapEmpleadoParaVista (vestuario completo).
     */
    public function stream(
        Empleado $empleado,
        string $delegadoNombre,
        array $fila,
        int $anioTitulo,
        int $anioEjercicioDatos,
    ): Response {
        $data = $this->buildDocumentData($empleado, $delegadoNombre, $fila, $anioTitulo, $anioEjercicioDatos);

        $monthsTtl = (int) config('services.sivso.acuse_url_ttl_months', 18);
        $monthsTtl = max(1, min($monthsTtl, 60));
        $expiresAt = now()->addMonths($monthsTtl);

        $publicToken = (string) Str::uuid();
        $signedUrl = URL::temporarySignedRoute(
            'acuse-vestuario.recibo',
            $expiresAt,
            ['token' => $publicToken],
        );

        $qrDataUri = $this->qrDataUri($signedUrl);

        $snapshot = array_merge($data, [
            'schema_version' => 1,
            'qrDataUri' => $qrDataUri,
        ]);

        AcuseReciboToken::query()->create([
            'public_token' => $publicToken,
            'empleado_id' => $empleado->id,
            'folio' => $data['folio'],
            'snapshot' => $snapshot,
            'expires_at' => $expiresAt,
        ]);

        $logoDataUri = $this->logoDataUri();

        $pdf = Pdf::loadView('pdf.acuse-recibo-vestuario', array_merge($data, [
            'qrDataUri' => $qrDataUri,
            'logoDataUri' => $logoDataUri,
        ]));

        $pdf->setPaper('letter', 'portrait');
        $pdf->setOption('defaultFont', 'DejaVu Sans');

        $filename = 'acuse-vestuario-'.$empleado->id.'-'.preg_replace('/[^A-Za-z0-9_-]+/', '_', $data['folio']).'.pdf';

        return $pdf->stream($filename);
    }

    /**
     * @param  array<string, mixed>  $fila
     * @return array<string, mixed>
     */
    public function buildDocumentData(
        Empleado $empleado,
        string $delegadoNombre,
        array $fila,
        int $anioTitulo,
        int $anioEjercicioDatos,
    ): array {
        $folio = $this->generarFolio($empleado);
        $licitacion = (string) config('services.sivso.acuse_licitacion', 'LPN-SA-SA-0036-08/'.$anioTitulo);
        $lineas = $this->lineasParaTabla($fila);
        $totalPiezas = array_sum(array_column($lineas, 'cantidad'));

        return [
            'folio' => $folio,
            'licitacion' => $licitacion,
            'codigoDelegacion' => $this->upperUtf8((string) ($empleado->delegacion_codigo ?? '')),
            'anioTitulo' => $anioTitulo,
            'anioEjercicioDatos' => $anioEjercicioDatos,
            'nombreEmpleado' => $this->upperUtf8((string) ($fila['nombre_completo'] ?? '—')),
            'nue' => (string) ($empleado->nue ?? '—'),
            'dependenciaNombre' => $this->upperUtf8((string) ($fila['dependencia_nombre'] ?? '—')),
            'delegadoNombre' => $this->upperUtf8($delegadoNombre),
            'lineas' => $lineas,
            'totalPiezas' => $totalPiezas,
            'generadoEn' => now()->timezone(config('app.timezone', 'America/Mexico_City'))->format('d/m/Y H:i'),
        ];
    }

    private function upperUtf8(string $value): string
    {
        if (function_exists('mb_strtoupper')) {
            return mb_strtoupper($value, 'UTF-8');
        }

        return strtoupper($value);
    }

    private function generarFolio(Empleado $empleado): string
    {
        $base = strtoupper(preg_replace('/\s+/', '', (string) $empleado->delegacion_codigo)) ?: 'SIVSO';
        $sufijo = $empleado->nue !== null && $empleado->nue !== ''
            ? preg_replace('/\D/', '', (string) $empleado->nue) ?: (string) $empleado->id
            : (string) $empleado->id;

        return $base.'-'.$sufijo;
    }

    /**
     * @param  array<string, mixed>  $fila
     * @return list<array{no: int, descripcion: string, talla: string, cantidad: int}>
     */
    private function lineasParaTabla(array $fila): array
    {
        $vestuario = $fila['vestuario'] ?? [];
        if (! is_array($vestuario)) {
            return [];
        }

        $out = [];
        $n = 1;
        foreach ($vestuario as $row) {
            if (! is_array($row)) {
                continue;
            }
            $estado = $row['estado'] ?? '';
            if (! in_array($estado, ['confirmado', 'cambio'], true)) {
                continue;
            }
            $prenda = (string) ($row['prenda'] ?? '');
            $clave = isset($row['clave']) ? (string) $row['clave'] : '';
            $descripcion = $prenda;
            if ($clave !== '') {
                $descripcion .= ' · CÓDIGO '.$clave;
            }
            $talla = trim((string) ($row['talla'] ?? ''));
            $medida = trim((string) ($row['medida'] ?? ''));
            if ($medida !== '') {
                $talla .= ($talla !== '' ? ' · ' : '').$medida;
            }
            if ($talla === '') {
                $talla = '—';
            }
            $cant = (int) ($row['cantidad'] ?? 1);
            if ($cant < 1) {
                $cant = 1;
            }
            $out[] = [
                'no' => $n,
                'descripcion' => $descripcion,
                'talla' => $talla,
                'cantidad' => $cant,
            ];
            $n++;
        }

        return $out;
    }

    /**
     * PNG en alta resolución en disco; el PDF lo muestra pequeño para caber en cabecera y conserva nitidez al ampliar/zoom.
     */
    private function logoDataUri(): ?string
    {
        $path = public_path('images/stpeidceo-logo.png');
        if (! is_file($path) || ! is_readable($path)) {
            return null;
        }

        $raw = @file_get_contents($path);
        if ($raw === false || $raw === '') {
            return null;
        }

        return 'data:image/png;base64,'.base64_encode($raw);
    }

    private function qrDataUri(string $data): string
    {
        $builder = new Builder(
            writer: new PngWriter,
            writerOptions: [],
            validateResult: false,
            data: $data,
            encoding: new Encoding('UTF-8'),
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: 132,
            margin: 2,
            roundBlockSizeMode: RoundBlockSizeMode::Margin,
        );

        return $builder->build()->getDataUri();
    }
}
