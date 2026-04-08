<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Lista de empleados</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #18181b; }
        h1 { margin: 0 0 6px; font-size: 16px; }
        .meta { margin: 0 0 12px; color: #52525b; font-size: 10px; }
        .header-row { width: 100%; margin-bottom: 6px; border-collapse: collapse; }
        .header-row td { vertical-align: top; padding: 0; }
        .logo-cell { width: 16%; text-align: left; padding-right: 4px !important; }
        .logo-inst { display: block; width: 44px; height: auto; max-height: 96px; }
        .center-col { width: 84%; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d4d4d8; padding: 6px; vertical-align: top; }
        th { background: #f4f4f5; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
        .num { text-align: right; }
        .mono { font-family: DejaVu Sans Mono, monospace; }
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
                <h1>Lista de empleados</h1>
            </td>
        </tr>
    </table>
    <p class="meta">
        Delegado: {{ strtoupper((string) $delegadoNombre) }} |
        Generado: {{ $generadoEn }}
    </p>

    <table>
        <thead>
            <tr>
                <th class="num">No.</th>
                <th>Nombre</th>
                <th>NUE</th>
            </tr>
        </thead>
        <tbody>
            @foreach($filas as $row)
                <tr>
                    <td class="num">{{ $row['no'] }}</td>
                    <td>{{ $row['nombre'] }}</td>
                    <td class="mono">{{ $row['nue'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
