import AdminPageShell from '@/components/admin/AdminPageShell';
import TablePagination from '@/components/admin/TablePagination';
import { isReverbRealtimeEnabled } from '@/echo';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowLeftRight,
    BadgeCheck,
    CheckCircle2,
    Clock,
    Info,
    RotateCcw,
    Search,
    X,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* ─── pestañas de estado ─────────────────────────────────────────── */

/** Sin WebSocket (p. ej. Hostinger): lista y contadores se refrescan solos. */
const SOLICITUDES_MOVIMIENTO_POLL_MS = 12_000;

const TABS = [
    { key: 'pendiente', label: 'Pendientes', color: 'amber'   },
    { key: 'aprobada',  label: 'Aprobadas',  color: 'emerald' },
    { key: 'rechazada', label: 'Rechazadas', color: 'rose'    },
    { key: 'todas',     label: 'Todas',      color: 'zinc'    },
];

/* ─── helpers visuales ───────────────────────────────────────────── */

function BadgeTipo({ tipo }) {
    return tipo === 'baja' ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 ring-1 ring-rose-200/40 dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-800/30">
            <XCircle className="size-3" strokeWidth={2} /> Baja
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200/50 dark:bg-slate-800/60 dark:text-slate-400 dark:ring-slate-700/40">
            <ArrowLeftRight className="size-3" strokeWidth={2} /> Cambio
        </span>
    );
}

