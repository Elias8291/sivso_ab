<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acuse de recibo — {{ $folio }}</title>
    <style>
        @page { margin: 14mm 16mm; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 9pt;
            color: #111;
            line-height: 1.25;
        }
        .aviso {
            text-align: center;
            font-size: 7.5pt;
            font-weight: bold;
            margin-bottom: 8px;
            letter-spacing: 0.02em;
        }
        .header-row {
            width: 100%;
            margin-bottom: 10px;
        }
        .header-row td { vertical-align: top; }
        .titulo-inst {
            text-align: center;
            font-size: 8pt;
            font-weight: bold;
        }
        .titulo-doc {
            text-align: center;
            font-size: 11pt;
            font-weight: bold;
            margin-top: 4px;
        }
        .subtitulo {
            text-align: center;
            font-size: 8.5pt;
            margin-top: 3px;
        }
        .folio-line {
            text-align: center;
            font-size: 9pt;
            font-weight: bold;
            margin-top: 8px;
        }
        .qr {
            text-align: right;
        }
        .qr img { width: 92px; height: 92px; }
        .datos { margin: 12px 0 10px; }
        .datos table { width: 100%; border-collapse: collapse; }
        .datos td { padding: 4px 0; vertical-align: top; }
        .lbl { font-weight: bold; width: 28%; font-size: 8.5pt; }
        .val { font-size: 9pt; }
        table.grid {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
        }
        table.grid th, table.grid td {
            border: 1px solid #000;
            padding: 4px 5px;
            font-size: 8pt;
        }
        table.grid th {
            background: #f3f3f3;
            font-weight: bold;
            text-align: center;
        }
        .c-no { width: 6%; text-align: center; }
        .c-desc { width: 62%; text-align: left; }
        .c-talla { width: 14%; text-align: center; }
        .c-cant { width: 10%; text-align: center; }
        .total-row td {
            border: 1px solid #000;
            font-weight: bold;
            text-align: right;
            padding: 5px 8px;
        }
        .footer-meta {
            margin-top: 14px;
            font-size: 8pt;
        }
        .firmas {
            margin-top: 36px;
            width: 100%;
        }
        .firmas td {
            width: 50%;
            text-align: center;
            vertical-align: top;
            padding: 0 12px;
        }
        .linea-firma {
            border-top: 1px solid #000;
            margin: 0 8px 6px;
            padding-top: 4px;
            font-size: 8.5pt;
            font-weight: bold;
        }
        .rol-firma {
            font-size: 7.5pt;
            margin-top: 2px;
        }
        .pie-gen {
            margin-top: 10px;
            font-size: 7pt;
            color: #555;
            text-align: right;
        }
    </style>
</head>
<body>
    <p class="aviso">NO SE RECIBIRÁ ESTE FORMATO SI PRESENTA TACHADURAS O ENMENDADURAS.</p>

    <table class="header-row">
        <tr>
            <td style="width:22%;"></td>
            <td style="width:56%;">
                <div class="titulo-inst">SECRETARÍA DE PREVISIÓN SOCIAL</div>
                <div class="titulo-doc">ACUSE DE RECIBO DE VESTUARIO, CALZADO Y ACCESORIOS DE VESTUARIO {{ $anioTitulo }}</div>
                <div class="subtitulo">LICITACIÓN: {{ $licitacion }}</div>
                @if($codigoDelegacion !== '')
                    <div class="subtitulo">{{ $codigoDelegacion }}</div>
                @endif
                <div class="folio-line">Folio {{ $folio }}</div>
            </td>
            <td class="qr" style="width:22%;">
                <img src="{{ $qrDataUri }}" alt="QR verificación">
            </td>
        </tr>
    </table>

    <div class="datos">
        <table>
            <tr>
                <td class="lbl">NOMBRE</td>
                <td class="val">{{ $nombreEmpleado }}</td>
            </tr>
            <tr>
                <td class="lbl">NUE</td>
                <td class="val">{{ $nue }}</td>
            </tr>
            <tr>
                <td class="lbl">SECRETARÍA / DEPENDENCIA</td>
                <td class="val">{{ $dependenciaNombre }}</td>
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
                    <td class="c-no">{{ $row['no'] }}</td>
                    <td class="c-desc">{{ $row['descripcion'] }}</td>
                    <td class="c-talla">{{ $row['talla'] }}</td>
                    <td class="c-cant">{{ $row['cantidad'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="4" style="text-align:center;">Sin partidas confirmadas.</td>
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
</body>
</html>
