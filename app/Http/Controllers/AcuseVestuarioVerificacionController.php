<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Empleado;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class AcuseVestuarioVerificacionController extends Controller
{
    public function __invoke(Request $request): View
    {
        $empleadoId = (int) $request->query('empleado', 0);
        $folio = (string) $request->query('folio', '');

        $empleado = Empleado::query()->find($empleadoId);
        abort_if($empleado === null, 404);

        return view('acuse-vestuario.verificado', [
            'folio' => $folio,
            'empleado' => $empleado,
        ]);
    }
}
