import AdminPageShell from '@/components/admin/AdminPageShell';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';

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
    urs_disponibles = [],
    delegaciones_opciones = [],
    partidas_especificas_fijas = [],
}) {
    const navegar = (overrides = {}) => {
        const next = {
            anio,
            ur: ur_activa,
            delegacion: delegacion_activa,
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
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Registros</p>
                        <p className="mt-0.5 text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{integer(resumen.registros)}</p>
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
                    <FiltroSelect label="Año" value={anio} options={opcionesAnio} onChange={(v) => navegar({ anio: Number(v), ur: null, delegacion: null })} />
                    <FiltroSelect label="UR" value={ur_activa ?? ''} options={opcionesUr} onChange={(v) => navegar({ ur: v ? Number(v) : null })} />
                    <FiltroSelect label="Delegación" value={delegacion_activa ?? ''} options={opcionesDelegacion} onChange={(v) => navegar({ delegacion: v })} />
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Partidas específicas fijas: {partidas_especificas_fijas.join(' · ')}
                    </span>
                </div>

                {rows.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-8 text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-400">
                        No hay datos para los filtros seleccionados.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <table className="min-w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                                    <th className="px-3 py-2 text-left">Partida específica</th>
                                    <th className="px-3 py-2 text-left">UR</th>
                                    <th className="px-3 py-2 text-right">Asignaciones</th>
                                    <th className="px-3 py-2 text-right">Piezas</th>
                                    <th className="px-3 py-2 text-right">Subtotal</th>
                                    <th className="px-3 py-2 text-right">IVA</th>
                                    <th className="px-3 py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={`${row.partida_especifica}-${row.ur}-${idx}`} className="border-b border-zinc-100/80 dark:border-zinc-800/60">
                                        <td className="px-3 py-2 tabular-nums">{row.partida_especifica}</td>
                                        <td className="px-3 py-2 font-mono">{row.ur}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{integer(row.asignaciones)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{integer(row.piezas)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{money(row.subtotal_sin_iva)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{money(row.iva)}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{money(row.total_con_iva)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </AdminPageShell>
        </>
    );
}

PartidasIndex.layout = createAdminPageLayout('Partidas');
