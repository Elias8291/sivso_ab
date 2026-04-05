import echo, { isWebsocketRealtimeEnabled } from '@/echo';
import { getPollIntervalMs } from '@/lib/realtimePoll';
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

/* ── configuración visual por tipo de notificación ──────────────── */

function notifCfg(tipo, decision, tipoSol) {
        if (tipo === 'solicitud_resuelta') {
            return decision === 'aprobada'
                ? {
                      iconBg:  'bg-emerald-50 dark:bg-emerald-950/30',
                      iconClr: 'text-emerald-600 dark:text-emerald-400',
                      dot:     'bg-emerald-500',
                      icon:    <CheckCircle2 className="size-4" strokeWidth={1.8} />,
                  }
            : {
                  iconBg:  'bg-rose-50 dark:bg-rose-950/30',
                  iconClr: 'text-rose-500 dark:text-rose-400',
                  dot:     'bg-rose-500',
                  icon:    <XCircle className="size-4" strokeWidth={1.8} />,
              };
    }
        return tipoSol === 'cambio'
            ? {
                  iconBg:  'bg-slate-50 dark:bg-slate-950/30',
                  iconClr: 'text-slate-500 dark:text-slate-400',
                  dot:     'bg-slate-400',
                  icon:    <ArrowLeftRight className="size-4" strokeWidth={1.8} />,
              }
        : {
              iconBg:  'bg-rose-50 dark:bg-rose-950/30',
              iconClr: 'text-rose-500 dark:text-rose-400',
              dot:     'bg-rose-500',
              icon:    <XCircle className="size-4" strokeWidth={1.8} />,
          };
}

/** Inertia a veces entrega colecciones Laravel como objeto `{0:…}`; siempre trabajar como array. */
function coerceNotifBellList(value) {
    let raw;
    if (Array.isArray(value)) raw = value;
    else if (value != null && typeof value === 'object') raw = Object.values(value);
    else raw = [];

    return raw.filter(
        (n) => n != null && typeof n === 'object' && n.id != null && String(n.id).length > 0,
    );
}

/* ── fila de notificación ────────────────────────────────────────── */

