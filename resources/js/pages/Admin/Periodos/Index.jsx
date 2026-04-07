import AdminPageShell from '@/components/admin/AdminPageShell';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Calendar, CheckCircle2, ChevronRight, Clock, Lock,
    Pencil, Plus, RotateCcw, Trash2, Unlock, X,
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

/* ── helpers ── */
const fmt = (iso) => iso
    ? new Date(iso + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';

const ESTADO_CFG = {
    abierto: {
        label: 'Abierto',
        dot: 'bg-emerald-500 animate-pulse',
        text: 'text-emerald-700 dark:text-emerald-400',
        bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40',
    },
    cerrado: {
        label: 'Cerrado',
        dot: 'bg-zinc-400',
        text: 'text-zinc-500 dark:text-zinc-400',
        bg: 'bg-zinc-50 border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800',
    },
    proximo: {
        label: 'Próximo',
        dot: 'bg-amber-400',
        text: 'text-amber-700 dark:text-amber-400',
        bg: 'bg-amber-50/60 border-amber-200/70 dark:bg-amber-950/10 dark:border-amber-800/30',
    },
};

/* ── Campo reutilizable (fuera del modal para evitar re-mount en cada tecla) ── */
function PeriodoField({ label, id, type = 'text', k, ph = '', required = false, value, error, onChange }) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {label}{required && <span className="ml-0.5 text-zinc-500">*</span>}
            </label>
            <input
                id={id} type={type} value={value} onChange={(e) => onChange(k, e.target.value)}
                placeholder={ph} required={required}
                className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[13px] text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            {error && <p className="text-[11px] text-red-500">{error}</p>}
        </div>
    );
}

