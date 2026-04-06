import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { Bell, ChevronDown, ChevronRight, Lock, PieChart, Shirt, Tag, User } from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

function PeriodPill({ periodo }) {
    if (!periodo) return null;

    const fmtFecha = (d) =>
        d
            ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
              })
            : null;

    if (periodo.estado === 'abierto') {
        return (
            <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/40 px-4 py-2 text-[12px] text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/25 dark:text-emerald-200">
                <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                <span className="font-medium">Período abierto</span>
                <span className="hidden text-emerald-600/70 sm:inline dark:text-emerald-400/60">·</span>
                <span className="text-emerald-800/90 dark:text-emerald-300/90">{periodo.nombre}</span>
                {periodo.fecha_fin ? (
                    <span className="w-full text-[11px] font-normal text-emerald-700/80 sm:w-auto dark:text-emerald-400/80">
                        Cierre {fmtFecha(periodo.fecha_fin)}
                    </span>
                ) : null}
            </div>
        );
    }

    return (
        <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200/90 bg-zinc-50/80 px-4 py-2 text-[12px] text-zinc-600 dark:border-zinc-700/80 dark:bg-zinc-900/35 dark:text-zinc-400">
            <Lock className="size-3.5 shrink-0 opacity-50" strokeWidth={1.5} aria-hidden />
            <span>
                {periodo.estado === 'cerrado' ? 'Período cerrado' : 'Próximo período'}
                <span className="text-zinc-400"> · </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-300">{periodo.nombre}</span>
            </span>
        </div>
    );
}

function Metric({ label, value }) {
    return (
        <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">{label}</p>
            <p className="mt-2 text-[1.75rem] font-light tabular-nums leading-none tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[2rem]">
                {value}
            </p>
        </div>
    );
}

function ProgressBlock({ pct, listos, total, anio }) {
    const safe = Math.min(100, Math.max(0, pct));
    return (
        <div className="rounded-2xl border border-zinc-200/55 bg-white/80 px-6 py-8 sm:px-8 dark:border-zinc-800/60 dark:bg-zinc-950/35">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between sm:gap-10">
                <div>
                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                        Avance consolidado
                    </p>
                    <p className="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400">Vestuario {anio}</p>
                </div>
                <p className="tabular-nums text-5xl font-extralight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
                    {safe}
                    <span className="text-2xl font-light text-zinc-300 dark:text-zinc-600">%</span>
                </p>
            </div>
            <div className="mt-8">
                <div className="h-0.5 w-full overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800/80">
                    <div
                        className="h-0.5 rounded-full bg-gradient-to-r from-brand-gold/80 to-brand-gold-soft/70 transition-[width] duration-700 dark:from-brand-gold-soft/70 dark:to-brand-gold/60"
                        style={{ width: `${safe}%` }}
                    />
                </div>
                <p className="mt-4 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    <span className="text-zinc-900 dark:text-zinc-100">{listos}</span>
                    {' de '}
                    <span className="text-zinc-900 dark:text-zinc-100">{total}</span>
                    {' empleados con expediente de vestuario completo.'}
                </p>
            </div>
        </div>
    );
}

