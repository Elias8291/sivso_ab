<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acuse general de vestuario</title>
    <style>
        @page { margin: 11mm 12mm; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 8pt;
            color: #111;
            line-height: 1.08;
        }
        .aviso {
            text-align: center;
            font-size: 6.5pt;
            font-weight: bold;
            margin-bottom: 5px;
            letter-spacing: 0.02em;
            line-height: 1.1;
        }
        .header-row { width: 100%; margin-bottom: 6px; border-collapse: collapse; }
        .header-row td { vertical-align: top; padding: 0; }
        .logo-cell { width: 16%; text-align: left; padding-right: 4px !important; }
        .logo-inst { display: block; width: 44px; height: auto; max-height: 96px; }
        .titulo-inst { text-align: center; font-size: 7pt; font-weight: bold; line-height: 1.05; }
        .titulo-doc { text-align: center; font-size: 9.5pt; font-weight: bold; margin-top: 2px; line-height: 1.08; }
        .subtitulo { text-align: center; font-size: 7pt; margin-top: 2px; line-height: 1.06; }
        .folio-line { text-align: center; font-size: 7.5pt; font-weight: bold; margin-top: 5px; line-height: 1.08; }
        .center-col { width: 67%; }
        .qr { text-align: right; width: 17%; }
        .qr img { width: 76px; height: 76px; }
        .datos { margin: 8px 0 5px; }
        .datos table { width: 100%; border-collapse: collapse; }
        .datos td { padding: 2px 0; vertical-align: top; line-height: 1.08; border: 0; }
        .lbl { font-weight: bold; width: 30%; font-size: 7pt; line-height: 1.08; }
        .val { font-size: 7.5pt; line-height: 1.08; }
        table.grid { width: 100%; border-collapse: collapse; margin-top: 4px; }
        table.grid th, table.grid td { border: 1px solid #000; padding: 2px 3px; font-size: 6.5pt; line-height: 1.05; }
        table.grid th { background: #f3f3f3; font-weight: bold; text-align: center; }
        .c-no { width: 5%; text-align: center; }
        .c-desc { width: 64%; text-align: left; }
        .c-talla { width: 13%; text-align: center; }
        .c-cant { width: 9%; text-align: center; }
        .total-row td { border: 1px solid #000; font-weight: bold; text-align: right; font-size: 6.5pt; padding: 2px 4px; line-height: 1.05; }
        .footer-meta { margin-top: 8px; font-size: 7pt; line-height: 1.1; }
        .firmas { margin-top: 28px; width: 100%; }
        .firmas td { width: 50%; text-align: center; vertical-align: top; padding: 0 8px; border: 0; }
        .linea-firma { border-top: 1px solid #000; margin: 0 6px 4px; padding-top: 3px; font-size: 7pt; font-weight: bold; line-height: 1.08; }
        .rol-firma { font-size: 6.5pt; margin-top: 1px; line-height: 1.08; }
        .pie-gen { margin-top: 6px; font-size: 6pt; color: #555; text-align: right; line-height: 1.1; }
        .acuse-block { page-break-after: always; }
        .acuse-block:last-child { page-break-after: auto; }
    </style>
</head>
<body>
    @foreach($acuses as $acuse)
        <div class="acuse-block">
            <p class="aviso">NO SE RECIBIRÁ ESTE FORMATO SI PRESENTA TACHADURAS O ENMENDADURAS.</p>

            <table class="header-row">
                <tr>
                    <td class="logo-cell">
                        @if(!empty($logoDataUri))
                            <img src="{{ $logoDataUri }}" alt="STPEIDCEO" class="logo-inst">
                        @endif
                    </td>
                    <td class="center-col">
                        <div class="titulo-inst">SECRETARIA DE PREVISION SOCIAL</div>
                        <div class="titulo-doc">ACUSE DE RECIBO DE VESTUARIO, CALZADO Y ACCESORIOS DE VESTUARIO {{ $acuse['anioTitulo'] }}</div>
                        <div class="subtitulo">LICITACIÓN: {{ $acuse['licitacion'] }}</div>
                        @if(($acuse['codigoDelegacion'] ?? '') !== '')
                            <div class="subtitulo">{{ $acuse['codigoDelegacion'] }}</div>
                        @endif
                        <div class="folio-line">Folio {{ $acuse['folio'] }}</div>
                    </td>
                    <td class="qr">
                        @if(!empty($acuse['qrDataUri']))
                            <img src="{{ $acuse['qrDataUri'] }}" alt="QR verificacion">
                        @endif
                    </td>
                </tr>
            </table>

            <div class="datos">
                <table>
                    <tr>
                        <td class="lbl">NOMBRE</td>
                        <td class="val">{{ $acuse['nombreEmpleado'] }}</td>
                    </tr>
                    <tr>
                        <td class="lbl">NUE</td>
                        <td class="val">{{ $acuse['nue'] }}</td>
                    </tr>
                    <tr>
                        <td class="lbl">SECRETARIA / DEPENDENCIA</td>
                        <td class="val">{{ $acuse['dependenciaNombre'] }}</td>
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
                    @foreach($acuse['lineas'] as $row)
                        <tr>
                            <td class="c-no">{{ $row['no'] }}</td>
                            <td class="c-desc">{{ $row['descripcion'] }}</td>
                            <td class="c-talla">{{ $row['talla'] }}</td>
                            <td class="c-cant">{{ $row['cantidad'] }}</td>
                        </tr>
                    @endforeach
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="3">Total (piezas)</td>
                        <td class="c-cant" style="text-align:center;">{{ $acuse['totalPiezas'] }}</td>
                    </tr>
                </tfoot>
            </table>

            <p class="footer-meta">Ejercicio de los datos: {{ $acuse['anioEjercicioDatos'] }}</p>

            <table class="firmas">
                <tr>
                    <td>
                        <div class="linea-firma">{{ $acuse['nombreEmpleado'] }}</div>
                        <div class="rol-firma">RECIBÍ DE CONFORMIDAD</div>
                    </td>
                    <td>
                        <div class="linea-firma">{{ $acuse['delegadoNombre'] }}</div>
                        <div class="rol-firma">DELEGADO(A)</div>
                    </td>
                </tr>
            </table>

            <p class="pie-gen">Generado: {{ $generadoEn }}</p>
        </div>
    @endforeach
</body>
</html>
