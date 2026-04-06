import AdminPageShell from '@/components/admin/AdminPageShell';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';

function FiltroAnio({ anio, aniosDisponibles }) {
    return (
        <label className="flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
            <span>Año</span>
            <select
                value={anio}
                onChange={(e) => {
                    router.get(
                        route('productos.index'),
                        { anio: Number(e.target.value) },
                        { preserveState: true, preserveScroll: true, replace: true },
                    );
                }}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-2.5 pr-7 text-[12px] font-medium text-zinc-800 shadow-sm outline-none transition-[border-color] focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-900/40"
            >
                {aniosDisponibles.map((a) => (
                    <option key={a} value={a}>
                        {a}
                    </option>
                ))}
            </select>
        </label>
    );
}

export default function ProductosIndex({ anio, anios_disponibles = [], licitados = [], cotizados = [] }) {
    const [tab, setTab] = useState('licitados');

    return (
        <>
            <Head title="Productos" />
            <AdminPageShell
                title="Productos"
                description={<span className="tabular-nums">Consulta por año de productos licitados y cotizados</span>}
            >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <FiltroAnio anio={anio} aniosDisponibles={anios_disponibles} />
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Licitados: {licitados.length} · Cotizados: {cotizados.length}
                    </span>
                </div>

                <div className="mb-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setTab('licitados')}
                        className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition ${
                            tab === 'licitados'
                                ? 'border-brand-gold/55 bg-brand-gold/[0.12] text-zinc-900 dark:border-brand-gold-soft/45 dark:bg-brand-gold-soft/[0.12] dark:text-zinc-50'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300'
                        }`}
                    >
                        Licitados
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('cotizados')}
                        className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition ${
                            tab === 'cotizados'
                                ? 'border-brand-gold/55 bg-brand-gold/[0.12] text-zinc-900 dark:border-brand-gold-soft/45 dark:bg-brand-gold-soft/[0.12] dark:text-zinc-50'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300'
                        }`}
                    >
                        Cotizados
                    </button>
                </div>

                {tab === 'licitados' ? (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <table className="min-w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                                    <th className="px-3 py-2 text-left">Partida</th>
                                    <th className="px-3 py-2 text-left">Código</th>
                                    <th className="px-3 py-2 text-left">Descripción</th>
                                    <th className="px-3 py-2 text-left">Categoría</th>
                                    <th className="px-3 py-2 text-right">Cant.</th>
                                    <th className="px-3 py-2 text-right">P.U.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {licitados.map((item) => (
                                    <tr key={item.id} className="border-b border-zinc-100/80 dark:border-zinc-800/60">
                                        <td className="px-3 py-2 tabular-nums">{item.numero_partida}</td>
                                        <td className="px-3 py-2 font-mono">{item.codigo_catalogo}</td>
                                        <td className="px-3 py-2">{item.descripcion}</td>
                                        <td className="px-3 py-2">{item.categoria || '—'}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{item.cantidad_propuesta}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {item.precio_unitario != null
                                                ? Number(item.precio_unitario).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
                                                : '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30">
                        <table className="min-w-full text-[12px]">
                            <thead>
                                <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                                    <th className="px-3 py-2 text-left">Partida</th>
                                    <th className="px-3 py-2 text-left">Clave</th>
                                    <th className="px-3 py-2 text-left">Descripción</th>
                                    <th className="px-3 py-2 text-left">Categoría</th>
                                    <th className="px-3 py-2 text-left">Referencia</th>
                                    <th className="px-3 py-2 text-right">P.U.</th>
                                    <th className="px-3 py-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cotizados.map((item) => (
                                    <tr key={item.id} className="border-b border-zinc-100/80 dark:border-zinc-800/60">
                                        <td className="px-3 py-2 tabular-nums">{item.numero_partida}</td>
                                        <td className="px-3 py-2 font-mono">{item.clave}</td>
                                        <td className="px-3 py-2">{item.descripcion}</td>
                                        <td className="px-3 py-2">{item.categoria || '—'}</td>
                                        <td className="px-3 py-2 font-mono">{item.referencia_codigo || '—'}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {item.precio_unitario != null
                                                ? Number(item.precio_unitario).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-right tabular-nums">
                                            {item.total != null
                                                ? Number(item.total).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
                                                : '—'}
                                        </td>
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

ProductosIndex.layout = createAdminPageLayout('Productos');
