import AdminPageShell from '@/components/admin/AdminPageShell';
import TablePagination from '@/components/admin/TablePagination';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    AlertTriangle,
    ArrowLeftRight,
    CheckCircle2,
    ChevronDown,
    Clock,
    FileDown,
    Info,
    Lock,
    Package,
    Pencil,
    RotateCcw,
    Search,
    Shirt,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const FILTROS = [
    { key: 'todos',       label: 'Todos'       },
    { key: 'listos',      label: 'Listos'      },
    { key: 'sin_empezar', label: 'Sin empezar' },
    { key: 'bajas',       label: 'Bajas'       },
    { key: 'sin_nue',     label: 'Sin NUE'     },
];

const PER_PAGE_OPCIONES = [10, 15, 20, 30, 50, 100];

/* ─── PrendaRow ──────────────────────────────────────────────────── */
/* Ahora es controlado: recibe draft del panel padre y lo notifica */

function PrendaRow({ item, draftTalla, draftMedida, onDraftChange, onDraftRevert, periodoAbierto = true }) {
    const [editando, setEditando] = useState(false);

    const talla = draftTalla ?? item.talla ?? '';
    const medida = draftMedida ?? item.medida ?? '';
    const dirty = draftTalla !== undefined || draftMedida !== undefined;
    const confirmado = item.estado === 'confirmado' && !dirty;

    const cancelar = () => {
        onDraftRevert(item.id);
        setEditando(false);
    };

    return (
        <div className={`transition-colors ${
            editando
                ? 'rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40'
                : confirmado
                    ? 'rounded-xl bg-stone-50/50 dark:bg-stone-900/20'
                    : ''
        }`}>
            <div className="flex gap-3 px-1 py-3 sm:gap-3.5 sm:py-3.5">
                <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${
                    dirty
                        ? 'bg-stone-200/40 dark:bg-stone-700/35'
                        : confirmado
                            ? 'bg-stone-200/50 dark:bg-stone-800/50'
                            : 'bg-zinc-100 dark:bg-zinc-800'
                }`}>
                    {dirty
                        ? <Pencil className="size-3 text-stone-500 dark:text-stone-400" strokeWidth={2} />
                        : confirmado
                            ? <CheckCircle2 className="size-3 text-stone-500 dark:text-stone-400" strokeWidth={1.75} />
                            : <Clock className="size-3 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                    }
                </div>

                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="min-w-0">
                        {item.clave && (
                            <p className="font-mono text-[9px] text-zinc-400 dark:text-zinc-500">{item.clave}</p>
                        )}
                        <p className={`[overflow-wrap:anywhere] break-words text-[13px] font-medium leading-snug ${
                            confirmado ? 'text-zinc-800 dark:text-zinc-100' : 'text-zinc-800 dark:text-zinc-200'
                        }`}>
                            {item.prenda}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            <span className={`inline-flex items-center gap-0.5 rounded-full border px-1 py-px ${
                                dirty
                                    ? 'border-stone-200/80 bg-stone-100/50 dark:border-stone-600/40 dark:bg-stone-800/40'
                                    : confirmado
                                        ? 'border-stone-200/70 bg-stone-50/70 dark:border-stone-600/40 dark:bg-stone-800/35'
                                        : 'border-zinc-200/70 bg-zinc-50 dark:border-zinc-700/70 dark:bg-zinc-800/50'
                            }`}>
                                <span className={`text-[7px] font-semibold uppercase tracking-wide ${confirmado ? 'text-stone-500 dark:text-stone-400' : 'text-zinc-400'}`}>T</span>
                                <span className={`font-mono text-[9px] font-semibold leading-none ${confirmado ? 'text-stone-800 dark:text-stone-300' : 'text-zinc-800 dark:text-zinc-200'}`}>{talla || '—'}</span>
                            </span>
                            <span className={`inline-flex items-center gap-0.5 rounded-full border px-1 py-px ${
                                dirty
                                    ? 'border-stone-200/80 bg-stone-100/50 dark:border-stone-600/40 dark:bg-stone-800/40'
                                    : confirmado
                                        ? 'border-stone-200/70 bg-stone-50/70 dark:border-stone-600/40 dark:bg-stone-800/35'
                                        : 'border-zinc-200/70 bg-zinc-50 dark:border-zinc-700/70 dark:bg-zinc-800/50'
                            }`}>
                                <span className={`text-[7px] font-semibold uppercase tracking-wide ${confirmado ? 'text-stone-500 dark:text-stone-400' : 'text-zinc-400'}`}>M</span>
                                <span className={`font-mono text-[9px] font-semibold leading-none ${confirmado ? 'text-stone-800 dark:text-stone-300' : 'text-zinc-800 dark:text-zinc-200'}`}>{medida || '—'}</span>
                            </span>
                        </div>
                        {!editando && periodoAbierto && (
                            <button type="button" onClick={() => setEditando(true)}
                                className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-[11px] font-medium transition ${
                                    confirmado
                                        ? 'border-stone-200/80 bg-white text-stone-800 hover:bg-stone-50/90 dark:border-stone-600/45 dark:bg-stone-900/35 dark:text-stone-300 dark:hover:bg-stone-800/45'
                                        : 'border-zinc-200/90 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                }`}>
                                <Pencil className="size-3" strokeWidth={2} />
                                Editar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* panel edición inline */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${editando ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="flex flex-col gap-3 border-t border-zinc-100 pb-1 pt-4 dark:border-zinc-800/80 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 sm:pb-2 sm:pt-3.5">
                        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-1 sm:flex-wrap sm:items-end">
                            {[
                                { lbl: 'Talla',  val: talla,  field: 'talla',  ph: item.talla_anterior || 'Ej. M' },
                                { lbl: 'Medida', val: medida, field: 'medida', ph: 'Ej. 34' },
                            ].map(({ lbl, val, field, ph }) => (
                                <div key={lbl} className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[7rem]">
                                    <label htmlFor={`prenda-${item.id}-${lbl}`}
                                        className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                                        {lbl}
                                    </label>
                                    <input
                                        id={`prenda-${item.id}-${lbl}`}
                                        type="text"
                                        value={val}
                                        onChange={(e) => onDraftChange(item.id, field, field === 'talla' ? e.target.value.toUpperCase() : e.target.value)}
                                        placeholder={ph}
                                        maxLength={20}
                                        className="min-h-11 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 font-mono text-[14px] font-bold text-zinc-900 outline-none placeholder:font-normal placeholder:text-zinc-300 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 sm:min-h-0 sm:py-2 sm:text-[13px] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                        inputMode="text"
                                        autoComplete="off"
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="flex w-full gap-2 sm:w-auto sm:shrink-0 sm:items-center">
                            <button type="button" onClick={() => setEditando(false)}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:min-h-0 sm:flex-initial sm:rounded-md sm:px-3 sm:py-2 sm:text-[12px]">
                                <CheckCircle2 className="size-4 shrink-0 sm:size-3.5" />
                                Listo
                            </button>
                            {dirty && (
                                <button type="button" onClick={cancelar}
                                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[13px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 sm:min-h-0 sm:rounded-md sm:py-2 sm:text-[12px]">
                                    <RotateCcw className="size-3.5" strokeWidth={2} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── VestuarioPanel ─────────────────────────────────────────────── */

function VestuarioPanel({ empleadoId, vestuario, onPrendasGuardadas, anioActual = new Date().getFullYear(), periodoAbierto = true, loading = false }) {
    // drafts: { [asignacionId]: { talla?, medida? } }
    const [drafts, setDrafts]   = useState({});
    const [saving, setSaving]   = useState(false);
    const [flashOk, setFlashOk] = useState(false);
    const [errMsg, setErrMsg]   = useState('');

    const dirtyCount = Object.keys(drafts).length;

    const onDraftChange = useCallback((id, field, value) => {
        setDrafts((prev) => ({
            ...prev,
            [id]: { ...(prev[id] ?? {}), [field]: value },
        }));
    }, []);

    const onDraftRevert = useCallback((id) => {
        setDrafts((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    }, []);

    const guardarTodo = async () => {
        if (dirtyCount === 0) return;
        setSaving(true);
        setErrMsg('');
        try {
            const items = vestuario
                .filter((v) => drafts[v.id])
                .map((v) => ({
                    id:     v.id,
                    talla:  drafts[v.id]?.talla  ?? v.talla  ?? null,
                    medida: drafts[v.id]?.medida ?? v.medida ?? null,
                }));
            await axios.patch(route('my-delegation.vestuario.lote', empleadoId), { items });
            items.forEach(({ id, talla, medida }) => onPrendasGuardadas(id, talla, medida));
            setDrafts({});
            setFlashOk(true);
            setTimeout(() => setFlashOk(false), 3000);
            // Recarga solo las stats sin mover scroll ni estado de filtros
            router.reload({ only: ['resumen'], preserveScroll: true });
        } catch (e) {
            setErrMsg(e?.response?.data?.message ?? 'Error al guardar. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const confirmadas = vestuario.filter((v) => {
        if (drafts[v.id]) return true; // contará como confirmado tras guardar
        return v.estado === 'confirmado';
    }).length;
    const total = vestuario.length;
    const pct   = total > 0 ? Math.round((confirmadas / total) * 100) : 0;

    return (
        <div className="border-t border-zinc-100 px-4 pb-4 pt-4 dark:border-zinc-800/90">
            {/* cabecera */}
            <div className="mb-4 flex flex-col gap-2 border-b border-zinc-100 pb-3 dark:border-zinc-800/80 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                    Vestuario <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{anioActual}</span>
                </p>
                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                    <span className="text-[12px] tabular-nums text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">{confirmadas}</span>
                        <span className="text-zinc-300 dark:text-zinc-600"> / {total}</span>
                    </span>
                    {total > 0 && (
                        <div className="h-0.5 w-full overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800 sm:w-36">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-stone-300/50 to-stone-400/35 dark:from-stone-600/40 dark:to-stone-500/30 transition-all duration-500"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-[12px] text-zinc-400 dark:text-zinc-500">
                    <RotateCcw className="size-3.5 animate-spin" aria-hidden />
                    Cargando prendas (catálogo vigente por clave)…
                </div>
            ) : total === 0 ? (
                <p className="py-3.5 text-center text-[12px] text-zinc-400 dark:text-zinc-500">
                    Sin prendas asignadas en el año de referencia.
                </p>
            ) : (
                <>
                    <ul className="m-0 flex list-none flex-col divide-y divide-zinc-100 p-0 dark:divide-zinc-800/80">
                        {vestuario.map((item) => (
                            <li key={item.id}>
                                <PrendaRow
                                    item={item}
                                    draftTalla={drafts[item.id]?.talla}
                                    draftMedida={drafts[item.id]?.medida}
                                    onDraftChange={onDraftChange}
                                    onDraftRevert={onDraftRevert}
                                    periodoAbierto={periodoAbierto}
                                />
                            </li>
                        ))}
                    </ul>

                    {/* barra de guardado global */}
                    {(dirtyCount > 0 || flashOk || errMsg) && (
                        <div className="mt-3 flex flex-col gap-2">
                            {errMsg && (
                                <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-600 dark:bg-red-950/30 dark:text-red-400">
                                    {errMsg}
                                </p>
                            )}
                            {flashOk && (
                                <p className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-[11px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                                    <CheckCircle2 className="size-3.5 shrink-0 text-stone-500 dark:text-stone-400" />
                                    Vestuario actualizado correctamente.
                                </p>
                            )}
                            {dirtyCount > 0 && (
                                <button type="button" onClick={guardarTodo} disabled={saving}
                                    className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-700/90 bg-stone-800 px-5 py-2.5 text-[12px] font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-50 dark:border-stone-500 dark:bg-stone-600 dark:text-stone-50 dark:hover:bg-stone-500">
                                    {saving
                                        ? <><RotateCcw className="size-4 animate-spin" /> Guardando…</>
                                        : <><CheckCircle2 className="size-4" /> Actualizar todo · <span className="tabular-nums">{dirtyCount} {dirtyCount === 1 ? 'prenda' : 'prendas'}</span></>
                                    }
                                </button>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ─── Modal base ─────────────────────────────────────────────────── */

function Modal({ open, onClose, children, maxWidthClass = 'max-w-md', tone = 'default' }) {
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

    const shellTone = tone === 'bajaSoft'
        ? 'border-stone-200/50 bg-white shadow-sm shadow-stone-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none'
        : 'border-zinc-200/70 bg-zinc-50 shadow-md shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900';

    const backdropTone = tone === 'bajaSoft'
        ? 'bg-stone-900/25 backdrop-blur-[3px] dark:bg-zinc-900/40'
        : 'bg-zinc-900/40 backdrop-blur-[2px]';

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className={`absolute inset-0 ${backdropTone}`} onClick={onClose} />
            <div
                className={`relative z-10 w-full ${maxWidthClass} overflow-hidden rounded-2xl border ${shellTone}`}
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
        iconBg:   'bg-stone-100/80 dark:bg-zinc-800',
        iconClr:  'text-stone-500 dark:text-zinc-400',
        warnBg:   'bg-stone-50/95 dark:bg-zinc-900/50',
        warnRing: 'ring-stone-200/45 dark:ring-zinc-700/80',
        warnTxt:  'text-stone-600 dark:text-zinc-400',
        inputCls: 'border-stone-200/80 bg-white focus:border-stone-400/90 focus:ring-stone-200/30 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500',
        btnCls:   'border-2 border-stone-500/75 bg-white text-stone-800 hover:bg-stone-50/90 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/50',
        icon:     <XCircle className="size-5" strokeWidth={1.8} />,
        title:    'Solicitar baja',
        label:    'Motivo de baja',
        ph:       'Ej. Renuncia voluntaria, licencia médica indefinida, jubilación…',
        btnLbl:   'Enviar solicitud',
        warn:     (
            <>
                Elige si la baja es <strong className="font-semibold text-stone-700 dark:text-zinc-200">definitiva</strong> o si <strong className="font-semibold text-stone-700 dark:text-zinc-200">llega una persona en su lugar</strong>.
                En ambos casos se envía una <strong className="font-semibold text-stone-700 dark:text-zinc-200">solicitud</strong> a S.Administración; con sustituto incluye nombre y sexo (hombre/mujer) para el vestuario del nuevo empleado.
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
        btnCls:   'border-2 border-zinc-500/80 bg-white text-zinc-800 hover:bg-zinc-50/90 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/50',
        icon:     <ArrowLeftRight className="size-5" strokeWidth={1.8} />,
        title:    'Solicitar cambio de delegación',
        label:    'Nota del cambio',
        ph:       'Ej. Asignado a nuevas funciones, cambio de área…',
        btnLbl:   'Enviar solicitud',
        warn:     (
            <>
                Se enviará una <strong className="font-semibold">solicitud de cambio</strong> a S.Administración.
                Si el destino es de la misma UR, el recurso acompaña automáticamente al empleado.
                Si cambia de UR, la decisión de recurso y prendas se toma en Solicitudes.
                El movimiento se ejecuta hasta que sea aprobado.
            </>
        ),
    },
};

function ModalAccionEmpleado({ open, accion, empleado, delegaciones = [], onCerrar, onGuardado }) {
    const [obs, setObs]                     = useState('');
    const [nuevaDelegacion, setNuevaDelegacion] = useState('');
    const [bajaModo, setBajaModo]           = useState('definitiva');
    const [sustNombre, setSustNombre]       = useState('');
    const [sustApPat, setSustApPat]         = useState('');
    const [sustApMat, setSustApMat]         = useState('');
    const [sustNue, setSustNue]             = useState('');
    const [sustSexo, setSustSexo]           = useState('M');
    const [saving, setSaving]               = useState(false);
    const [error, setError]                 = useState('');

    // Delegaciones disponibles (misma u otra UR), excluyendo la actual.
    const delegacionesDisponibles = delegaciones.filter(
        (d) => d.codigo !== empleado?.delegacion_codigo,
    );

    useEffect(() => {
        if (open) {
            setObs('');
            setNuevaDelegacion('');
            setError('');
            setBajaModo('definitiva');
            setSustNombre('');
            setSustApPat('');
            setSustApMat('');
            setSustNue('');
            setSustSexo('M');
        }
    }, [open]);

    const cfg = MODAL_CFG[accion] ?? MODAL_CFG.baja;

    const guardar = async () => {
        if (accion === 'cambio' && !nuevaDelegacion) {
            setError('Debes seleccionar la delegación destino.');
            return;
        }
        if (accion === 'baja' && bajaModo === 'sustitucion') {
            if (!sustNombre.trim() || !sustApPat.trim()) {
                setError('Indica nombre y primer apellido de quien llega en su lugar.');
                return;
            }
        }
        setError('');
        setSaving(true);
        try {
            const payload = {
                tipo: accion,
                observacion: obs || null,
                nueva_delegacion: accion === 'cambio' ? nuevaDelegacion : undefined,
            };
            if (accion === 'baja') {
                payload.baja_modo = bajaModo;
                if (bajaModo === 'sustitucion') {
                    payload.sustituto = {
                        nombre: sustNombre.trim(),
                        apellido_paterno: sustApPat.trim(),
                        apellido_materno: sustApMat.trim() || '',
                        nue: sustNue.trim() || null,
                        sexo: sustSexo,
                    };
                }
            }
            const { data } = await axios.post(route('my-delegation.solicitar', empleado?.id), payload);
            onGuardado(accion, obs, nuevaDelegacion, data.data?.solicitud_id, { baja_modo: accion === 'baja' ? bajaModo : undefined });
        } catch (e) {
            setError(e?.response?.data?.message ?? 'No se pudo enviar la solicitud.');
        } finally {
            setSaving(false);
        }
    };

    const esBajaUi = accion === 'baja';

    return (
        <Modal open={open} onClose={onCerrar} maxWidthClass={esBajaUi ? 'max-w-2xl' : 'max-w-lg'} tone={esBajaUi ? 'bajaSoft' : 'default'}>
            {/* Cabecera */}
            <div className={`flex items-start justify-between gap-3 px-6 pb-4 pt-6 ${esBajaUi ? 'sm:px-8' : ''}`}>
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}>
                        <span className={cfg.iconClr}>{cfg.icon}</span>
                    </div>
                    <div className="min-w-0">
                        <h2 className={`text-[15px] font-bold ${esBajaUi ? 'text-stone-800 dark:text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'}`}>{cfg.title}</h2>
                        <p className={`mt-0.5 truncate text-[11px] ${esBajaUi ? 'max-w-none text-stone-500 dark:text-zinc-400' : 'max-w-[210px] text-zinc-500 dark:text-zinc-400'}`}>
                            {empleado?.nombre_completo}
                        </p>
                    </div>
                </div>
                <button type="button" onClick={onCerrar}
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl transition dark:hover:bg-zinc-800 dark:hover:text-zinc-300 ${esBajaUi ? 'text-stone-400 hover:bg-stone-100 hover:text-stone-600' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'}`}>
                    <X className="size-4" />
                </button>
            </div>

            {/* Divisor sutil */}
            <div className={`mx-6 h-px sm:mx-8 ${esBajaUi ? 'bg-stone-100 dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-800'}`} />

            {/* Cuerpo */}
            <div className={`px-6 py-5 ${esBajaUi ? 'sm:px-8' : ''}`}>
                {/* Aviso */}
                <div className={`mb-5 flex items-start gap-3 rounded-lg px-4 py-3 ring-1 ${cfg.warnBg} ${cfg.warnRing}`}>
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${cfg.iconClr}`} />
                    <p className={`text-[12px] leading-snug ${cfg.warnTxt}`}>{cfg.warn}</p>
                </div>

                {/* Tipo de baja — solo baja */}
                {accion === 'baja' && (
                    <div className="mb-5 space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-500">Modalidad</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <button
                                type="button"
                                onClick={() => { setBajaModo('definitiva'); setError(''); }}
                                className={`rounded-xl px-3 py-2.5 text-left text-[12px] font-medium transition ${
                                    bajaModo === 'definitiva'
                                        ? 'border-2 border-stone-500/75 bg-white text-stone-800 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100'
                                        : 'border border-stone-200/90 bg-stone-50/70 text-stone-700 hover:border-stone-300/90 hover:bg-stone-100/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                }`}
                            >
                                Baja definitiva
                                <span className="mt-0.5 block text-[10px] font-normal opacity-90">No hay relevo en el puesto</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setBajaModo('sustitucion'); setError(''); }}
                                className={`rounded-xl px-3 py-2.5 text-left text-[12px] font-medium transition ${
                                    bajaModo === 'sustitucion'
                                        ? 'border-2 border-stone-500/75 bg-white text-stone-800 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100'
                                        : 'border border-stone-200/90 bg-stone-50/70 text-stone-700 hover:border-stone-300/90 hover:bg-stone-100/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                }`}
                            >
                                Llega otra persona
                                <span className="mt-0.5 block text-[10px] font-normal opacity-90">Se solicita alta del sustituto</span>
                            </button>
                        </div>

                        {bajaModo === 'sustitucion' && (
                            <div className="space-y-3 rounded-xl border border-stone-200/60 bg-stone-50/70 p-4 dark:border-zinc-700/80 dark:bg-zinc-900/30">
                                <div className="flex items-center gap-2 text-[11px] font-medium text-stone-600 dark:text-zinc-400">
                                    <Users className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
                                    Datos de quien llega (van a la solicitud)
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-[10px] font-medium text-stone-500 dark:text-zinc-500">Nombre <span className="text-stone-700 dark:text-zinc-200">*</span></label>
                                        <input
                                            type="text"
                                            value={sustNombre}
                                            onChange={(e) => setSustNombre(e.target.value)}
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-stone-800 outline-none dark:bg-zinc-900 dark:text-zinc-200 ${cfg.inputCls}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-medium text-stone-500 dark:text-zinc-500">Primer apellido <span className="text-stone-700 dark:text-zinc-200">*</span></label>
                                        <input
                                            type="text"
                                            value={sustApPat}
                                            onChange={(e) => setSustApPat(e.target.value)}
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-stone-800 outline-none dark:bg-zinc-900 dark:text-zinc-200 ${cfg.inputCls}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-medium text-stone-500 dark:text-zinc-500">Segundo apellido</label>
                                        <input
                                            type="text"
                                            value={sustApMat}
                                            onChange={(e) => setSustApMat(e.target.value)}
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-stone-800 outline-none dark:bg-zinc-900 dark:text-zinc-200 ${cfg.inputCls}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-[10px] font-medium text-stone-500 dark:text-zinc-500">
                                            NUE <span className="font-normal text-stone-400 dark:text-zinc-500">— opcional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={sustNue}
                                            onChange={(e) => setSustNue(e.target.value)}
                                            maxLength={15}
                                            placeholder="Número de empleado único"
                                            className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-[13px] text-stone-800 outline-none placeholder:font-sans dark:bg-zinc-900 dark:text-zinc-200 ${cfg.inputCls}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="mb-2 text-[10px] font-medium text-stone-500 dark:text-zinc-500">Sexo (vestuario) <span className="text-stone-700 dark:text-zinc-200">*</span></p>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                ['M', 'Hombre'],
                                                ['F', 'Mujer'],
                                            ].map(([val, label]) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setSustSexo(val)}
                                                    className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition ${
                                                        sustSexo === val
                                                            ? 'border-2 border-stone-500/75 bg-white text-stone-800 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100'
                                                            : 'border border-stone-200/90 bg-white/80 text-stone-600 hover:border-stone-300/80 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400 dark:hover:border-zinc-600'
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Selector de delegación destino — solo para cambio */}
                {accion === 'cambio' && (
                    <div className="mb-5">
                        <label className="mb-2 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            Delegación destino <span className="text-zinc-700 dark:text-zinc-300">*</span>
                        </label>

                        {delegacionesDisponibles.length === 0 ? (
                            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-[12px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
                                No hay delegaciones destino disponibles.
                            </p>
                        ) : (
                            <select
                                value={nuevaDelegacion}
                                onChange={(e) => { setNuevaDelegacion(e.target.value); setError(''); }}
                                className={`w-full rounded-lg border bg-zinc-50/60 px-4 py-2.5 text-[13px] text-zinc-800 outline-none transition-[border-color,box-shadow] focus:bg-zinc-100 focus:ring-2 dark:bg-zinc-800/40 dark:text-zinc-200 dark:focus:bg-zinc-800 ${cfg.selectCls}`}
                            >
                                <option value="">— Selecciona la delegación destino —</option>
                                {delegacionesDisponibles.map((d) => (
                                    <option key={d.codigo} value={d.codigo}>
                                        {d.codigo}
                                        {d.ur === empleado?.ur ? ' — Misma UR' : ` — UR ${d.ur ?? 'N/D'}`}
                                    </option>
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
                    <label className={`mb-2 block text-[11px] font-semibold uppercase tracking-widest dark:text-zinc-500 ${esBajaUi ? 'text-stone-400' : 'text-zinc-400'}`}>
                        {cfg.label}
                        <span className={`ml-1.5 font-normal normal-case tracking-normal ${esBajaUi ? 'text-stone-400/90' : 'text-zinc-400'}`}> — opcional</span>
                    </label>
                    <textarea
                        value={obs} onChange={(e) => setObs(e.target.value)}
                        rows={2} maxLength={255} placeholder={cfg.ph}
                        className={`w-full resize-none rounded-lg border px-4 py-3 text-[13px] outline-none transition-[border-color,box-shadow] focus:ring-2 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-800 ${esBajaUi
                            ? 'border-stone-200/80 bg-white text-stone-800 placeholder:text-stone-400/80 focus:bg-stone-50/50 focus:ring-stone-200/35 dark:border-zinc-700 dark:bg-zinc-800/40 dark:focus:bg-zinc-800'
                            : 'bg-zinc-50/60 text-zinc-800 placeholder:text-zinc-400 focus:bg-zinc-100 dark:bg-zinc-800/40 dark:focus:bg-zinc-800'} ${cfg.inputCls}`}
                    />
                    <p className={`mt-1 text-right text-[10px] tabular-nums ${esBajaUi ? 'text-stone-400 dark:text-zinc-500' : 'text-zinc-400'}`}>{obs.length}/255</p>
                </div>

                {/* Error */}
                {error && (
                    <p className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-800/30 ${esBajaUi
                        ? 'bg-rose-50/90 text-rose-600/95 ring-1 ring-rose-200/40'
                        : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200/50'}`}
                    >
                        <AlertTriangle className="size-4 shrink-0" /> {error}
                    </p>
                )}

                {/* Botones */}
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                    <button type="button" onClick={guardar} disabled={saving}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-opacity disabled:opacity-50 ${cfg.btnCls}`}>
                        {saving ? <RotateCcw className="size-4 animate-spin" /> : cfg.icon}
                        {saving ? 'Enviando…' : cfg.btnLbl}
                    </button>
                    <button type="button" onClick={onCerrar}
                        className={`rounded-lg border px-4 py-2.5 text-[13px] font-medium sm:shrink-0 ${esBajaUi
                            ? 'border-stone-200/90 bg-stone-50/90 text-stone-600 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'}`}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/* ─── ModalProductos ─────────────────────────────────────────────── */

function ModalProductos({ empleado, open, onClose }) {
    const [tab, setTab]         = useState('licitados');
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');
    const [anioSeleccionado, setAnioSeleccionado] = useState('');

    useEffect(() => {
        if (!open || !empleado) return;
        setLoading(true);
        setError('');
        setData(null);
        axios
            .get(route('my-delegation.empleado.productos', empleado.id), {
                params: anioSeleccionado ? { anio: Number(anioSeleccionado) } : {},
            })
            .then((r) => {
                const payload = r.data?.data ?? null;
                setData(payload);
                if (payload?.anio != null && !anioSeleccionado) {
                    setAnioSeleccionado(String(payload.anio));
                }
                if (!payload?.licitados?.length && payload?.cotizados?.length) {
                    setTab('cotizados');
                }
            })
            .catch(() => setError('No se pudieron cargar los productos.'))
            .finally(() => setLoading(false));
    }, [open, empleado?.id, anioSeleccionado]);

    useEffect(() => {
        if (open) {
            setTab('licitados');
            setAnioSeleccionado('');
        }
    }, [open, empleado?.id]);

    const fmt$ = (v) =>
        v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : null;

    /* resumen de categorías: usa cotizados si existen, si no licitados */
    const resumenCategorias = useMemo(() => {
        if (!data) return [];
        const fuente = data.cotizados?.length ? data.cotizados : data.licitados ?? [];
        const mapa = new Map();
        fuente.forEach((p) => {
            (p.clasificaciones ?? []).forEach((c) => {
                const entry = mapa.get(c.codigo) ?? { codigo: c.codigo, nombre: c.nombre, total: 0, confirmadas: 0 };
                entry.total += 1;
                if (p.estado === 'confirmado') entry.confirmadas += 1;
                mapa.set(c.codigo, entry);
            });
            /* producto sin clasificación */
            if (!p.clasificaciones?.length) {
                const entry = mapa.get('__sin__') ?? { codigo: '__sin__', nombre: 'Sin clasificación', total: 0, confirmadas: 0 };
                entry.total += 1;
                if (p.estado === 'confirmado') entry.confirmadas += 1;
                mapa.set('__sin__', entry);
            }
        });
        return [...mapa.values()].sort((a, b) => b.total - a.total);
    }, [data]);

    const TABS = ['licitados', 'cotizados', 'categorias'];
    const lista = data ? (tab === 'licitados' ? data.licitados : tab === 'cotizados' ? data.cotizados : []) : [];

    return (
        <Modal open={open} onClose={onClose} maxWidthClass="max-w-6xl">
            {/* ── encabezado ── */}
            <div className="flex items-start justify-between gap-2 px-5 pb-3 pt-5">
                <div className="min-w-0">
                    <h2 className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                        Productos asignados
                    </h2>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-400 dark:text-zinc-500">
                        {empleado?.nombre_completo}
                        {data?.anio && <span className="ml-1 tabular-nums">· {data.anio}</span>}
                    </p>
                </div>
                <button type="button" onClick={onClose}
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300">
                    <X className="size-3.5" />
                </button>
            </div>

            {data?.anios_disponibles?.length > 0 && (
                <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Mostrando productos del año <span className="font-semibold text-zinc-800 dark:text-zinc-200">{data.anio}</span>
                    </p>
                    <label className="flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span>Año</span>
                        <select
                            value={anioSeleccionado}
                            onChange={(e) => setAnioSeleccionado(e.target.value)}
                            className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-[12px] font-medium text-zinc-800 outline-none transition-[border-color,box-shadow] focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-900/40"
                        >
                            {data.anios_disponibles.map((anio) => (
                                <option key={anio} value={String(anio)}>
                                    {anio}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
            )}

            {/* ── tabs: ancho natural, alineados a la izquierda; scroll si no caben ── */}
            <div className="border-b border-zinc-100 px-5 dark:border-zinc-800">
                <div
                    role="tablist"
                    className="-mb-px flex max-w-full gap-1 overflow-x-auto overflow-y-hidden pb-px [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {TABS.map((id) => {
                        const labels = { licitados: 'Licitados', cotizados: 'Cotizados', categorias: 'Categorías' };
                        const count = id === 'categorias'
                            ? (data ? resumenCategorias.length : null)
                            : (data?.[id]?.length ?? null);
                        const active = tab === id;
                        return (
                            <button
                                key={id}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setTab(id)}
                                className={`relative shrink-0 whitespace-nowrap border-b-2 pb-2.5 pl-1 pr-3 pt-1 text-left text-[12px] font-semibold transition-colors ${
                                    active
                                        ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50'
                                        : 'border-transparent text-zinc-400 hover:border-zinc-200 hover:text-zinc-700 dark:text-zinc-500 dark:hover:border-zinc-700 dark:hover:text-zinc-300'
                                }`}
                            >
                                {labels[id]}
                                {count != null && (
                                    <span
                                        className={`ml-1.5 tabular-nums text-[10px] font-medium ${
                                            active ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── lista ── */}
            <div className="max-h-[62vh] overflow-y-auto">
                {loading && (
                    <div className="flex items-center justify-center gap-2 py-16 text-[11px] text-zinc-400">
                        <RotateCcw className="size-3.5 animate-spin" /> Cargando…
                    </div>
                )}
                {error && (
                    <p className="mx-5 my-4 rounded-lg bg-red-50 px-3 py-2.5 text-[11px] text-red-600 dark:bg-red-950/30 dark:text-red-400">
                        {error}
                    </p>
                )}
                {/* ── tab CATEGORÍAS ── */}
                {data && tab === 'categorias' && (
                    resumenCategorias.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-16 text-center">
                            <Tag className="size-7 text-zinc-200 dark:text-zinc-700" strokeWidth={1.25} />
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Sin clasificaciones registradas.</p>
                        </div>
                    ) : (
                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                            {resumenCategorias.map((cat, catIdx) => {
                                const pct = cat.total > 0 ? Math.round((cat.confirmadas / cat.total) * 100) : 0;
                                return (
                                    <li key={`${cat.codigo}-${catIdx}-${cat.nombre}`} className="flex items-center gap-4 px-5 py-3.5">
                                        {/* nombre */}
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
                                                {cat.nombre}
                                            </p>
                                            {cat.codigo !== '__sin__' && (
                                                <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{cat.codigo}</p>
                                            )}
                                        </div>
                                        {/* barra + conteo */}
                                        <div className="flex shrink-0 items-center gap-3">
                                            <div className="hidden w-20 sm:block">
                                                <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-stone-300/50 to-stone-400/35 dark:from-stone-600/40 dark:to-stone-500/30 transition-all duration-500"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="min-w-[1.5rem] text-right text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                                                {cat.total}
                                            </span>
                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                                {cat.confirmadas}/{cat.total}
                                            </span>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )
                )}

                {data && tab !== 'categorias' && lista.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-16 text-center">
                        <Package className="size-7 text-zinc-200 dark:text-zinc-700" strokeWidth={1.25} />
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                            Sin productos {tab === 'licitados' ? 'licitados' : 'cotizados'}.
                        </p>
                    </div>
                )}

                {data && tab !== 'categorias' && lista.length > 0 && (
                    <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        {lista.map((p) => {
                            const clasifs = Array.isArray(p.clasificaciones) ? p.clasificaciones : [];
                            const confirmado = p.estado === 'confirmado';

                            /* pares label/valor filtrados */
                            const campos = tab === 'licitados'
                                ? [
                                    ['Partida',    p.numero_partida, false],
                                    ['Marca',      p.marca,          false],
                                    ['Unidad',     p.unidad,         false],
                                    ['Medida',     p.medida,         false],
                                    ['Proveedor',  p.proveedor,      false],
                                    ['P.U.',       fmt$(p.precio_unitario), false],
                                    ['Cant.',      p.cantidad_asignada, false],
                                    ['Talla',      p.talla,          true],
                                    ['Rubro',      p.clave_rubro,    true],
                                ]
                                : [
                                    ['Partida',    p.numero_partida, false],
                                    ['Ref.',       p.referencia,     true],
                                    ['P.U.',       fmt$(p.precio_unitario), false],
                                    ['Total',      fmt$(p.total),    false],
                                    ['Cant.',      p.cantidad_asignada, false],
                                    ['Talla',      p.talla,          true],
                                    ['Medida',     p.medida,         false],
                                    ['Rubro',      p.clave_rubro,    true],
                                ];

                            const camposValidos = campos.filter(([, v]) => v != null && v !== '');

                            return (
                                <li key={p.asignacion_id} className="px-5 py-4">
                                    {/* nombre + estado */}
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[12px] font-semibold leading-tight text-zinc-900 dark:text-zinc-100 [overflow-wrap:anywhere]">
                                                {p.descripcion}
                                            </p>
                                            {p.codigo && (
                                                <p className="mt-0.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                                                    {p.codigo}
                                                </p>
                                            )}
                                        </div>
                                        {tab === 'cotizados' && p.estado && (
                                            <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${
                                                confirmado
                                                    ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                                    : 'bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500'
                                            }`}>
                                                {p.estado}
                                            </span>
                                        )}
                                    </div>

                                    {/* clasificaciones */}
                                    {clasifs.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {clasifs.map((c, ci) => (
                                                <span key={`${p.asignacion_id}-${c.codigo}-${ci}`}
                                                    className="rounded-full border border-zinc-200/80 px-2 py-px text-[10px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                                                    title={c.nombre}
                                                >
                                                    {c.nombre}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* atributos en grid compacto */}
                                    {camposValidos.length > 0 && (
                                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                                            {camposValidos.map(([label, value, mono], fi) => (
                                                <span key={`${p.asignacion_id}-${label}-${fi}`} className="flex items-baseline gap-1 text-[11px]">
                                                    <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
                                                    <span className={`text-zinc-700 dark:text-zinc-300 ${mono ? 'font-mono' : ''}`}>
                                                        {value}
                                                    </span>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>

            {/* espaciado inferior */}
            <div className="h-3" />
        </Modal>
    );
}

/* ─── EmpleadoRow ────────────────────────────────────────────────── */

function EmpleadoRow({ empleado, delegaciones, anioActual, periodoAbierto = true, acuseAnio = null }) {
    const [vestuarioAbierto, setVestuarioAbierto] = useState(false);
    const [modal, setModal]                        = useState(null);
    const [verProductos, setVerProductos]          = useState(false);
    const [vestuario, setVestuario]                = useState(empleado.vestuario);
    const [vestuarioCargando, setVestuarioCargando] = useState(false);
    const [vestuarioFetchKey, setVestuarioFetchKey] = useState(0);
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

    // Llamado cuando el panel guarda una prenda individual o en lote
    const handlePrendaGuardada = useCallback((id, nuevaTalla, nuevaMedida) => {
        setVestuario((prev) => prev.map((v) =>
            v.id === id ? { ...v, talla: nuevaTalla, medida: nuevaMedida, estado: 'confirmado' } : v
        ));
    }, []);

    const handleSolicitudEnviada = useCallback((tipo, obs, destino, solicitudId, meta = {}) => {
        setSolicitudPendiente({
            id: solicitudId,
            tipo,
            delegacion_destino: destino,
            baja_modo: meta.baja_modo ?? null,
        });
        cerrarModal();
    }, []);

    const handleCancelarSolicitud = async () => {
        if (!solicitudPendiente?.id) return;
        try {
            await axios.delete(route('my-delegation.solicitud.cancelar', solicitudPendiente.id));
            setSolicitudPendiente(null);
        } catch { /* sin acción */ }
    };

    useEffect(() => {
        if (!vestuarioAbierto) return;
        let cancelled = false;
        setVestuarioCargando(true);
        axios
            .get(route('my-delegation.empleado.vestuario', empleado.id))
            .then((r) => {
                if (cancelled) return;
                const list = r.data?.data?.vestuario;
                if (Array.isArray(list)) {
                    setVestuario(list);
                    setVestuarioFetchKey((k) => k + 1);
                }
            })
            .catch(() => { /* mantener lista previa */ })
            .finally(() => {
                if (!cancelled) setVestuarioCargando(false);
            });
        return () => {
            cancelled = true;
        };
    }, [vestuarioAbierto, empleado.id]);

    /** Listado inicial viene sin prendas; usar métricas del servidor hasta cargar el detalle al abrir el panel. */
    const tieneDetalleVestuario = vestuario.length > 0;
    const totalPrendas = tieneDetalleVestuario ? vestuario.length : (empleado.total_prendas ?? 0);
    const enBajaCount = tieneDetalleVestuario
        ? vestuario.filter((v) => v.estado === 'baja').length
        : (empleado.bajas_vestuario ?? 0);
    const confirmadasOCambio = tieneDetalleVestuario
        ? vestuario.filter((v) => v.estado === 'confirmado' || v.estado === 'cambio').length
        : (empleado.confirmadas ?? 0);
    const requeridas = totalPrendas - enBajaCount;
    const listos = confirmadasOCambio;
    const completo = tieneDetalleVestuario
        ? totalPrendas > 0 && confirmadasOCambio >= requeridas
        : empleado.vestuario_listo === true;
    /** Coincide con backend; con detalle local, `completo` gana sobre la marca del listado. */
    const vestuarioListo = empleado.vestuario_listo === true || completo;
    const pendienteVestuario = totalPrendas > 0 && !completo;
    const total = totalPrendas;
    const esBaja   = estadoDelegacion === 'baja';
    const esCambio = estadoDelegacion === 'cambio';

    const cardCls = esBaja
        ? 'border-rose-200/50 bg-rose-50/20 dark:border-rose-900/25 dark:bg-rose-950/10'
        : esCambio
            ? 'border-zinc-200/80 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/25'
            : vestuarioListo && !esBaja && !esCambio
                ? 'border-zinc-200/80 border-l-[3px] border-l-stone-300/80 bg-stone-50/30 shadow-sm shadow-zinc-900/[0.02] hover:border-zinc-300/90 dark:border-zinc-800 dark:border-l-stone-600/50 dark:bg-zinc-950/35 dark:shadow-none dark:hover:border-zinc-700'
                : vestuarioAbierto
                    ? 'border-zinc-300/90 bg-white dark:border-zinc-600 dark:bg-zinc-950/50'
                    : 'border-zinc-200/70 bg-white hover:border-zinc-300/80 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:border-zinc-700';

    const avatarCls = esBaja
        ? 'bg-rose-50/90 text-rose-700/90 ring-1 ring-rose-100/80 dark:bg-rose-950/25 dark:text-rose-400/90 dark:ring-rose-900/30'
        : esCambio
            ? 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700'
            : vestuarioListo
                ? 'bg-stone-100/80 text-stone-700 ring-1 ring-stone-200/60 dark:bg-stone-800/50 dark:text-stone-300 dark:ring-stone-600/40'
                : 'bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-zinc-700/80';

    return (
        <div className={`overflow-hidden rounded-2xl border ${cardCls}`}>

            {/* ── cabecera tarjeta: datos + acciones ── */}
            <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex min-w-0 flex-1 gap-3">
                    {/* avatar */}
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${avatarCls}`}>
                        {esBaja
                            ? <XCircle className="size-4" strokeWidth={1.5} />
                            : esCambio
                                ? <ArrowLeftRight className="size-4" strokeWidth={1.5} />
                                : empleado.nombre_completo.charAt(0)
                        }
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`min-w-0 break-words text-[13px] font-medium leading-snug tracking-tight ${
                                esBaja ? 'text-rose-600/75 line-through decoration-rose-200/70 dark:text-rose-400/75' : 'text-zinc-800 dark:text-zinc-100'
                            }`}>
                                {empleado.nombre_completo}
                            </span>
                            {esBaja && (
                                <span className="inline-flex shrink-0 items-center rounded-full bg-rose-50/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-rose-700/85 dark:bg-rose-950/30 dark:text-rose-400/90">
                                    Baja
                                </span>
                            )}
                            {esCambio && (
                                <span className="inline-flex shrink-0 items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                    Cambio
                                </span>
                            )}
                            {!esBaja && !esCambio && (
                                <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${
                                    vestuarioListo
                                        ? 'bg-stone-100/90 text-stone-700 dark:bg-stone-800/60 dark:text-stone-300'
                                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-400'
                                }`}>
                                    {vestuarioListo ? 'Listo' : `${listos}/${total}`}
                                </span>
                            )}
                        </div>
                        {empleado.nue && (
                            <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">{empleado.nue}</p>
                        )}
                        {obsDelegacion && (
                            <p className="break-words text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                “{obsDelegacion}”
                            </p>
                        )}
                    </div>
                </div>

                {/* acciones: fila completa en móvil, columna a la derecha en desktop */}
                <div className="flex w-full flex-wrap items-center justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800/80 sm:w-auto sm:shrink-0 sm:border-0 sm:pt-0">
                    {!solicitudPendiente && (esBaja || esCambio) && (
                        <button type="button" onClick={handleReactivar} disabled={reactivando}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 text-[11px] font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
                            {reactivando ? <RotateCcw className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
                            Reactivar
                        </button>
                    )}

                    {!esBaja && (
                        <button type="button" onClick={() => setVestuarioAbierto((p) => !p)}
                            title={periodoAbierto
                                ? (pendienteVestuario ? `Actualizar vestuario ${anioActual}` : `Vestuario ${anioActual}`)
                                : `Ver vestuario ${anioActual}`}
                            aria-label={
                                (periodoAbierto
                                    ? (pendienteVestuario ? 'Actualizar vestuario' : 'Vestuario')
                                    : 'Ver vestuario')
                                + ` ${anioActual}`
                                + (total > 0 ? `, ${listos} de ${total} prendas` : '')
                            }
                            className={`inline-flex h-9 max-w-full flex-1 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-medium transition sm:flex-initial sm:justify-start ${
                                vestuarioAbierto
                                    ? 'border-stone-300/80 bg-stone-200/40 text-stone-900 dark:border-stone-600 dark:bg-stone-800/70 dark:text-stone-100'
                                    : periodoAbierto && pendienteVestuario
                                        ? 'border-stone-200/90 bg-stone-50/90 text-stone-800 hover:border-stone-300 dark:border-stone-600/50 dark:bg-stone-900/40 dark:text-stone-200 dark:hover:border-stone-500/50'
                                        : 'border-zinc-200/80 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50/90 dark:border-zinc-700/80 dark:bg-zinc-950/40 dark:text-zinc-300 dark:hover:bg-zinc-900/60'
                            }`}>
                            <span className="relative inline-flex shrink-0">
                                <Shirt className="size-3.5 shrink-0 opacity-90" strokeWidth={1.75} />
                                {periodoAbierto && pendienteVestuario && (
                                    <span
                                        className={`absolute -right-1 -top-1 flex size-3 items-center justify-center rounded-full border sm:hidden ${
                                            vestuarioAbierto
                                                ? 'border-stone-200 bg-white text-stone-700 dark:border-stone-600 dark:bg-zinc-900 dark:text-stone-300'
                                                : 'border-zinc-200 bg-zinc-700 text-white dark:border-zinc-600 dark:bg-zinc-600 dark:text-white'
                                        }`}
                                        aria-hidden
                                    >
                                        <Pencil className="size-2" strokeWidth={2.5} />
                                    </span>
                                )}
                            </span>
                            <span className="hidden sm:inline md:hidden">
                                {periodoAbierto ? (pendienteVestuario ? 'Actualizar' : 'Vestuario') : 'Ver'}
                            </span>
                            <span className="hidden md:inline">
                                {periodoAbierto ? (pendienteVestuario ? 'Actualizar vestuario' : 'Vestuario') : 'Ver vestuario'}
                            </span>
                            {total > 0 && (
                                <span className={`tabular-nums opacity-80 ${
                                    vestuarioAbierto ? 'text-zinc-800 dark:text-zinc-200' : ''
                                }`}>{listos}/{total}</span>
                            )}
                            <ChevronDown className={`size-3.5 shrink-0 opacity-70 transition-transform duration-150 ease-out motion-reduce:transition-none sm:size-4 ${
                                vestuarioAbierto ? 'rotate-180' : ''
                            }`} strokeWidth={2} />
                        </button>
                    )}

                    {!esBaja && !esCambio && total > 0 && empleado.tiene_registro_anio_actual === true && vestuarioListo && (
                        <a
                            href={route('my-delegation.empleado.acuse-pdf', { empleado: empleado.id, anio: acuseAnio || undefined })}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`Descargar acuse de recibo en PDF${acuseAnio ? ` (${acuseAnio})` : ''}`}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-stone-200/90 bg-stone-100/60 px-3 text-[11px] font-medium text-stone-700 transition hover:bg-stone-100 dark:border-stone-600/40 dark:bg-stone-800/45 dark:text-stone-300 dark:hover:bg-stone-800/65"
                        >
                            <FileDown className="size-3.5 shrink-0 text-stone-500 dark:text-stone-400" strokeWidth={1.75} />
                            <span className="hidden sm:inline">Acuse PDF</span>
                            <span className="sm:hidden">PDF</span>
                        </a>
                    )}

                    {!esBaja && !solicitudPendiente && (
                        <>
                            <button type="button" onClick={() => setModal('cambio')} title="Solicitar cambio de delegación"
                                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-200/85 bg-zinc-50/90 px-3 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-100/90 sm:flex-initial dark:border-zinc-700/70 dark:bg-zinc-900/35 dark:text-zinc-400 dark:hover:bg-zinc-800/50">
                                <ArrowLeftRight className="size-3.5 shrink-0 opacity-90" strokeWidth={1.8} />
                                <span className="hidden sm:inline md:hidden">Cambio</span>
                                <span className="hidden md:inline">Cambio delegación</span>
                            </button>

                            <button type="button" onClick={() => setModal('baja')} title="Solicitar baja"
                                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-rose-200/50 bg-rose-50/40 px-3 text-[11px] font-medium text-rose-800/80 transition hover:bg-rose-50/80 sm:flex-initial dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400/85 dark:hover:bg-rose-950/30">
                                <XCircle className="size-3.5 shrink-0 opacity-90" strokeWidth={1.8} />
                                <span className="hidden sm:inline">Baja</span>
                            </button>
                        </>
                    )}

                    <button type="button" onClick={() => setVerProductos(true)}
                        title="Ver productos asignados (licitados y cotizados)"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-zinc-200/70 bg-zinc-50/70 px-3 text-[11px] font-medium text-zinc-600 transition hover:bg-zinc-100/80 dark:border-zinc-700/70 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-zinc-800/60">
                        <Package className="size-3.5 shrink-0 opacity-90" strokeWidth={1.75} />
                        <span className="hidden sm:inline">Productos</span>
                    </button>
                </div>
            </div>

            {/* ── solicitud pendiente ── */}
            {solicitudPendiente && (
                <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/35 sm:flex-row sm:items-center sm:justify-between sm:px-4">
                    <div className="flex min-w-0 items-start gap-2.5 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400 sm:items-center">
                        <Clock className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500 sm:mt-0" strokeWidth={1.5} />
                        <span className="min-w-0 break-words">
                            Solicitud de{' '}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {solicitudPendiente.tipo === 'baja' && solicitudPendiente.baja_modo === 'sustitucion'
                                    ? 'baja con sustituto'
                                    : solicitudPendiente.tipo}
                            </span>{' '}
                            en revisión
                            {solicitudPendiente.delegacion_destino && (
                                <> · <span className="break-all font-mono text-[11px] text-zinc-600 dark:text-zinc-400 sm:break-normal">{solicitudPendiente.delegacion_destino}</span></>
                            )}
                        </span>
                    </div>
                    <button type="button" onClick={handleCancelarSolicitud}
                        className="flex h-9 shrink-0 items-center justify-center gap-1 self-end rounded-full border border-zinc-200 bg-white px-3 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:self-auto">
                        <X className="size-3.5" strokeWidth={2} /> Cancelar
                    </button>
                </div>
            )}

            {/* ── vestuario accordion ── */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${vestuarioAbierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <VestuarioPanel
                        key={`${empleado.id}-${vestuarioFetchKey}`}
                        empleadoId={empleado.id}
                        vestuario={vestuario}
                        onPrendasGuardadas={handlePrendaGuardada}
                        anioActual={anioActual}
                        periodoAbierto={periodoAbierto}
                        loading={vestuarioCargando}
                    />
                </div>
            </div>

            {/* ── modales ── */}
            <ModalAccionEmpleado open={modal === 'baja'}   accion="baja"   empleado={empleado} delegaciones={delegaciones} onCerrar={cerrarModal} onGuardado={handleSolicitudEnviada} />
            <ModalAccionEmpleado open={modal === 'cambio'} accion="cambio" empleado={empleado} delegaciones={delegaciones} onCerrar={cerrarModal} onGuardado={handleSolicitudEnviada} />
            <ModalProductos
                empleado={{ id: empleado.id, nombre_completo: empleado.nombre_completo }}
                open={verProductos}
                onClose={() => setVerProductos(false)}
            />
        </div>
    );
}

/* ─── página principal ───────────────────────────────────────────── */

function MiDelegacionIndex({
    empleados,
    delegaciones = [],
    contexto = {},
    resumen = {},
    periodo = null,
    filters = {},
    acuse_anios_disponibles = [],
    acuse_anio_default = null,
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [filtro, setFiltro] = useState(filters.filtro || 'todos');
    const isFirstRender       = useRef(true);
    const anioRefFallback =
        resumen.anio_ref ?? resumen.anio_actual ?? new Date().getFullYear();
    const anioVestuario       = resumen.anio_actual ?? new Date().getFullYear();

    const perPage = PER_PAGE_OPCIONES.includes(Number(filters.per_page))
        ? Number(filters.per_page)
        : 20;
    const esVistaIndependiente = filters.modo === 'independiente'
        || (typeof filters.delegacion_codigo === 'string' && filters.delegacion_codigo.startsWith('IND-'));
    const moduleTitle = esVistaIndependiente ? 'Delegación independiente' : 'Mi Delegación';
    const aniosAcuse = Array.isArray(acuse_anios_disponibles) ? acuse_anios_disponibles : [];
    const acuseAnio =
        aniosAcuse.length > 0
            ? String(acuse_anio_default && aniosAcuse.includes(acuse_anio_default) ? acuse_anio_default : aniosAcuse[0])
            : '';
    const exportParams = {
        search: search || undefined,
        filtro,
        delegacion_codigo: filters.delegacion_codigo ?? undefined,
        modo: filters.modo ?? undefined,
        anio: acuseAnio ? Number(acuseAnio) : undefined,
    };

    const navegar = (overrides = {}) => {
        const q = {
            filtro: overrides.filtro !== undefined ? overrides.filtro : filtro,
            per_page: overrides.per_page !== undefined ? overrides.per_page : perPage,
            page: overrides.page !== undefined ? overrides.page : 1,
            delegacion_codigo: filters.delegacion_codigo ?? undefined,
            modo: filters.modo ?? undefined,
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
            <Head title={moduleTitle} />
            <AdminPageShell
                title={moduleTitle}
                description={
                    contexto.modo === 'super_admin' ? (
                        <>
                            Vista global (super admin).{' '}
                            <span className="tabular-nums">
                                Vestuario {resumen.anio_actual ?? new Date().getFullYear()} · ref.{' '}
                                {anioRefFallback}
                            </span>
                        </>
                    ) : contexto.modo === 'delegado' && contexto.delegaciones?.length ? (
                        <p className="text-[13px] leading-snug text-zinc-600 dark:text-zinc-400">
                            <span className="font-medium text-zinc-800 dark:text-zinc-100">
                                {contexto.delegado_nombre ?? 'Delegado'}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-600" aria-hidden> · </span>
                            <span className="font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
                                {contexto.delegaciones.join(' · ')}
                            </span>
                        </p>
                    ) : (
                        <span className="tabular-nums">
                            Vestuario {resumen.anio_actual ?? new Date().getFullYear()} · ref.{' '}
                            {anioRefFallback}
                        </span>
                    )
                }
            >
                {contexto.modo === 'sin_perfil' && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                        <Info className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                        <p className="text-[12px] leading-tight text-zinc-600 dark:text-zinc-400">
                            Tu cuenta no está vinculada a un registro de <strong className="font-medium text-zinc-800 dark:text-zinc-200">delegado</strong>.
                            Un administrador debe asociarte en <strong className="font-medium text-zinc-800 dark:text-zinc-200">Estructura → Delegados</strong>.
                        </p>
                    </div>
                )}

                <div className="mb-6 border-b border-zinc-100 pb-6 dark:border-zinc-800/80">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                        <p className="max-w-2xl text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                            Tallas, cambio de delegación y bajas se gestionan en cada fila.
                        </p>
                        {periodo && periodo.estado !== 'abierto' && (
                            <p className="shrink-0 text-[12px] leading-snug text-zinc-500 dark:text-zinc-500 sm:text-right">
                                <span className="inline-flex items-center gap-1.5">
                                    <Lock className="size-3 shrink-0 opacity-60" strokeWidth={1.5} aria-hidden />
                                    {periodo.estado === 'cerrado' ? 'Período cerrado' : 'Período próximo'}
                                </span>
                                <span className="mt-1 block text-zinc-600 dark:text-zinc-400">{periodo.nombre}</span>
                            </p>
                        )}
                        {periodo?.estado === 'abierto' && (
                            <p className="shrink-0 text-[12px] leading-snug text-zinc-500 dark:text-zinc-500 sm:text-right">
                                <span className="font-medium text-zinc-700 dark:text-zinc-300">{periodo.nombre}</span>
                                {periodo.fecha_fin && (
                                    <>
                                        <span className="text-zinc-300 dark:text-zinc-600"> · </span>
                                        <span className="tabular-nums">
                                            hasta{' '}
                                            {new Date(periodo.fecha_fin + 'T12:00:00').toLocaleDateString('es-MX', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                </div>

                <section className="mb-8 space-y-4" aria-label="Resumen y filtros">
                    <div
                        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px] text-zinc-500 dark:text-zinc-400"
                        aria-live="polite"
                    >
                        <span className="tabular-nums">
                            <span className="mr-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                Total
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{resumen.total ?? empleados.total}</span>
                        </span>
                        <span className="text-zinc-200 dark:text-zinc-700" aria-hidden>
                            ·
                        </span>
                        <span className="tabular-nums">
                            <span className="mr-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                Listos
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{resumen.listos ?? 0}</span>
                        </span>
                        <span className="text-zinc-200 dark:text-zinc-700" aria-hidden>
                            ·
                        </span>
                        <span className="tabular-nums">
                            <span className="mr-1.5 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                Sin empezar
                            </span>
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{resumen.sin_empezar ?? 0}</span>
                        </span>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                        <div
                            role="tablist"
                            aria-label="Filtrar empleados por estado"
                            className="flex flex-wrap gap-1"
                        >
                            {FILTROS.map((f) => {
                                const active = filtro === f.key;
                                return (
                                    <button
                                        key={f.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => handleFiltro(f.key)}
                                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                            active
                                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-4 sm:border-t-0 sm:pt-0 dark:border-zinc-800/80">
                            {(resumen.total ?? 0) > 0 && (resumen.listos ?? 0) >= (resumen.total ?? 0) ? (
                                <a
                                    href={route('my-delegation.acuse-general.pdf', exportParams)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-900 hover:decoration-zinc-500 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-white dark:hover:decoration-zinc-400"
                                >
                                    <FileDown className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                                    Acuse general
                                </a>
                            ) : (
                                <span
                                    className="inline-flex cursor-not-allowed items-center gap-1.5 text-[12px] font-medium text-zinc-400 dark:text-zinc-600"
                                    title="Actualiza el vestuario de todos los empleados para generar el acuse general"
                                >
                                    <Lock className="size-3 shrink-0 opacity-60" strokeWidth={2} aria-hidden />
                                    Acuse general
                                </span>
                            )}
                            <a
                                href={route('my-delegation.empleados.lista.pdf', exportParams)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-600 underline decoration-zinc-200 underline-offset-4 transition hover:text-zinc-900 hover:decoration-zinc-400 dark:text-zinc-400 dark:decoration-zinc-700 dark:hover:text-zinc-200"
                            >
                                <Users className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                                Lista
                            </a>
                        </div>
                    </div>
                </section>

                <div className="mb-10 max-w-md">
                    <label htmlFor="mi-del-busqueda" className="mb-2 block text-[11px] text-zinc-400 dark:text-zinc-500">
                        Buscar
                    </label>
                    <div className="group flex items-center gap-3 border-b border-zinc-200 pb-2 transition-colors focus-within:border-zinc-400 dark:border-zinc-700 dark:focus-within:border-zinc-500">
                        <Search className="size-4 shrink-0 text-zinc-300 transition group-focus-within:text-zinc-500 dark:text-zinc-600 dark:group-focus-within:text-zinc-400" aria-hidden />
                        <input
                            id="mi-del-busqueda"
                            type="search"
                            placeholder="Nombre o NUE"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-zinc-900 placeholder:text-zinc-300 outline-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                        />
                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="shrink-0 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                            >
                                Limpiar
                            </button>
                        ) : null}
                    </div>
                </div>

                {(resumen.total ?? 0) > 0 && (
                    <div className={`mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 ${
                        (resumen.listos ?? 0) >= (resumen.total ?? 0)
                            ? 'border-stone-200/70 bg-stone-50/50 dark:border-stone-700/40 dark:bg-stone-900/20'
                            : 'border-zinc-200/70 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30'
                    }`}>
                        {(resumen.listos ?? 0) >= (resumen.total ?? 0) ? (
                            <>
                                <CheckCircle2 className="size-4 shrink-0 text-stone-500 dark:text-stone-400" strokeWidth={1.75} />
                                <p className="text-[13px] leading-snug text-stone-700 dark:text-stone-300">
                                    <span className="font-semibold">Actualización completa.</span>{' '}
                                    Todos los empleados tienen su vestuario al día. Ya puedes generar el acuse general.
                                </p>
                            </>
                        ) : (
                            <>
                                <Clock className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[13px] leading-snug text-zinc-600 dark:text-zinc-400">
                                        <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{resumen.listos ?? 0}</span> de{' '}
                                        <span className="font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">{resumen.total ?? 0}</span>{' '}
                                        empleados actualizados. Completa todos para generar el acuse general.
                                    </p>
                                    <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-stone-300/60 to-stone-400/45 transition-all duration-500 dark:from-stone-600/50 dark:to-stone-500/35"
                                            style={{ width: `${(resumen.total ?? 0) > 0 ? Math.round(((resumen.listos ?? 0) / (resumen.total ?? 0)) * 100) : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                        Empleados
                    </h2>
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
                    <div className="space-y-4">
                        {empleados.data.map((emp) => (
                            <EmpleadoRow
                                key={emp.id}
                                empleado={emp}
                                delegaciones={delegaciones}
                                anioActual={anioVestuario}
                                periodoAbierto={periodo?.estado === 'abierto'}
                                acuseAnio={acuseAnio ? Number(acuseAnio) : null}
                            />
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

MiDelegacionIndex.layout = (page) => {
    const filtroCodigo = page?.props?.filters?.delegacion_codigo;
    const modo = page?.props?.filters?.modo;
    const esVistaInd = modo === 'independiente'
        || (typeof filtroCodigo === 'string' && filtroCodigo.startsWith('IND-'));
    const layoutTitle = esVistaInd ? 'Delegación independiente' : 'Mi Delegación';

    return (
        <AuthenticatedLayout
            header={<span className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">{layoutTitle}</span>}
        >
            {page}
        </AuthenticatedLayout>
    );
};

export default MiDelegacionIndex;
