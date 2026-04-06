<?php

declare(strict_types=1);

namespace App\Services\Delegado;

use App\Models\Empleado;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Encoding\Encoding;
use Endroid\QrCode\ErrorCorrectionLevel;
use Endroid\QrCode\RoundBlockSizeMode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\URL;

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
        $folio = $this->generarFolio($empleado);
        $licitacion = (string) config('services.sivso.acuse_licitacion', 'LPN-SA-SA-0036-08/'.$anioTitulo);

        $verifyUrl = URL::temporarySignedRoute(
            'acuse-vestuario.verificar',
            now()->addYears(3),
            ['empleado' => $empleado->id, 'folio' => $folio],
        );

        $qrDataUri = $this->qrDataUri($verifyUrl);

        $lineas = $this->lineasParaTabla($fila);
        $totalPiezas = array_sum(array_column($lineas, 'cantidad'));

        $dependenciaNombre = strtoupper((string) ($fila['dependencia_nombre'] ?? '—'));
        $nombreEmpleado = strtoupper((string) ($fila['nombre_completo'] ?? '—'));
        $nue = (string) ($empleado->nue ?? '—');
        $codigoDelegacion = strtoupper((string) ($empleado->delegacion_codigo ?? ''));

        $pdf = Pdf::loadView('pdf.acuse-recibo-vestuario', [
            'folio' => $folio,
            'licitacion' => $licitacion,
            'codigoDelegacion' => $codigoDelegacion,
            'anioTitulo' => $anioTitulo,
            'anioEjercicioDatos' => $anioEjercicioDatos,
            'nombreEmpleado' => $nombreEmpleado,
            'nue' => $nue,
            'dependenciaNombre' => $dependenciaNombre,
            'delegadoNombre' => strtoupper($delegadoNombre),
            'lineas' => $lineas,
            'totalPiezas' => $totalPiezas,
            'qrDataUri' => $qrDataUri,
            'generadoEn' => now()->timezone(config('app.timezone', 'America/Mexico_City'))->format('d/m/Y H:i'),
        ]);

        $pdf->setPaper('letter', 'portrait');
        $pdf->setOption('defaultFont', 'DejaVu Sans');

        $filename = 'acuse-vestuario-'.$empleado->id.'-'.preg_replace('/[^A-Za-z0-9_-]+/', '_', $folio).'.pdf';

        return $pdf->stream($filename);
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
