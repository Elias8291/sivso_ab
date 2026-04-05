import AdminPageShell from '@/components/admin/AdminPageShell';
import TablePagination from '@/components/admin/TablePagination';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowLeftRight,
    CheckCircle2,
    ChevronDown,
    Clock,
    Info,
    LayoutList,
    Pencil,
    RotateCcw,
    Search,
    Shirt,
    Tag,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const FILTROS = [
    { key: 'todos',       label: 'Todos'       },
    { key: 'listos',      label: 'Listos'      },
    { key: 'sin_empezar', label: 'Sin empezar' },
    { key: 'bajas',       label: 'Bajas'       },
];

const PER_PAGE_OPCIONES = [10, 15, 20, 30, 50, 100];

/* ─── PrendaRow ──────────────────────────────────────────────────── */

function PrendaRow({ item, onGuardado }) {
    const [editando, setEditando] = useState(false);
    const [talla, setTalla]       = useState(item.talla  || '');
    const [medida, setMedida]     = useState(item.medida || '');
    const [saving, setSaving]     = useState(false);
    const [flash, setFlash]       = useState(false);

    const cancelar = () => {
        setTalla(item.talla || '');
        setMedida(item.medida || '');
        setEditando(false);
    };

    const guardar = useCallback(async () => {
        setSaving(true);
        try {
            await axios.patch(route('my-delegation.talla.update', item.id), {
                talla, medida, estado: 'confirmado', observacion: null,
            });
            setFlash(true);
            setTimeout(() => setFlash(false), 2500);
            onGuardado(item.id, talla, medida);
            setEditando(false);
        } catch {
            setTalla(item.talla || '');
            setMedida(item.medida || '');
        } finally {
            setSaving(false);
        }
    }, [talla, medida, item.id, onGuardado]);

    const confirmado = item.estado === 'confirmado';

    return (
        <div className={editando ? 'rounded-md bg-zinc-100/60 dark:bg-zinc-900/35' : ''}>
            <div className="flex gap-3 px-0 py-3 sm:gap-3.5">
                {/* icono estado — alineado con la primera línea del texto */}
                <div className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                    confirmado
                        ? 'bg-zinc-200/60 dark:bg-zinc-700/50'
                        : 'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                    {confirmado
                        ? <CheckCircle2 className="size-3.5 text-zinc-600 dark:text-zinc-300" strokeWidth={2} />
                        : <Clock className="size-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                    }
                </div>

                <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="min-w-0 space-y-1">
                        {item.clave && (
                            <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                                {item.clave}
                            </p>
                        )}
                        <p className="[overflow-wrap:anywhere] break-words text-[13px] font-medium leading-snug text-zinc-800 dark:text-zinc-200">
                            {item.prenda}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200/80 bg-zinc-100/90 px-2 py-0.5 dark:border-zinc-700/80 dark:bg-zinc-800/60">
                                <span className="text-[10px] uppercase tracking-wider text-zinc-400">T</span>
                                {item.talla_anterior && item.talla_anterior !== talla && (
                                    <span className="font-mono text-zinc-300 line-through dark:text-zinc-600">{item.talla_anterior}</span>
                                )}
                                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{talla || '—'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-zinc-200/80 bg-zinc-100/90 px-2 py-0.5 dark:border-zinc-700/80 dark:bg-zinc-800/60">
                                <span className="text-[10px] uppercase tracking-wider text-zinc-400">M</span>
                                <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{medida || '—'}</span>
                            </span>
                            {flash && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-brand-gold dark:text-brand-gold-soft">
                                    <CheckCircle2 className="size-3 text-brand-gold/90 dark:text-brand-gold-soft/90" /> Listo
                                </span>
                            )}
                        </div>

                        {!editando && (
                            <button type="button" onClick={() => setEditando(true)}
                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 shadow-sm hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80">
                                <Pencil className="size-3" strokeWidth={2} />
                                Editar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* panel edición */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${editando ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="flex flex-col gap-3 border-t border-zinc-200/80 pb-1 pt-3 dark:border-zinc-700/60 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2.5 sm:pb-2 sm:pt-2.5">
                        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:max-w-md sm:flex-1 sm:grid-cols-none sm:flex sm:flex-wrap sm:items-end">
                            {[
                                { lbl: 'Talla',  val: talla,  set: (v) => setTalla(v.toUpperCase()), ph: item.talla_anterior || 'Ej. M' },
                                { lbl: 'Medida', val: medida, set: setMedida, ph: 'Ej. 34' },
                            ].map(({ lbl, val, set, ph }) => (
                                <div key={lbl} className="min-w-0 flex-1 flex flex-col gap-1 sm:min-w-[7rem]">
                                    <label htmlFor={`prenda-${item.id}-${lbl}`} className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">{lbl}</label>
                                    <input
                                        id={`prenda-${item.id}-${lbl}`}
                                        type="text"
                                        value={val}
                                        onChange={(e) => set(e.target.value)}
                                        placeholder={ph}
                                        maxLength={20}
                                        className="min-h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-[14px] font-bold text-zinc-900 outline-none placeholder:font-normal placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 sm:min-h-0 sm:py-2 sm:text-[13px] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                        inputMode="text"
                                        autoComplete="off"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex w-full gap-2 max-sm:flex-col max-sm:gap-2.5 sm:w-auto sm:shrink-0 sm:items-center">
                            <button type="button" onClick={guardar} disabled={saving}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-[13px] font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:min-h-0 sm:flex-initial sm:rounded-md sm:py-2 sm:text-[12px]">
                                {saving ? <RotateCcw className="size-4 shrink-0 animate-spin sm:size-3.5" /> : <CheckCircle2 className="size-4 shrink-0 sm:size-3.5" />}
                                {saving ? 'Guardando…' : 'Confirmar'}
                            </button>
                            <button type="button" onClick={cancelar}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800/80 sm:min-h-0 sm:flex-initial sm:rounded-md sm:px-3 sm:py-2 sm:text-[12px]">
                                <X className="size-4 shrink-0 sm:size-3.5" />
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── VestuarioPanel ─────────────────────────────────────────────── */

function VestuarioPanel({ vestuario, onPrendaGuardada, anioActual = new Date().getFullYear() }) {
    const confirmadas = vestuario.filter((v) => v.estado === 'confirmado').length;
    const total       = vestuario.length;
    const pct         = total > 0 ? Math.round((confirmadas / total) * 100) : 0;

    return (
        <div className="border-t border-zinc-200/90 px-3.5 pb-3.5 pt-3 dark:border-zinc-800 sm:px-4">
            <div className="mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    <span className="mr-1 inline-block size-1 rounded-full bg-brand-gold/55 align-middle dark:bg-brand-gold-soft/45" aria-hidden />
                    Vestuario{' '}
                    <span className="tabular-nums text-brand-gold/80 dark:text-brand-gold-soft/75">{anioActual}</span>
                </p>
                <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
                    <span className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{confirmadas}</span>
                        <span className="text-zinc-400"> / {total}</span>
                    </span>
                    {total > 0 && (
                        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 sm:w-32">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-gold/45 via-brand-gold/65 to-brand-gold-soft/55 dark:from-brand-gold-soft/35 dark:via-brand-gold-soft/50 dark:to-brand-gold/40"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {total === 0 ? (
                <p className="py-3.5 text-center text-[12px] text-zinc-400 dark:text-zinc-500">
                    Sin prendas asignadas en el año de referencia.
                </p>
            ) : (
                <ul className="m-0 flex list-none flex-col divide-y divide-zinc-200 p-0 dark:divide-zinc-700">
                    {vestuario.map((item) => (
                        <li key={item.id}>
                            <PrendaRow item={item} onGuardado={onPrendaGuardada} />
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

/* ─── Modal base ─────────────────────────────────────────────────── */

function Modal({ open, onClose, children }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]" onClick={onClose} />
            <div
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                style={{ animation: 'modalIn 0.16s cubic-bezier(.16,1,.3,1)' }}
            >
                {children}
            </div>
            <style>{`
                @keyframes modalIn {
                    from { opacity:0; transform:scale(0.96) translateY(10px); }
                    to   { opacity:1; transform:scale(1)    translateY(0);    }
                }
            `}</style>
        </div>,
        document.body,
    );
}

/* ─── ModalAccionEmpleado ────────────────────────────────────────── */

const MODAL_CFG = {
    baja: {
        iconBg:   'bg-zinc-100 dark:bg-zinc-800',
        iconClr:  'text-zinc-600 dark:text-zinc-400',
        warnBg:   'bg-zinc-50 dark:bg-zinc-900/50',
        warnRing: 'ring-zinc-200/80 dark:ring-zinc-700/80',
        warnTxt:  'text-zinc-600 dark:text-zinc-400',
        inputCls: 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-200/40 dark:border-zinc-700 dark:focus:border-zinc-500',
        btnCls:   'border border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
        icon:     <XCircle className="size-5" strokeWidth={1.8} />,
        title:    'Solicitar baja',
        label:    'Motivo de baja',
        ph:       'Ej. Renuncia voluntaria, licencia médica indefinida, jubilación…',
        btnLbl:   'Enviar solicitud',
        warn:     (
            <>
                Se enviará una <strong className="font-semibold">solicitud de baja</strong> a S.Administración para revisión.
                El presupuesto de vestuario asignado <strong className="font-semibold">quedará disponible para la delegación</strong>.
                El movimiento se ejecuta hasta que sea aprobado.
            </>
        ),
    },
    cambio: {
        iconBg:   'bg-zinc-100 dark:bg-zinc-800',
        iconClr:  'text-zinc-600 dark:text-zinc-400',
        warnBg:   'bg-zinc-50 dark:bg-zinc-900/50',
        warnRing: 'ring-zinc-200/80 dark:ring-zinc-700/80',
        warnTxt:  'text-zinc-600 dark:text-zinc-400',
        inputCls: 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-200/40 dark:border-zinc-700 dark:focus:border-zinc-500',
        selectCls:'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-200/40 dark:border-zinc-700 dark:focus:border-zinc-500',
        btnCls:   'border border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200',
        icon:     <ArrowLeftRight className="size-5" strokeWidth={1.8} />,
        title:    'Solicitar cambio de delegación',
        label:    'Nota del cambio',
        ph:       'Ej. Asignado a nuevas funciones, cambio de área…',
        btnLbl:   'Enviar solicitud',
        warn:     (
            <>
                Se enviará una <strong className="font-semibold">solicitud de cambio</strong> a S.Administración.
                Ellos decidirán si el recurso presupuestal acompaña al empleado.
                El movimiento se ejecuta hasta que sea aprobado.
            </>
        ),
    },
};

function ModalAccionEmpleado({ open, accion, empleado, delegaciones = [], onCerrar, onGuardado }) {
    const [obs, setObs]                     = useState('');
    const [nuevaDelegacion, setNuevaDelegacion] = useState('');
    const [saving, setSaving]               = useState(false);
    const [error, setError]                 = useState('');

    // Delegaciones de la misma UR que el empleado, excluyendo la actual
    const delegacionesDisponibles = delegaciones.filter(
        (d) => d.ur === empleado?.ur && d.codigo !== empleado?.delegacion_codigo,
    );

    useEffect(() => {
        if (open) { setObs(''); setNuevaDelegacion(''); setError(''); }
    }, [open]);

    const cfg = MODAL_CFG[accion] ?? MODAL_CFG.baja;

    const guardar = async () => {
        if (accion === 'cambio' && !nuevaDelegacion) {
            setError('Debes seleccionar la delegación destino.');
            return;
        }
        setError('');
        setSaving(true);
        try {
            const { data } = await axios.post(route('my-delegation.solicitar', empleado?.id), {
                tipo: accion,
                observacion: obs || null,
                nueva_delegacion: accion === 'cambio' ? nuevaDelegacion : undefined,
            });
            onGuardado(accion, obs, nuevaDelegacion, data.data?.solicitud_id);
        } catch (e) {
            setError(e?.response?.data?.message ?? 'No se pudo enviar la solicitud.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={onCerrar}>
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 px-6 pb-4 pt-6">
                <div className="flex items-center gap-4">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}>
                        <span className={cfg.iconClr}>{cfg.icon}</span>
                    </div>
                    <div>
                        <h2 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">{cfg.title}</h2>
                        <p className="mt-0.5 max-w-[210px] truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                            {empleado?.nombre_completo}
                        </p>
                    </div>
                </div>
                <button type="button" onClick={onCerrar}
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
                    <X className="size-4" />
                </button>
            </div>

            {/* Divisor sutil */}
            <div className="mx-6 h-px bg-zinc-100 dark:bg-zinc-800" />

            {/* Cuerpo */}
            <div className="px-6 py-5">
                {/* Aviso */}
                <div className={`mb-5 flex items-start gap-3 rounded-lg px-4 py-3 ring-1 ${cfg.warnBg} ${cfg.warnRing}`}>
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${cfg.iconClr}`} />
                    <p className={`text-[12px] leading-relaxed ${cfg.warnTxt}`}>{cfg.warn}</p>
                </div>

                {/* Selector de delegación destino — solo para cambio */}
                {accion === 'cambio' && (
                    <div className="mb-5">
                        <label className="mb-2 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            Delegación destino <span className="text-zinc-700 dark:text-zinc-300">*</span>
                        </label>

                        {delegacionesDisponibles.length === 0 ? (
                            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-[12px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
                                No hay otras delegaciones disponibles en la misma UR.
                            </p>
                        ) : (
                            <select
                                value={nuevaDelegacion}
                                onChange={(e) => { setNuevaDelegacion(e.target.value); setError(''); }}
                                className={`w-full rounded-lg border bg-zinc-50/60 px-4 py-2.5 text-[13px] text-zinc-800 outline-none transition-[border-color,box-shadow] focus:bg-zinc-100 focus:ring-2 dark:bg-zinc-800/40 dark:text-zinc-200 dark:focus:bg-zinc-800 ${cfg.selectCls}`}
                            >
                                <option value="">— Selecciona la delegación destino —</option>
                                {delegacionesDisponibles.map((d) => (
                                    <option key={d.codigo} value={d.codigo}>{d.codigo}</option>
                                ))}
                            </select>
                        )}

                        {error && (
                            <p className="mt-1.5 text-[11px] font-medium text-rose-500 dark:text-rose-400">{error}</p>
                        )}
                    </div>
                )}

                {/* Observación */}
                <div className="mb-6">
                    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                        {cfg.label}
                        <span className="ml-1.5 font-normal normal-case tracking-normal text-zinc-400"> — opcional</span>
                    </label>
                    <textarea
                        value={obs} onChange={(e) => setObs(e.target.value)}
                        rows={2} maxLength={255} placeholder={cfg.ph}
                        className={`w-full resize-none rounded-lg border bg-zinc-50/60 px-4 py-3 text-[13px] text-zinc-800 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:bg-zinc-100 focus:ring-2 dark:bg-zinc-800/40 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-800 ${cfg.inputCls}`}
                    />
                    <p className="mt-1 text-right text-[10px] tabular-nums text-zinc-400">{obs.length}/255</p>
                </div>

                {/* Error */}
                {error && (
                    <p className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-800/30">
                        <AlertTriangle className="size-4 shrink-0" /> {error}
                    </p>
                )}

                {/* Botones */}
                <div className="flex items-center gap-2">
                    <button type="button" onClick={guardar} disabled={saving}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-opacity disabled:opacity-50 ${cfg.btnCls}`}>
                        {saving ? <RotateCcw className="size-4 animate-spin" /> : cfg.icon}
                        {saving ? 'Enviando…' : cfg.btnLbl}
                    </button>
                    <button type="button" onClick={onCerrar}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800">
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ─── EmpleadoRow ────────────────────────────────────────────────── */

function EmpleadoRow({ empleado, delegaciones, anioActual }) {
    const [vestuarioAbierto, setVestuarioAbierto] = useState(false);
    const [modal, setModal]                        = useState(null);
    const [vestuario, setVestuario]                = useState(empleado.vestuario);
    const [estadoDelegacion, setEstadoDelegacion]  = useState(empleado.estado_delegacion || 'activo');
    const [obsDelegacion, setObsDelegacion]        = useState(empleado.observacion_delegacion || '');
    const [solicitudPendiente, setSolicitudPendiente] = useState(empleado.solicitud_pendiente ?? null);
    const [reactivando, setReactivando]               = useState(false);

    const cerrarModal = () => setModal(null);

    const handleReactivar = async () => {
        setReactivando(true);
        try {
            await axios.patch(route('my-delegation.empleado.reactivar', empleado.id));
            setEstadoDelegacion('activo');
            setObsDelegacion('');
        } catch { /* sin acción */ } finally {
            setReactivando(false);
        }
    };

    const handlePrendaGuardada = useCallback((id, nuevaTalla, nuevaMedida) => {
        setVestuario((prev) => prev.map((v) =>
            v.id === id ? { ...v, talla: nuevaTalla, medida: nuevaMedida, estado: 'confirmado' } : v
        ));
    }, []);

    const handleSolicitudEnviada = useCallback((tipo, obs, destino, solicitudId) => {
        setSolicitudPendiente({ id: solicitudId, tipo, delegacion_destino: destino });
        cerrarModal();
    }, []);

    const handleCancelarSolicitud = async () => {
        if (!solicitudPendiente?.id) return;
        try {
            await axios.delete(route('my-delegation.solicitud.cancelar', solicitudPendiente.id));
            setSolicitudPendiente(null);
        } catch { /* sin acción */ }
    };

    const listos   = vestuario.filter((v) => v.estado === 'confirmado').length;
    const total    = vestuario.length;
    const completo = total > 0 && listos >= total;
    const pendienteVestuario = total > 0 && !completo;
    const esBaja   = estadoDelegacion === 'baja';
    const esCambio = estadoDelegacion === 'cambio';

    const cardCls = esBaja
        ? 'border-zinc-300 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-900/40'
        : esCambio
            ? 'border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/25'
            : vestuarioAbierto
                ? 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900'
                : 'border-zinc-200/80 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700';

    const cardRingCompleto =
        completo && !esBaja && !esCambio && !vestuarioAbierto
            ? ' ring-1 ring-brand-gold/20 dark:ring-brand-gold-soft/18'
            : '';

    const avatarCls = esBaja
        ? 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
        : esCambio
            ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
            : completo
                ? 'bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';

    return (
        <div className={`overflow-hidden rounded-xl border ${cardCls}${cardRingCompleto}`}>

            {/* ── cabecera tarjeta: datos + acciones ── */}
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-5 sm:py-3.5">
                <div className="flex min-w-0 flex-1 gap-3 sm:gap-3.5">
                    {/* avatar */}
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${avatarCls}`}>
                        {esBaja
                            ? <XCircle className="size-[18px]" strokeWidth={1.5} />
                            : esCambio
                                ? <ArrowLeftRight className="size-[18px]" strokeWidth={1.5} />
                                : empleado.nombre_completo.charAt(0)
                        }
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`min-w-0 break-words text-[13px] font-semibold tracking-wide ${
                                esBaja ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-900 dark:text-zinc-100'
                            }`}>
                                {empleado.nombre_completo}
                            </span>
                            {esBaja && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                    Baja
                                </span>
                            )}
                            {esCambio && (
                                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                                    Cambio
                                </span>
                            )}
                            {!esBaja && !esCambio && (
                                <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-md border px-2 py-0.5 text-[10px] font-medium ${
                                    completo
                                        ? 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200'
                                        : 'border-transparent bg-zinc-100/80 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400'
                                }`}>
                                    {completo ? 'Completo' : `${listos}/${total} prendas`}
                                </span>
                            )}
                        </div>
                        {empleado.nue && (
                            <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">{empleado.nue}</p>
                        )}
                        {obsDelegacion && (
                            <p className="break-words text-[11px] italic leading-relaxed text-zinc-500 dark:text-zinc-400">
                                «{obsDelegacion}»
                            </p>
                        )}
                    </div>
                </div>

                {/* acciones: fila completa en móvil, columna a la derecha en desktop */}
                <div className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80 sm:w-auto sm:shrink-0 sm:border-0 sm:pt-0">
                    {!solicitudPendiente && (esBaja || esCambio) && (
                        <button type="button" onClick={handleReactivar} disabled={reactivando}
                            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:min-h-0 sm:py-1.5">
                            {reactivando ? <RotateCcw className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                            Reactivar
                        </button>
                    )}

                    {!esBaja && (
                        <button type="button" onClick={() => setVestuarioAbierto((p) => !p)}
                            title={pendienteVestuario ? `Actualizar vestuario ${anioActual}` : `Vestuario ${anioActual}`}
                            aria-label={
                                (pendienteVestuario ? 'Actualizar vestuario' : 'Vestuario')
                                + ` ${anioActual}`
                                + (total > 0 ? `, ${listos} de ${total} prendas` : '')
                            }
                            className={`inline-flex min-h-[42px] max-w-full flex-1 items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-medium sm:min-h-0 sm:flex-initial sm:justify-start sm:px-3 sm:py-1.5 sm:text-[12px] ${
                                vestuarioAbierto
                                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                                    : pendienteVestuario
                                        ? 'border-zinc-300/90 bg-zinc-50 text-zinc-800 hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-100 dark:hover:border-zinc-500'
                                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                            }`}>
                            <span className="relative inline-flex shrink-0">
                                <Shirt className="size-4 shrink-0" strokeWidth={1.75} />
                                {pendienteVestuario && (
                                    <span
                                        className={`absolute -right-1.5 -top-1.5 flex size-[15px] items-center justify-center rounded-full border shadow-sm sm:hidden ${
                                            vestuarioAbierto
                                                ? 'border-white/30 bg-zinc-100 text-zinc-900 dark:border-zinc-900/35 dark:bg-zinc-800 dark:text-white'
                                                : 'border-zinc-200 bg-zinc-900 text-white dark:border-zinc-600 dark:bg-zinc-100 dark:text-zinc-900'
                                        }`}
                                        aria-hidden
                                    >
                                        <Pencil className="size-2" strokeWidth={2.5} />
                                    </span>
                                )}
                            </span>
                            <span className="hidden sm:inline md:hidden">
                                {pendienteVestuario ? 'Actualizar' : 'Vestuario'}
                            </span>
                            <span className="hidden md:inline">
                                {pendienteVestuario ? 'Actualizar vestuario' : 'Vestuario'}
                            </span>
                            {total > 0 && (
                                <span className={`tabular-nums ${
                                    vestuarioAbierto
                                        ? 'text-zinc-300 dark:text-zinc-600'
                                        : 'text-zinc-500 dark:text-zinc-400'
                                }`}>{listos}/{total}</span>
                            )}
                            <ChevronDown className={`size-3.5 shrink-0 transition-transform duration-150 ease-out motion-reduce:transition-none sm:size-4 ${
                                vestuarioAbierto ? 'rotate-180' : ''
                            } ${vestuarioAbierto ? 'text-white dark:text-zinc-900' : ''}`} strokeWidth={2} />
                        </button>
                    )}

                    {!esBaja && !solicitudPendiente && (
                        <>
                            <button type="button" onClick={() => setModal('cambio')} title="Solicitar cambio de delegación"
                                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:min-h-0 sm:flex-initial sm:py-1.5 sm:text-[12px]">
                                <ArrowLeftRight className="size-3.5 shrink-0" strokeWidth={1.8} />
                                <span className="hidden sm:inline md:hidden">Cambio</span>
                                <span className="hidden md:inline">Cambio delegación</span>
                            </button>

                            <button type="button" onClick={() => setModal('baja')} title="Solicitar baja"
                                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-2 text-[11px] font-medium text-zinc-500 transition hover:border-red-200 hover:bg-red-50/80 hover:text-red-700 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-red-900/50 dark:hover:bg-red-950/30 dark:hover:text-red-400 sm:min-h-0 sm:flex-initial sm:py-1.5 sm:text-[12px]">
                                <XCircle className="size-3.5 shrink-0" strokeWidth={1.8} />
                                <span className="hidden sm:inline">Baja</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── solicitud pendiente ── */}
            {solicitudPendiente && (
                <div className="flex flex-col gap-2 border-t border-zinc-200 bg-zinc-50/80 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/50 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="flex min-w-0 items-start gap-2 text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400 sm:items-center sm:text-[12px]">
                        <Clock className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500 sm:mt-0" strokeWidth={1.8} />
                        <span className="min-w-0 break-words">
                            Solicitud de <span className="font-medium text-zinc-800 dark:text-zinc-200">{solicitudPendiente.tipo}</span> en revisión
                            {solicitudPendiente.delegacion_destino && (
                                <> · <span className="break-all font-mono text-zinc-700 dark:text-zinc-300 sm:break-normal">{solicitudPendiente.delegacion_destino}</span></>
                            )}
                        </span>
                    </div>
                    <button type="button" onClick={handleCancelarSolicitud}
                        className="flex shrink-0 items-center justify-center gap-1 self-end rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[11px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 sm:self-auto">
                        <X className="size-3" /> Cancelar
                    </button>
                </div>
            )}

            {/* ── vestuario accordion ── */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${vestuarioAbierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <VestuarioPanel vestuario={vestuario} onPrendaGuardada={handlePrendaGuardada} anioActual={anioActual} />
                </div>
            </div>

            {/* ── modales ── */}
            <ModalAccionEmpleado open={modal === 'baja'}   accion="baja"   empleado={empleado} delegaciones={delegaciones} onCerrar={cerrarModal} onGuardado={handleSolicitudEnviada} />
            <ModalAccionEmpleado open={modal === 'cambio'} accion="cambio" empleado={empleado} delegaciones={delegaciones} onCerrar={cerrarModal} onGuardado={handleSolicitudEnviada} />
        </div>
    );
}

function ResumenStatCard({ icon: Icon, label, value, hint }) {
    return (
        <div className="rounded-xl border border-zinc-200/80 border-l-2 border-l-brand-gold/35 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:border-l-brand-gold-soft/30 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
                    {hint ? (
                        <p className="mt-0.5 text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">{hint}</p>
                    ) : null}
                </div>
                <Icon
                    className="size-[18px] shrink-0 text-brand-gold/50 dark:text-brand-gold-soft/45"
                    strokeWidth={1.5}
                    aria-hidden
                />
            </div>
        </div>
    );
}

/* ─── ResumenCategorias ──────────────────────────────────────────── */

function ResumenCategorias({ prendas = [] }) {
    const [open, setOpen] = useState(false);

    // agrupar por año
    const porAnio = prendas.reduce((acc, p) => {
        if (!acc[p.anio]) acc[p.anio] = [];
        acc[p.anio].push(p);
        return acc;
    }, {});

    const anios = Object.keys(porAnio).sort((a, b) => b - a);

    if (prendas.length === 0) return null;

    return (
        <div className="mb-3 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30">
            {/* cabecera / toggle */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
            >
                <span className="flex items-center gap-2 text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                    <Tag className="size-3.5 shrink-0 text-brand-gold/65 dark:text-brand-gold-soft/55" strokeWidth={1.75} />
                    Resumen por categoría de prenda
                </span>
                <ChevronDown
                    className={`size-4 shrink-0 text-zinc-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                />
            </button>

            {/* panel acordeón */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="border-t border-zinc-200/80 px-4 pb-4 pt-3 dark:border-zinc-800 sm:px-5">
                        {anios.map((anio) => (
                            <div key={anio} className="mb-4 last:mb-0">
                                {/* año */}
                                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                    <span className="inline-block size-1 rounded-full bg-brand-gold/55 dark:bg-brand-gold-soft/45" aria-hidden />
                                    Año {anio}
                                </p>

                                {/* tabla de prendas */}
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[400px] text-[12px]">
                                        <thead>
                                            <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                                                <th className="pb-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                    Prenda
                                                </th>
                                                <th className="pb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                    Total
                                                </th>
                                                <th className="pb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                    Conf.
                                                </th>
                                                <th className="pb-1.5 text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                    Pend.
                                                </th>
                                                <th className="pb-1.5 pr-1 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                    %
                                                </th>
                                                <th className="w-[30%] pb-1.5 pl-3 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                                    Progreso
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                            {porAnio[anio].map((p) => (
                                                <tr key={`${anio}-${p.clave}`} className="align-middle">
                                                    <td className="py-2 pr-3">
                                                        <p className="font-medium text-zinc-800 dark:text-zinc-200 [overflow-wrap:anywhere]">
                                                            {p.descripcion}
                                                        </p>
                                                        {p.clave && (
                                                            <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{p.clave}</p>
                                                        )}
                                                    </td>
                                                    <td className="py-2 text-center tabular-nums text-zinc-600 dark:text-zinc-400">{p.total}</td>
                                                    <td className="py-2 text-center tabular-nums text-zinc-600 dark:text-zinc-400">{p.confirmadas}</td>
                                                    <td className="py-2 text-center tabular-nums text-zinc-600 dark:text-zinc-400">{p.pendientes}</td>
                                                    <td className="py-2 pr-1 text-right tabular-nums text-zinc-500 dark:text-zinc-400">{p.porcentaje}%</td>
                                                    <td className="py-2 pl-3">
                                                        <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-brand-gold/45 via-brand-gold/65 to-brand-gold-soft/55 dark:from-brand-gold-soft/35 dark:via-brand-gold-soft/50 dark:to-brand-gold/40 transition-all duration-500"
                                                                style={{ width: `${p.porcentaje}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── página principal ───────────────────────────────────────────── */

function MiDelegacionIndex({ empleados, delegaciones = [], contexto = {}, resumen = {}, resumen_prendas = [], filters = {} }) {
    const [search, setSearch] = useState(filters.search || '');
    const [filtro, setFiltro] = useState(filters.filtro || 'todos');
    const isFirstRender       = useRef(true);
    const anioVestuario       = resumen.anio_actual ?? new Date().getFullYear();

    const perPage = PER_PAGE_OPCIONES.includes(Number(filters.per_page))
        ? Number(filters.per_page)
        : 20;

    const navegar = (overrides = {}) => {
        const q = {
            filtro: overrides.filtro !== undefined ? overrides.filtro : filtro,
            per_page: overrides.per_page !== undefined ? overrides.per_page : perPage,
            page: overrides.page !== undefined ? overrides.page : 1,
        };
        const s = overrides.search !== undefined ? overrides.search : search;
        if (s) {
            q.search = s;
        }
        router.get(route('my-delegation.index'), q, {
            preserveState: true,
            preserveScroll: overrides.preserveScroll !== false,
            replace: true,
        });
    };

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const t = setTimeout(() => navegar({ page: 1 }), 300);
        return () => clearTimeout(t);
    }, [search]);

    const handleFiltro = (key) => {
        setFiltro(key);
        navegar({ filtro: key, page: 1 });
    };

    const handlePerPageChange = (e) => {
        navegar({ per_page: Number(e.target.value), page: 1, preserveScroll: false });
    };

    return (
        <>
            <Head title="Mi Delegación" />
            <AdminPageShell
                title="Mi delegación"
                description={
                    contexto.modo === 'super_admin' ? (
                        <>
                            Vista global (super admin).{' '}
                            <span className="tabular-nums">
                                Vestuario {resumen.anio_actual ?? new Date().getFullYear()} · ref.{' '}
                                {resumen.anio_ref ?? new Date().getFullYear() - 1}
                            </span>
                        </>
                    ) : contexto.modo === 'delegado' && contexto.delegaciones?.length ? (
                        <>
                            <span className="block font-medium [overflow-wrap:anywhere] break-words text-zinc-800 dark:text-zinc-100">
                                {contexto.delegado_nombre ?? 'Delegado'}
                            </span>
                            <p className="mt-1 text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
                                <span className="font-mono text-[11px] [overflow-wrap:anywhere] break-all text-zinc-600 dark:text-zinc-300 sm:break-normal sm:text-[12px]">
                                    {contexto.delegaciones.join(' · ')}
                                </span>
                                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600" aria-hidden>
                                    ·
                                </span>
                                <span className="whitespace-nowrap tabular-nums">
                                    {anioVestuario} · ref. {resumen.anio_ref ?? new Date().getFullYear() - 1}
                                </span>
                            </p>
                        </>
                    ) : (
                        <span className="tabular-nums">
                            Vestuario {resumen.anio_actual ?? new Date().getFullYear()} · ref.{' '}
                            {resumen.anio_ref ?? new Date().getFullYear() - 1}
                        </span>
                    )
                }
            >
                {contexto.modo === 'sin_perfil' && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                        <Info className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                        <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Tu cuenta no está vinculada a un registro de <strong className="font-medium text-zinc-800 dark:text-zinc-200">delegado</strong>.
                            Un administrador debe asociarte en <strong className="font-medium text-zinc-800 dark:text-zinc-200">Estructura → Delegados</strong>.
                        </p>
                    </div>
                )}

                <p className="mb-3 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                    Actualiza tallas, solicita cambio de delegación o baja desde cada fila.
                </p>

                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                    <ResumenStatCard icon={Users} label="Total" value={resumen.total ?? empleados.total} />
                    <ResumenStatCard icon={CheckCircle2} label="Listos" value={resumen.listos ?? 0} />
                    <ResumenStatCard icon={LayoutList} label="Sin empezar" value={resumen.sin_empezar ?? 0} />
                </div>

                <ResumenCategorias prendas={resumen_prendas} />

                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:justify-between sm:gap-3">
                    <div className="flex flex-wrap gap-0.5 rounded-md border border-zinc-200/80 bg-zinc-50/70 p-px dark:border-zinc-800 dark:bg-zinc-900/50">
                        {FILTROS.map((f) => (
                            <button key={f.key} type="button" onClick={() => handleFiltro(f.key)}
                                className={`rounded px-2.5 py-1 text-[10px] font-medium sm:px-3 sm:py-1.5 sm:text-[11px] ${
                                    filtro === f.key
                                        ? 'bg-zinc-100 text-zinc-900 shadow-sm ring-1 ring-brand-gold/25 dark:bg-zinc-800 dark:text-zinc-50 dark:ring-brand-gold-soft/22'
                                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                                }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex min-h-[40px] min-w-0 flex-1 items-center gap-2 rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 transition-[border-color,box-shadow] focus-within:border-brand-gold/40 focus-within:ring-1 focus-within:ring-brand-gold/15 dark:border-zinc-800 dark:bg-zinc-900/30 dark:focus-within:border-brand-gold-soft/35 dark:focus-within:ring-brand-gold-soft/12 sm:max-w-xs md:max-w-sm">
                        <Search className="size-4 shrink-0 text-brand-gold/65 dark:text-brand-gold-soft/55" aria-hidden />
                        <input
                            type="search"
                            placeholder="Buscar…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full min-w-0 border-0 bg-transparent p-0 text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                        />
                        {search ? (
                            <button type="button" onClick={() => setSearch('')}
                                className="shrink-0 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
                                Limpiar
                            </button>
                        ) : null}
                    </div>
                </div>

                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span className="flex items-center gap-2 text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
                        <span className="h-px w-4 bg-gradient-to-r from-transparent via-brand-gold/50 to-transparent dark:via-brand-gold-soft/40" aria-hidden />
                        Empleados
                    </span>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        <label className="flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
                            <span className="whitespace-nowrap">Ver</span>
                            <select
                                value={perPage}
                                onChange={handlePerPageChange}
                                aria-label="Empleados por página"
                                className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-2.5 pr-8 text-[12px] font-medium text-zinc-800 shadow-sm outline-none transition-[border-color,box-shadow] focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-900/40"
                            >
                                {PER_PAGE_OPCIONES.map((n) => (
                                    <option key={n} value={n}>{n}</option>
                                ))}
                            </select>
                            <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">por página</span>
                        </label>
                        <span className="tabular-nums text-[12px] text-zinc-400 dark:text-zinc-500">
                            {empleados.data.length} / {empleados.total}
                        </span>
                    </div>
                </div>

                {empleados.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/20">
                        <Users className="size-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} aria-hidden />
                        <div className="text-center">
                            <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Sin resultados</p>
                            <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">Ajusta búsqueda o filtro.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {empleados.data.map((emp) => (
                            <EmpleadoRow key={emp.id} empleado={emp} delegaciones={delegaciones} anioActual={anioVestuario} />
                        ))}
                    </div>
                )}

                {empleados.last_page > 1 && (
                    <div className="mt-6"><TablePagination pagination={empleados} /></div>
                )}
            </AdminPageShell>
        </>
    );
}

MiDelegacionIndex.layout = createAdminPageLayout('Mi Delegación');

export default MiDelegacionIndex;