function NotifRow({ notif, onRead }) {
    const cfg = notifCfg(notif.tipo, notif.decision, notif.tipo_sol);

    const handleClick = async () => {
        await onRead(notif.id);
        if (notif.url) router.visit(notif.url);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
        >
            {/* avatar coloreado */}
            <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconClr}`}>
                {cfg.icon}
            </span>

            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                    <span className="block truncate text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-100">
                        {notif.titulo}
                    </span>
                    {/* punto "no leída" */}
                    <span className={`size-1.5 shrink-0 rounded-full ${cfg.dot}`} />
                </span>
                <span className="mt-0.5 block text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {notif.cuerpo}
                </span>
                <span className="mt-1 block text-[10px] font-medium text-zinc-400 dark:text-zinc-500">
                    {notif.created_at}
                </span>
            </span>
        </button>
    );
}

/* ── campana principal ───────────────────────────────────────────── */

export default function NotificationBell() {
    const { auth, notificaciones = [] } = usePage().props;
    const [open, setOpen]               = useState(false);
    const [items, setItems]             = useState(() => coerceNotifBellList(notificaciones));
    const [isNew, setIsNew]             = useState(false);   // pulso al llegar nueva
    const panelRef                      = useRef(null);
    const userId                        = auth?.user?.id;

    /* sincronizar al navegar con Inertia */
    useEffect(() => {
        setItems(coerceNotifBellList(notificaciones));
    }, [notificaciones]);

    /* ── WebSocket: canal privado del usuario ───────────────────── */
    useEffect(() => {
        if (!userId || !echo) return;
        const channel = echo.private(`App.Models.User.${userId}`);

        channel.listen('.sivso.notificacion', (payload) => {
            const nueva = {
                id:         payload.id          ?? crypto.randomUUID(),
                tipo:       payload.tipo        ?? null,
                titulo:     payload.titulo      ?? '',
                cuerpo:     payload.cuerpo      ?? '',
                url:        payload.url         ?? null,
                decision:   payload.decision    ?? null,
                tipo_sol:   payload.tipo_sol    ?? null,
                created_at: 'Ahora mismo',
            };
            setItems((prev) => [nueva, ...coerceNotifBellList(prev)]);
            setIsNew(true);
            setTimeout(() => setIsNew(false), 2500);
        });

        return () => {
            echo.leave(`App.Models.User.${userId}`);
        };
    }, [userId]);

    /* ── Polling HTTP si no hay WebSocket (Pusher/Reverb) ─ */
    useEffect(() => {
        if (!userId || isWebsocketRealtimeEnabled) return;

        const fetchUnread = async () => {
            if (document.visibilityState === 'hidden') return;
            try {
                const { data } = await axios.get(route('notificaciones.unread-poll'));
                const list = coerceNotifBellList(Array.isArray(data?.data) ? data.data : []);
                setItems((prev) => {
                    const prevList = coerceNotifBellList(prev);
                    const prevIds = new Set(prevList.map((n) => n.id));
                    const hasNew = list.some((n) => n.id != null && !prevIds.has(n.id));
                    if (hasNew) {
                        queueMicrotask(() => {
                            setIsNew(true);
                            setTimeout(() => setIsNew(false), 2500);
                        });
                    }
                    return list;
                });
            } catch {
                /* red intermitente: siguiente intervalo */
            }
        };

        const interval = setInterval(fetchUnread, getPollIntervalMs());
        void fetchUnread();

        return () => clearInterval(interval);
    }, [userId]);

    /* cerrar al click fuera */
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const markOne = useCallback(async (id) => {
        try {
            await axios.post(route('notificaciones.leer', id));
            setItems((prev) => coerceNotifBellList(prev).filter((n) => n.id !== id));
        } catch { /* sin acción crítica */ }
    }, []);

    const markAll = useCallback(async () => {
        try {
            await axios.post(route('notificaciones.leer-todas'));
            setItems([]);
        } catch { /* sin acción crítica */ }
    }, []);

    const count = items.length;

    const bellBtnClasses = (isActive) =>
        `relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border transition ${
            isActive
                ? 'border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100'
                : 'border-zinc-200/90 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900'
        }`;

    const badge =
        count > 0 ? (
            <span
                className={`absolute right-1.5 top-1.5 flex size-[18px] items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-zinc-950 ${isNew ? 'animate-ping-once' : ''}`}
            >
                {count > 9 ? '9+' : count}
            </span>
        ) : null;

    return (
        <>
            <Link
                href={route('notificaciones.index')}
                className={`${bellBtnClasses(false)} lg:hidden`}
                aria-label="Ir a notificaciones"
            >
                <Bell className={`size-5 transition-transform duration-200 ${isNew ? 'animate-[wiggle_0.4s_ease-in-out_2]' : ''}`} />
                {badge}
            </Link>

            <div className="relative hidden lg:block" ref={panelRef}>
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className={bellBtnClasses(open)}
                    aria-label="Notificaciones"
                    aria-expanded={open}
                >
                    <Bell className={`size-5 transition-transform duration-200 ${isNew ? 'animate-[wiggle_0.4s_ease-in-out_2]' : ''}`} />
                    {badge}
                </button>

            <style>{`
                @keyframes wiggle {
                    0%,100%{ transform:rotate(0deg); }
                    25%    { transform:rotate(-15deg); }
                    75%    { transform:rotate(15deg); }
                }
                @keyframes notifPanelIn {
                    from { opacity:0; transform:scale(.96) translateY(-8px); }
                    to   { opacity:1; transform:scale(1)   translateY(0);    }
                }
            `}</style>

            {/* ── panel dropdown ────────────────────────────────── */}
            {open && (
                <div
                    className="absolute right-0 top-full z-50 mt-2.5 w-[360px] overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-2xl shadow-zinc-900/10 dark:border-zinc-700/60 dark:bg-zinc-900"
                    style={{ animation: 'notifPanelIn 0.15s cubic-bezier(.16,1,.3,1)' }}
                >
                    {/* encabezado */}
                    <div className="flex items-center justify-between px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                                <Bell className="size-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={2} />
                            </div>
                            <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-100">
                                Notificaciones
                            </span>
                            {count > 0 && (
                                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                                    {count} nueva{count !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {count > 0 && (
                            <button
                                type="button"
                                onClick={markAll}
                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                            >
                                <CheckCheck className="size-3.5" /> Leer todas
                            </button>
                        )}
                    </div>

                    <div className="mx-5 h-px bg-zinc-100 dark:bg-zinc-800" />

                    {/* lista */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/60">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center gap-3 py-12">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800">
                                    <BellOff className="size-6 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} />
                                </div>
                                <div className="text-center">
                                    <p className="text-[13px] font-semibold text-zinc-600 dark:text-zinc-400">Todo al día</p>
                                    <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                                        No tienes notificaciones pendientes
                                    </p>
                                </div>
                            </div>
                        ) : (
                            items.map((n) => (
                                <NotifRow key={n.id} notif={n} onRead={markOne} />
                            ))
                        )}
                    </div>

                    {/* footer — link al módulo completo */}
                    <div className="mx-5 h-px bg-zinc-100 dark:bg-zinc-800" />
                    <div className="px-5 py-3">
                        <Link
                            href={route('notificaciones.index')}
                            onClick={() => setOpen(false)}
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                        >
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
