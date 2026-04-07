import { Inbox } from 'lucide-react';

function cellContent(col, row) {
    return col.render ? col.render(row) : row[col.key];
}

function headerLabel(col, actions) {
    return col.header ?? (actions ? 'Acciones' : '');
}

function EmptyState({ emptyTitle, emptyDescription }) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-zinc-50 dark:bg-white/5">
                <Inbox className="size-5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} aria-hidden />
            </div>
            <div className="space-y-1">
                <p className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{emptyTitle}</p>
                <p className="max-w-sm text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{emptyDescription}</p>
            </div>
        </div>
    );
}

export default function DataTable({
    columns,
    rows,
    keyExtractor,
    emptyTitle = 'Sin registros',
    emptyDescription = 'No hay datos para mostrar en este momento.',
    footer = null,
    /** Móvil: `card` = caja por fila; `divided` = solo líneas entre registros (sin contenedor gris). */
    mobileRowStyle = 'card',
}) {
    const isEmpty = !rows?.length;
    const isActionsCol = (col) => col.key === 'acciones';
    const mobilePlain = mobileRowStyle === 'divided';

    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
            {isEmpty ? (
                <EmptyState emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
            ) : (
                <>
                    {/* Móvil: cada registro = tarjeta; campos en filas (etiqueta + valor) */}
                    <ul
                        className={`md:hidden ${mobilePlain ? 'divide-y divide-zinc-200/75 px-3 py-2 dark:divide-zinc-700/55' : 'divide-y divide-zinc-900/5 p-3 dark:divide-white/5'}`}
                    >
                        {rows.map((row) => (
                            <li
                                key={keyExtractor(row)}
                                className={mobilePlain ? 'py-3.5 first:pt-3' : 'py-4 first:pt-1'}
                            >
                                <div
                                    className={
                                        mobilePlain
                                            ? 'space-y-0'
                                            : 'space-y-0 rounded-xl bg-zinc-50/80 px-3 py-3 ring-1 ring-zinc-900/5 dark:bg-zinc-900/40 dark:ring-white/10'
                                    }
                                >
                                    {columns.map((col, colIndex) => {
                                        const actions = isActionsCol(col);
                                        const label = headerLabel(col, actions);
                                        if (actions) {
                                            return (
                                                <div
                                                    key={col.key}
                                                    className="mt-3 border-t border-zinc-200/80 pt-3 dark:border-zinc-600/60"
                                                >
                                                    {label ? (
                                                        <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                                            {label}
                                                        </p>
                                                    ) : null}
                                                    <div className="flex justify-end">{cellContent(col, row)}</div>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div
                                                key={col.key}
                                                className="flex gap-3 border-b border-zinc-200/60 py-2.5 last:border-b-0 dark:border-zinc-600/40"
                                            >
                                                <span className="w-[40%] shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                                    {label}
                                                </span>
                                                <div
                                                    className={`min-w-0 flex-1 text-right text-[13px] text-zinc-700 dark:text-zinc-300 ${colIndex === 0 ? 'font-medium text-zinc-900 dark:text-zinc-100' : ''} ${col.cellClassName ?? ''}`}
                                                >
                                                    {cellContent(col, row)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </li>
                        ))}
                    </ul>

                    {/* Escritorio: tabla clásica */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-zinc-900/5 dark:border-white/5">
                                    {columns.map((col) => {
                                        const actions = isActionsCol(col);
                                        return (
                                            <th
                                                key={col.key}
                                                scope="col"
                                                className={`py-4 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 ${actions ? 'min-w-[12rem] whitespace-nowrap px-4 text-right' : 'whitespace-nowrap px-6'
                                                    } ${col.className ?? ''}`}
                                            >
                                                {headerLabel(col, actions)}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900/5 dark:divide-white/5">
                                {rows.map((row) => (
                                    <tr
                                        key={keyExtractor(row)}
                                        className="transition-colors duration-200 hover:bg-zinc-50 dark:hover:bg-white/5"
                                    >
                                        {columns.map((col, colIndex) => {
                                            const actions = isActionsCol(col);
                                            return (
                                                <td
                                                    key={col.key}
                                                    className={`align-middle text-[13px] text-zinc-600 dark:text-zinc-400 ${actions
                                                        ? 'px-4 py-3.5 text-right whitespace-nowrap'
                                                        : 'px-6 py-4'
                                                        } ${colIndex === 0 ? 'font-medium text-zinc-900 dark:text-zinc-100' : ''} ${col.cellClassName ?? ''}`}
                                                >
                                                    {cellContent(col, row)}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
            {footer && !isEmpty ? (
                <div className="border-t border-zinc-900/5 px-4 py-3 dark:border-white/5 sm:px-6">
                    {footer}
                </div>
            ) : null}
        </div>
    );
}
