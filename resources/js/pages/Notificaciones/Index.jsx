import TablePagination from '@/components/admin/TablePagination';
import echo, { isWebsocketRealtimeEnabled } from '@/echo';
import { getPollIntervalMs } from '@/lib/realtimePoll';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeftRight,
    Bell,
    BellOff,
    CheckCheck,
    CheckCircle2,
    Clock,
    Inbox,
    Lock,
    Unlock,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { route } from 'ziggy-js';

/* ── configuración visual ────────────────────────────────────────── */

function cfg(tipo, decision, tipoSol) {
    if (tipo === 'solicitud_resuelta') {
        return decision === 'aprobada'
            ? {
                  iconBg:  'bg-emerald-50 dark:bg-emerald-950/30',
                  iconClr: 'text-emerald-600 dark:text-emerald-400',
                  ring:    'ring-emerald-200/40 dark:ring-emerald-800/20',
                  dot:     'bg-emerald-500',
                  icon:    <CheckCircle2 className="size-5" strokeWidth={1.8} />,
                  label:   'Aprobada',
                  labelCls:'bg-emerald-50 text-emerald-700 ring-emerald-200/40 dark:bg-emerald-950/20 dark:text-emerald-400',
              }
            : {
                  iconBg:  'bg-rose-50 dark:bg-rose-950/30',
                  iconClr: 'text-rose-600 dark:text-rose-400',
                  ring:    'ring-rose-200/40 dark:ring-rose-800/20',
                  dot:     'bg-rose-500',
                  icon:    <XCircle className="size-5" strokeWidth={1.8} />,
                  label:   'Rechazada',
                  labelCls:'bg-rose-50 text-rose-600 ring-rose-200/40 dark:bg-rose-950/20 dark:text-rose-400',
              };
    }
    if (tipo === 'periodo_abierto') {
        return {
            iconBg:  'bg-emerald-50 dark:bg-emerald-950/30',
            iconClr: 'text-emerald-600 dark:text-emerald-400',
            ring:    'ring-emerald-200/40 dark:ring-emerald-800/20',
            dot:     'bg-emerald-500',
            icon:    <Unlock className="size-5" strokeWidth={1.8} />,
            label:   'Período abierto',
            labelCls:'bg-emerald-50 text-emerald-700 ring-emerald-200/40 dark:bg-emerald-950/20 dark:text-emerald-400',
        };
    }
    if (tipo === 'periodo_cerrado') {
        return {
            iconBg:  'bg-zinc-100 dark:bg-zinc-800/60',
            iconClr: 'text-zinc-500 dark:text-zinc-400',
            ring:    'ring-zinc-200/40 dark:ring-zinc-700/30',
            dot:     'bg-zinc-400',
            icon:    <Lock className="size-5" strokeWidth={1.8} />,
            label:   'Período cerrado',
            labelCls:'bg-zinc-100 text-zinc-600 ring-zinc-200/40 dark:bg-zinc-800 dark:text-zinc-400',
        };
    }
    return tipoSol === 'cambio'
        ? {
              iconBg:  'bg-slate-50 dark:bg-slate-950/30',
              iconClr: 'text-slate-500 dark:text-slate-400',
              ring:    'ring-slate-200/40 dark:ring-slate-800/20',
              dot:     'bg-slate-400',
              icon:    <ArrowLeftRight className="size-5" strokeWidth={1.8} />,
              label:   'Cambio',
              labelCls:'bg-slate-50 text-slate-600 ring-slate-200/40 dark:bg-slate-950/20 dark:text-slate-400',
          }
        : {
              iconBg:  'bg-rose-50 dark:bg-rose-950/30',
              iconClr: 'text-rose-600 dark:text-rose-400',
              ring:    'ring-rose-200/40 dark:ring-rose-800/20',
              dot:     'bg-rose-500',
              icon:    <XCircle className="size-5" strokeWidth={1.8} />,
              label:   'Baja',
              labelCls:'bg-rose-50 text-rose-600 ring-rose-200/40 dark:bg-rose-950/20 dark:text-rose-400',
          };
}

/* ── pestañas ────────────────────────────────────────────────────── */

const TABS = [
    { key: 'no_leidas', label: 'No leídas', icon: <Bell className="size-3.5" strokeWidth={2} /> },
    { key: 'todas',     label: 'Todas',     icon: <Inbox className="size-3.5" strokeWidth={2} /> },
];

/* ── tarjeta de notificación ─────────────────────────────────────── */

