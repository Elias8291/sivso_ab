import { CheckCircle2, Clock, Users } from 'lucide-react';

/**
 * Bloque de resumen y progreso de captura de vestuario.
 * Muestra tarjetas de stats + barra de progreso + mensaje de estado.
 */
export function ResumenProgreso({ resumen }) {
    const total    = resumen.total    ?? 0;
    const listos   = resumen.listos   ?? 0;
    const bajas    = resumen.bajas    ?? 0;
    const sinNue   = resumen.sin_nue  ?? 0;
    const sinEmp   = resumen.sin_empezar ?? 0;

    const pct      = total > 0 ? Math.round((listos / total) * 100) : 0;
    const completo = total > 0 && listos >= total;

    const stats = [
        { label: 'Total',       value: total,  cls: 'text-zinc-900 dark:text-zinc-50' },
        { label: 'Actualizados', value: listos, cls: completo ? 'text-stone-700 dark:text-stone-300' : 'text-zinc-900 dark:text-zinc-50' },
        { label: 'Pendientes',  value: sinEmp, cls: sinEmp > 0 ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400 dark:text-zinc-500' },
        ...(bajas  > 0 ? [{ label: 'Bajas',    value: bajas,  cls: 'text-rose-600 dark:text-rose-400' }] : []),
        ...(sinNue > 0 ? [{ label: 'Sin NUE',  value: sinNue, cls: 'text-amber-700 dark:text-amber-400' }] : []),
    ];

    if (total === 0) return null;

    return (
        <div className={`rounded-xl border px-4 py-3.5 ${
            completo
                ? 'border-stone-200/70 bg-stone-50/50 dark:border-stone-700/40 dark:bg-stone-900/20'
                : 'border-zinc-200/70 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/30'
        }`}>
            {/* Icono + mensaje */}
            <div className="mb-3 flex items-start gap-2.5">
                {completo ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-stone-500 dark:text-stone-400" strokeWidth={1.75} />
                ) : (
                    <Clock className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                )}
                <p className="text-[13px] leading-snug text-zinc-700 dark:text-zinc-300">
                    {completo ? (
                        <>
                            <span className="font-semibold text-stone-800 dark:text-stone-200">Actualización completa.</span>{' '}
                            Todos los empleados tienen su vestuario al día. Ya puedes generar el acuse general.
                        </>
                    ) : (
                        <>
                            <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">{listos}</span> de{' '}
                            <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">{total}</span>{' '}
                            empleados actualizados. Completa todos para generar el acuse general.
                        </>
                    )}
                </p>
            </div>

            {/* Barra de progreso */}
            <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${
                        completo
                            ? 'bg-gradient-to-r from-stone-400/70 to-stone-500/55 dark:from-stone-500/55 dark:to-stone-400/45'
                            : 'bg-gradient-to-r from-stone-300/60 to-stone-400/45 dark:from-stone-600/50 dark:to-stone-500/35'
                    }`}
                    style={{ width: `${pct}%` }}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${pct}% del vestuario actualizado`}
                />
            </div>

            {/* Stats pill row */}
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {stats.map(({ label, value, cls }) => (
                    <span key={label} className="flex items-baseline gap-1 text-[11px]">
                        <span className={`tabular-nums font-semibold ${cls}`}>{value}</span>
                        <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
                    </span>
                ))}
                {total > 0 && (
                    <span className="flex items-baseline gap-1 text-[11px]">
                        <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-50">{pct}%</span>
                        <span className="text-zinc-400 dark:text-zinc-500">completado</span>
                    </span>
                )}
            </div>
        </div>
    );
}

/**
 * Encabezado compacto de stats para la zona de filtros (aria-live).
 */
export function StatsBar({ resumen }) {
    const total  = resumen.total    ?? 0;
    const listos = resumen.listos   ?? 0;
    const sinEmp = resumen.sin_empezar ?? 0;

    const items = [
        { label: 'Total',       value: total  },
        { label: 'Actualizados', value: listos },
        { label: 'Pendientes',  value: sinEmp },
    ];

    return (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-live="polite">
            {items.map(({ label, value }, i) => (
                <span key={label} className="flex items-baseline gap-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
                    {i > 0 && <span className="text-zinc-200 dark:text-zinc-700" aria-hidden>·</span>}
                    <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</span>
                    <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">{value}</span>
                </span>
            ))}
        </div>
    );
}
