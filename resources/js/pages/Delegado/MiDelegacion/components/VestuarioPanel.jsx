import { router } from '@inertiajs/react';
import axios from 'axios';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { route } from 'ziggy-js';
import { PrendaRow } from './PrendaRow';

/**
 * Panel desplegable de vestuario de un empleado.
 * Maneja drafts locales y guardado en lote vía PATCH.
 */
export function VestuarioPanel({ empleadoId, vestuario, onPrendasGuardadas, anioActual = new Date().getFullYear(), periodoAbierto = true, loading = false }) {
    const [drafts, setDrafts]   = useState({});
    const [saving, setSaving]   = useState(false);
    const [flashOk, setFlashOk] = useState(false);
    const [errMsg, setErrMsg]   = useState('');

    const dirtyCount = Object.keys(drafts).length;

    const onDraftChange = useCallback((id, field, value) => {
        setDrafts((prev) => ({ ...prev, [id]: { ...(prev[id] ?? {}), [field]: value } }));
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
            router.reload({ only: ['resumen'], preserveScroll: true });
        } catch (e) {
            setErrMsg(e?.response?.data?.message ?? 'Error al guardar. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const confirmadas = vestuario.filter((v) => drafts[v.id] || v.estado === 'confirmado').length;
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
                    Cargando prendas…
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
                                <button
                                    type="button"
                                    onClick={guardarTodo}
                                    disabled={saving}
                                    className="flex w-full items-center justify-center gap-2 rounded-full border border-stone-700/90 bg-stone-800 px-5 py-2.5 text-[12px] font-medium text-stone-50 transition hover:bg-stone-700 disabled:opacity-50 dark:border-stone-500 dark:bg-stone-600 dark:text-stone-50 dark:hover:bg-stone-500"
                                >
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
