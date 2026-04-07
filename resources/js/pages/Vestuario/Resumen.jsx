import AdminPageShell from '@/components/admin/AdminPageShell';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router } from '@inertiajs/react';
import {
    CheckCircle2, ChevronDown, Clock, LayoutList,
    Package, Tag,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { route } from 'ziggy-js';

/* ──────────────────────────────────────────────
   Tarjeta de estadística
────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, hint }) {
    return (
        <div className="rounded-xl border border-zinc-200/80 border-l-2 border-l-brand-gold/35 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:border-l-brand-gold-soft/30 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                        {value}
                    </p>
                    {hint && (
                        <p className="mt-0.5 text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">{hint}</p>
                    )}
                </div>
                <Icon className="size-[18px] shrink-0 text-brand-gold/50 dark:text-brand-gold-soft/45" strokeWidth={1.5} aria-hidden />
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Barra de progreso gold
────────────────────────────────────────────── */
function Bar({ pct, className = 'h-1' }) {
    return (
        <div className={`w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800 ${className}`}>
            <div
                className="h-full rounded-full bg-gradient-to-r from-brand-gold/45 via-brand-gold/65 to-brand-gold-soft/55 dark:from-brand-gold-soft/35 dark:via-brand-gold-soft/50 dark:to-brand-gold/40 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
        </div>
    );
}

/* ──────────────────────────────────────────────
   Badge confirmada / pendiente
────────────────────────────────────────────── */
function Badge({ pendientes, total }) {
    if (total === 0) return null;
    if (pendientes === 0) {
        return (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                <CheckCircle2 className="size-3" strokeWidth={2.5} /> Completa
            </span>
        );
    }
    return (
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-transparent bg-zinc-100/80 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
            <Clock className="size-3" strokeWidth={1.8} /> {pendientes} pend.
        </span>
    );
}

/* ──────────────────────────────────────────────
   Tarjeta de categoría con acordeón de productos
────────────────────────────────────────────── */
function CategoriaCard({ cat }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`overflow-hidden rounded-xl border transition-colors ${
            open
                ? 'border-zinc-300 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900'
                : 'border-zinc-200/80 bg-zinc-50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/30 dark:hover:border-zinc-700'
        }`}>

            {/* ── cabecera ── */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left sm:px-5"
            >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                    {/* ícono categoría */}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <Tag className="size-3.5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">
                                {cat.nombre}
                            </span>
                            <Badge pendientes={cat.pendientes} total={cat.total} />
                        </div>
                        {/* barra compacta */}
                        <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1">
                                <Bar pct={cat.porcentaje} className="h-1" />
                            </div>
                            <span className="shrink-0 text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                                {cat.confirmadas}/{cat.total} · {cat.porcentaje}%
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 pt-0.5">
                    <span className="hidden text-[11px] text-zinc-400 dark:text-zinc-500 sm:inline">
                        {cat.productos.length} producto{cat.productos.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronDown
                        className={`size-4 text-zinc-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                        strokeWidth={2}
                    />
                </div>
            </button>

            {/* ── productos (acordeón) ── */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="border-t border-zinc-200/80 dark:border-zinc-800">
                        {/* encabezado tabla */}
                        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-4 border-b border-zinc-100 px-4 py-2 dark:border-zinc-800/60 sm:px-5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Producto</span>
                            <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Total</span>
                            <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Conf.</span>
                            <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Pend.</span>
                            <span className="w-20 text-right text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 sm:w-32">Progreso</span>
                        </div>

                        {/* filas de producto */}
                        {cat.productos.map((p) => (
                            <div
                                key={p.clave}
                                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-4 border-b border-zinc-100/80 px-4 py-2.5 last:border-0 dark:border-zinc-800/40 sm:px-5"
                            >
                                <div className="min-w-0">
                                    <p className="text-[12px] font-medium leading-snug text-zinc-800 [overflow-wrap:anywhere] dark:text-zinc-200">
                                        {p.descripcion}
                                    </p>
                                    {p.clave && (
                                        <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{p.clave}</p>
                                    )}
                                </div>
                                <span className="min-w-[2.5rem] text-center text-[12px] tabular-nums text-zinc-600 dark:text-zinc-400">{p.total}</span>
                                <span className="min-w-[2.5rem] text-center text-[12px] tabular-nums text-zinc-600 dark:text-zinc-400">{p.confirmadas}</span>
                                <span className="min-w-[2.5rem] text-center text-[12px] tabular-nums text-zinc-600 dark:text-zinc-400">{p.pendientes}</span>
                                <div className="w-20 sm:w-32">
                                    <div className="mb-0.5 flex justify-between gap-1">
                                        <span className="text-[10px] tabular-nums text-zinc-400">{p.porcentaje}%</span>
                                    </div>
                                    <Bar pct={p.porcentaje} className="h-1" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Selector de filtro (año / delegación)
────────────────────────────────────────────── */
function FiltroSelect({ label, value, onChange, options }) {
    return (
        <label className="flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
            <span className="whitespace-nowrap">{label}</span>
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value || null)}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-2.5 pr-7 text-[12px] font-medium text-zinc-800 shadow-sm outline-none transition-[border-color] focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-900/40"
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </label>
    );
}

/* ──────────────────────────────────────────────
   Página principal
────────────────────────────────────────────── */
function ResumenVestuario({
    categorias = [],
    resumen = { total: 0, confirmadas: 0, pendientes: 0, porcentaje: 0 },
    anio,
    anios_disponibles = [],
    delegacion_activa,
    delegaciones_opciones = [],
    empleados_actualizados = [],
    filters = {},
}) {
    const puedeVerResumen = useAuthCan()('Ver cotejo vestuario');

    if (!puedeVerResumen) {
        return (
            <>
                <Head title="Resumen de vestuario" />
                <AdminPageShell
                    title="Resumen de vestuario"
                    description="No tienes permisos para consultar esta sección."
                />
            </>
        );
    }

    const navegar = useCallback((overrides) => {
        router.get(
            route('vestuario.resumen'),
            { anio, delegacion: delegacion_activa, ...filters, ...overrides },
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, [anio, delegacion_activa, filters]);

    const opcionesAnio = anios_disponibles.map((a) => ({ value: a, label: `Año ${a}` }));
    const opcionesDelegacion = [
        { value: '', label: 'Todas las delegaciones' },
        ...delegaciones_opciones.map((c) => ({ value: c, label: c })),
    ];

    return (
        <>
            <Head title="Resumen de vestuario" />
            <AdminPageShell
                title="Resumen de vestuario"
                description={
                    <span className="tabular-nums">
                        Distribución por categoría y producto · ejercicio {anio}
                    </span>
                }
            >
                {/* ── Tarjetas globales ── */}
                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                    <StatCard icon={LayoutList} label="Total asignaciones"
                        value={resumen.total.toLocaleString()} hint={`Ejercicio ${anio}`} />
                    <StatCard icon={CheckCircle2} label="Confirmadas"
                        value={resumen.confirmadas.toLocaleString()} hint={`${resumen.porcentaje}% del total`} />
                    <StatCard icon={Package} label="Pendientes"
                        value={resumen.pendientes.toLocaleString()} hint="aún sin confirmar" />
                </div>

                {/* ── Barra global ── */}
                <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            <span className="inline-block size-1 rounded-full bg-brand-gold/55 align-middle dark:bg-brand-gold-soft/45" aria-hidden />
                            Avance global
                        </span>
                        <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {resumen.confirmadas.toLocaleString()}
                            </span>
                            {' '}/ {resumen.total.toLocaleString()}
                        </span>
                    </div>
                    <Bar pct={resumen.porcentaje} className="h-1.5" />
                </div>

                {/* ── Filtros ── */}
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <FiltroSelect
                        label="Año"
                        value={anio}
                        onChange={(v) => navegar({ anio: v || anio })}
                        options={opcionesAnio}
                    />
                    {delegaciones_opciones.length > 0 && (
                        <FiltroSelect
                            label="Delegación"
                            value={delegacion_activa}
                            onChange={(v) => navegar({ delegacion: v })}
                            options={opcionesDelegacion}
                        />
                    )}
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {categorias.length} categoría{categorias.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* ── Cotejo general: empleados actualizados ── */}
                <div className="mb-4 overflow-hidden rounded-xl border border-zinc-200/80 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/30">
                    <div className="flex items-center justify-between gap-3 border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800">
                        <div>
                            <p className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
                                Cotejo general de actualización
                            </p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                Empleados que ya actualizaron · verificar UR y Delegación
                            </p>
                        </div>
                        <span className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                            {empleados_actualizados.length} registros
                        </span>
                    </div>

                    {empleados_actualizados.length === 0 ? (
                        <p className="px-4 py-6 text-[12px] text-zinc-500 dark:text-zinc-400">
                            Aún no hay empleados con actualización registrada para los filtros seleccionados.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-[12px]">
                                <thead>
                                    <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                                        <th className="px-4 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400">NUE</th>
                                        <th className="px-4 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400">Empleado</th>
                                        <th className="px-4 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400">UR</th>
                                        <th className="px-4 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400">Delegación</th>
                                        <th className="px-4 py-2 text-center font-semibold text-zinc-500 dark:text-zinc-400">Prendas</th>
                                        <th className="px-4 py-2 text-left font-semibold text-zinc-500 dark:text-zinc-400">Última actualización</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {empleados_actualizados.map((emp) => (
                                        <tr key={emp.id} className="border-b border-zinc-100/80 dark:border-zinc-800/60">
                                            <td className="px-4 py-2 font-mono text-zinc-700 dark:text-zinc-300">{emp.nue || '—'}</td>
                                            <td className="px-4 py-2 text-zinc-800 dark:text-zinc-100">{emp.nombre_completo || '—'}</td>
                                            <td className="px-4 py-2 font-mono text-zinc-700 dark:text-zinc-300">{emp.ur || '—'}</td>
                                            <td className="px-4 py-2 font-mono text-zinc-700 dark:text-zinc-300">{emp.delegacion_codigo || '—'}</td>
                                            <td className="px-4 py-2 text-center tabular-nums text-zinc-700 dark:text-zinc-300">{emp.prendas_actualizadas}</td>
                                            <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">
                                                {emp.ultima_actualizacion
                                                    ? new Date(emp.ultima_actualizacion).toLocaleString('es-MX')
                                                    : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Lista de categorías ── */}
                {categorias.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/20">
                        <Package className="size-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} aria-hidden />
                        <div className="text-center">
                            <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Sin datos</p>
                            <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                                No hay asignaciones para los filtros seleccionados.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {categorias.map((cat) => (
                            <CategoriaCard key={cat.nombre} cat={cat} />
                        ))}
                    </div>
                )}
            </AdminPageShell>
        </>
    );
}

ResumenVestuario.layout = createAdminPageLayout('Resumen Vestuario');

export default ResumenVestuario;
