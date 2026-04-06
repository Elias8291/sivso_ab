import AdminPageShell from '@/components/admin/AdminPageShell';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { route } from 'ziggy-js';
import { useEffect, useState } from 'react';

function money(value) {
    return Number(value ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
}

function integer(value) {
    return Number(value ?? 0).toLocaleString('es-MX');
}

function FiltroSelect({ label, value, options = [], onChange }) {
    return (
        <label className="flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
            <span className="whitespace-nowrap">{label}</span>
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value || null)}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-2.5 pr-7 text-[12px] font-medium text-zinc-800 shadow-sm outline-none transition-[border-color] focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-900/40"
            >
                {options.map((opt) => (
                    <option key={String(opt.value)} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function PartidasIndex({
    anio,
    anios_disponibles = [],
    rows = [],
    resumen = {},
    ur_activa,
    delegacion_activa,
    delegacion_buscar,
    urs_disponibles = [],
    delegaciones_opciones = [],
    partidas_especificas_fijas = [],
}) {
    const [buscarDelegacion, setBuscarDelegacion] = useState(delegacion_buscar ?? '');

    const navegar = (overrides = {}) => {
        const next = {
            anio,
            ur: ur_activa,
            delegacion: delegacion_activa,
            delegacion_buscar: buscarDelegacion,
            ...overrides,
        };
        router.get(route('partidas.index'), next, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const opcionesAnio = anios_disponibles.map((a) => ({ value: a, label: `Año ${a}` }));
    const opcionesUr = [{ value: '', label: 'Todas las UR' }, ...urs_disponibles.map((u) => ({ value: u, label: `UR ${u}` }))];
    const opcionesDelegacion = [{ value: '', label: 'Todas las delegaciones' }, ...delegaciones_opciones.map((d) => ({ value: d, label: d }))];

    useEffect(() => {
        setBuscarDelegacion(delegacion_buscar ?? '');
    }, [delegacion_buscar]);

    useEffect(() => {
        if ((delegacion_buscar ?? '') === buscarDelegacion) {
            return undefined;
        }

        const t = setTimeout(() => {
            navegar({ delegacion_buscar: buscarDelegacion || null });
        }, 350);

        return () => clearTimeout(t);
    }, [buscarDelegacion]);

    return (
        <>
            <Head title="Partidas" />
            <AdminPageShell
                title="Partidas"
                description={
                    <span className="tabular-nums">
                        Gasto por partida específica, delegación y UR (licitado + IVA) · ejercicio {anio}
                    </span>
                }
            >
                <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">UR con gasto</p>
                        <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{integer(resumen.urs)}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Subtotal sin IVA</p>
                        <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{money(resumen.subtotal_sin_iva)}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">IVA</p>
                        <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{money(resumen.iva)}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Total con IVA</p>
                        <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{money(resumen.total_con_iva)}</p>
                    </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <FiltroSelect label="Año" value={anio} options={opcionesAnio} onChange={(v) => navegar({ anio: Number(v), ur: null, delegacion: null, delegacion_buscar: null })} />
                    <FiltroSelect label="UR" value={ur_activa ?? ''} options={opcionesUr} onChange={(v) => navegar({ ur: v ? Number(v) : null })} />
                    <FiltroSelect label="Delegación" value={delegacion_activa ?? ''} options={opcionesDelegacion} onChange={(v) => navegar({ delegacion: v })} />
                    <label className="flex min-w-[15rem] flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[12px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        <Search className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} />
                        <input
                            type="search"
                            value={buscarDelegacion}
                            onChange={(e) => setBuscarDelegacion(e.target.value)}
                            placeholder="Buscar delegación..."
                            className="w-full border-0 bg-transparent p-0 text-[12px] text-zinc-800 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                        />
                    </label>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Partidas específicas fijas: {partidas_especificas_fijas.join(' · ')}
                    </span>
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400">
                        No hay datos para los filtros seleccionados.
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="space-y-2 md:hidden">
                            {rows.map((row, idx) => (
                                <div
                                    key={`${row.ur}-${idx}`}
                                    className="rounded-xl border border-zinc-200/80 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:bg-zinc-900/30"
                                >
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        UR <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-100">{row.ur}</span>
                                    </p>

                                    <div className="mt-2 grid grid-cols-1 gap-2">
                                        <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/40">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Partida 244</p>
                                            <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">Subtotal: <span className="tabular-nums">{money(row.partida_244.subtotal_sin_iva)}</span></p>
                                            <p className="text-[11px] text-zinc-600 dark:text-zinc-300">IVA: <span className="tabular-nums">{money(row.partida_244.iva)}</span></p>
                                            <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">Total: <span className="tabular-nums">{money(row.partida_244.total_con_iva)}</span></p>
                                        </div>
                                        <div className="rounded-lg border border-zinc-200/80 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/40">
                                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Partida 246</p>
                                            <p className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-300">Subtotal: <span className="tabular-nums">{money(row.partida_246.subtotal_sin_iva)}</span></p>
                                            <p className="text-[11px] text-zinc-600 dark:text-zinc-300">IVA: <span className="tabular-nums">{money(row.partida_246.iva)}</span></p>
                                            <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-100">Total: <span className="tabular-nums">{money(row.partida_246.total_con_iva)}</span></p>
                                        </div>
                                    </div>

                                    <div className="mt-2 rounded-lg border border-zinc-300/80 bg-zinc-100 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800/60">
                                        <p className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total UR</p>
                                        <p className="text-[12px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{money(row.total_ur.total_con_iva)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30 md:block">
                            <table className="min-w-full text-[12px]">
                                <thead>
                                    <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                                        <th className="px-3 py-2 text-left">UR</th>
                                        <th className="px-3 py-2 text-right">244 Subtotal</th>
                                        <th className="px-3 py-2 text-right">244 IVA</th>
                                        <th className="px-3 py-2 text-right">244 Total</th>
                                        <th className="px-3 py-2 text-right">246 Subtotal</th>
                                        <th className="px-3 py-2 text-right">246 IVA</th>
                                        <th className="px-3 py-2 text-right">246 Total</th>
                                        <th className="px-3 py-2 text-right">Total UR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((row, idx) => (
                                        <tr key={`${row.ur}-${idx}`} className="border-b border-zinc-100/80 dark:border-zinc-800/60">
                                            <td className="px-3 py-2 font-mono">{row.ur}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{money(row.partida_244.subtotal_sin_iva)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{money(row.partida_244.iva)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{money(row.partida_244.total_con_iva)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{money(row.partida_246.subtotal_sin_iva)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{money(row.partida_246.iva)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{money(row.partida_246.total_con_iva)}</td>
                                            <td className="px-3 py-2 text-right tabular-nums font-semibold">{money(row.total_ur.total_con_iva)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </AdminPageShell>
        </>
    );
}

PartidasIndex.layout = createAdminPageLayout('Partidas');