function GarmentTable({ prendas = [] }) {
    const [open, setOpen] = useState(true);
    const anios = [...new Set(prendas.map((p) => p.anio))].sort((a, b) => b - a);
    const anioActivo = anios[0];
    const filas = prendas.filter((p) => p.anio === anioActivo);

    if (prendas.length === 0) {
        return (
            <p className="py-10 text-center text-[13px] text-zinc-400 dark:text-zinc-500">
                No hay registros de prendas para esta delegación.
            </p>
        );
    }

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="mb-4 flex w-full items-center justify-between gap-3 py-1 text-left"
            >
                <span className="flex items-center gap-2 text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                    <Tag className="size-3.5 text-zinc-300 dark:text-zinc-600" strokeWidth={1.5} aria-hidden />
                    Detalle por prenda
                    <span className="font-normal tabular-nums text-zinc-400 dark:text-zinc-600">{filas.length}</span>
                </span>
                <ChevronDown
                    className={`size-4 text-zinc-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    strokeWidth={1.75}
                />
            </button>

            <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[540px] text-left text-[13px]">
                            <thead>
                                <tr className="border-b border-zinc-200/80 dark:border-zinc-800/80">
                                    <th className="pb-3 pr-4 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                                        Prenda
                                    </th>
                                    <th className="w-12 pb-3 pt-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                                        Tot.
                                    </th>
                                    <th className="w-12 pb-3 pt-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                                        Ok
                                    </th>
                                    <th className="w-12 pb-3 pt-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                                        Pend.
                                    </th>
                                    <th className="w-14 pb-3 pt-1 text-right text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                                        %
                                    </th>
                                    <th className="min-w-[100px] pb-3 pl-4 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                                        Avance
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filas.map((p, i) => (
                                    <tr
                                        key={`${p.clave ?? ''}-${p.descripcion}-${i}`}
                                        className="border-b border-zinc-100/90 last:border-0 dark:border-zinc-800/50"
                                    >
                                        <td className="py-4 pr-4 align-middle">
                                            <p className="font-medium leading-snug text-zinc-800 dark:text-zinc-200 [overflow-wrap:anywhere]">
                                                {p.descripcion}
                                            </p>
                                            {p.clave ? (
                                                <p className="mt-0.5 font-mono text-[11px] text-zinc-400 dark:text-zinc-600">
                                                    {p.clave}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="py-4 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                                            {p.total}
                                        </td>
                                        <td className="py-4 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                                            {p.confirmadas}
                                        </td>
                                        <td className="py-4 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                                            {p.pendientes}
                                        </td>
                                        <td className="py-4 text-right tabular-nums text-zinc-500 dark:text-zinc-500">
                                            {p.porcentaje}
                                        </td>
                                        <td className="py-4 pl-4 align-middle">
                                            <div className="h-0.5 max-w-[120px] overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
                                                <div
                                                    className="h-full rounded-full bg-brand-gold/65 dark:bg-brand-gold-soft/55"
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

function NavItem({ icon: Icon, label, description, href, badge }) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-4 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-white/90 dark:hover:bg-zinc-800/40"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200/70 bg-white/80 text-zinc-400 transition group-hover:border-brand-gold/25 group-hover:text-brand-gold/90 dark:border-zinc-700/80 dark:bg-zinc-950/50 dark:text-zinc-500 dark:group-hover:border-brand-gold-soft/30 dark:group-hover:text-brand-gold-soft">
                <Icon className="size-[17px]" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                    {badge != null && badge > 0 ? (
                        <span className="rounded-md bg-rose-500/90 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    ) : null}
                </span>
                {description ? (
                    <span className="mt-0.5 block text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
                        {description}
                    </span>
                ) : null}
            </span>
            <ChevronRight
                className="size-4 shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400"
                strokeWidth={1.5}
                aria-hidden
            />
        </Link>
    );
}

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

            <div className="w-full max-w-[min(100%,90rem)] text-left">
                {/* Cabecera editorial */}
                <header className="grid gap-8 pb-12 lg:grid-cols-[auto_1fr] lg:gap-10 lg:pb-16">
                    <div
                        className="hidden w-px shrink-0 self-stretch bg-gradient-to-b from-brand-gold/50 via-brand-gold/20 to-transparent lg:block dark:from-brand-gold-soft/45 dark:via-brand-gold-soft/15"
                        aria-hidden
                    />
                    <div className="min-w-0 space-y-6">
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-brand-gold/80 dark:text-brand-gold-soft/75">
                                Sistema integral de vestuario
                            </p>
                            <h1 className="mt-3 text-[1.875rem] font-light leading-[1.15] tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[2.35rem]">
                                Panel del delegado
                            </h1>
                        </div>

                        <div className="flex flex-col gap-1 text-[13px] text-zinc-600 dark:text-zinc-400 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3">
                            {delegadoNombre ? (
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">{delegadoNombre}</span>
                            ) : null}
                            {delegadoNombre && delegaciones.length > 0 ? (
                                <span className="hidden text-zinc-300 sm:inline dark:text-zinc-600" aria-hidden>
                                    ·
                                </span>
                            ) : null}
                            {delegaciones.length > 0 ? (
                                <span className="font-mono text-[12px] text-zinc-500 dark:text-zinc-500">
                                    {delegaciones.join(' · ')}
                                </span>
                            ) : null}
                        </div>

                        <p className="text-[12px] tabular-nums tracking-wide text-zinc-400 dark:text-zinc-600">
                            Ciclo {anio}
                            <span className="mx-2 text-zinc-300 dark:text-zinc-700">—</span>
                            Referencia {resumen.anio_ref}
                        </p>

                        {periodo ? <PeriodPill periodo={periodo} /> : null}
                    </div>
                </header>

                <div className="grid gap-14 xl:grid-cols-[minmax(0,1fr)_min(100%,20rem)] xl:gap-20">
                    <main className="min-w-0 space-y-14">
                        {/* Indicadores */}
                        <section>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                                Indicadores
                            </p>
                            <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4 sm:gap-x-10">
                                <Metric label="Personal" value={resumen.total ?? 0} />
                                <Metric label="Completos" value={resumen.listos ?? 0} />
                                <Metric label="Sin empezar" value={resumen.sin_empezar ?? 0} />
                                <Metric label="Bajas" value={resumen.bajas ?? 0} />
                            </div>
                            {enProgreso > 0 ? (
                                <p className="mt-8 text-[12px] text-zinc-500 dark:text-zinc-500">
                                    <span className="font-medium text-zinc-800 dark:text-zinc-300">{enProgreso}</span>
                                    {' en proceso intermedio'}
                                </p>
                            ) : null}
                        </section>

                        <section>
                            <ProgressBlock pct={pct} listos={resumen.listos ?? 0} total={resumen.total ?? 0} anio={anio} />
                        </section>

                        <section className="pt-2">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                                Desglose
                            </p>
                            <div className="mt-6">
                                <GarmentTable prendas={resumen_prendas} />
                            </div>
                        </section>
                    </main>

                    {/* Columna lateral: tarjeta contenedora suave */}
                    <aside className="h-fit xl:sticky xl:top-6">
                        <div className="rounded-2xl border border-zinc-200/60 bg-zinc-50/40 px-2 py-2 dark:border-zinc-800/70 dark:bg-zinc-900/25">
                            <div className="border-b border-zinc-200/60 px-4 py-4 dark:border-zinc-800/60">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-600">
                                    Enlace directo
                                </p>
                                <p className="mt-1 text-[13px] text-zinc-600 dark:text-zinc-400">Continúe su gestión</p>
                            </div>
                            <nav className="py-1" aria-label="Accesos del panel">
                                <NavItem
                                    icon={Shirt}
                                    label="Mi delegación"
                                    description="Altas, tallas y solicitudes"
                                    href={route('my-delegation.index')}
                                />
                                <NavItem
                                    icon={PieChart}
                                    label="Resumen de vestuario"
                                    description="Vista por categoría"
                                    href={route('vestuario.resumen')}
                                />
                                <NavItem
                                    icon={Bell}
                                    label="Notificaciones"
                                    description={
                                        notifCount > 0 ? `${notifCount} sin leer` : 'Bandeja de avisos'
                                    }
                                    href={route('notificaciones.index')}
                                    badge={notifCount}
                                />
                                <NavItem
                                    icon={User}
                                    label="Mi cuenta"
                                    description="Perfil y seguridad"
                                    href={route('profile.edit')}
                                />
                            </nav>
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

PanelDelegado.layout = createAdminPageLayout('Panel del Delegado');

export default PanelDelegado;
