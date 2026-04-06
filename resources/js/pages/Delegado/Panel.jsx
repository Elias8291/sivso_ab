import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bell,
    CheckCircle2,
    ChevronDown,
    Clock,
    Lock,
    PieChart,
    Shirt,
    Tag,
    TrendingUp,
    User,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { route } from 'ziggy-js';

/* ── StatCard ──────────────────────────────────────────────────── */

const STAT_VARIANTS = {
    default: {
        wrap: 'border-zinc-200/80 bg-white dark:border-zinc-800/90 dark:bg-zinc-950/50',
        accent: '',
        icon: 'text-zinc-300 dark:text-zinc-600',
        label: 'text-zinc-500 dark:text-zinc-400',
        value: 'text-zinc-900 dark:text-zinc-50',
        hint: 'text-zinc-400 dark:text-zinc-500',
    },
    gold: {
        wrap: 'border-zinc-200/80 bg-white border-l-[3px] border-l-brand-gold/50 dark:border-zinc-800/90 dark:bg-zinc-950/50 dark:border-l-brand-gold-soft/40',
        accent: '',
        icon: 'text-brand-gold/55 dark:text-brand-gold-soft/50',
        label: 'text-zinc-500 dark:text-zinc-400',
        value: 'text-zinc-900 dark:text-zinc-50',
        hint: 'text-zinc-400 dark:text-zinc-500',
    },
    muted: {
        wrap: 'border-zinc-200/60 bg-zinc-50/70 dark:border-zinc-800/60 dark:bg-zinc-950/30',
        accent: '',
        icon: 'text-zinc-200 dark:text-zinc-700',
        label: 'text-zinc-400 dark:text-zinc-500',
        value: 'text-zinc-500 dark:text-zinc-400',
        hint: 'text-zinc-400 dark:text-zinc-600',
    },
};

function StatCard({ icon: Icon, label, value, hint, variant = 'default' }) {
    const v = STAT_VARIANTS[variant] ?? STAT_VARIANTS.default;
    return (
        <div className={`rounded-xl border px-4 py-4 shadow-sm transition-shadow hover:shadow-md ${v.wrap}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
                <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${v.label}`}>{label}</p>
                <Icon className={`size-[18px] shrink-0 ${v.icon}`} strokeWidth={1.5} aria-hidden />
            </div>
            <p className={`text-3xl font-semibold tabular-nums tracking-tight ${v.value}`}>{value}</p>
            {hint ? <p className={`mt-1.5 text-[11px] leading-snug ${v.hint}`}>{hint}</p> : null}
        </div>
    );
}

/* ── BigProgress ───────────────────────────────────────────────── */

function BigProgress({ pct, listos, total, anio }) {
    const safe = Math.min(100, Math.max(0, pct));
    return (
        <div className="rounded-xl border border-zinc-200/80 bg-white px-5 py-5 shadow-sm dark:border-zinc-800/90 dark:bg-zinc-950/50">
            <div className="mb-1 flex items-end justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                    Avance global · Vestuario {anio}
                </p>
                <span className="tabular-nums text-[28px] font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
                    {safe}
                    <span className="ml-0.5 text-[16px] font-medium text-zinc-400 dark:text-zinc-500">%</span>
                </span>
            </div>

            {/* track */}
            <div className="relative mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-gold/55 via-brand-gold/80 to-brand-gold-soft/65 transition-all duration-700 dark:from-brand-gold-soft/40 dark:via-brand-gold-soft/65 dark:to-brand-gold/50"
                    style={{ width: `${safe}%` }}
                />
            </div>

            <p className="mt-3 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{listos}</span>
                {' de '}
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{total}</span>
                {' empleados con vestuario completo'}
            </p>
        </div>
    );
}

/* ── PeriodBanner ──────────────────────────────────────────────── */

