<!doctype html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Acuse general de vestuario</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #18181b; }
        h1 { margin: 0 0 6px; font-size: 16px; }
        .meta { margin: 0 0 12px; color: #52525b; font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #d4d4d8; padding: 6px; vertical-align: top; }
        th { background: #f4f4f5; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
        .num { text-align: right; }
        .mono { font-family: DejaVu Sans Mono, monospace; }
    </style>
</head>
<body>
    <h1>Acuse general de vestuario</h1>
    <p class="meta">
        Delegado: {{ strtoupper((string) $delegadoNombre) }} |
        Ejercicio: {{ $anio }} |
        Generado: {{ $generadoEn }}
    </p>

    <table>
        <thead>
            <tr>
                <th>NUE</th>
                <th>Empleado</th>
                <th>Dependencia</th>
                <th>Delegación</th>
                <th class="num">Confirmadas</th>
                <th class="num">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($filas as $row)
                <tr>
                    <td class="mono">{{ $row['nue'] }}</td>
                    <td>{{ $row['nombre_completo'] }}</td>
                    <td>{{ $row['dependencia_nombre'] }}</td>
                    <td class="mono">{{ $row['delegacion_codigo'] }}</td>
                    <td class="num">{{ $row['confirmadas'] }}</td>
                    <td class="num">{{ $row['total_prendas'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
