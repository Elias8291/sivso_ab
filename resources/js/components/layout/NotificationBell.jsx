import echo from '@/echo';
import { Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeftRight,
    Bell,
    BellOff,
    CheckCheck,
    CheckCircle2,
    ExternalLink,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';

/* ───────────────────────────────────────────────────────────────────
 * Intervalo de reintento para el fallback de sondeo HTTP
 * (solo activo si el navegador no soporta EventSource).
 * ─────────────────────────────────────────────────────────────────── */
const POLL_FALLBACK_MS = (() => {
    const n = Number(import.meta.env.VITE_POLL_INTERVAL_MS);
    return Number.isFinite(n) && n >= 2000 ? n : 5000;
})();

/* ───────────────────────────────────────────────────────────────────
 * Extrae un array de notificaciones desde cualquier forma que llegue.
 * ─────────────────────────────────────────────────────────────────── */
function toNotifArray(value) {
    const raw = Array.isArray(value)
        ? value
        : Array.isArray(value?.items)
            ? value.items
            : Array.isArray(value?.data)
                ? value.data
                : [];

    return raw.filter((n) => n && typeof n === 'object' && n.id);
}

/* ───────────────────────────────────────────────────────────────────
 * Configuración visual por tipo de notificación
 * ─────────────────────────────────────────────────────────────────── */
function notifCfg(tipo, decision, tipoSol) {
    if (tipo === 'solicitud_resuelta') {
        return decision === 'aprobada'
            ? { iconBg: 'bg-zinc-100 dark:bg-zinc-800/70', iconClr: 'text-zinc-600 dark:text-zinc-300', dot: 'bg-brand-gold dark:bg-brand-gold-soft', icon: <CheckCircle2 className="size-4" strokeWidth={1.8} /> }
            : { iconBg: 'bg-zinc-100 dark:bg-zinc-800/70', iconClr: 'text-zinc-500 dark:text-zinc-300', dot: 'bg-zinc-400 dark:bg-zinc-500', icon: <XCircle className="size-4" strokeWidth={1.8} /> };
    }
    return tipoSol === 'cambio'
        ? { iconBg: 'bg-zinc-100 dark:bg-zinc-800/70', iconClr: 'text-zinc-500 dark:text-zinc-300', dot: 'bg-zinc-400 dark:bg-zinc-500', icon: <ArrowLeftRight className="size-4" strokeWidth={1.8} /> }
        : { iconBg: 'bg-zinc-100 dark:bg-zinc-800/70', iconClr: 'text-zinc-500 dark:text-zinc-300', dot: 'bg-zinc-400 dark:bg-zinc-500', icon: <XCircle className="size-4" strokeWidth={1.8} /> };
}

/* ───────────────────────────────────────────────────────────────────
 * Fila de notificación
 * ─────────────────────────────────────────────────────────────────── */
function NotifRow({ notif, onRead }) {
    const cfg = notifCfg(notif.tipo, notif.decision, notif.tipo_sol);
    return (
        <button
            type="button"
            onClick={async () => {
                await onRead(notif.id);           // espera a quitar del estado y hacer POST
                if (notif.url) router.visit(notif.url);
            }}
            className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
            <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconClr}`}>
                {cfg.icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                    <span className="block truncate text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-100">{notif.titulo}</span>
                    <span className={`size-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">{notif.cuerpo}</span>
                <span className="mt-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-500">{notif.created_at}</span>
            </span>
        </button>
    );
}

/* ───────────────────────────────────────────────────────────────────
 * Campana de notificaciones
 * ─────────────────────────────────────────────────────────────────── */