function BadgeEstado({ estado }) {
    const cfg = {
        pendiente: { bg: 'bg-amber-50 dark:bg-amber-950/20',  ring: 'ring-amber-200/40 dark:ring-amber-800/25', txt: 'text-amber-600 dark:text-amber-400', icon: <Clock className="size-3" />,        label: 'Pendiente'  },
        aprobada:  { bg: 'bg-emerald-50 dark:bg-emerald-950/20',    ring: 'ring-emerald-200/40 dark:ring-emerald-900/25',   txt: 'text-emerald-600 dark:text-emerald-400',   icon: <BadgeCheck className="size-3" />,   label: 'Aprobada'   },
        rechazada: { bg: 'bg-rose-50 dark:bg-rose-950/20',    ring: 'ring-rose-200/40 dark:ring-rose-900/25',   txt: 'text-rose-600 dark:text-rose-400',   icon: <XCircle className="size-3" />,      label: 'Rechazada'  },
    }[estado] ?? {};
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${cfg.bg} ${cfg.ring} ${cfg.txt}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

/* ─── Modal base ─────────────────────────────────────────────────── */

function Modal({ open, onClose, children }) {
    useEffect(() => {
        if (!open) return;
        const fn = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', fn);
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-zinc-900/6 dark:bg-zinc-900 dark:ring-white/8"
                style={{ animation: 'modalIn 0.16s cubic-bezier(.16,1,.3,1)' }}>
                {children}
            </div>
            <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.96) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
        </div>,
        document.body,
    );
}

/* ─── ModalResolver ──────────────────────────────────────────────── */

function ModalResolver({ open, solicitud, onCerrar, onResuelta }) {
    const [decision, setDecision]   = useState(null);   // 'aprobada' | 'rechazada'
    const [llevaRecurso, setLlevaRecurso] = useState(true);
    const [ajuste, setAjuste]       = useState('');
    const [obs, setObs]             = useState('');
    const [saving, setSaving]       = useState(false);
    const [error, setError]         = useState('');

    useEffect(() => {
        if (open) { setDecision(null); setLlevaRecurso(true); setAjuste(''); setObs(''); setError(''); }
    }, [open]);

    const resolver = async () => {
        if (!decision) { setError('Selecciona una decisión.'); return; }
        if (decision === 'aprobada' && solicitud?.tipo === 'cambio' && llevaRecurso === null) {
            setError('Indica si el empleado lleva el recurso presupuestal.'); return;
        }
        setError('');
        setSaving(true);
        try {
            await axios.patch(route('solicitudes-movimiento.resolver', solicitud.id), {
                decision,
                lleva_recurso: solicitud?.tipo === 'cambio' ? llevaRecurso : null,
                ajuste_recurso: ajuste || null,
                observacion_administracion: obs || null,
            });
            onResuelta(solicitud.id, decision);
        } catch (e) {
            setError(e?.response?.data?.message ?? 'Error al resolver la solicitud.');
        } finally {
            setSaving(false);
        }
    };

    if (!solicitud) return null;

    const esBaja   = solicitud.tipo === 'baja';
    const esCambio = solicitud.tipo === 'cambio';

    return (
        <Modal open={open} onClose={onCerrar}>
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 px-6 pt-6 pb-4">
                <div>
                    <div className="mb-1 flex items-center gap-2">
                        <BadgeTipo tipo={solicitud.tipo} />
                        <BadgeEstado estado={solicitud.estado} />
                    </div>
                    <h2 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">
                        Resolver solicitud
                    </h2>
                    <p className="mt-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                        {solicitud.empleado?.nombre_completo}
                        {solicitud.empleado?.nue && <span className="ml-2 font-mono text-zinc-400">{solicitud.empleado.nue}</span>}
                    </p>
                </div>
                <button type="button" onClick={onCerrar}
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
                    <X className="size-4" />
                </button>
            </div>

            <div className="mx-6 h-px bg-zinc-100 dark:bg-zinc-800" />

            <div className="px-6 py-5 space-y-5">
                {/* Detalle de la solicitud */}
                <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200/50 dark:bg-zinc-800/40 dark:ring-zinc-700/40 space-y-2 text-[12px]">
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Delegación origen</span>
                        <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{solicitud.delegacion_origen}</span>
                    </div>
                    {esCambio && (
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Delegación destino</span>
                            <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{solicitud.delegacion_destino}</span>
                        </div>
                    )}
                    {solicitud.observacion_solicitante && (
                        <div className="border-t border-zinc-200/60 pt-2 dark:border-zinc-700/40">
                            <span className="block text-[10px] uppercase tracking-wider text-zinc-400 mb-0.5">Nota del delegado</span>
                            <span className="italic text-zinc-600 dark:text-zinc-400">"{solicitud.observacion_solicitante}"</span>
                        </div>
                    )}
                    <div className="text-zinc-400 text-[10px]">Solicitado el {solicitud.created_at}</div>
                </div>

                {/* Decisión */}
                <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Decisión</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setDecision('aprobada')}
                            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[13px] font-semibold transition ${
                                decision === 'aprobada'
                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-emerald-600/40 hover:bg-emerald-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-emerald-900/20 dark:hover:border-emerald-500/30'
                            }`}>
                            <CheckCircle2 className="size-4" strokeWidth={2} /> Aprobar
                        </button>
                        <button type="button" onClick={() => setDecision('rechazada')}
                            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[13px] font-semibold transition ${
                                decision === 'rechazada'
                                    ? 'border-rose-600 bg-rose-600 text-white shadow-sm'
                                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-rose-600/30 hover:bg-rose-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-rose-900/20 dark:hover:border-rose-500/30'
                            }`}>
                            <XCircle className="size-4" strokeWidth={2} /> Rechazar
                        </button>
                    </div>
                </div>

                {/* Recurso presupuestal — solo para cambio aprobado */}
                {decision === 'aprobada' && esCambio && (
                    <div className="rounded-2xl bg-zinc-50/80 p-4 ring-1 ring-zinc-200/50 dark:bg-zinc-800/40 dark:ring-zinc-700/30">
                        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                            Recurso presupuestal de vestuario
                        </p>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <button type="button" onClick={() => setLlevaRecurso(true)}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition ${
                                    llevaRecurso === true
                                        ? 'border-zinc-800 bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200'
                                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}>
                                <ArrowLeftRight className="size-3.5" /> Lleva el recurso
                            </button>
                            <button type="button" onClick={() => setLlevaRecurso(false)}
                                className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[12px] font-semibold transition ${
                                    llevaRecurso === false
                                        ? 'border-rose-600 bg-rose-600 text-white'
                                        : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}>
                                <X className="size-3.5" /> Queda en origen
                            </button>
                        </div>
                        <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                            {llevaRecurso
                                ? 'El presupuesto de vestuario acompaña al empleado. Se reasignará vestuario nuevo en la delegación destino.'
                                : 'El presupuesto queda en la delegación origen. La delegación destino deberá asignar nuevo recurso.'
                            }
                        </p>

                        {/* Ajuste de recurso */}
                        <div className="mt-3">
                            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
                                Ajuste al recurso <span className="font-normal normal-case text-zinc-400">— opcional</span>
                            </label>
                            <textarea value={ajuste} onChange={(e) => setAjuste(e.target.value)}
                                rows={2} maxLength={500}
                                placeholder="Ej. Se añade partida X. Se reduce cantidad de artículo Y…"
                                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-[12px] text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:ring-zinc-800"
                            />
                        </div>
                    </div>
                )}

                {/* Nota de administración */}
                <div>
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        Nota de S.Administración <span className="font-normal normal-case text-zinc-400">— opcional</span>
                    </label>
                    <textarea value={obs} onChange={(e) => setObs(e.target.value)}
                        rows={2} maxLength={500}
                        placeholder="Observaciones internas sobre la resolución…"
                        className="w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3 text-[13px] text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-200"
                    />
                </div>

                {error && (
                    <p className="flex items-center gap-2 text-[12px] font-medium text-rose-500 dark:text-rose-400">
                        <AlertTriangle className="size-4 shrink-0" /> {error}
                    </p>
                )}

                {/* Botones finales */}
                <div className="flex items-center gap-2.5">
                    <button type="button" onClick={resolver} disabled={saving || !decision}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-5 py-3 text-[13px] font-semibold text-white shadow-sm transition disabled:opacity-40 ${
                            decision === 'rechazada' ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
                        }`}>
                        {saving ? <RotateCcw className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                        {saving ? 'Guardando…' : 'Confirmar resolución'}
                    </button>
                    <button type="button" onClick={onCerrar}
                        className="rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-[13px] font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700/60">
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ─── TarjetaSolicitud ───────────────────────────────────────────── */

function TarjetaSolicitud({ solicitud, onResolver, puedeResolver }) {
    const esPendiente = solicitud.estado === 'pendiente';
    const esCambio    = solicitud.tipo === 'cambio';

    return (
        <div className={`overflow-hidden rounded-2xl ring-1 transition-all ${
            esPendiente
                ? 'bg-white shadow-sm ring-amber-200/25 dark:bg-zinc-900 dark:ring-amber-800/15'
                : solicitud.estado === 'aprobada'
                    ? 'bg-emerald-50/20 ring-emerald-200/40 dark:bg-emerald-950/10 dark:ring-emerald-900/30'
                    : 'bg-rose-50/30 ring-rose-200/40 dark:bg-rose-950/10 dark:ring-rose-900/30'
        }`}>
            <div className="flex items-start gap-4 px-5 py-4">
                {/* Avatar */}
                <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${
                    esCambio ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                             : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                }`}>
                    {esCambio ? <ArrowLeftRight className="size-5" strokeWidth={1.5} />
                              : <XCircle className="size-5" strokeWidth={1.5} />}
                </div>

                {/* Datos */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                            {solicitud.empleado?.nombre_completo}
                        </span>
                        <BadgeTipo tipo={solicitud.tipo} />
                        <BadgeEstado estado={solicitud.estado} />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        {solicitud.empleado?.nue && (
                            <span className="font-mono">{solicitud.empleado.nue}</span>
                        )}
                        <span>
                            UR <strong className="font-mono text-zinc-700 dark:text-zinc-300">{solicitud.empleado?.ur}</strong>
                        </span>
                        <span>
                            De <strong className="font-mono text-zinc-700 dark:text-zinc-300">{solicitud.delegacion_origen}</strong>
                            {esCambio && (
                                <> → <strong className="font-mono text-zinc-600 dark:text-zinc-400">{solicitud.delegacion_destino}</strong></>
                            )}
                        </span>
                        <span className="text-zinc-400">{solicitud.created_at}</span>
                    </div>

                    {solicitud.observacion_solicitante && (
                        <p className="mt-1 text-[11px] italic text-zinc-400 dark:text-zinc-500">
                            "{solicitud.observacion_solicitante}"
                        </p>
                    )}

                    {/* Resolución si ya fue procesada */}
                    {!esPendiente && (
                        <div className="mt-2 rounded-xl bg-zinc-50 px-3 py-2 ring-1 ring-zinc-200/50 dark:bg-zinc-800/40 dark:ring-zinc-700/40 text-[11px] space-y-0.5">
                            {solicitud.resuelta_por && (
                                <span className="block text-zinc-500 dark:text-zinc-400">
                                    Resuelta por <strong className="text-zinc-700 dark:text-zinc-300">{solicitud.resuelta_por}</strong> · {solicitud.resuelta_at}
                                </span>
                            )}
                            {esCambio && solicitud.estado === 'aprobada' && (
                                <span className={`block font-semibold ${solicitud.lleva_recurso ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}`}>
                                    {solicitud.lleva_recurso ? '→ Empleado lleva el recurso presupuestal' : '→ El recurso queda en delegación origen'}
                                </span>
                            )}
                            {solicitud.ajuste_recurso && (
                                <span className="block italic text-zinc-500 dark:text-zinc-400">Ajuste: {solicitud.ajuste_recurso}</span>
                            )}
                            {solicitud.observacion_administracion && (
                                <span className="block italic text-zinc-500 dark:text-zinc-400">Nota: {solicitud.observacion_administracion}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Botón resolver */}
                {esPendiente && puedeResolver && (
                    <button type="button" onClick={() => onResolver(solicitud)}
                        className="shrink-0 rounded-xl bg-zinc-900 px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                        Resolver
                    </button>
                )}
            </div>
        </div>
    );
}

/* ─── página principal ───────────────────────────────────────────── */

function SolicitudesMovimientoIndex({ solicitudes, totales = {}, filters = {} }) {
    const { auth } = usePage().props;
    const puedeResolver = useAuthCan()('Resolver solicitudes');
    const [estado, setEstado]     = useState(filters.estado || 'pendiente');
    const [search, setSearch]     = useState(filters.search || '');
    const [modalSolicitud, setModalSolicitud] = useState(null);
    const isFirstRender           = useRef(true);

    const modalAbierto = modalSolicitud !== null;

    useEffect(() => {
        if (!auth?.user || isReverbRealtimeEnabled || modalAbierto) return;

        const interval = setInterval(() => {
            if (document.visibilityState === 'hidden') return;
            router.reload({
                only: ['solicitudes', 'totales', 'filters'],
                preserveScroll: true,
            });
        }, SOLICITUDES_MOVIMIENTO_POLL_MS);

        return () => clearInterval(interval);
    }, [auth?.user?.id, modalAbierto]);

    const applyFilters = (e, s) => {
        router.get(
            route('solicitudes-movimiento.index'),
            { estado: e, search: s },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    };

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const t = setTimeout(() => applyFilters(estado, search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const handleTabChange = (key) => { setEstado(key); applyFilters(key, search); };

    const handleResuelta = useCallback((id, decision) => {
        setModalSolicitud(null);
        router.reload({ preserveScroll: true });
    }, []);

    return (
        <>
            <Head title="Solicitudes de movimiento" />
            <AdminPageShell
                title="Solicitudes de movimiento"
                description="Bajas y cambios de delegación solicitados por los delegados. Revisa, decide si el recurso acompaña al empleado, y aprueba o rechaza."
            >
                {/* Banner */}
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3.5 dark:border-zinc-800/50 dark:bg-zinc-900/30">
                    <Info className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                    <p className="text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                        <strong className="font-semibold text-zinc-700 dark:text-zinc-300">Baja</strong> — el presupuesto queda en la delegación origen.{' '}
                        <strong className="font-semibold text-zinc-700 dark:text-zinc-300">Cambio</strong> — define si el recurso presupuestal acompaña al empleado a la delegación destino o queda en la delegación de origen.
                    </p>
                </div>

                {/* Contadores por estado */}
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    {TABS.map((tab) => {
                        const count = totales[tab.key] ?? 0;
                        const active = estado === tab.key;
                        return (
                            <button key={tab.key} type="button" onClick={() => handleTabChange(tab.key)}
                                className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-[12px] font-semibold transition-all ${
                                    active
                                        ? 'border-zinc-300 bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                }`}>
                                {tab.label}
                                {tab.key !== 'todas' && count > 0 && (
                                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                                        active
                                            ? 'bg-white/20 text-white dark:bg-black/20 dark:text-zinc-800'
                                            : {
                                                pendiente: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
                                                aprobada: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
                                                rechazada: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
                                                todas: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
                                            }[tab.key]
                                    }`}>{count}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Buscador */}
                <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/60 dark:ring-white/8">
                    <Search className="size-4 shrink-0 text-zinc-400" />
                    <input type="text" placeholder="Buscar por nombre o NUE…"
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')}
                            className="text-[11px] text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300">
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Contador */}
                <div className="mb-3 text-right text-[11px] text-zinc-400 dark:text-zinc-500">
                    {solicitudes.data.length} de {solicitudes.total} solicitudes
                </div>

                {/* Lista */}
                {solicitudes.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/60 py-20 ring-1 ring-zinc-900/5 dark:bg-zinc-900/40 dark:ring-white/5">
                        <div className="flex size-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <BadgeCheck className="size-5 text-zinc-400" strokeWidth={1.5} />
                        </div>
                        <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Sin solicitudes</p>
                        <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
                            {estado === 'pendiente' ? 'No hay solicitudes pendientes por revisar.' : 'Sin resultados para este filtro.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {solicitudes.data.map((s) => (
                            <TarjetaSolicitud
                                key={s.id}
                                solicitud={s}
                                onResolver={setModalSolicitud}
                                puedeResolver={puedeResolver}
                            />
                        ))}
                    </div>
                )}

                {solicitudes.last_page > 1 && (
                    <div className="mt-6"><TablePagination pagination={solicitudes} /></div>
                )}

                {/* Modal de resolución */}
                <ModalResolver
                    open={!!modalSolicitud}
                    solicitud={modalSolicitud}
                    onCerrar={() => setModalSolicitud(null)}
                    onResuelta={handleResuelta}
                />
            </AdminPageShell>
        </>
    );
}

SolicitudesMovimientoIndex.layout = createAdminPageLayout('Solicitudes de movimiento');

export default SolicitudesMovimientoIndex;
