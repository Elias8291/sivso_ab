/**
 * Intervalo del sondeo HTTP cuando no hay WebSocket (ms).
 * Opcional: VITE_POLL_INTERVAL_MS (mínimo 2000 para no saturar el servidor).
 */
export function getPollIntervalMs() {
    const n = Number(import.meta.env.VITE_POLL_INTERVAL_MS);
    if (Number.isFinite(n) && n >= 2000) {
        return n;
    }
    return 5000;
}

/** Respaldo con WebSocket activo: si hay varios admins, la lista puede quedar desactualizada hasta el próximo sondeo. */
export const POLL_BACKUP_WHEN_WS_MS = 25_000;
