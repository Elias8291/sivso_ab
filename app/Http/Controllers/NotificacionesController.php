<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class NotificacionesController extends Controller
{
    private const PER_PAGE = 20;

    private const BELL_UNREAD_LIMIT = 15;

    /**
     * JSON para campana / polling (misma forma que comparte HandleInertiaRequests).
     */
    public function unreadPoll(): JsonResponse
    {
        $user = Auth::user();

        $items = $user
            ->unreadNotifications()
            ->latest()
            ->limit(self::BELL_UNREAD_LIMIT)
            ->get()
            ->map(fn (DatabaseNotification $n): array => $this->mapBellItem($n))
            ->values()
            ->all();

        return response()->json([
            'data' => $items,
            'message' => '',
            'errors' => null,
        ]);
    }

    public function index(Request $request): Response
    {
        $filtro = $request->input('filtro', 'no_leidas'); // no_leidas | todas
        $user = Auth::user();

        $query = $filtro === 'todas'
            ? $user->notifications()
            : $user->unreadNotifications();

        $notificaciones = $query
            ->latest()
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn ($n) => [
                'id' => $n->id,
                'tipo' => $n->data['tipo'] ?? null,
                'titulo' => $n->data['titulo'] ?? '',
                'cuerpo' => $n->data['cuerpo'] ?? '',
                'url' => $n->data['url'] ?? null,
                'decision' => $n->data['decision'] ?? null,
                'tipo_sol' => $n->data['tipo_sol'] ?? null,
                'leida' => $n->read_at !== null,
                'created_at' => $n->created_at->diffForHumans(),
                'created_at_full' => $n->created_at->format('d/m/Y H:i'),
            ]);

        return Inertia::render('Notificaciones/Index', [
            'notificaciones' => $notificaciones,
            'totales' => [
                'no_leidas' => $user->unreadNotifications()->count(),
                'todas' => $user->notifications()->count(),
            ],
            'filters' => $request->only(['filtro']),
        ]);
    }

    public function leer(string $id): JsonResponse
    {
        $n = Auth::user()->notifications()->findOrFail($id);
        $n->markAsRead();

        return response()->json(['ok' => true]);
    }

    public function leerTodas(): JsonResponse
    {
        Auth::user()->unreadNotifications->markAsRead();

        return response()->json(['ok' => true]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapBellItem(DatabaseNotification $n): array
    {
        return [
            'id' => $n->id,
            'tipo' => $n->data['tipo'] ?? null,
            'titulo' => $n->data['titulo'] ?? '',
            'cuerpo' => $n->data['cuerpo'] ?? '',
            'url' => $n->data['url'] ?? null,
            'decision' => $n->data['decision'] ?? null,
            'tipo_sol' => $n->data['tipo_sol'] ?? null,
            'created_at' => $n->created_at->diffForHumans(),
        ];
    }
}
