<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class NotificacionesController extends Controller
{
    private const PER_PAGE = 20;

    private const BELL_UNREAD_LIMIT = 15;

    /**
     * SSE (Server-Sent Events): el navegador abre la URL y espera datos.
     * Este endpoint responde de inmediato con las notificaciones no leídas
     * y cierra la conexión. El header `retry:` indica al navegador cuánto
     * esperar antes de reconectar (por defecto 3 s).
     *
     * Ventajas en hosting compartido (Hostinger):
     *  - Cada request dura < 100 ms (solo una query, sin sleep).
     *  - No mantiene procesos PHP abiertos.
     *  - El navegador maneja la reconexión automáticamente.
     */
    public function stream(): StreamedResponse
    {
        $user  = Auth::user();
        $items = $user
            ->unreadNotifications()
            ->latest()
            ->limit(self::BELL_UNREAD_LIMIT)
            ->get()
            ->map(fn (DatabaseNotification $n): array => $this->mapBellItem($n))
            ->values()
            ->all();

        $payload = json_encode(['items' => $items], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

        return response()->stream(static function () use ($payload): void {
            // retry: le dice al navegador "reconecta en 3 000 ms si la conexión cae"
            echo "retry: 3000\n";
            echo "data: {$payload}\n\n";
            if (ob_get_level() > 0) {
                ob_flush();
            }
            flush();
        }, 200, [
            'Content-Type'      => 'text/event-stream; charset=utf-8',
            'Cache-Control'     => 'no-cache, no-store, must-revalidate',
            'X-Accel-Buffering' => 'no', // desactiva buffer de Nginx/Hostinger
        ]);
    }

    public function index(Request $request): Response
    {
        $filtro = $request->input('filtro', 'no_leidas');
        $user   = Auth::user();

        $query = $filtro === 'todas'
            ? $user->notifications()
            : $user->unreadNotifications();

        $notificaciones = $query
            ->latest()
            ->paginate(self::PER_PAGE)
            ->withQueryString()
            ->through(fn ($n) => [
                'id'              => $n->id,
                'tipo'            => $n->data['tipo']     ?? null,
                'titulo'          => $n->data['titulo']   ?? '',
                'cuerpo'          => $n->data['cuerpo']   ?? '',
                'url'             => $n->data['url']      ?? null,
                'decision'        => $n->data['decision'] ?? null,
                'tipo_sol'        => $n->data['tipo_sol'] ?? null,
                'leida'           => $n->read_at !== null,
                'created_at'      => $n->created_at->diffForHumans(),
                'created_at_full' => $n->created_at->format('d/m/Y H:i'),
            ]);

        return Inertia::render('Notificaciones/Index', [
            'notificaciones' => $notificaciones,
            'totales'        => [
                'no_leidas' => $user->unreadNotifications()->count(),
                'todas'     => $user->notifications()->count(),
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
            'id'        => $n->id,
            'tipo'      => $n->data['tipo']     ?? null,
            'titulo'    => $n->data['titulo']   ?? '',
            'cuerpo'    => $n->data['cuerpo']   ?? '',
            'url'       => $n->data['url']      ?? null,
            'decision'  => $n->data['decision'] ?? null,
            'tipo_sol'  => $n->data['tipo_sol'] ?? null,
            'created_at'=> $n->created_at->diffForHumans(),
        ];
    }
}
