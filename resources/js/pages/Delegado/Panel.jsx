import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    LayoutList,
    Shirt,
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

function SectionTitle({ children }) {
    return (
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
            {children}
        </h2>
    );
}

/** Cuando no hay fila de período en sistema. */
function SinPeriodoMensaje() {
    return (
        <div className="rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/50 px-4 py-3.5 dark:border-zinc-800 dark:bg-zinc-900/25">
            <p className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">Sin período de captura</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                No hay un período de vestuario configurado. Puede{' '}
                <strong className="font-medium text-zinc-700 dark:text-zinc-300">consultar</strong> empleados y estado
                del vestuario en <span className="font-medium">Mi delegación</span>. La{' '}
                <strong className="font-medium text-zinc-700 dark:text-zinc-300">actualización de tallas</strong> estará
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

    const wrap = capturaAbierta
        ? 'border-emerald-200/70 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/20'
        : 'border-zinc-200/85 bg-white dark:border-zinc-800/90 dark:bg-zinc-950/50';

    return (
        <div className={`rounded-xl border px-4 py-3 shadow-sm ${wrap}`}>
            <p className="text-[13px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                {periodo.nombre}
                {fechas ? (
                    <span className="font-normal text-zinc-500 dark:text-zinc-400"> · {fechas}</span>
                ) : null}
            </p>
            <p
                className={`mt-1.5 text-[12px] leading-relaxed ${
                    capturaAbierta ? 'text-emerald-800 dark:text-emerald-300' : 'text-zinc-500 dark:text-zinc-400'
                }`}
            >
                {capturaAbierta
                    ? 'Puede actualizar tallas y revisar el avance de la captura en su delegación.'
                    : 'No es posible modificar tallas en este período. Use Mi delegación para consultar expedientes.'}
            </p>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, hint }) {
    return (
        <div className="rounded-xl border border-zinc-200/80 border-l-2 border-l-brand-gold/35 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:border-l-brand-gold-soft/30 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                        {value}
                    </p>
                    {hint ? (
                        <p className="mt-0.5 text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">{hint}</p>
                    ) : null}
                </div>
                <Icon
                    className="size-[18px] shrink-0 text-brand-gold/50 dark:text-brand-gold-soft/45"
                    strokeWidth={1.5}
                    aria-hidden
                />
            </div>
        </div>
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

    const tituloKpis = capturaAbierta ? 'Indicadores de la captura' : 'Resumen';

    const hintCompletosCaptura = `${pct}% con vestuario confirmado · consulta`;

    const tituloPrincipal = capturaAbierta ? 'Actualizar en mi delegación' : 'Consultar mi delegación';
    const hintPrincipal = capturaAbierta
        ? 'Captura abierta: empleados, tallas y solicitudes'
        : 'Ver empleados, estado de tallas y solicitudes (sin edición de tallas)';

    return (
        <>
            <Head title="Panel del Delegado" />

            <div className="mx-auto w-full max-w-3xl space-y-8">
                <header className="flex gap-4">
                    <span
                        className="mt-1 hidden h-14 w-1 shrink-0 rounded-full bg-gradient-to-b from-brand-gold/50 to-brand-gold/15 sm:block dark:from-brand-gold-soft/45 dark:to-brand-gold-soft/12"
                        aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-gold/90 dark:text-brand-gold-soft/85">
                            Sistema integral de vestuario
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-3xl">
                            Panel del delegado
                        </h1>
                        <div className="flex flex-col gap-1 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                            {(nombre || delegaciones.length > 0) && (
                                <p>
                                    {nombre ? (
                                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{nombre}</span>
                                    ) : null}
                                    {nombre && delegaciones.length > 0 ? (
                                        <span className="text-zinc-400 dark:text-zinc-600" aria-hidden>
                                            {' '}
                                            ·{' '}
                                        </span>
                                    ) : null}
                                    {delegaciones.length > 0 ? (
                                        <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
                                            {delegaciones.join(' · ')}
                                        </span>
                                    ) : null}
                                </p>
                            )}
                            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                                Vestuario <span className="tabular-nums">{anio}</span>
                                <span className="text-zinc-400 dark:text-zinc-600"> — </span>
                                referencia <span className="tabular-nums">{resumen.anio_ref}</span>
                            </p>
                        </div>
                    </div>
                </header>

                <section className="space-y-3" aria-label="Estado del período de captura">
                    <SectionTitle>{tituloPeriodoSeccion}</SectionTitle>
                    {hayPeriodo ? (
                        <PeriodoBloque periodo={periodo} capturaAbierta={capturaAbierta} />
                    ) : (
                        <SinPeriodoMensaje />
                    )}
                </section>

                <section className="space-y-3" aria-label="Indicadores">
                    <SectionTitle>{tituloKpis}</SectionTitle>
                    {capturaAbierta ? (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            <StatCard
                                icon={Users}
                                label="Personal"
                                value={total}
                                hint="Personal sujeto a captura"
                            />
                            <StatCard
                                icon={CheckCircle2}
                                label="Completos"
                                value={listos}
                                hint={hintCompletosCaptura}
                            />
                            <StatCard
                                icon={LayoutList}
                                label="Sin completar"
                                value={sinEmpezar}
                                hint="Pendientes de registrar o confirmar tallas"
                            />
                            <StatCard icon={XCircle} label="Bajas" value={bajas} hint="Registros dados de baja" />
                        </div>
                    ) : (
                        <div className="grid max-w-lg gap-2 sm:grid-cols-2">
                            <StatCard icon={Users} label="Personal" value={total} hint="Personal en su delegación" />
                            <StatCard icon={XCircle} label="Bajas" value={bajas} hint="Registros dados de baja" />
                        </div>
                    )}
                </section>

                <section className="space-y-3">
                    <SectionTitle>Acciones</SectionTitle>
                    <Link
                        href={route('my-delegation.index')}
                        className="group flex min-h-[3.5rem] flex-col items-stretch justify-center gap-0.5 rounded-xl border border-zinc-200/85 bg-zinc-900 px-4 py-3 shadow-sm transition-colors hover:bg-zinc-800 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-700 dark:bg-zinc-100 dark:hover:bg-zinc-200"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <Shirt
                                className="size-[18px] shrink-0 text-white dark:text-zinc-900"
                                strokeWidth={1.75}
                                aria-hidden
                            />
                            <div className="min-w-0 text-left">
                                <span className="block truncate text-[14px] font-medium text-white dark:text-zinc-900">
                                    {tituloPrincipal}
                                </span>
                                <span className="mt-0.5 block text-[12px] leading-snug text-zinc-400 dark:text-zinc-600">
                                    {hintPrincipal}
                                </span>
                            </div>
                        </div>
                        <ArrowRight
                            className="mt-2 size-4 shrink-0 self-end text-zinc-300 transition-transform group-hover:translate-x-0.5 sm:mt-0 sm:self-center dark:text-zinc-600"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                    </Link>

                    {capturaAbierta ? (
                        <>
                            <Link
                                href={route('vestuario.resumen')}
                                className="group flex min-h-[3.5rem] items-center justify-between gap-3 rounded-xl border border-zinc-200/85 bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand-gold/30 hover:bg-zinc-50/90 dark:border-zinc-800/90 dark:bg-zinc-950/50 dark:hover:border-brand-gold-soft/25 dark:hover:bg-zinc-900/40"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                                            Resumen por categoría
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                                        Vista consolidada de vestuario
                                    </p>
                                </div>
                                <ChevronRight
                                    className="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold/70 dark:text-zinc-600 dark:group-hover:text-brand-gold-soft/80"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                            </Link>
                            <Link
                                href={route('notificaciones.index')}
                                className="group flex min-h-[3.5rem] items-center justify-between gap-3 rounded-xl border border-zinc-200/85 bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand-gold/30 hover:bg-zinc-50/90 dark:border-zinc-800/90 dark:bg-zinc-950/50 dark:hover:border-brand-gold-soft/25 dark:hover:bg-zinc-900/40"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                                            Notificaciones
                                        </span>
                                        {notifCount > 0 ? (
                                            <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-px text-[10px] font-bold tabular-nums text-white">
                                                {notifCount > 9 ? '9+' : notifCount}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                                        {notifCount > 0 ? `${notifCount} sin leer` : 'Avisos del sistema'}
                                    </p>
                                </div>
                                <ChevronRight
                                    className="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold/70 dark:text-zinc-600 dark:group-hover:text-brand-gold-soft/80"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href={route('notificaciones.index')}
                                className="group flex min-h-[3.5rem] items-center justify-between gap-3 rounded-xl border border-zinc-200/85 bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand-gold/30 hover:bg-zinc-50/90 dark:border-zinc-800/90 dark:bg-zinc-950/50 dark:hover:border-brand-gold-soft/25 dark:hover:bg-zinc-900/40"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                                            Notificaciones
                                        </span>
                                        {notifCount > 0 ? (
                                            <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-px text-[10px] font-bold tabular-nums text-white">
                                                {notifCount > 9 ? '9+' : notifCount}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                                        {notifCount > 0 ? `${notifCount} sin leer` : 'Avisos del sistema'}
                                    </p>
                                </div>
                                <ChevronRight
                                    className="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold/70 dark:text-zinc-600 dark:group-hover:text-brand-gold-soft/80"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                            </Link>
                            <Link
                                href={route('vestuario.resumen')}
                                className="group flex min-h-[3.5rem] items-center justify-between gap-3 rounded-xl border border-zinc-200/85 bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand-gold/30 hover:bg-zinc-50/90 dark:border-zinc-800/90 dark:bg-zinc-950/50 dark:hover:border-brand-gold-soft/25 dark:hover:bg-zinc-900/40"
                            >
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                                            Resumen por categoría
                                        </span>
                                    </div>
                                    <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                                        Vista consolidada de vestuario
                                    </p>
                                </div>
                                <ChevronRight
                                    className="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold/70 dark:text-zinc-600 dark:group-hover:text-brand-gold-soft/80"
                                    strokeWidth={1.75}
                                    aria-hidden
                                />
                            </Link>
                        </>
                    )}

                    <Link
                        href={route('profile.edit')}
                        className="group flex min-h-[3.5rem] items-center justify-between gap-3 rounded-xl border border-zinc-200/85 bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand-gold/30 hover:bg-zinc-50/90 dark:border-zinc-800/90 dark:bg-zinc-950/50 dark:hover:border-brand-gold-soft/25 dark:hover:bg-zinc-900/40"
                    >
                        <div className="min-w-0">
                            <span className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-100">
                                Mi cuenta
                            </span>
                            <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">
                                Datos personales y contraseña
                            </p>
                        </div>
                        <ChevronRight
                            className="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold/70 dark:text-zinc-600 dark:group-hover:text-brand-gold-soft/80"
                            strokeWidth={1.75}
                            aria-hidden
                        />
                    </Link>
                </section>
            </div>
        </>
    );
}

PanelDelegado.layout = createAdminPageLayout('Panel del Delegado');

export default PanelDelegado;