function TarjetaNotificacion({ notif, onLeer }) {
    const c = cfg(notif.tipo, notif.decision, notif.tipo_sol);

    const handleClick = async () => {
        if (!notif.leida) await onLeer(notif.id);
        if (notif.url) router.visit(notif.url);
    };

    return (
        <div
            className={`overflow-hidden rounded-2xl ring-1 transition-all duration-200 ${
                notif.leida
                    ? `bg-white/60 ${c.ring} dark:bg-zinc-900/40`
                    : `bg-white shadow-sm ${c.ring} dark:bg-zinc-900`
            }`}
        >
            <div className="flex items-start gap-4 px-5 py-4">

                {/* avatar */}
                <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg} ${c.iconClr}`}>
                    {c.icon}
                </div>

                {/* contenido */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-[13px] font-bold ${notif.leida ? 'text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            {notif.titulo}
                        </span>

                        {/* badge tipo */}
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${c.labelCls}`}>
                            {c.icon && <span className="size-2.5 [&>svg]:size-2.5">{c.icon}</span>}
                            {c.label}
                        </span>

                        {/* badge no leída */}
                        {!notif.leida && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-900 px-2 py-0.5 text-[9px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                                <span className={`size-1.5 rounded-full ${c.dot}`} /> Nueva
                            </span>
                        )}
                    </div>

                    <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        {notif.cuerpo}
                    </p>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[10.5px] text-zinc-400 dark:text-zinc-500">
                        <Clock className="size-3" strokeWidth={1.5} />
                        <span>{notif.created_at_full}</span>
                        <span className="text-zinc-300 dark:text-zinc-700">·</span>
                        <span className="italic">{notif.created_at}</span>
                    </div>
                </div>

                {/* acciones */}
                <div className="flex shrink-0 items-center gap-2">
                    {!notif.leida && (
                        <button
                            type="button"
                            onClick={() => onLeer(notif.id)}
                            className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            title="Marcar como leída"
                        >
                            <CheckCheck className="size-3.5" /> Leída
                        </button>
                    )}
                    {notif.url && (
                        <button
                            type="button"
                            onClick={handleClick}
                            className="rounded-xl bg-zinc-900 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            Ver
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── estado vacío ────────────────────────────────────────────────── */

function EmptyState({ filtro }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl bg-white/60 py-20 ring-1 ring-zinc-900/5 dark:bg-zinc-900/40 dark:ring-white/5">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-800">
                <BellOff className="size-7 text-zinc-300 dark:text-zinc-600" strokeWidth={1.4} />
            </div>
            <div className="text-center">
                <p className="text-[14px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {filtro === 'no_leidas' ? 'Todo al día' : 'Sin notificaciones'}
                </p>
                <p className="mt-1 text-[12px] text-zinc-400 dark:text-zinc-500">
                    {filtro === 'no_leidas'
                        ? 'No tienes notificaciones pendientes de leer.'
                        : 'Todavía no hay notificaciones en el historial.'}
                </p>
            </div>
        </div>
    );
}

/* ── página principal ────────────────────────────────────────────── */

const NOTIFICACIONES_INDEX_POLL_MS = 12_000;

function NotificacionesIndex({ notificaciones, totales = {}, filters = {} }) {
    const { auth } = usePage().props;
    const [filtro, setFiltro] = useState(filters.filtro ?? 'no_leidas');
    const [items, setItems]  = useState(notificaciones.data);

    useEffect(() => {
        setItems(notificaciones.data);
    }, [notificaciones]);

    useEffect(() => {
        if (!auth?.user) return;

        const reloadList = () => {
            if (document.visibilityState === 'hidden') return;
            router.reload({
                only: ['notificaciones', 'totales'],
                preserveScroll: true,
            });
        };

        if (isWebsocketRealtimeEnabled && echo) {
            const channel = echo.private(`App.Models.User.${auth.user.id}`);
            const handler = () => reloadList();
            channel.listen('.sivso.notificacion', handler);
            return () => channel.stopListening('.sivso.notificacion', handler);
        }

        const interval = setInterval(reloadList, getPollIntervalMs());
        return () => clearInterval(interval);
    }, [auth?.user?.id]);

    const applyFiltro = (f) => {
        setFiltro(f);
        router.get(route('notificaciones.index'), { filtro: f }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const leerUna = useCallback(async (id) => {
        try {
            await axios.post(route('notificaciones.leer', id));
            setItems((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
        } catch { /* silent */ }
    }, []);

    const leerTodas = useCallback(async () => {
        try {
            await axios.post(route('notificaciones.leer-todas'));
            setItems((prev) => prev.map((n) => ({ ...n, leida: true })));
        } catch { /* silent */ }
    }, []);

    const noLeidas = items.filter((n) => !n.leida).length;

    return (
        <>
            <Head title="Notificaciones" />

            {/* ── encabezado de sección ── */}
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                        Solicitudes resueltas, bajas aprobadas y movimientos de delegación.
                    </p>
                </div>
                {noLeidas > 0 && (
                    <button
                        type="button"
                        onClick={leerTodas}
                        className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-[12px] font-semibold text-zinc-600 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    >
                        <CheckCheck className="size-4" /> Marcar todas como leídas
                    </button>
                )}
            </div>

            {/* ── pestañas ── */}
            <div className="mb-5 flex items-center gap-2">
                {TABS.map((tab) => {
                    const count  = totales[tab.key] ?? 0;
                    const active = filtro === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => applyFiltro(tab.key)}
                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-[12px] font-semibold transition-all ${
                                active
                                    ? 'border-zinc-300 bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {count > 0 && (
                                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                                    active
                                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-800'
                                        : tab.key === 'no_leidas'
                                            ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400'
                                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── contador ── */}
            <div className="mb-3 text-right text-[11px] text-zinc-400 dark:text-zinc-500">
                {notificaciones.total} notificacion{notificaciones.total !== 1 ? 'es' : ''}
            </div>

            {/* ── lista ── */}
            {items.length === 0 ? (
                <EmptyState filtro={filtro} />
            ) : (
                <div className="space-y-2.5">
                    {items.map((n) => (
                        <TarjetaNotificacion key={n.id} notif={n} onLeer={leerUna} />
                    ))}
                </div>
            )}

            {notificaciones.last_page > 1 && (
                <div className="mt-6">
                    <TablePagination pagination={notificaciones} />
                </div>
            )}
        </>
    );
}

NotificacionesIndex.layout = createAdminPageLayout('Notificaciones');
export default NotificacionesIndex;