export default function NotificationBell() {
    const { auth } = usePage().props;
    const userId   = auth?.user?.id;

    const [items, setItems] = useState([]);
    const [isNew, setIsNew] = useState(false);
    const [open,  setOpen]  = useState(false);
    const panelRef          = useRef(null);
    /** IDs que el usuario ya descartó pero cuyo POST de "leer" aún no completó. */
    const pendingRead       = useRef(new Set());

    /* ── carga inicial y actualizaciones desde Inertia ─────────────── */
    const propsNotif = usePage().props.notificaciones;
    useEffect(() => {
        const next = toNotifArray(propsNotif);
        setItems((prev) => {
            const prevIds = new Set(prev.map((n) => n.id));
            if (next.some((n) => !prevIds.has(n.id))) {
                setIsNew(true);
                setTimeout(() => setIsNew(false), 2500);
            }
            return next;
        });
    }, [propsNotif]);

    /* ── aplica lista del servidor; descarta ítems ya marcados como leídos ── */
    const applyList = useCallback((newList) => {
        setItems((prev) => {
            // No re-agregar ítems que el usuario acaba de descartar mientras el POST viaja
            const filtered = newList.filter((n) => !pendingRead.current.has(n.id));
            const prevIds  = new Set(prev.map((n) => n.id));
            if (filtered.some((n) => !prevIds.has(n.id))) {
                queueMicrotask(() => {
                    setIsNew(true);
                    setTimeout(() => setIsNew(false), 2500);
                });
            }
            return filtered;
        });
    }, []);

    /* ──────────────────────────────────────────────────────────────────
     * SSE (Server-Sent Events): el cliente abre una conexión GET y el
     * servidor envía la lista actual y cierra. El header `retry:3000`
     * indica al navegador que reconecte en 3 segundos.
     * Resultado: lista actualizada cada ~3 s, sin procesos largos en el
     * servidor, compatible con Hostinger y cualquier hosting compartido.
     *
     * Fallback: si el navegador no soporta EventSource (prácticamente
     * inexistente en 2025), se usa sondeo HTTP con setInterval.
     * ─────────────────────────────────────────────────────────────────── */
    useEffect(() => {
        if (!userId) return;

        let es   = null;
        let poll = null;

        const handleMessage = (event) => {
            try {
                const parsed  = JSON.parse(event.data);
                const list    = toNotifArray(parsed);
                applyList(list);
            } catch { /* JSON inválido, ignorar */ }
        };

        if (typeof EventSource !== 'undefined') {
            /* ─── Modo SSE ─── */
            const url = route('notificaciones.stream');
            const connect = () => {
                es = new EventSource(url, { withCredentials: true });
                es.onmessage = handleMessage;
                es.onerror   = () => {
                    /* El navegador reconecta automáticamente gracias a `retry:`.
                     * Si el error es permanente, EventSource se cierra solo. */
                };
            };
            connect();
        } else {
            /* ─── Modo fallback (polling clásico) ─── */
            const fetchUnread = async () => {
                if (document.hidden) return;
                try {
                    const res  = await axios.get(route('notificaciones.stream'));
                    const list = toNotifArray(res.data);
                    applyList(list);
                } catch { /* red intermitente */ }
            };
            void fetchUnread();
            poll = setInterval(fetchUnread, POLL_FALLBACK_MS);
        }

        return () => {
            es?.close();
            if (poll) clearInterval(poll);
        };
    }, [userId, applyList]);

    /* ── WebSocket (Pusher / Reverb) — prepend instantáneo opcional ── */
    useEffect(() => {
        if (!userId || !echo) return;

        const channel = echo.private(`App.Models.User.${userId}`);

        channel.listen('.sivso.notificacion', (payload) => {
            const nueva = {
                id:        String(payload.id ?? crypto.randomUUID()),
                tipo:      payload.tipo     ?? null,
                titulo:    payload.titulo   ?? '',
                cuerpo:    payload.cuerpo   ?? '',
                url:       payload.url      ?? null,
                decision:  payload.decision ?? null,
                tipo_sol:  payload.tipo_sol ?? null,
                created_at:'Ahora mismo',
            };
            setItems((prev) => {
                if (prev.some((n) => n.id === nueva.id)) return prev;
                return [nueva, ...prev];
            });
            setIsNew(true);
            setTimeout(() => setIsNew(false), 2500);
        });

        return () => echo.leave(`App.Models.User.${userId}`);
    }, [userId]);

    /* ── cierra panel al hacer click fuera ─────────────────────────── */
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    /* ── acciones ───────────────────────────────────────────────────── */
    const markOne = useCallback(async (id) => {
        // Optimista: quitar de la UI inmediatamente y proteger del SSE
        pendingRead.current.add(id);
        setItems((prev) => prev.filter((n) => n.id !== id));
        try {
            await axios.post(route('notificaciones.leer', id));
        } finally {
            pendingRead.current.delete(id);
        }
    }, []);

    const markAll = useCallback(async () => {
        // Optimista: vaciar inmediatamente
        const ids = items.map((n) => n.id);
        ids.forEach((id) => pendingRead.current.add(id));
        setItems([]);
        try {
            await axios.post(route('notificaciones.leer-todas'));
        } finally {
            ids.forEach((id) => pendingRead.current.delete(id));
        }
    }, [items]);

    /* ── render ─────────────────────────────────────────────────────── */
    const count = items.length;

    const bellCls = (active) =>
        `relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition ${
            active
                ? 'border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
                : 'border-zinc-200/90 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900'
        }`;

    const badge = count > 0 ? (
        <span className={`absolute right-1.5 top-1.5 flex size-[18px] items-center justify-center rounded-full bg-zinc-700 text-[9px] font-bold text-white ring-2 ring-white dark:bg-zinc-300 dark:text-zinc-900 dark:ring-zinc-950 ${isNew ? 'animate-ping-once' : ''}`}>
            {count > 9 ? '9+' : count}
        </span>
    ) : null;

    const bellIcon = (
        <Bell className={`size-5 transition-transform duration-200 ${isNew ? 'animate-[wiggle_0.4s_ease-in-out_2]' : ''}`} />
    );

    return (
        <>
            {/* Móvil: enlace directo a la página */}
            <Link href={route('notificaciones.index')} className={`${bellCls(false)} lg:hidden`} aria-label="Ir a notificaciones">
                {bellIcon}{badge}
            </Link>

            {/* Desktop: dropdown */}
            <div className="relative hidden lg:block" ref={panelRef}>
                <style>{`
                    @keyframes wiggle{0%,100%{transform:rotate(0)}25%{transform:rotate(-15deg)}75%{transform:rotate(15deg)}}
                    @keyframes notifIn{from{opacity:0;transform:scale(.96) translateY(-8px)}to{opacity:1;transform:scale(1) translateY(0)}}
                `}</style>

                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className={bellCls(open)}
                    aria-label="Notificaciones"
                    aria-expanded={open}
                >
                    {bellIcon}{badge}
                </button>

                {open && (
                    <div
                        className="absolute right-0 top-full z-50 mt-2.5 w-[360px] overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-2xl dark:border-zinc-700/60 dark:bg-zinc-900"
                        style={{ animation: 'notifIn 0.15s cubic-bezier(.16,1,.3,1)' }}
                    >
                        {/* cabecera */}
                        <div className="flex items-center justify-between px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                    <Bell className="size-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
                                </div>
                                <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">Notificaciones</span>
                                {count > 0 && (
                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                                        {count} nueva{count !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            {count > 0 && (
                                <button type="button" onClick={markAll}
                                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800">
                                    <CheckCheck className="size-3.5" /> Leer todas
                                </button>
                            )}
                        </div>

                        <div className="mx-5 h-px bg-zinc-100 dark:bg-zinc-800" />

                        {/* lista */}
                        <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/60">
                            {count === 0 ? (
                                <div className="flex flex-col items-center gap-3 py-12">
                                    <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800">
                                        <BellOff className="size-6 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">Todo al día</p>
                                        <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">No tienes notificaciones pendientes</p>
                                    </div>
                                </div>
                            ) : (
                                items.map((n) => <NotifRow key={n.id} notif={n} onRead={markOne} />)
                            )}
                        </div>

                        <div className="mx-5 h-px bg-zinc-100 dark:bg-zinc-800" />
                        <div className="px-5 py-3">
                            <Link href={route('notificaciones.index')} onClick={() => setOpen(false)}
                                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60">
                                <ExternalLink className="size-3.5" />
                                Ver centro de notificaciones
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
