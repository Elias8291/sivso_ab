import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Bell,
    CheckCircle2,
    ChevronRight,
    LayoutList,
    PieChart,
    Shirt,
    User,
    Users,
    XCircle,
} from 'lucide-react';
import { route } from 'ziggy-js';

function fmtCorto(d) {
    if (!d) return null;
    return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function SectionLabel({ children }) {
    return (
        <div className="flex items-center gap-2.5">
            <span
                className="h-3 w-px shrink-0 rounded-full bg-gradient-to-b from-brand-gold/70 to-brand-gold/25 dark:from-brand-gold-soft/65 dark:to-brand-gold-soft/20"
                aria-hidden
            />
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{children}</p>
        </div>
    );
}

function SinPeriodoMensaje() {
    return (
        <div className="rounded-2xl border border-dashed border-zinc-200/90 bg-zinc-50/30 px-5 py-4 dark:border-zinc-700/80 dark:bg-zinc-900/20">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Sin período de captura</p>
            <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                No hay un período de vestuario configurado. Puede{' '}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">consultar</span> empleados y estado del
                vestuario en <span className="font-medium text-zinc-800 dark:text-zinc-200">Mi delegación</span>. La{' '}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">actualización de tallas</span> estará
                habilitada cuando exista un período abierto.
            </p>
        </div>
    );
}

function PeriodoBloque({ periodo, capturaAbierta }) {
    const inicio = fmtCorto(periodo.fecha_inicio);
    const fin = fmtCorto(periodo.fecha_fin);
    let fechas = null;
    if (inicio && fin) {
        fechas = `${inicio} — ${fin}`;
    } else if (fin) {
        fechas = `Hasta ${fin}`;
    } else if (inicio) {
        fechas = `Desde ${inicio}`;
    }

    const shell = capturaAbierta
        ? 'border-brand-gold/35 bg-white shadow-[0_1px_0_0_rgba(212,175,55,0.08)] dark:border-brand-gold-soft/30 dark:bg-zinc-950/60 dark:shadow-none'
        : 'border-zinc-200/80 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.04)] dark:border-zinc-800 dark:bg-zinc-950/50 dark:shadow-none';

    return (
        <div className={`flex gap-4 rounded-2xl border px-5 py-4 ${shell}`}>
            <span
                className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    capturaAbierta
                        ? 'bg-brand-gold shadow-[0_0_0_3px_rgba(212,175,55,0.2)] dark:bg-brand-gold-soft dark:shadow-[0_0_0_3px_rgba(232,212,138,0.15)]'
                        : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
                aria-hidden
            />
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-50">
                    {periodo.nombre}
                    {fechas ? (
                        <span className="font-normal text-zinc-500 dark:text-zinc-400"> · {fechas}</span>
                    ) : null}
                </p>
                <p
                    className={`mt-2 text-[13px] leading-relaxed ${
                        capturaAbierta ? 'text-zinc-600 dark:text-zinc-300' : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                >
                    {capturaAbierta
                        ? 'Puede actualizar tallas y revisar el avance de la captura en su delegación.'
                        : 'No es posible modificar tallas en este período. Use Mi delegación para consultar expedientes.'}
                </p>
            </div>
        </div>
    );
}

function CapturaProgress({ pct }) {
    const v = Math.min(100, Math.max(0, pct));
    return (
        <div className="rounded-2xl border border-zinc-200/80 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-950/50">
            <div className="flex items-center justify-between gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="font-medium uppercase tracking-[0.12em]">Avance de captura</span>
                <span className="tabular-nums text-sm font-semibold text-zinc-900 dark:text-zinc-100">{v}%</span>
            </div>
            <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"
                role="progressbar"
                aria-valuenow={v}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-gold/95 to-brand-gold/65 dark:from-brand-gold-soft/90 dark:to-brand-gold-soft/55"
                    style={{ width: `${v}%` }}
                />
            </div>
        </div>
    );
}

function StatTile({ icon: Icon, label, value, hint }) {
    return (
        <div className="flex flex-col rounded-2xl border border-zinc-200/75 border-l-[3px] border-l-brand-gold/40 bg-zinc-50/40 px-4 py-3.5 dark:border-zinc-800 dark:border-l-brand-gold-soft/35 dark:bg-zinc-900/25">
            <div className="flex items-start justify-between gap-2">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
                <Icon
                    className="size-3.5 shrink-0 text-brand-gold/55 dark:text-brand-gold-soft/50"
                    strokeWidth={1.75}
                    aria-hidden
                />
            </div>
            <p className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                {value}
            </p>
            {hint ? (
                <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">{hint}</p>
            ) : null}
        </div>
    );
}

function ActionRow({ href, title, subtitle, icon: Icon, badge, emphasis }) {
    const base =
        'group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold/40';
    const normal = `${base} hover:bg-zinc-50 dark:hover:bg-zinc-800/40`;
    const strong = `${base} bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200`;

    return (
        <Link href={href} className={emphasis ? strong : normal}>
            <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    emphasis
                        ? 'bg-white/10 text-white dark:bg-zinc-900/10 dark:text-zinc-900'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-300'
                }`}
            >
                <Icon className="size-[18px]" strokeWidth={1.75} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                    <span
                        className={`truncate text-[13px] font-medium ${
                            emphasis ? 'text-white dark:text-zinc-900' : 'text-zinc-900 dark:text-zinc-50'
                        }`}
                    >
                        {title}
                    </span>
                    {badge != null && badge > 0 ? (
                        <span className="shrink-0 rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white dark:bg-zinc-900 dark:text-zinc-100">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    ) : null}
                </span>
                {subtitle ? (
                    <span
                        className={`mt-0.5 block truncate text-[12px] ${
                            emphasis ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'
                        }`}
                    >
                        {subtitle}
                    </span>
                ) : null}
            </span>
            {emphasis ? (
                <ArrowRight
                    className="size-4 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 dark:text-zinc-500"
                    strokeWidth={1.75}
                    aria-hidden
                />
            ) : (
                <ChevronRight
                    className="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold/75 dark:text-zinc-600 dark:group-hover:text-brand-gold-soft/80"
                    strokeWidth={1.75}
                    aria-hidden
                />
            )}
        </Link>
    );
}

function PanelDelegado({ resumen, contexto, periodo }) {
    const { notificaciones = [] } = usePage().props;
    const notifCount = Array.isArray(notificaciones) ? notificaciones.length : 0;

    const anio = resumen.anio_actual ?? new Date().getFullYear();
    const pct = Math.min(100, Math.max(0, resumen.pct_completado ?? 0));
    const total = resumen.total ?? 0;
    const listos = resumen.listos ?? 0;
    const sinEmpezar = resumen.sin_empezar ?? 0;
    const bajas = resumen.bajas ?? 0;

    const nombre = contexto.delegado_nombre;
    const delegaciones = contexto.delegaciones ?? [];

    const hayPeriodo = periodo != null;
    const capturaAbierta = hayPeriodo && periodo.estado === 'abierto';

    const tituloPeriodoSeccion = capturaAbierta
        ? 'Actualización de tallas'
        : hayPeriodo
          ? 'Período de vestuario'
          : 'Calendario de captura';

    const tituloKpis = capturaAbierta ? 'Indicadores' : 'Resumen';
    const hintCompletosCaptura = `${pct}% con vestuario confirmado`;

    const tituloPrincipal = capturaAbierta ? 'Actualizar en mi delegación' : 'Consultar mi delegación';
    const hintPrincipal = capturaAbierta
        ? 'Empleados, tallas y solicitudes'
        : 'Consulta sin edición de tallas';

    const resumenLink = {
        href: route('vestuario.resumen'),
        title: 'Resumen por categoría',
        subtitle: 'Vista consolidada de vestuario',
        icon: PieChart,
    };
    const notifLink = {
        href: route('notificaciones.index'),
        title: 'Notificaciones',
        subtitle: notifCount > 0 ? `${notifCount} sin leer` : 'Avisos del sistema',
        icon: Bell,
        badge: notifCount,
    };
    const cuentaLink = {
        href: route('profile.edit'),
        title: 'Mi cuenta',
        subtitle: 'Datos personales y contraseña',
        icon: User,
    };

    const secondaryActions = capturaAbierta ? [resumenLink, notifLink, cuentaLink] : [notifLink, resumenLink, cuentaLink];

    return (
        <>
            <Head title="Dashboard" />

            <div className="mx-auto w-full max-w-5xl">
                <div className="space-y-8 rounded-3xl border border-zinc-200/80 bg-white px-4 py-6 shadow-sm shadow-zinc-200/50 sm:px-6 sm:py-8 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                    <header className="space-y-4">
                        <div className="flex min-w-0 gap-2.5 sm:gap-3">
                            <span
                                className="mt-0.5 h-6 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-brand-gold/50 to-brand-gold/20 sm:h-7 sm:w-1 dark:from-brand-gold-soft/45 dark:to-brand-gold-soft/15"
                                aria-hidden
                            />
                            <div className="min-w-0 flex-1 space-y-1.5">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold/90 dark:text-brand-gold-soft/85">
                                    Sistema integral de vestuario
                                </p>
                                <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">
                                    {nombre ? (
                                        <>
                                            <span className="font-medium text-zinc-500 dark:text-zinc-400">Hola,</span>{' '}
                                            <span className="text-brand-gold dark:text-brand-gold-soft">{nombre}</span>
                                        </>
                                    ) : (
                                        <>
                                            Panel del{' '}
                                            <span className="text-brand-gold dark:text-brand-gold-soft">delegado</span>
                                        </>
                                    )}
                                </h1>
                            </div>
                        </div>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/90 to-transparent dark:via-zinc-700/70" aria-hidden />
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
                            {delegaciones.length > 0 ? (
                                <div className="flex min-w-0 flex-wrap gap-2">
                                    {delegaciones.map((d) => (
                                        <span
                                            key={d}
                                            className="inline-flex max-w-full items-center rounded-full border border-brand-gold/25 bg-zinc-50/80 px-3 py-1 text-[12px] font-medium text-zinc-800 [overflow-wrap:anywhere] dark:border-brand-gold-soft/25 dark:bg-zinc-900/40 dark:text-zinc-200"
                                        >
                                            {d}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-[13px] text-zinc-500 dark:text-zinc-400">Sin delegaciones asignadas</span>
                            )}
                            <p className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                <span
                                    className="mr-1 inline-block size-1 rounded-full bg-brand-gold/70 align-middle dark:bg-brand-gold-soft/60"
                                    aria-hidden
                                />
                                Vestuario{' '}
                                <span className="tabular-nums text-brand-gold/80 dark:text-brand-gold-soft/75">{anio}</span>
                                <span className="mx-1.5 font-normal normal-case tracking-normal text-zinc-300 dark:text-zinc-600">
                                    ·
                                </span>
                                <span className="font-normal normal-case tracking-normal tabular-nums text-zinc-500 dark:text-zinc-400">
                                    ref. {resumen.anio_ref}
                                </span>
                            </p>
                        </div>
                    </header>

                    <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
                        <div className="space-y-8 lg:col-span-7 xl:col-span-8">
                            <section className="space-y-3" aria-label="Estado del período de captura">
                                <SectionLabel>{tituloPeriodoSeccion}</SectionLabel>
                                {hayPeriodo ? (
                                    <PeriodoBloque periodo={periodo} capturaAbierta={capturaAbierta} />
                                ) : (
                                    <SinPeriodoMensaje />
                                )}
                            </section>

                            {capturaAbierta ? (
                                <section aria-label="Avance">
                                    <CapturaProgress pct={pct} />
                                </section>
                            ) : null}

                            <section className="space-y-3" aria-label="Indicadores">
                                <SectionLabel>{tituloKpis}</SectionLabel>
                                {capturaAbierta ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <StatTile icon={Users} label="Personal" value={total} hint="Sujeto a captura" />
                                        <StatTile
                                            icon={CheckCircle2}
                                            label="Completos"
                                            value={listos}
                                            hint={hintCompletosCaptura}
                                        />
                                        <StatTile
                                            icon={LayoutList}
                                            label="Sin completar"
                                            value={sinEmpezar}
                                            hint="Pendientes de confirmar tallas"
                                        />
                                        <StatTile icon={XCircle} label="Bajas" value={bajas} hint="Registros dados de baja" />
                                    </div>
                                ) : (
                                    <div className="grid max-w-xl gap-3 sm:grid-cols-2">
                                        <StatTile icon={Users} label="Personal" value={total} hint="En su delegación" />
                                        <StatTile icon={XCircle} label="Bajas" value={bajas} hint="Registros dados de baja" />
                                    </div>
                                )}
                            </section>
                        </div>

                        <aside className="lg:col-span-5 xl:col-span-4">
                            <div className="space-y-3 lg:sticky lg:top-4">
                                <SectionLabel>Accesos</SectionLabel>
                                <nav
                                    className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:divide-zinc-800/80 dark:border-zinc-800 dark:bg-zinc-950/80"
                                    aria-label="Enlaces rápidos"
                                >
                                    <div className="p-1.5">
                                        <ActionRow
                                            href={route('my-delegation.index')}
                                            title={tituloPrincipal}
                                            subtitle={hintPrincipal}
                                            icon={Shirt}
                                            emphasis
                                        />
                                    </div>
                                    <div className="space-y-0.5 p-1.5 pt-0">
                                        {secondaryActions.map((a) => (
                                            <ActionRow
                                                key={a.href + a.title}
                                                href={a.href}
                                                title={a.title}
                                                subtitle={a.subtitle}
                                                icon={a.icon}
                                                badge={a.badge}
                                            />
                                        ))}
                                    </div>
                                </nav>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}

PanelDelegado.layout = createAdminPageLayout('Dashboard');

export default PanelDelegado;