function PeriodBanner({ periodo }) {
    if (!periodo) return null;

    const fmtFecha = (d) =>
        d
            ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
              })
            : null;

    if (periodo.estado === 'abierto') {
        return (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
                <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                    strokeWidth={2}
                />
                <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-200">
                        Período abierto
                        <span className="ml-1.5 font-normal text-emerald-700 dark:text-emerald-300">
                            · {periodo.nombre}
                        </span>
                    </p>
                    {periodo.fecha_fin && (
                        <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400">
                            Cierra el {fmtFecha(periodo.fecha_fin)}
                        </p>
                    )}
                    {periodo.descripcion && (
                        <p className="mt-1 text-[11px] leading-relaxed text-emerald-600/80 dark:text-emerald-500/80">
                            {periodo.descripcion}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <Lock className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} />
            <div>
                <p className="text-[13px] font-semibold text-zinc-700 dark:text-zinc-300">
                    {periodo.estado === 'cerrado' ? 'Período cerrado' : 'Período próximo'}
                    <span className="ml-1.5 font-normal text-zinc-500 dark:text-zinc-400">· {periodo.nombre}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    La actualización de tallas no está disponible en este momento.
                </p>
            </div>
        </div>
    );
}

/* ── CategoryTable ─────────────────────────────────────────────── */

function CategoryTable({ prendas = [] }) {
    const [open, setOpen] = useState(false);

    const aniosDisponibles = [...new Set(prendas.map((p) => p.anio))].sort((a, b) => b - a);
    const anioActivo = aniosDisponibles[0];
    const prendasActivas = prendas.filter((p) => p.anio === anioActivo);

    if (prendas.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50/60 py-12 dark:border-zinc-800 dark:bg-zinc-900/20">
                <Tag className="size-7 text-zinc-200 dark:text-zinc-700" strokeWidth={1.25} />
                <p className="text-[12px] text-zinc-400 dark:text-zinc-500">Sin datos de categorías disponibles.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800/90 dark:bg-zinc-950/50">
            {/* toggle */}
            <button
                type="button"
                onClick={() => setOpen((p) => !p)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30"
            >
                <div className="flex items-center gap-3">
                    <Tag
                        className="size-4 shrink-0 text-brand-gold/60 dark:text-brand-gold-soft/50"
                        strokeWidth={1.75}
                    />
                    <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                        Resumen por prenda
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        {prendasActivas.length}
                    </span>
                </div>
                <ChevronDown
                    className={`size-4 shrink-0 text-zinc-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                    strokeWidth={2}
                />
            </button>

            {/* accordion body */}
            <div
                className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
            >
                <div className="overflow-hidden">
                    <div className="border-t border-zinc-100 dark:border-zinc-800/60">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[440px] text-[12px]">
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-zinc-800/60">
                                        <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                                            Prenda
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                                            Total
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                                            Conf.
                                        </th>
                                        <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                                            Pend.
                                        </th>
                                        <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                                            %
                                        </th>
                                        <th className="w-[22%] px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                                            Progreso
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/40">
                                    {prendasActivas.map((p) => (
                                        <tr
                                            key={p.clave ?? p.descripcion}
                                            className="align-middle transition-colors hover:bg-zinc-50/60 dark:hover:bg-zinc-900/20"
                                        >
                                            <td className="px-5 py-3">
                                                <p className="font-medium leading-snug text-zinc-800 dark:text-zinc-200 [overflow-wrap:anywhere]">
                                                    {p.descripcion}
                                                </p>
                                                {p.clave && (
                                                    <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                                                        {p.clave}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                                                {p.total}
                                            </td>
                                            <td className="px-3 py-3 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                                                {p.confirmadas}
                                            </td>
                                            <td className="px-3 py-3 text-center tabular-nums text-zinc-600 dark:text-zinc-400">
                                                {p.pendientes}
                                            </td>
                                            <td className="px-5 py-3 text-right tabular-nums text-zinc-500 dark:text-zinc-400">
                                                {p.porcentaje}%
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-brand-gold/45 via-brand-gold/65 to-brand-gold-soft/55 transition-all duration-500 dark:from-brand-gold-soft/35 dark:via-brand-gold-soft/50 dark:to-brand-gold/40"
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
        </div>
    );
}

/* ── QuickAction ───────────────────────────────────────────────── */

function QuickAction({ icon: Icon, label, hint, href, badge }) {
    return (
        <Link
            href={href}
            className="group flex min-h-[5rem] flex-col justify-between gap-3 rounded-xl border border-zinc-200/85 bg-white px-4 py-4 shadow-sm transition-all hover:border-brand-gold/30 hover:bg-zinc-50/90 hover:shadow-md dark:border-zinc-800/90 dark:bg-zinc-950/50 dark:hover:border-brand-gold-soft/25 dark:hover:bg-zinc-900/40"
        >
            <div className="flex items-center justify-between gap-2">
                <Icon
                    className="size-[18px] shrink-0 text-zinc-400 transition-colors group-hover:text-brand-gold/70 dark:text-zinc-500 dark:group-hover:text-brand-gold-soft/60"
                    strokeWidth={1.75}
                />
                {badge != null && badge > 0 ? (
                    <span className="rounded-full bg-rose-500 px-1.5 py-px text-[10px] font-bold tabular-nums text-white">
                        {badge > 9 ? '9+' : badge}
                    </span>
                ) : null}
            </div>
            <div className="min-w-0">
                <p className="text-[13px] font-semibold text-zinc-900 dark:text-zinc-100">{label}</p>
                {hint ? (
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</p>
                ) : null}
            </div>
        </Link>
    );
}

/* ── SectionTitle ──────────────────────────────────────────────── */

function SectionTitle({ children }) {
    return (
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400 dark:text-zinc-500">
            {children}
        </h2>
    );
}

/* ── DividerLine ───────────────────────────────────────────────── */

function DividerLine() {
    return (
        <div className="flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/80" />
            <span className="size-1 rounded-full bg-brand-gold/30 dark:bg-brand-gold-soft/25" />
            <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800/80" />
        </div>
    );
}

/* ── Page ──────────────────────────────────────────────────────── */

function PanelDelegado({ resumen, contexto, periodo, resumen_prendas = [] }) {
    const { notificaciones = [] } = usePage().props;
    const notifCount = Array.isArray(notificaciones) ? notificaciones.length : 0;

    const anio = resumen.anio_actual ?? new Date().getFullYear();
    const pct  = resumen.pct_completado ?? 0;

    const delegadoNombre = contexto.delegado_nombre;
    const delegaciones   = contexto.delegaciones ?? [];

    const enProgreso = Math.max(
        0,
        (resumen.total ?? 0) - (resumen.listos ?? 0) - (resumen.sin_empezar ?? 0) - (resumen.bajas ?? 0),
    );

    return (
        <>
            <Head title="Panel del Delegado" />

            <div className="mx-auto w-full max-w-3xl space-y-9">

                {/* ── Identity header ── */}
                <header className="flex gap-4">
                    <span
                        className="mt-1 hidden h-16 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-gold/55 to-brand-gold/10 sm:block dark:from-brand-gold-soft/50 dark:to-brand-gold-soft/8"
                        aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-2.5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-gold/90 dark:text-brand-gold-soft/80">
                            Sistema integral de vestuario
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                            Panel del delegado
                        </h1>
                        <div className="space-y-1">
                            {delegadoNombre && (
                                <p className="text-[14px] font-medium text-zinc-800 dark:text-zinc-100">
                                    {delegadoNombre}
                                </p>
                            )}
                            {delegaciones.length > 0 && (
                                <p className="font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
                                    {delegaciones.join(' · ')}
                                </p>
                            )}
                            <p className="text-[12px] tabular-nums text-zinc-400 dark:text-zinc-500">
                                Vestuario {anio}
                                <span className="mx-1.5 text-zinc-300 dark:text-zinc-600" aria-hidden>
                                    ·
                                </span>
                                referencia {resumen.anio_ref}
                            </p>
                        </div>
                    </div>
                </header>

                {/* ── Period status ── */}
                {periodo && <PeriodBanner periodo={periodo} />}

                <DividerLine />

                {/* ── Stats grid ── */}
                <section className="space-y-3">
                    <SectionTitle>Estadísticas de vestuario</SectionTitle>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <StatCard
                            icon={Users}
                            label="Total"
                            value={resumen.total ?? 0}
                            hint="Empleados en delegación"
                            variant="default"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            label="Completos"
                            value={resumen.listos ?? 0}
                            hint="Vestuario confirmado"
                            variant="gold"
                        />
                        <StatCard
                            icon={Clock}
                            label="Sin empezar"
                            value={resumen.sin_empezar ?? 0}
                            hint="Sin prendas confirmadas"
                            variant="default"
                        />
                        <StatCard
                            icon={XCircle}
                            label="Bajas"
                            value={resumen.bajas ?? 0}
                            hint="Empleados en baja"
                            variant="muted"
                        />
                    </div>
                    {enProgreso > 0 && (
                        <p className="text-right text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                            <span className="font-medium text-zinc-600 dark:text-zinc-400">{enProgreso}</span>
                            {' empleado'}
                            {enProgreso !== 1 ? 's' : ''}
                            {' en progreso'}
                        </p>
                    )}
                </section>

                {/* ── Progress bar ── */}
                <section className="space-y-3">
                    <SectionTitle>Avance global</SectionTitle>
                    <BigProgress
                        pct={pct}
                        listos={resumen.listos ?? 0}
                        total={resumen.total ?? 0}
                        anio={anio}
                    />
                </section>

                <DividerLine />

                {/* ── Category breakdown ── */}
                <section className="space-y-3">
                    <SectionTitle>Detalle por prenda</SectionTitle>
                    <CategoryTable prendas={resumen_prendas} />
                </section>

                <DividerLine />

                {/* ── Quick actions ── */}
                <section className="space-y-3">
                    <SectionTitle>Acceso rápido</SectionTitle>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <QuickAction
                            icon={Shirt}
                            label="Mi delegación"
                            hint="Empleados y tallas"
                            href={route('my-delegation.index')}
                        />
                        <QuickAction
                            icon={PieChart}
                            label="Resumen general"
                            hint="Por categorías y productos"
                            href={route('vestuario.resumen')}
                        />
                        <QuickAction
                            icon={Bell}
                            label="Notificaciones"
                            hint={notifCount > 0 ? `${notifCount} sin leer` : 'Avisos del sistema'}
                            href={route('notificaciones.index')}
                            badge={notifCount}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <QuickAction
                            icon={User}
                            label="Mi cuenta"
                            hint="Datos personales y contraseña"
                            href={route('profile.edit')}
                        />
                        <QuickAction
                            icon={TrendingUp}
                            label="Dashboard general"
                            hint="Panel principal del sistema"
                            href={route('dashboard')}
                        />
                    </div>
                </section>
            </div>
        </>
    );
}

PanelDelegado.layout = createAdminPageLayout('Panel del Delegado');

export default PanelDelegado;
