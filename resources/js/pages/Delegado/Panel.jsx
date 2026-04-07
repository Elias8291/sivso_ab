import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    ArrowRight,
    Bell,
    CheckCircle2,
    ClipboardList,
    LayoutList,
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

/** Lista legible: "A", "A y B", "A, B y C" */
function delegacionesComoTexto(codigos) {
    if (!Array.isArray(codigos) || codigos.length === 0) {
        return null;
    }
    if (codigos.length === 1) {
        return codigos[0];
    }
    if (codigos.length === 2) {
        return `${codigos[0]} y ${codigos[1]}`;
    }
    return `${codigos.slice(0, -1).join(', ')} y ${codigos[codigos.length - 1]}`;
}

function SectionLabel({ children, compact = false }) {
    return (
        <div className={compact ? 'flex items-center gap-2' : 'flex items-center gap-2.5'}>
            <span
                className={`w-px shrink-0 rounded-full bg-gradient-to-b from-brand-gold/70 to-brand-gold/25 dark:from-brand-gold-soft/65 dark:to-brand-gold-soft/20 ${compact ? 'h-2.5' : 'h-3'}`}
                aria-hidden
            />
            <p
                className={`font-medium uppercase text-zinc-500 dark:text-zinc-400 ${compact ? 'text-[10px] tracking-[0.12em]' : 'text-[11px] tracking-[0.14em]'}`}
            >
                {children}
            </p>
        </div>
    );
}

function SinPeriodoMensaje() {
    return (
        <div className="rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/30 px-3.5 py-2.5 dark:border-zinc-700/80 dark:bg-zinc-900/20">
            <p className="text-[12px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">Sin período de captura</p>
            <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                No hay un período de vestuario configurado. Puede{' '}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">consultar</span> empleados y estado del
                vestuario en <span className="font-medium text-zinc-700 dark:text-zinc-300">Mi delegación</span>. La{' '}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">actualización de tallas</span> estará
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
        <div className="flex flex-col rounded-xl border border-zinc-200/75 border-l-2 border-l-brand-gold/40 bg-zinc-50/40 px-2.5 py-2 dark:border-zinc-800 dark:border-l-brand-gold-soft/35 dark:bg-zinc-900/25">
            <div className="flex items-center justify-between gap-1.5">
                <span className="text-[9px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</span>
                <Icon
                    className="size-3 shrink-0 text-brand-gold/50 dark:text-brand-gold-soft/45"
                    strokeWidth={1.75}
                    aria-hidden
                />
            </div>
            <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">{value}</p>
            {hint ? (
                <p className="mt-0.5 line-clamp-1 text-[9px] leading-snug text-zinc-400 dark:text-zinc-500">{hint}</p>
            ) : null}
        </div>
    );
}

const ESTADO_SOL_LABEL = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
};

