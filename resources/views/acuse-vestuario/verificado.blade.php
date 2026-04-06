<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Verificación de acuse — SIVSO</title>
    <style>
        body { font-family: system-ui, sans-serif; max-width: 520px; margin: 48px auto; padding: 0 20px; color: #111; }
        h1 { font-size: 1.25rem; }
        .ok { color: #166534; }
        dl { margin-top: 1.5rem; }
        dt { font-size: 0.75rem; text-transform: uppercase; color: #666; margin-top: 0.75rem; }
        dd { margin: 0.25rem 0 0; font-weight: 600; }
    </style>
</head>
<body>
    <h1 class="ok">Constancia de referencia</h1>
    <p>Este enlace forma parte del acuse de recibo de vestuario generado en el sistema SIVSO.</p>
    <dl>
        <dt>Folio</dt>
        <dd>{{ $folio !== '' ? $folio : '—' }}</dd>
        <dt>Empleado</dt>
        <dd>{{ strtoupper(trim($empleado->apellido_paterno.' '.$empleado->apellido_materno.' '.$empleado->nombre)) }}</dd>
        <dt>NUE</dt>
        <dd>{{ $empleado->nue ?? '—' }}</dd>
        <dt>Delegación</dt>
        <dd>{{ $empleado->delegacion_codigo ?? '—' }}</dd>
    </dl>
    <p style="margin-top:2rem;font-size:0.8rem;color:#666;">La validez formal del documento impreso corresponde al formato firmado y a los registros del sistema.</p>
</body>
</html>
