import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

/** Reverb local / VPS con proceso `reverb:start`. */
export const isReverbRealtimeEnabled =
    import.meta.env.VITE_REVERB_ENABLED === 'true' && Boolean(import.meta.env.VITE_REVERB_APP_KEY);

/** Pusher (recomendado en hosting compartido: sin proceso WebSocket en tu servidor). */
const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY ?? '';
export const isPusherRealtimeEnabled = Boolean(pusherKey);

export const isWebsocketRealtimeEnabled = isReverbRealtimeEnabled || isPusherRealtimeEnabled;

window.Pusher = Pusher;

let echo = null;

if (isReverbRealtimeEnabled) {
    echo = new Echo({
        broadcaster: 'reverb',
        key: import.meta.env.VITE_REVERB_APP_KEY,
        wsHost: import.meta.env.VITE_REVERB_HOST ?? 'localhost',
        wsPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        wssPort: Number(import.meta.env.VITE_REVERB_PORT ?? 8080),
        scheme: import.meta.env.VITE_REVERB_SCHEME ?? 'http',
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        disableStats: true,
    });
} else if (isPusherRealtimeEnabled) {
    echo = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
        forceTLS: true,
        encrypted: true,
        authEndpoint: '/broadcasting/auth',
        auth: {
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                Accept: 'application/json',
            },
        },
        withCredentials: true,
    });
}

export default echo;