function PanelMisSolicitudes({ solicitudes }) {
    const list = Array.isArray(solicitudes) ? solicitudes : [];

    return (
        <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-950/80">
            {list.length === 0 ? (
                <p className="px-3 py-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    Aún no has enviado solicitudes de baja o cambio de delegación.
                </p>
            ) : (
                <ul className="max-h-[220px] divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800/80">
                    {list.map((s) => (
                        <li key={s.id} className="px-3 py-2">
                            <div className="flex items-start justify-between gap-2">
                                <span className="flex min-w-0 items-center gap-1.5">
                                    {s.tipo === 'cambio' ? (
                                        <ArrowLeftRight
                                            className="size-3 shrink-0 text-brand-gold/55 dark:text-brand-gold-soft/50"
                                            strokeWidth={1.75}
                                            aria-hidden
                                        />
                                    ) : (
                                        <XCircle
                                            className="size-3 shrink-0 text-brand-gold/55 dark:text-brand-gold-soft/50"
                                            strokeWidth={1.75}
                                            aria-hidden
                                        />
                                    )}
                                    <span className="min-w-0 text-[11px] font-medium text-zinc-900 dark:text-zinc-100">
                                        <span className="block truncate">{s.empleado_label}</span>
                                        {s.empleado_nue ? (
                                            <span className="font-mono text-[10px] font-normal text-zinc-500 dark:text-zinc-400">
                                                {s.empleado_nue}
                                            </span>
                                        ) : null}
                                    </span>
                                </span>
                                <span
                                    className={`shrink-0 rounded-md px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide ${
                                        s.estado === 'pendiente'
                                            ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                                            : s.estado === 'aprobada'
                                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                    }`}
                                >
                                    {ESTADO_SOL_LABEL[s.estado] ?? s.estado}
                                </span>
                            </div>
                            <p className="mt-1 pl-[18px] text-[10px] text-zinc-500 dark:text-zinc-400">
                                {s.tipo === 'cambio'
                                    ? `Cambio · ${s.delegacion_origen} → ${s.delegacion_destino ?? '—'}`
                                    : 'Baja solicitada'}
                                {s.creado_relativo ? (
                                    <span className="text-zinc-400 dark:text-zinc-500"> · {s.creado_relativo}</span>
                                ) : null}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
            <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800/80">
                <Link
                    href={route('my-delegation.index')}
                    className="text-[10px] font-semibold uppercase tracking-wide text-brand-gold hover:underline dark:text-brand-gold-soft"
                >
                    Ir a mi delegación
                </Link>
            </div>
        </div>
    );
}

function PanelDelegado({ resumen, contexto, periodo, mis_solicitudes = [], solicitudes_count = 0 }) {
    const { notificaciones = [] } = usePage().props;
    const notifCount = Array.isArray(notificaciones) ? notificaciones.length : 0;
    const solicitudesTotal = typeof solicitudes_count === 'number' ? solicitudes_count : 0;

    const anio = resumen.anio_actual ?? new Date().getFullYear();
    const anioRefFallback =
        resumen.anio_ref ?? resumen.anio_actual ?? new Date().getFullYear();
    const pct = Math.min(100, Math.max(0, resumen.pct_completado ?? 0));
    const total = resumen.total ?? 0;
    const listos = resumen.listos ?? 0;
    const sinEmpezar = resumen.sin_empezar ?? 0;
    const bajas = resumen.bajas ?? 0;

    const nombre = contexto.delegado_nombre;
    const delegaciones = contexto.delegaciones ?? [];
    const delegacionesTexto = delegacionesComoTexto(delegaciones);

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
                                {delegacionesTexto ? (
                                    <p className="pt-1 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                        Eres delegado de{' '}
                                        <span className="font-medium text-zinc-800 [overflow-wrap:anywhere] dark:text-zinc-200">
                                            {delegacionesTexto}
                                        </span>
                                        .
                                    </p>
                                ) : (
                                    <p className="pt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                                        Aún no tienes delegaciones asignadas.
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/90 to-transparent dark:via-zinc-700/70" aria-hidden />
                        <div className="flex flex-col items-center px-1 text-center">
                            <Link
                                href={route('my-delegation.index')}
                                className="group inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200/90 bg-zinc-50/90 px-5 py-2.5 shadow-sm transition-colors hover:border-brand-gold/45 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/45 dark:shadow-none dark:hover:border-brand-gold-soft/40 dark:hover:bg-zinc-800/55"
                            >
                                <span className="text-[13px] font-semibold tracking-tight text-zinc-800 transition-colors group-hover:text-brand-gold dark:text-zinc-100 dark:group-hover:text-brand-gold-soft">
                                    {tituloPrincipal}
                                </span>
                                <ArrowRight
                                    className="size-[18px] shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold/65 dark:text-zinc-500 dark:group-hover:text-brand-gold-soft/70"
                                    strokeWidth={1.5}
                                    aria-hidden
                                />
                            </Link>
                        </div>
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
                                    ref. {anioRefFallback}
                                </span>
                            </p>
                        </div>
                    </header>

                    <div className="space-y-8">
                        <section className="space-y-2" aria-label="Estado del período de captura">
                            <SectionLabel compact>{tituloPeriodoSeccion}</SectionLabel>
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
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                    <StatTile icon={Users} label="Personal" value={total} hint="Captura" />
                                    <StatTile icon={CheckCircle2} label="Listos" value={listos} hint={hintCompletosCaptura} />
                                    <StatTile icon={LayoutList} label="Pendientes" value={sinEmpezar} hint="Sin confirmar" />
                                    <StatTile icon={XCircle} label="Bajas" value={bajas} hint="En delegación" />
                                    <StatTile icon={Bell} label="Notificaciones" value={notifCount} hint="Sin leer" />
                                    <StatTile
                                        icon={ClipboardList}
                                        label="Solicitudes"
                                        value={solicitudesTotal}
                                        hint="Total enviadas"
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    <StatTile icon={Users} label="Personal" value={total} hint="Delegación" />
                                    <StatTile icon={XCircle} label="Bajas" value={bajas} hint="Registros" />
                                    <StatTile icon={Bell} label="Notificaciones" value={notifCount} hint="Sin leer" />
                                    <StatTile
                                        icon={ClipboardList}
                                        label="Solicitudes"
                                        value={solicitudesTotal}
                                        hint="Total enviadas"
                                    />
                                </div>
                            )}
                        </section>

                        <section
                            className="space-y-3 border-t border-zinc-200/80 pt-8 dark:border-zinc-800/80"
                            aria-label="Mis solicitudes de movimiento"
                        >
                            <SectionLabel>Mis solicitudes</SectionLabel>
                            <p className="text-[10px] leading-snug text-zinc-500 dark:text-zinc-400">
                                Bajas y cambios de delegación que enviaste a administración.
                            </p>
                            <PanelMisSolicitudes solicitudes={mis_solicitudes} />
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}

PanelDelegado.layout = createAdminPageLayout('Dashboard');

export default PanelDelegado;
