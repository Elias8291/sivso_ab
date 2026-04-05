import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

/** Solo conecta si VITE_REVERB_ENABLED=true y hay clave (requiere `php artisan reverb:start`). */
const reverbEnabled =
    import.meta.env.VITE_REVERB_ENABLED === 'true' && Boolean(import.meta.env.VITE_REVERB_APP_KEY);

let echo = null;

if (reverbEnabled) {
    window.Pusher = Pusher;
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
}

export default echo;
