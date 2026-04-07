<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Events\SivsoNotificacion;
use App\Http\Controllers\Controller;
use App\Models\PeriodoVestuario;
use App\Models\User;
use App\Notifications\PeriodoCambioNotification;
use App\Notifications\PeriodoCreacionNotification;
use App\Support\SivsoPermissions;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PeriodoController extends Controller
{
    public function index(Request $request): Response
    {
        $periodos = PeriodoVestuario::query()
            ->orderByDesc('anio')
            ->get()
            ->map(fn ($p) => [
                'id'           => $p->id,
                'anio'         => $p->anio,
                'nombre'       => $p->nombre,
                'fecha_inicio' => $p->fecha_inicio?->format('Y-m-d'),
                'fecha_fin'    => $p->fecha_fin?->format('Y-m-d'),
                'estado'       => $p->estado,
                'descripcion'  => $p->descripcion,
            ]);

        return Inertia::render('Admin/Periodos/Index', [
            'periodos' => $periodos,
            'filters'  => $request->only(['search']),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'anio'         => ['required', 'integer', 'min:2020', 'max:2099', 'unique:periodo_vestuario,anio'],
            'nombre'       => ['required', 'string', 'max:120'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin'    => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'descripcion'  => ['nullable', 'string', 'max:500'],
        ]);

        $periodo = PeriodoVestuario::create([...$data, 'estado' => 'proximo']);

        // Notificar a todos los usuarios con rol Delegado sobre el nuevo período
        $delegados = User::role(SivsoPermissions::ROLE_DELEGADO)->get();
        $notification = new PeriodoCreacionNotification($periodo);
        foreach ($delegados as $user) {
            $user->notify($notification);
            $payload = array_merge($notification->toArray($user), [
                'id' => $user->notifications()->latest()->first()?->id,
            ]);
            broadcast(new SivsoNotificacion($payload, $user->id));
        }

        return response()->json([
            'data'    => $this->formatPeriodo($periodo),
            'message' => 'Período creado. Delegados notificados.',
            'errors'  => null,
        ], 201);
    }

    public function update(Request $request, PeriodoVestuario $periodo): JsonResponse
    {
        $data = $request->validate([
            'nombre'       => ['required', 'string', 'max:120'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin'    => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'descripcion'  => ['nullable', 'string', 'max:500'],
        ]);

        $periodo->update($data);

        return response()->json([
            'data'    => $this->formatPeriodo($periodo->fresh()),
            'message' => 'Período actualizado.',
            'errors'  => null,
        ]);
    }

    public function destroy(PeriodoVestuario $periodo): JsonResponse
    {
        abort_if($periodo->estado === 'abierto', 422, 'No se puede eliminar un período abierto.');
        $periodo->delete();

        return response()->json([
            'data'    => null,
            'message' => 'Período eliminado.',
            'errors'  => null,
        ]);
    }

    /**
     * Abre o cierra un período y notifica a todos los delegados.
     */
    public function toggle(PeriodoVestuario $periodo): JsonResponse
    {
        if ($periodo->estado === 'abierto') {
            // Cerrar
            $periodo->update(['estado' => 'cerrado']);
            $accion = 'cerrado';
        } else {
            // Abrir: cerrar cualquier otro primero
            PeriodoVestuario::where('estado', 'abierto')->update(['estado' => 'cerrado']);
            $periodo->update(['estado' => 'abierto']);
            $accion = 'abierto';
        }

        // Notificar a todos los usuarios con rol Delegado
        $delegados = User::role(SivsoPermissions::ROLE_DELEGADO)->get();
        foreach ($delegados as $user) {
            $user->notify(new PeriodoCambioNotification($periodo, $accion));
        }

        return response()->json([
            'data'    => $this->formatPeriodo($periodo->fresh()),
            'message' => $accion === 'abierto' ? 'Período abierto. Delegados notificados.' : 'Período cerrado. Delegados notificados.',
            'errors'  => null,
        ]);
    }

    private function formatPeriodo(PeriodoVestuario $p): array
    {
        return [
            'id'           => $p->id,
            'anio'         => $p->anio,
            'nombre'       => $p->nombre,
            'fecha_inicio' => $p->fecha_inicio?->format('Y-m-d'),
            'fecha_fin'    => $p->fecha_fin?->format('Y-m-d'),
            'estado'       => $p->estado,
            'descripcion'  => $p->descripcion,
        ];
    }
}
