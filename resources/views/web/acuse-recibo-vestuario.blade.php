@php
    /** @var array<string, mixed> $data */
    $folio = $data['folio'] ?? '—';
    $licitacion = $data['licitacion'] ?? '—';
    $codigoDelegacion = $data['codigoDelegacion'] ?? '';
    $anioTitulo = $data['anioTitulo'] ?? date('Y');
    $anioEjercicioDatos = $data['anioEjercicioDatos'] ?? date('Y');
    $nombreEmpleado = $data['nombreEmpleado'] ?? '—';
    $nue = $data['nue'] ?? '—';
    $dependenciaNombre = $data['dependenciaNombre'] ?? '—';
    $delegadoNombre = $data['delegadoNombre'] ?? '—';
    $lineas = is_array($data['lineas'] ?? null) ? $data['lineas'] : [];
    $totalPiezas = (int) ($data['totalPiezas'] ?? 0);
    $generadoEn = $data['generadoEn'] ?? '';
@endphp
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <meta name="googlebot" content="noindex, nofollow, noarchive, nosnippet">
    <title>Acuse de recibo — {{ $folio }}</title>
    <style>
        :root {
            color-scheme: light;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 13px;
            line-height: 1.08;
            color: #111;
            background: #f4f4f5;
            padding: 16px 12px 48px;
        }
        .wrap {
            max-width: 720px;
            margin: 0 auto;
            background: #fff;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            padding: 20px 18px 24px;
            box-shadow: 0 1px 3px rgba(0,0,0,.06);
        }
        .toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e4e4e7;
        }
        .toolbar p {
            margin: 0;
            font-size: 11px;
            color: #52525b;
            max-width: 100%;
        }
        .btn-print {
            appearance: none;
            border: 1px solid #d4d4d8;
            background: #fafafa;
            color: #18181b;
            padding: 8px 14px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-print:hover { background: #f4f4f5; }
        .aviso {
            text-align: center;
            font-size: 10px;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: 0.02em;
        }
        .header-row { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .header-row td { vertical-align: top; padding: 0; }
        .logo-cell { width: 18%; padding-right: 8px !important; }
        .logo-inst {
            display: block;
            max-width: 56px;
            width: 100%;
            height: auto;
        }
        .titulo-inst { text-align: center; font-size: 11px; font-weight: 700; line-height: 1.05; }
        .titulo-doc {
            text-align: center;
            font-size: 15px;
            font-weight: 700;
            margin-top: 4px;
            line-height: 1.08;
        }
        .subtitulo { text-align: center; font-size: 11px; margin-top: 4px; line-height: 1.06; color: #3f3f46; }
        .folio-line { text-align: center; font-size: 12px; font-weight: 700; margin-top: 8px; }
        .qr { text-align: right; width: 18%; }
        .qr img { width: 88px; height: 88px; display: inline-block; }
        .datos { margin: 12px 0 8px; }
        .datos table { width: 100%; border-collapse: collapse; }
        .datos td { padding: 3px 0; vertical-align: top; line-height: 1.08; font-size: 12px; }
        .lbl { font-weight: 700; width: 32%; font-size: 11px; color: #52525b; }
        table.grid {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            font-size: 11px;
        }
        table.grid th, table.grid td {
            border: 1px solid #000;
            padding: 3px 4px;
            line-height: 1.05;
        }
        table.grid th {
            background: #f4f4f5;
            font-weight: 700;
            text-align: center;
            font-size: 10px;
        }
        .c-no { width: 6%; text-align: center; }
        .c-desc { text-align: left; }
        .c-talla { width: 14%; text-align: center; }
        .c-cant { width: 10%; text-align: center; }
        .total-row td {
            border: 1px solid #000;
            font-weight: 700;
            text-align: right;
            font-size: 11px;
        }
        .footer-meta { margin-top: 10px; font-size: 11px; color: #52525b; }
        .firmas { margin-top: 32px; width: 100%; border-collapse: collapse; }
        .firmas td { width: 50%; text-align: center; vertical-align: top; padding: 0 10px; }
        .linea-firma {
            border-top: 1px solid #000;
            margin: 0 8px 4px;
            padding-top: 6px;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.08;
        }
        .rol-firma { font-size: 10px; margin-top: 2px; color: #52525b; }
        .pie-gen { margin-top: 16px; font-size: 10px; color: #71717a; text-align: right; }
        .seguridad {
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1px dashed #e4e4e7;
            font-size: 10px;
            color: #71717a;
            line-height: 1.25;
        }
        @media print {
            body { background: #fff; padding: 0; }
            .wrap { border: none; box-shadow: none; border-radius: 0; max-width: none; }
            .toolbar, .seguridad { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="wrap">
        <div class="toolbar">
            <p>Constancia digital. El PDF impreso debe coincidir con esta versión si se generó el mismo día de registro.</p>
            <button type="button" id="acuse-print-btn" class="btn-print">Imprimir / PDF</button>
        </div>

        <p class="aviso">NO SE RECIBIRÁ ESTE FORMATO SI PRESENTA TACHADURAS O ENMENDADURAS.</p>

        <table class="header-row">
            <tr>
                <td class="logo-cell">
                    @if(file_exists(public_path('images/stpeidceo-logo.png')))
                        <img src="{{ asset('images/stpeidceo-logo.png') }}" alt="STPEIDCEO" class="logo-inst" width="112" height="auto">
                    @endif
                </td>
                <td style="width:64%;">
                    <div class="titulo-inst">SECRETARÍA DE PREVISIÓN SOCIAL</div>
                    <div class="titulo-doc">ACUSE DE RECIBO DE VESTUARIO, CALZADO Y ACCESORIOS DE VESTUARIO {{ $anioTitulo }}</div>
                    <div class="subtitulo">LICITACIÓN: {{ $licitacion }}</div>
                    @if($codigoDelegacion !== '')
                        <div class="subtitulo">{{ $codigoDelegacion }}</div>
                    @endif
                    <div class="folio-line">Folio {{ $folio }}</div>
                </td>
                <td class="qr">
                    @if(!empty($data['qrDataUri']))
                        <img src="{{ $data['qrDataUri'] }}" alt="QR — abrir esta constancia" width="88" height="88">
                    @endif
                </td>
            </tr>
        </table>

        <div class="datos">
            <table>
                <tr>
                    <td class="lbl">NOMBRE</td>
                    <td>{{ $nombreEmpleado }}</td>
                </tr>
                <tr>
                    <td class="lbl">NUE</td>
                    <td>{{ $nue }}</td>
                </tr>
                <tr>
                    <td class="lbl">SECRETARÍA / DEPENDENCIA</td>
                    <td>{{ $dependenciaNombre }}</td>
                </tr>
            </table>
        </div>

        <table class="grid">
            <thead>
                <tr>
                    <th class="c-no">NO.</th>
                    <th class="c-desc">DESCRIPCIÓN</th>
                    <th class="c-talla">TALLA</th>
                    <th class="c-cant">CANT.</th>
                </tr>
            </thead>
            <tbody>
                @forelse($lineas as $row)
                    <tr>
                        <td class="c-no">{{ $row['no'] ?? '' }}</td>
                        <td class="c-desc">{{ $row['descripcion'] ?? '' }}</td>
                        <td class="c-talla">{{ $row['talla'] ?? '' }}</td>
                        <td class="c-cant">{{ $row['cantidad'] ?? '' }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" style="text-align:center;">Sin partidas.</td>
                    </tr>
                @endforelse
            </tbody>
            @if(count($lineas) > 0)
                <tfoot>
                    <tr class="total-row">
                        <td colspan="3">Total (piezas)</td>
                        <td class="c-cant" style="text-align:center;">{{ $totalPiezas }}</td>
                    </tr>
                </tfoot>
            @endif
        </table>

        <p class="footer-meta">Ejercicio de los datos: {{ $anioEjercicioDatos }}</p>

        <table class="firmas">
            <tr>
                <td>
                    <div class="linea-firma">{{ $nombreEmpleado }}</div>
                    <div class="rol-firma">RECIBÍ DE CONFORMIDAD</div>
                </td>
                <td>
                    <div class="linea-firma">{{ $delegadoNombre }}</div>
                    <div class="rol-firma">DELEGADO(A)</div>
                </td>
            </tr>
        </table>

        <p class="pie-gen">Generado: {{ $generadoEn }}</p>

        <div class="seguridad">
            <strong>Protección del enlace:</strong> URL firmada con caducidad, identificador único en servidor y registro de consultas.
            No comparta este enlace fuera del uso institucional previsto.
        </div>
    </div>
    <script src="{{ asset('js/acuse-print.js') }}" defer></script>
</body>
</html>
