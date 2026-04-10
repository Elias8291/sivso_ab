import { CheckCircle2, Clock, Pencil, RotateCcw } from 'lucide-react';
import { useState } from 'react';

/**
 * Fila de una prenda en el panel de vestuario.
 * Controlado: recibe el draft del panel padre y lo notifica hacia arriba.
 */
export function PrendaRow({ item, draftTalla, draftMedida, onDraftChange, onDraftRevert, periodoAbierto = true }) {
    const [editando, setEditando] = useState(false);

    const talla   = draftTalla  ?? item.talla  ?? '';
    const medida  = draftMedida ?? item.medida ?? '';
    const dirty   = draftTalla !== undefined || draftMedida !== undefined;
    const confirmado = item.estado === 'confirmado' && !dirty;

    const cancelar = () => {
        onDraftRevert(item.id);
        setEditando(false);
    };

    const colorIcon  = dirty ? 'bg-amber-100/60 dark:bg-amber-900/30' : confirmado ? 'bg-stone-200/50 dark:bg-stone-800/50' : 'bg-zinc-100 dark:bg-zinc-800';
    const colorPill  = dirty
        ? 'border-amber-300/50 bg-amber-50/70 dark:border-amber-700/30 dark:bg-amber-900/25'
        : confirmado
            ? 'border-stone-200/70 bg-stone-50/70 dark:border-stone-600/40 dark:bg-stone-800/35'
            : 'border-zinc-200/70 bg-zinc-50 dark:border-zinc-700/70 dark:bg-zinc-800/50';
    const colorPillTxt = dirty ? 'text-amber-800 dark:text-amber-300' : confirmado ? 'text-stone-800 dark:text-stone-300' : 'text-zinc-800 dark:text-zinc-200';
    const colorPillLbl = dirty ? 'text-amber-500' : confirmado ? 'text-stone-500 dark:text-stone-400' : 'text-zinc-400';

    return (
        <div className={`transition-colors ${
            editando    ? 'rounded-xl bg-zinc-50/80 dark:bg-zinc-900/40'
            : dirty     ? 'rounded-xl bg-amber-50/50 ring-1 ring-amber-200/30 dark:bg-amber-950/15 dark:ring-amber-700/20'
            : confirmado? 'rounded-xl bg-stone-50/50 dark:bg-stone-900/20'
            : ''
        }`}>
            <div className="flex gap-3 px-1 py-3 sm:gap-3.5 sm:py-3.5">
                {/* icono de estado */}
                <div className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full ${colorIcon}`}>
                    {dirty
                        ? <Pencil className="size-3 text-amber-600 dark:text-amber-400" strokeWidth={2} />
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
                        {/* pills talla / medida */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                            {[['T', talla], ['M', medida]].map(([lbl, val]) => (
                                <span key={lbl} className={`inline-flex items-center gap-0.5 rounded-full border px-1 py-px ${colorPill}`}>
                                    <span className={`text-[7px] font-semibold uppercase tracking-wide ${colorPillLbl}`}>{lbl}</span>
                                    <span className={`font-mono text-[9px] font-semibold leading-none ${colorPillTxt}`}>{val || '—'}</span>
                                </span>
                            ))}
                        </div>

                        {!editando && periodoAbierto && (
                            <button
                                type="button"
                                onClick={() => setEditando(true)}
                                className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-3 text-[11px] font-medium transition ${
                                    dirty
                                        ? 'border-amber-300/60 bg-amber-50/80 text-amber-800 hover:bg-amber-100/70 dark:border-amber-700/35 dark:bg-amber-900/25 dark:text-amber-300'
                                        : confirmado
                                            ? 'border-stone-200/80 bg-white text-stone-800 hover:bg-stone-50/90 dark:border-stone-600/45 dark:bg-stone-900/35 dark:text-stone-300'
                                            : 'border-zinc-200/90 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <Pencil className="size-3" strokeWidth={2} />
                                {dirty ? 'Editado' : 'Editar'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* panel de edición inline con animación CSS grid */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${editando ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="flex flex-col gap-3 border-t border-zinc-100 pb-1 pt-4 dark:border-zinc-800/80 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3 sm:pb-2 sm:pt-3.5">
                        <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto sm:flex-1 sm:flex-wrap sm:items-end">
                            {[
                                { lbl: 'Talla',  val: talla,  field: 'talla',  ph: item.talla_anterior || 'Ej. M' },
                                { lbl: 'Medida', val: medida, field: 'medida', ph: 'Ej. 34' },
                            ].map(({ lbl, val, field, ph }) => (
                                <div key={lbl} className="flex min-w-0 flex-1 flex-col gap-1 sm:min-w-[7rem]">
                                    <label
                                        htmlFor={`prenda-${item.id}-${lbl}`}
                                        className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400"
                                    >
                                        {lbl}
                                    </label>
                                    <input
                                        id={`prenda-${item.id}-${lbl}`}
                                        type="text"
                                        value={val}
                                        onChange={(e) =>
                                            onDraftChange(item.id, field, field === 'talla' ? e.target.value.toUpperCase() : e.target.value)
                                        }
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
                            <button
                                type="button"
                                onClick={() => setEditando(false)}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 sm:min-h-0 sm:flex-initial sm:rounded-md sm:px-3 sm:py-2 sm:text-[12px]"
                            >
                                <CheckCircle2 className="size-4 shrink-0 sm:size-3.5" />
                                Listo
                            </button>
                            {dirty && (
                                <button
                                    type="button"
                                    onClick={cancelar}
                                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[13px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 sm:min-h-0 sm:rounded-md sm:py-2 sm:text-[12px]"
                                >
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
