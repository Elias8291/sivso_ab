<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Vestuario {{ $anio }} — {{ $delegaciones }}</title>
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
        .header-row {
            width: 100%;
            margin-bottom: 6px;
            border-collapse: collapse;
        }
        .header-row td { vertical-align: top; padding: 0; }
        .logo-cell {
            width: 16%;
            text-align: left;
            padding-right: 4px !important;
        }
        .logo-inst {
            display: block;
            width: 44px;
            height: auto;
            max-height: 96px;
        }
        .titulo-inst {
            text-align: center;
            font-size: 7pt;
            font-weight: bold;
            line-height: 1.05;
        }
        .titulo-doc {
            text-align: center;
            font-size: 9.5pt;
            font-weight: bold;
            margin-top: 2px;
            line-height: 1.08;
        }
        .subtitulo {
            text-align: center;
            font-size: 7pt;
            margin-top: 2px;
            line-height: 1.06;
        }
        .delegado-line {
            text-align: center;
            font-size: 7.5pt;
            font-weight: bold;
            margin-top: 5px;
            line-height: 1.08;
        }
        /* separator between employees */
        .empleado-block {
            margin-top: 10px;
            page-break-inside: avoid;
        }
        .empleado-header {
            background: #f3f3f3;
            border: 1px solid #ccc;
            padding: 3px 5px;
            margin-bottom: 0;
        }
        .empleado-nombre {
            font-size: 8pt;
            font-weight: bold;
            line-height: 1.1;
        }
        .empleado-meta {
            font-size: 6.5pt;
            color: #444;
            line-height: 1.1;
        }
        table.grid {
            width: 100%;
            border-collapse: collapse;
        }
        table.grid th, table.grid td {
            border: 1px solid #000;
            padding: 2px 3px;
            font-size: 6.5pt;
            line-height: 1.05;
        }
        table.grid th {
            background: #e8e8e8;
            font-weight: bold;
            text-align: center;
            padding: 2px 3px;
        }
        .c-no     { width: 5%;  text-align: center; }
        .c-desc   { width: 62%; text-align: left; }
        .c-talla  { width: 14%; text-align: center; }
        .c-est    { width: 10%; text-align: center; }
        .c-cant   { width: 9%;  text-align: center; }
        .sin-prendas {
            text-align: center;
            font-size: 6.5pt;
            font-style: italic;
            color: #888;
            padding: 3px;
            border: 1px solid #ccc;
        }
        .pie-gen {
            margin-top: 6px;
            font-size: 6pt;
            color: #555;
            text-align: right;
            line-height: 1.1;
        }
    </style>
</head>
<body>
    <p class="aviso">REPORTE INTERNO — NO SE RECIBIRÁ ESTE FORMATO SI PRESENTA TACHADURAS O ENMENDADURAS.</p>

    <table class="header-row">
        <tr>
            <td class="logo-cell">
                @if(!empty($logoDataUri))
                    <img src="{{ $logoDataUri }}" alt="STPEIDCEO" class="logo-inst">
                @endif
            </td>
            <td style="width:100%">
                <div class="titulo-inst">SECRETARÍA DE PREVISIÓN SOCIAL</div>
                <div class="titulo-doc">REPORTE GENERAL DE VESTUARIO, CALZADO Y ACCESORIOS {{ $anio }}</div>
                <div class="subtitulo">LICITACIÓN: {{ $licitacion }}</div>
                <div class="subtitulo">DELEGACIÓN(ES): {{ $delegaciones }}</div>
                <div class="delegado-line">DELEGADO(A): {{ $delegadoNombre }}</div>
            </td>
        </tr>
    </table>

    @foreach($empleados as $emp)
        <div class="empleado-block">
            <div class="empleado-header">
                <div class="empleado-nombre">{{ $emp['nombre_completo'] }}</div>
                <div class="empleado-meta">
                    NUE: {{ $emp['nue'] }}
                    &nbsp;·&nbsp;
                    {{ $emp['dependencia_nombre'] }}
                    &nbsp;·&nbsp;
                    DEL: {{ $emp['delegacion_codigo'] }}
                </div>
            </div>

            @php
                $prendas = collect($emp['vestuario']);
                $n = 1;
            @endphp

            @if($prendas->isEmpty())
                <p class="sin-prendas">Sin prendas asignadas.</p>
            @else
                <table class="grid">
                    <thead>
                        <tr>
                            <th class="c-no">NO.</th>
                            <th class="c-desc">DESCRIPCIÓN</th>
                            <th class="c-talla">TALLA</th>
                            <th class="c-est">ESTADO</th>
                            <th class="c-cant">CANT.</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($prendas as $row)
                            @php
                                $clave = isset($row['clave']) && $row['clave'] !== '' ? ' · CÓDIGO '.$row['clave'] : '';
                                $talla = trim((string)($row['talla'] ?? ''));
                                if ($talla === '') { $talla = '—'; }
                            @endphp
                            <tr>
                                <td class="c-no">{{ $n++ }}</td>
                                <td class="c-desc">{{ $row['prenda'] }}{{ $clave }}</td>
                                <td class="c-talla">{{ $talla }}</td>
                                <td class="c-est">{{ strtoupper($row['estado'] ?? 'pendiente') }}</td>
                                <td class="c-cant">{{ $row['cantidad'] }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    @endforeach

    <p class="pie-gen">Generado: {{ $generadoEn }} · Ejercicio {{ $anio }}</p>
</body>
</html>