/* ── Modal crear/editar ── */
function ModalPeriodo({ open, onClose, periodo, onSaved }) {
    const isEdit = !!periodo;
    const [form, setForm] = useState({
        anio:         periodo?.anio         ?? new Date().getFullYear(),
        nombre:       periodo?.nombre       ?? '',
        fecha_inicio: periodo?.fecha_inicio ?? '',
        fecha_fin:    periodo?.fecha_fin    ?? '',
        descripcion:  periodo?.descripcion  ?? '',
    });
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    if (!open) return null;

    const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((e) => ({ ...e, [k]: null })); };

    const guardar = async (e) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});
        try {
            const url  = isEdit ? route('periodos.update', periodo.id) : route('periodos.store');
            const method = isEdit ? axios.put : axios.post;
            const { data } = await method(url, form);
            onSaved(data.data, isEdit ? 'update' : 'create');
            onClose();
        } catch (err) {
            if (err?.response?.data?.errors) setErrors(err.response.data.errors);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200/80 bg-zinc-50 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
                {/* cabecera */}
                <div className="flex items-center justify-between px-6 pb-4 pt-6">
                    <h2 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100">
                        {isEdit ? 'Editar período' : 'Nuevo período'}
                    </h2>
                    <button type="button" onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                        <X className="size-4" />
                    </button>
                </div>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800" />
                <form onSubmit={guardar} className="space-y-4 px-6 pb-6 pt-4">
                    <div className="grid grid-cols-2 gap-3">
                        <PeriodoField label="Año" id="p-anio" type="number" k="anio" ph="2025" required value={form.anio} error={errors.anio} onChange={set} />
                        <PeriodoField label="Nombre" id="p-nombre" k="nombre" ph="Período 2025" required value={form.nombre} error={errors.nombre} onChange={set} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <PeriodoField label="Fecha inicio" id="p-ini" type="date" k="fecha_inicio" required value={form.fecha_inicio} error={errors.fecha_inicio} onChange={set} />
                        <PeriodoField label="Fecha fin"    id="p-fin" type="date" k="fecha_fin"    required value={form.fecha_fin} error={errors.fecha_fin} onChange={set} />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="p-desc" className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Descripción</label>
                        <textarea id="p-desc" rows={2} value={form.descripcion} onChange={(e) => set('descripcion', e.target.value)}
                            placeholder="Indicaciones adicionales…"
                            className="resize-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[13px] text-zinc-800 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200" />
                    </div>
                    <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                        <button type="button" onClick={onClose}
                            className="rounded-lg border border-zinc-200 px-4 py-2 text-[13px] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400">
                            Cancelar
                        </button>
                        <button type="submit" disabled={saving}
                            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
                            {saving && <RotateCcw className="size-3.5 animate-spin" />}
                            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear período'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Tarjeta de período ── */
function PeriodoCard({ p, puedeGestionar, onEdit, onToggle, onDelete }) {
    const cfg = ESTADO_CFG[p.estado] ?? ESTADO_CFG.cerrado;
    const [busyToggle, setBusyToggle] = useState(false);
    const [busyDel, setBusyDel] = useState(false);

    const handleToggle = async () => {
        setBusyToggle(true);
        try { await onToggle(p); } finally { setBusyToggle(false); }
    };
    const handleDelete = async () => {
        if (!confirm(`¿Eliminar el período "${p.nombre}"?`)) return;
        setBusyDel(true);
        try { await onDelete(p); } finally { setBusyDel(false); }
    };

    return (
        <div className={`overflow-hidden rounded-xl border ${cfg.bg} transition-colors`}>
            <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-5">
                {/* info */}
                <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <Calendar className="size-4 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{p.nombre}</span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.text}`}>
                                <span className={`size-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                            </span>
                        </div>
                        <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                            <span className="tabular-nums font-mono">{p.anio}</span>
                            <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">·</span>
                            {fmt(p.fecha_inicio)}
                            <ChevronRight className="mx-0.5 inline size-3" strokeWidth={2} />
                            {fmt(p.fecha_fin)}
                        </p>
                        {p.descripcion && (
                            <p className="mt-1 text-[11px] italic text-zinc-400 dark:text-zinc-500">«{p.descripcion}»</p>
                        )}
                    </div>
                </div>

                {/* acciones */}
                {puedeGestionar && (
                    <div className="flex shrink-0 items-center gap-1.5">
                        {/* toggle */}
                        <button type="button" onClick={handleToggle} disabled={busyToggle}
                            title={p.estado === 'abierto' ? 'Cerrar período' : 'Abrir período'}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors disabled:opacity-50 ${
                                p.estado === 'abierto'
                                    ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-400'
                            }`}>
                            {busyToggle
                                ? <RotateCcw className="size-3 animate-spin" />
                                : p.estado === 'abierto'
                                    ? <Lock className="size-3" strokeWidth={2} />
                                    : <Unlock className="size-3" strokeWidth={2} />
                            }
                            {p.estado === 'abierto' ? 'Cerrar' : 'Abrir'}
                        </button>
                        {p.estado !== 'abierto' && (
                            <>
                                <button type="button" onClick={() => onEdit(p)}
                                    className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                                    <Pencil className="size-3" strokeWidth={2} />
                                </button>
                                <button type="button" onClick={handleDelete} disabled={busyDel}
                                    className="flex size-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-red-900/50 dark:hover:bg-red-950/20 dark:hover:text-red-400">
                                    {busyDel ? <RotateCcw className="size-3 animate-spin" /> : <Trash2 className="size-3" strokeWidth={2} />}
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Página principal ── */
function PeriodosIndex({ periodos: initial = [], filters = {} }) {
    const puedeGestionar = useAuthCan()('Gestionar periodos');
    const [periodos, setPeriodos] = useState(initial);
    const [modalPeriodo, setModalPeriodo] = useState(null); // null | 'nuevo' | object (editar)
    const [toast, setToast] = useState('');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

    const onSaved = (data, action) => {
        if (action === 'create') {
            setPeriodos((p) => [data, ...p]);
        } else {
            setPeriodos((p) => p.map((x) => x.id === data.id ? data : x));
        }
        showToast(action === 'create' ? 'Período creado correctamente.' : 'Período actualizado.');
    };

    const onToggle = async (p) => {
        const { data } = await axios.post(route('periodos.toggle', p.id));
        setPeriodos((prev) => prev.map((x) => x.id === p.id ? data.data : x));
        showToast(data.message);
    };

    const onDelete = async (p) => {
        await axios.delete(route('periodos.destroy', p.id));
        setPeriodos((prev) => prev.filter((x) => x.id !== p.id));
        showToast('Período eliminado.');
    };

    const abierto = periodos.find((p) => p.estado === 'abierto');

    return (
        <>
            <Head title="Períodos de vestuario" />
            <AdminPageShell
                title="Períodos de vestuario"
                description="Gestiona las ventanas de tiempo para actualizar tallas. Solo puede haber un período abierto a la vez."
                actions={
                    puedeGestionar ? (
                        <button type="button" onClick={() => setModalPeriodo('nuevo')}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                            <Plus className="size-4" strokeWidth={2} />
                            Nuevo período
                        </button>
                    ) : null
                }
            >
                {/* banner estado activo */}
                {abierto && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" strokeWidth={2} />
                        <div>
                            <p className="text-[12px] font-semibold text-emerald-800 dark:text-emerald-300">
                                Período activo: {abierto.nombre}
                            </p>
                            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                                Los delegados pueden actualizar tallas hasta el {fmt(abierto.fecha_fin)}.
                            </p>
                        </div>
                    </div>
                )}

                {/* lista */}
                {periodos.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 py-16 dark:border-zinc-800">
                        <Calendar className="size-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} />
                        <div className="text-center">
                            <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Sin períodos</p>
                            <p className="mt-1 text-[12px] text-zinc-400 dark:text-zinc-500">
                                Crea el primer período para habilitar la edición de tallas.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {periodos.map((p) => (
                            <PeriodoCard key={p.id} p={p} puedeGestionar={puedeGestionar}
                                onEdit={setModalPeriodo}
                                onToggle={onToggle}
                                onDelete={onDelete}
                            />
                        ))}
                    </div>
                )}

                {/* toast */}
                {toast && (
                    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-zinc-200 bg-white px-5 py-3 text-[12px] font-medium text-zinc-800 shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
                        {toast}
                    </div>
                )}
            </AdminPageShell>

            <ModalPeriodo
                open={!!modalPeriodo}
                onClose={() => setModalPeriodo(null)}
                periodo={modalPeriodo === 'nuevo' ? null : modalPeriodo}
                onSaved={onSaved}
            />
        </>
    );
}

PeriodosIndex.layout = createAdminPageLayout('Periodos');

export default PeriodosIndex;
