<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Lista de empleados — vestuario {{ $anioTitulo ?? '' }}</title>
    <style>
        @page { margin: 11mm 12mm; }
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 8pt;
            color: #111;
            line-height: 1.08;
        }
        .header-row { width: 100%; margin-bottom: 8px; border-collapse: collapse; }
        .header-row td { vertical-align: top; padding: 0; }
        .logo-cell { width: 16%; text-align: left; padding-right: 4px !important; }
        .logo-inst { display: block; width: 44px; height: auto; max-height: 96px; }
        .titulo-inst { text-align: center; font-size: 7pt; font-weight: bold; line-height: 1.05; }
        .titulo-doc { text-align: center; font-size: 9.5pt; font-weight: bold; margin-top: 2px; line-height: 1.08; }
        .subtitulo { text-align: center; font-size: 7pt; margin-top: 2px; line-height: 1.06; }
        .folio-line { text-align: center; font-size: 7.5pt; font-weight: bold; margin-top: 5px; line-height: 1.08; }
        .center-col { width: 67%; }
        .qr { text-align: right; width: 17%; }
        .meta-block { margin: 8px 0 6px; font-size: 7pt; line-height: 1.15; }
        .meta-block table { width: 100%; border-collapse: collapse; }
        .meta-block td { padding: 2px 0; vertical-align: top; border: 0; }
        .lbl { font-weight: bold; width: 28%; font-size: 7pt; }
        .val { font-size: 7.5pt; }
        table.grid { width: 100%; border-collapse: collapse; margin-top: 4px; }
        table.grid th, table.grid td { border: 1px solid #000; padding: 2px 3px; font-size: 6.5pt; line-height: 1.05; }
        table.grid th { background: #f3f3f3; font-weight: bold; text-align: center; }
        .c-no { width: 8%; text-align: center; }
        .c-nom { width: 62%; text-align: left; }
        .c-nue { width: 30%; text-align: left; }
        .mono { font-family: DejaVu Sans Mono, monospace; font-size: 6.5pt; }
    </style>
</head>
<body>
    <table class="header-row">
        <tr>
            <td class="logo-cell">
                @if(!empty($logoDataUri))
                    <img src="{{ $logoDataUri }}" alt="STPEIDCEO" class="logo-inst">
                @endif
            </td>
            <td class="center-col">
                <div class="titulo-inst">SECRETARIA DE PREVISION SOCIAL</div>
                <div class="titulo-doc">LISTA DE EMPLEADOS — VESTUARIO {{ $anioTitulo }}</div>
                @if(($codigoDelegacion ?? '') !== '')
                    <div class="subtitulo">{{ $codigoDelegacion }}</div>
                @endif
                <div class="folio-line">SIVSO · Listado nominal</div>
            </td>
            <td class="qr"></td>
        </tr>
    </table>

    <div class="meta-block">
        <table>
            <tr>
                <td class="lbl">DELEGADO(A)</td>
                <td class="val">{{ strtoupper((string) $delegadoNombre) }}</td>
            </tr>
        </table>
    </div>

    <table class="grid">
        <thead>
            <tr>
                <th class="c-no">NO.</th>
                <th class="c-nom">NOMBRE COMPLETO</th>
                <th class="c-nue">NUE</th>
            </tr>
        </thead>
        <tbody>
            @foreach($filas as $row)
                <tr>
                    <td class="c-no">{{ $row['no'] }}</td>
                    <td class="c-nom">{{ $row['nombre'] }}</td>
                    <td class="c-nue mono">{{ $row['nue'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
