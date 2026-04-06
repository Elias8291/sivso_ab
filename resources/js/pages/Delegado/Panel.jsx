import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bell,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Clock,
    Lock,
    PieChart,
    Shirt,
    Tag,
    User,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

/* ── Period strip (minimal) ───────────────────────────────────── */

function PeriodStrip({ periodo }) {
    if (!periodo) return null;

    const fmtFecha = (d) =>
        d
            ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
              })
            : null;

    if (periodo.estado === 'abierto') {
        return (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-zinc-600 dark:text-zinc-400">
                <span className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
                    Período abierto
                </span>
                <span className="text-zinc-400 dark:text-zinc-600">·</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{periodo.nombre}</span>
                {periodo.fecha_fin && (
                    <>
                        <span className="hidden sm:inline text-zinc-400 dark:text-zinc-600">·</span>
                        <span className="text-zinc-500 dark:text-zinc-500">hasta {fmtFecha(periodo.fecha_fin)}</span>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-zinc-500 dark:text-zinc-400">
            <Lock className="size-3.5 shrink-0 opacity-60" strokeWidth={1.75} aria-hidden />
            <span>
                {periodo.estado === 'cerrado' ? 'Período cerrado' : 'Próximo período'}
                <span className="text-zinc-400 dark:text-zinc-600"> · </span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{periodo.nombre}</span>
            </span>
        </div>
    );
}

/* ── Stat row (minimal inline) ─────────────────────────────────── */

function StatRow({ label, value, sub }) {
    return (
        <div className="min-w-0 border-l border-zinc-200/90 pl-4 first:border-l-0 first:pl-0 dark:border-zinc-700/80">
            <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500">{label}</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                {value}
            </p>
            {sub ? <p className="mt-0.5 text-[11px] text-zinc-400 dark:text-zinc-600">{sub}</p> : null}
        </div>
    );
}

/* ── Progress minimal ──────────────────────────────────────────── */

function ProgressMinimal({ pct, listos, total, anio }) {
    const safe = Math.min(100, Math.max(0, pct));
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <div className="shrink-0">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-500">Avance · {anio}</p>
                <p className="mt-1 tabular-nums text-4xl font-light tracking-tight text-zinc-900 dark:text-zinc-50">
                    {safe}
                    <span className="ml-0.5 text-lg font-normal text-zinc-400 dark:text-zinc-600">%</span>
                </p>
            </div>
            <div className="min-w-0 flex-1 space-y-2">
                <div className="h-1 w-full max-w-2xl overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800/80">
                    <div
                        className="h-full rounded-full bg-brand-gold/70 transition-[width] duration-500 dark:bg-brand-gold-soft/55"
                        style={{ width: `${safe}%` }}
                    />
                </div>
                <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{listos}</span>
                    {' / '}
                    {total} empleados con vestuario completo
                </p>
            </div>
        </div>
    );
}

/* ── Category table (minimal accordion) ────────────────────────── */

function CategoryTable({ prendas = [] }) {
    const [open, setOpen] = useState(true);

    const aniosDisponibles = [...new Set(prendas.map((p) => p.anio))].sort((a, b) => b - a);
    const anioActivo = aniosDisponibles[0];
    const prendasActivas = prendas.filter((p) => p.anio === anioActivo);

    if (prendas.length === 0) {
        return (
            <p className="py-8 text-[13px] text-zinc-400 dark:text-zinc-500">Sin datos de prendas para mostrar.</p>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="mb-3 flex w-full max-w-2xl items-center justify-between gap-3 py-1 text-left text-[12px] font-medium text-zinc-700 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
                <span className="flex items-center gap-2">
                    <Tag className="size-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} aria-hidden />
                    Por prenda
                    <span className="font-normal tabular-nums text-zinc-400 dark:text-zinc-600">
                        ({prendasActivas.length})
                    </span>
                </span>
                <ChevronDown
                    className={`size-4 shrink-0 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                />
            </button>

            <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">
                    <div className="overflow-x-auto rounded-lg border border-zinc-200/70 dark:border-zinc-800/80">
                        <table className="w-full min-w-[520px] text-left text-[12px]">
                            <thead>
                                <tr className="border-b border-zinc-200/80 bg-zinc-50/80 dark:border-zinc-800/70 dark:bg-zinc-900/40">
                                    <th className="px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-500">Prenda</th>
                                    <th className="w-14 px-2 py-2.5 text-center font-medium text-zinc-500 dark:text-zinc-500">
                                        Tot.
                                    </th>
                                    <th className="w-14 px-2 py-2.5 text-center font-medium text-zinc-500 dark:text-zinc-500">
                                        Ok
                                    </th>
                                    <th className="w-14 px-2 py-2.5 text-center font-medium text-zinc-500 dark:text-zinc-500">
                                        Pend.
                                    </th>
                                    <th className="w-16 px-3 py-2.5 text-right font-medium text-zinc-500 dark:text-zinc-500">
                                        %
                                    </th>
                                    <th className="min-w-[120px] px-4 py-2.5 font-medium text-zinc-500 dark:text-zinc-500">
                                        Progreso
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                                {prendasActivas.map((p) => (
                                    <tr key={p.clave ?? p.descripcion} className="bg-white dark:bg-zinc-950/20">
                                        <td className="px-4 py-2.5 align-middle">
                                            <p className="font-medium text-zinc-800 dark:text-zinc-200 [overflow-wrap:anywhere]">
                                                {p.descripcion}
                                            </p>
                                            {p.clave && (
                                                <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-600">
                                                    {p.clave}
                                                </p>
                                            )}
                                        </td>
                                        <td className="px-2 py-2.5 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                                            {p.total}
                                        </td>
                                        <td className="px-2 py-2.5 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                                            {p.confirmadas}
                                        </td>
                                        <td className="px-2 py-2.5 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                                            {p.pendientes}
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums text-zinc-500 dark:text-zinc-500">
                                            {p.porcentaje}
                                        </td>
                                        <td className="px-4 py-2.5 align-middle">
                                            <div className="h-1 max-w-[140px] overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                <div
                                                    className="h-full rounded-full bg-brand-gold/60 dark:bg-brand-gold-soft/50"
                                                    style={{ width: `${p.porcentaje}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Quick link (list row) ───────────────────────────────────── */

function QuickLink({ icon: Icon, label, hint, href, badge }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 border-b border-zinc-100 py-3.5 text-left transition first:pt-0 last:border-b-0 dark:border-zinc-800/70"
        >
            <Icon
                className="size-[17px] shrink-0 text-zinc-400 group-hover:text-brand-gold/80 dark:text-zinc-500 dark:group-hover:text-brand-gold-soft/75"
                strokeWidth={1.5}
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                    {badge != null && badge > 0 ? (
                        <span className="rounded-full bg-rose-500/90 px-1.5 py-px text-[10px] font-semibold tabular-nums text-white">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    ) : null}
                </div>
                {hint ? (
                    <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-500">{hint}</p>
                ) : null}
            </div>
            <ChevronRight
                className="size-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400"
                strokeWidth={1.75}
                aria-hidden
            />
        </Link>
    );
}

/* ── Page ─────────────────────────────────────────────────────── */

function PanelDelegado({ resumen, contexto, periodo, resumen_prendas = [] }) {
    const { notificaciones = [] } = usePage().props;
    const notifCount = Array.isArray(notificaciones) ? notificaciones.length : 0;

    const anio = resumen.anio_actual ?? new Date().getFullYear();
    const pct = resumen.pct_completado ?? 0;

    const delegadoNombre = contexto.delegado_nombre;
    const delegaciones = contexto.delegaciones ?? [];

    const enProgreso = Math.max(
        0,
        (resumen.total ?? 0) - (resumen.listos ?? 0) - (resumen.sin_empezar ?? 0) - (resumen.bajas ?? 0),
    );

    return (
        <>
            <Head title="Panel del Delegado" />

            <div className="w-full max-w-none pr-0 text-left 2xl:max-w-[92rem]">
                {/* Encabezado: alineado a la izquierda, ancho completo del contenido */}
                <header className="max-w-3xl space-y-3 border-b border-zinc-200/80 pb-8 dark:border-zinc-800/80">
                    <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-brand-gold/85 dark:text-brand-gold-soft/75">
                        SIVSO · Delegado
                    </p>
                    <h1 className="text-[1.65rem] font-semibold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                        Panel
                    </h1>
                    <div className="space-y-1 text-[13px] text-zinc-600 dark:text-zinc-400">
                        {delegadoNombre ? (
                            <p className="font-medium text-zinc-800 dark:text-zinc-200">{delegadoNombre}</p>
                        ) : null}
                        {delegaciones.length > 0 ? (
                            <p className="font-mono text-[12px] text-zinc-500 dark:text-zinc-500">
                                {delegaciones.join(' · ')}
                            </p>
                        ) : null}
                        <p className="tabular-nums text-zinc-400 dark:text-zinc-600">
                            Vestuario {anio} · referencia {resumen.anio_ref}
                        </p>
                    </div>
                    {periodo ? (
                        <div className="pt-2">
                            <PeriodStrip periodo={periodo} />
                        </div>
                    ) : null}
                </header>

                <div className="mt-8 grid gap-10 xl:grid-cols-12 xl:gap-12">
                    {/* Columna principal: métricas y detalle */}
                    <div className="space-y-10 xl:col-span-8">
                        <section>
                            <h2 className="mb-4 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-600">
                                Resumen
                            </h2>
                            <div className="flex flex-wrap gap-y-6 gap-x-6 sm:gap-x-10 md:gap-x-12">
                                <StatRow label="Total" value={resumen.total ?? 0} sub="Empleados" />
                                <StatRow label="Completos" value={resumen.listos ?? 0} sub="Vestuario listo" />
                                <StatRow label="Sin empezar" value={resumen.sin_empezar ?? 0} sub="Pendiente de confirmar" />
                                <StatRow label="Bajas" value={resumen.bajas ?? 0} sub="En baja" />
                            </div>
                            {enProgreso > 0 ? (
                                <p className="mt-4 text-[12px] text-zinc-500 dark:text-zinc-500">
                                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{enProgreso}</span>
                                    {' en progreso'}
                                </p>
                            ) : null}
                        </section>

                        <section className="max-w-3xl border-t border-zinc-200/70 pt-10 dark:border-zinc-800/70">
                            <h2 className="mb-5 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-600">
                                Progreso global
                            </h2>
                            <ProgressMinimal
                                pct={pct}
                                listos={resumen.listos ?? 0}
                                total={resumen.total ?? 0}
                                anio={anio}
                            />
                        </section>

                        <section className="max-w-4xl border-t border-zinc-200/70 pt-10 dark:border-zinc-800/70">
                            <h2 className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-600">
                                Detalle
                            </h2>
                            <CategoryTable prendas={resumen_prendas} />
                        </section>
                    </div>

                    {/* Columna lateral: acciones, fija en lectura */}
                    <aside className="xl:col-span-4 xl:border-l xl:border-zinc-200/70 xl:pl-10 dark:xl:border-zinc-800/70 xl:self-start xl:sticky xl:top-6">
                        <h2 className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-600">
                            Ir a
                        </h2>
                        <p className="mb-2 text-[12px] text-zinc-500 dark:text-zinc-500">
                            Accesos frecuentes
                        </p>
                        <nav className="mt-4" aria-label="Accesos rápidos">
                            <QuickLink
                                icon={Shirt}
                                label="Mi delegación"
                                hint="Empleados, tallas y solicitudes"
                                href={route('my-delegation.index')}
                            />
                            <QuickLink
                                icon={PieChart}
                                label="Resumen de vestuario"
                                hint="Categorías y productos"
                                href={route('vestuario.resumen')}
                            />
                            <QuickLink
                                icon={Bell}
                                label="Notificaciones"
                                hint={notifCount > 0 ? `${notifCount} sin leer` : 'Sin avisos nuevos'}
                                href={route('notificaciones.index')}
                                badge={notifCount}
                            />
                            <QuickLink
                                icon={User}
                                label="Mi cuenta"
                                hint="Perfil y contraseña"
                                href={route('profile.edit')}
                            />
                        </nav>
                    </aside>
                </div>
            </div>
        </>
    );
}

PanelDelegado.layout = createAdminPageLayout('Panel del Delegado');

export default PanelDelegado;
