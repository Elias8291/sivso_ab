import AdminPageShell from '@/components/admin/AdminPageShell';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import FormField from '@/components/admin/FormField';
import Modal from '@/components/admin/Modal';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
    BellRing, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
    Clock, LayoutList, Pencil, Plus, RotateCcw, Search, Trash2, Users,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { route } from 'ziggy-js';

/* ──────────────────────────────────────────────
   Tarjeta de estadística global
────────────────────────────────────────────── */
function ResumenStatCard({ icon: Icon, label, value, hint }) {
    return (
        <div className="rounded-xl border border-zinc-200/80 border-l-2 border-l-brand-gold/35 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:border-l-brand-gold-soft/30 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                        {value}
                    </p>
                    {hint && (
                        <p className="mt-0.5 text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">{hint}</p>
                    )}
                </div>
                <Icon className="size-[18px] shrink-0 text-brand-gold/50 dark:text-brand-gold-soft/45" strokeWidth={1.5} aria-hidden />
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Barra de progreso — gold gradient
────────────────────────────────────────────── */
function ProgressBar({ porcentaje, confirmadas, total }) {
    const pct = Math.min(100, Math.max(0, porcentaje));
    return (
        <div>
            <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                    {confirmadas}/{total}
                </span>
                <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">{pct}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-gold/45 via-brand-gold/65 to-brand-gold-soft/55 dark:from-brand-gold-soft/35 dark:via-brand-gold-soft/50 dark:to-brand-gold/40 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Badge de estado
────────────────────────────────────────────── */
function StatusBadge({ pendientes, total }) {
    if (total === 0) return null;
    if (pendientes === 0) {
        return (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                <CheckCircle2 className="size-3" strokeWidth={2.5} />
                Completa
            </span>
        );
    }
    return (
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-transparent bg-zinc-100/80 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
            <Clock className="size-3" strokeWidth={1.8} />
            {pendientes} pend.
        </span>
    );
}

/* ──────────────────────────────────────────────
   Tarjeta de delegación con acordeón de detalle
────────────────────────────────────────────── */
function DelegacionCard({ row, puedeGestionar, anio, onEdit, onDelete, onAlert }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`overflow-hidden rounded-xl border transition-colors ${
            open
                ? 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900'
                : 'border-zinc-200/80 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700'
        }`}>

            {/* ── cabecera ── */}
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5 sm:py-3.5">
                <div className="flex min-w-0 flex-1 gap-3 sm:gap-3.5">
                    {/* avatar código */}
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <span className="font-mono text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
                            {row.codigo.slice(0, 3).toUpperCase()}
                        </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="font-mono text-[13px] font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
                                {row.codigo}
                            </span>
                            <StatusBadge pendientes={row.pendientes} total={row.total_asignaciones} />
                        </div>
                        {row.referencia_nombre && (
                            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">{row.referencia_nombre}</p>
                        )}
                        {row.delegados?.length > 0 && (
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                                {row.delegados.join(' · ')}
                            </p>
                        )}
                    </div>
                </div>

                {/* acciones */}
                <div className="flex w-full items-center justify-end gap-1.5 border-t border-zinc-100 pt-3 dark:border-zinc-800/80 sm:w-auto sm:shrink-0 sm:border-0 sm:pt-0">
                    {/* botón expandir progreso */}
                    <button
                        type="button"
                        onClick={() => setOpen((p) => !p)}
                        aria-label={open ? 'Cerrar detalle' : 'Ver progreso'}
                        className={`inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors sm:min-h-0 sm:flex-initial sm:text-[12px] ${
                            open
                                ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                                : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                        }`}
                    >
                        <LayoutList className="size-3.5 shrink-0" strokeWidth={1.75} />
                        <span className="hidden sm:inline">Progreso</span>
                        <ChevronDown
                            className={`size-3.5 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''} ${open ? 'text-white dark:text-zinc-900' : ''}`}
                            strokeWidth={2}
                        />
                    </button>

                    {puedeGestionar && (
                        <>
                            <button
                                type="button"
                                title="Enviar alerta al delegado"
                                onClick={() => onAlert(row)}
                                className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:min-h-0"
                            >
                                <BellRing className="size-3.5" strokeWidth={1.75} />
                            </button>
                            <button
                                type="button"
                                title="Editar"
                                onClick={() => onEdit(row)}
                                className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:min-h-0"
                            >
                                <Pencil className="size-3.5" strokeWidth={1.75} />
                            </button>
                            <button
                                type="button"
                                title="Eliminar"
                                onClick={() => onDelete(row)}
                                className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[11px] font-medium text-zinc-500 transition-colors hover:border-red-200 hover:bg-red-50/80 hover:text-red-700 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:min-h-0"
                            >
                                <Trash2 className="size-3.5" strokeWidth={1.75} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── panel de progreso (acordeón) ── */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="border-t border-zinc-200/80 px-4 pb-4 pt-3.5 dark:border-zinc-800 sm:px-5">
                        <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            <span className="inline-block size-1 rounded-full bg-brand-gold/55 dark:bg-brand-gold-soft/45" aria-hidden />
                            Vestuario {anio}
                        </p>

                        {row.total_asignaciones > 0 ? (
                            <>
                                <ProgressBar
                                    porcentaje={row.porcentaje}
                                    confirmadas={row.confirmadas}
                                    total={row.total_asignaciones}
                                />
                                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 text-center dark:border-zinc-800/50 sm:grid-cols-4">
                                    <div>
                                        <p className="text-base font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-100">
                                            {row.confirmadas}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Confirmadas</p>
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-100">
                                            {row.pendientes}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Pendientes</p>
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-100">
                                            {row.total_asignaciones}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Total</p>
                                    </div>
                                    <div className="hidden sm:block">
                                        <p className="text-base font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-100">
                                            {row.total_empleados}
                                        </p>
                                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Empleados</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="py-2 text-[12px] text-zinc-400 dark:text-zinc-500">
                                Sin asignaciones en este ejercicio.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Paginación — adaptada para móvil
────────────────────────────────────────────── */
function Pagination({ pagination }) {
    const lastPage    = pagination?.last_page ?? 1;
    const currentPage = pagination?.current_page ?? 1;
    const total       = pagination?.total ?? 0;

    if (total === 0 || lastPage <= 1 || !pagination?.links?.length) return null;

    const prevLink = pagination.links.find((l) => l.label.includes('anterior') || l.label.includes('&laquo;'));
    const nextLink = pagination.links.find((l) => l.label.includes('siguiente') || l.label.includes('&raquo;'));
    const pageLinks = pagination.links.filter((l) => !l.label.includes('&laquo;') && !l.label.includes('&raquo;'));

    const btnBase =
        'inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-[12px] transition-all duration-150';
    const btnActive = `${btnBase} bg-zinc-900 font-medium text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900`;
    const btnIdle   = `${btnBase} text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200`;
    const btnNav    = `${btnBase} gap-1 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800`;
    const btnNavDis = `${btnBase} cursor-default border border-zinc-100 text-zinc-300 dark:border-zinc-800 dark:text-zinc-700`;

    return (
        <nav className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-between" aria-label="Paginación">
            {/* info */}
            <span className="order-2 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-600 sm:order-1">
                {total} registro{total !== 1 ? 's' : ''}
            </span>

            {/* controles */}
            <div className="order-1 flex items-center gap-1 sm:order-2">
                {/* Anterior */}
                {prevLink?.url ? (
                    <Link href={prevLink.url} preserveScroll className={btnNav}>
                        <ChevronLeft className="size-3.5" strokeWidth={2} />
                        <span className="hidden sm:inline">Anterior</span>
                    </Link>
                ) : (
                    <span className={btnNavDis}>
                        <ChevronLeft className="size-3.5" strokeWidth={2} />
                        <span className="hidden sm:inline">Anterior</span>
                    </span>
                )}

                {/* páginas — solo en sm+ */}
                <div className="hidden items-center gap-0.5 sm:flex">
                    {pageLinks.map((link, i) =>
                        link.url ? (
                            <Link key={i} href={link.url} preserveScroll className={link.active ? btnActive : btnIdle}>
                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                            </Link>
                        ) : (
                            <span key={i} className={`${btnBase} text-zinc-300 dark:text-zinc-700`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </div>

                {/* indicador solo en móvil */}
                <span className="px-3 text-[12px] tabular-nums text-zinc-600 dark:text-zinc-400 sm:hidden">
                    {currentPage} / {lastPage}
                </span>

                {/* Siguiente */}
                {nextLink?.url ? (
                    <Link href={nextLink.url} preserveScroll className={btnNav}>
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRight className="size-3.5" strokeWidth={2} />
                    </Link>
                ) : (
                    <span className={btnNavDis}>
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRight className="size-3.5" strokeWidth={2} />
                    </span>
                )}
            </div>
        </nav>
    );
}

/* ──────────────────────────────────────────────
   Modal de alerta al delegado
────────────────────────────────────────────── */
function AlertaModal({ delegacion, onClose }) {
    const [sending, setSending] = useState(false);
    const [flash, setFlash]     = useState('');
    const [error, setError]     = useState('');

    const enviar = useCallback(async () => {
        setSending(true);
        setError('');
        try {
            const { data } = await axios.post(route('delegaciones.alertar', delegacion.codigo));
            setFlash(data.message ?? 'Alerta enviada.');
            setTimeout(onClose, 2000);
        } catch (e) {
            setError(e?.response?.data?.message ?? 'No se pudo enviar la alerta.');
        } finally {
            setSending(false);
        }
    }, [delegacion, onClose]);

    return (
        <Modal open={Boolean(delegacion)} onClose={onClose} title="Enviar alerta">
            {delegacion && (
                <div className="space-y-4 text-[13px]">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                            <BellRing className="size-5 text-zinc-600 dark:text-zinc-300" strokeWidth={1.75} />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                Delegación <span className="font-mono">{delegacion.codigo}</span>
                            </p>
                            {delegacion.delegados?.length > 0 && (
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    {delegacion.delegados.join(' · ')}
                                </p>
                            )}
                            {delegacion.pendientes > 0 && (
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    {delegacion.pendientes} talla(s) pendiente(s)
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 px-4 py-3 text-[12px] leading-relaxed text-zinc-600 dark:border-zinc-700/80 dark:bg-zinc-900/40 dark:text-zinc-400">
                        Se enviará una notificación a los delegados de esta delegación pidiéndoles que actualicen las tallas pendientes a la brevedad.
                    </div>

                    {flash && (
                        <p className="flex items-center gap-2 text-[12px] font-medium text-zinc-700 dark:text-zinc-200">
                            <CheckCircle2 className="size-4 shrink-0 text-brand-gold/80 dark:text-brand-gold-soft/70" strokeWidth={2} />
                            {flash}
                        </p>
                    )}
                    {error && (
                        <p className="rounded-lg border border-red-200/60 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                        <button type="button" onClick={onClose}
                            className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                            Cancelar
                        </button>
                        <button type="button" onClick={enviar} disabled={sending || Boolean(flash)}
                            className="inline-flex items-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                            {sending ? <RotateCcw className="size-4 animate-spin" /> : <BellRing className="size-4" strokeWidth={1.75} />}
                            {sending ? 'Enviando…' : 'Enviar alerta'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}

/* ──────────────────────────────────────────────
   Página principal
────────────────────────────────────────────── */
function DelegacionesIndex({
    delegaciones,
    dependenciasList = [],
    filters = {},
    anio,
    resumen = { total: 0, confirmadas: 0, pendientes: 0, porcentaje: 0 },
}) {
    const can = useAuthCan();
    const puedeGestionar = can('Gestionar delegaciones');
    const { errors: pageErrors } = usePage().props;
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit]     = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting]         = useState(false);
    const [alertTarget, setAlertTarget]   = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const timeout = setTimeout(() => {
            router.get(
                route('delegaciones.index'),
                { search },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const form     = useForm({ codigo: '', ur_referencia: '' });
    const editForm = useForm({ ur_referencia: '' });

    useEffect(() => {
        if (showEdit) {
            editForm.setData({
                ur_referencia: showEdit.ur_referencia != null ? String(showEdit.ur_referencia) : '',
            });
        }
    }, [showEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('delegaciones.store'), {
            preserveScroll: true,
            onSuccess: () => { setShowCreate(false); form.reset(); },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!showEdit) return;
        editForm.patch(route('delegaciones.update', showEdit.codigo), {
            preserveScroll: true,
            onSuccess: () => setShowEdit(null),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route('delegaciones.destroy', deleteTarget.codigo), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    };

    const selectClass =
        'block w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] text-zinc-800 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 dark:border-zinc-700 dark:text-zinc-200 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20';

    const pct = resumen.porcentaje ?? 0;

    return (
        <>
            <Head title="Delegaciones" />
            <AdminPageShell
                title="Delegaciones"
                description={
                    <span className="tabular-nums">
                        Progreso de actualización de tallas · ejercicio {anio ?? ''}
                    </span>
                }
                actions={
                    puedeGestionar ? (
                        <button type="button" onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                            <Plus className="size-4" strokeWidth={2} />
                            Agregar
                        </button>
                    ) : null
                }
            >
                {/* ── Tarjetas resumen ── */}
                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                    <ResumenStatCard icon={LayoutList} label="Total asignaciones"
                        value={resumen.total.toLocaleString()} hint={`Ejercicio ${anio ?? ''}`} />
                    <ResumenStatCard icon={CheckCircle2} label="Confirmadas"
                        value={resumen.confirmadas.toLocaleString()} hint={`${pct}% del total`} />
                    <ResumenStatCard icon={Users} label="Pendientes"
                        value={resumen.pendientes.toLocaleString()} hint="aún sin confirmar" />
                </div>

                {/* ── Barra global ── */}
                <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            <span className="inline-block size-1 rounded-full bg-brand-gold/55 align-middle dark:bg-brand-gold-soft/45" aria-hidden />
                            Avance global · todas las delegaciones
                        </span>
                        <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {resumen.confirmadas.toLocaleString()}
                            </span>
                            {' '}/ {resumen.total.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-gold/45 via-brand-gold/65 to-brand-gold-soft/55 dark:from-brand-gold-soft/35 dark:via-brand-gold-soft/50 dark:to-brand-gold/40 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                {pageErrors?.delegacion && (
                    <p className="mb-3 rounded-lg border border-red-200/60 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                        {pageErrors.delegacion}
                    </p>
                )}

                {/* ── Buscador ── */}
                <div className="mb-3 flex min-h-[40px] items-center gap-2 rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 transition-[border-color,box-shadow] focus-within:border-brand-gold/40 focus-within:ring-1 focus-within:ring-brand-gold/15 dark:border-zinc-800 dark:bg-zinc-900/30 dark:focus-within:border-brand-gold-soft/35 dark:focus-within:ring-brand-gold-soft/12">
                    <Search className="size-4 shrink-0 text-brand-gold/65 dark:text-brand-gold-soft/55" aria-hidden />
                    <input
                        type="text"
                        placeholder="Buscar delegación…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                    {search && (
                        <button type="button" onClick={() => setSearch('')}
                            className="shrink-0 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
                            Limpiar
                        </button>
                    )}
                </div>

                {/* ── Lista de delegaciones ── */}
                {delegaciones.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/20">
                        <LayoutList className="size-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} aria-hidden />
                        <div className="text-center">
                            <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Sin delegaciones</p>
                            <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                                No hay registros. Ejecuta migraciones y seeders.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {delegaciones.data.map((row) => (
                            <DelegacionCard
                                key={row.codigo}
                                row={row}
                                puedeGestionar={puedeGestionar}
                                anio={anio}
                                onEdit={setShowEdit}
                                onDelete={setDeleteTarget}
                                onAlert={setAlertTarget}
                            />
                        ))}
                    </div>
                )}

                <Pagination pagination={delegaciones} />
            </AdminPageShell>

            {/* ── Modal crear ── */}
            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva delegación">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Código" id="delegacion-codigo"
                        value={form.data.codigo}
                        onChange={(e) => form.setData('codigo', e.target.value)}
                        error={form.errors.codigo} placeholder="Ej. DEL-001" required />
                    <FormField label="UR de referencia" id="delegacion-ur" error={form.errors.ur_referencia}>
                        <select id="delegacion-ur" value={form.data.ur_referencia}
                            onChange={(e) => form.setData('ur_referencia', e.target.value)}
                            className={selectClass}>
                            <option value="">Sin referencia</option>
                            {dependenciasList.map((dep) => (
                                <option key={dep.ur} value={dep.ur}>
                                    {dep.ur} — {dep.nombre_corto || dep.nombre}
                                </option>
                            ))}
                        </select>
                    </FormField>
                    <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                        <button type="button" onClick={() => setShowCreate(false)}
                            className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                            Cancelar
                        </button>
                        <button type="submit" disabled={form.processing}
                            className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                            {form.processing ? 'Guardando…' : 'Crear delegación'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Modal editar ── */}
            <Modal open={Boolean(showEdit)} onClose={() => setShowEdit(null)} title="Editar delegación">
                {showEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                            Código{' '}
                            <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{showEdit.codigo}</span>{' '}
                            (no editable; solo UR de referencia)
                        </p>
                        <FormField label="UR de referencia" id="edit-del-ur" error={editForm.errors.ur_referencia}>
                            <select id="edit-del-ur" value={editForm.data.ur_referencia}
                                onChange={(e) => editForm.setData('ur_referencia', e.target.value)}
                                className={selectClass}>
                                <option value="">Sin referencia</option>
                                {dependenciasList.map((dep) => (
                                    <option key={dep.ur} value={dep.ur}>
                                        {dep.ur} — {dep.nombre_corto || dep.nombre}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                            <button type="button" onClick={() => setShowEdit(null)}
                                className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800">
                                Cancelar
                            </button>
                            <button type="submit" disabled={editForm.processing}
                                className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
                                {editForm.processing ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            <AlertaModal delegacion={alertTarget} onClose={() => setAlertTarget(null)} />

            <ConfirmDeleteModal
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                message={deleteTarget ? `¿Eliminar la delegación «${deleteTarget.codigo}»?` : ''}
                onConfirm={handleDeleteConfirm}
                processing={deleting}
            />
        </>
    );
}

DelegacionesIndex.layout = createAdminPageLayout('Delegaciones');

export default DelegacionesIndex;
