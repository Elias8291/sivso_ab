import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { useAuthCan } from '@/hooks/useAuthCan';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Building2,
    ClipboardList,
    Layers,
    LayoutList,
    MapPin,
    Package,
    Shield,
    UserCircle,
    Users,
    UserSquare2,
    ChevronRight,
    Calendar,
} from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

function fmtCorto(d) {
    if (!d) return null;
    return new Date(d + 'T12:00:00').toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
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

function SinPeriodoAdminMensaje({ canPeriodos }) {
    return (
        <div className="rounded-xl border border-dashed border-zinc-200/90 bg-zinc-50/30 px-3.5 py-2.5 dark:border-zinc-700/80 dark:bg-zinc-900/20">
            <p className="text-[12px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">Sin período de vestuario</p>
            <p className="mt-1.5 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                No hay un período configurado en el sistema.
                {canPeriodos ? (
                    <>
                        {' '}
                        <Link
                            href={route('periodos.index')}
                            className="font-medium text-brand-gold underline-offset-2 hover:underline dark:text-brand-gold-soft"
                        >
                            Gestionar periodos
                        </Link>
                    </>
                ) : null}
            </p>
        </div>
    );
}

function PeriodoBloqueAdmin({ periodo, capturaAbierta }) {
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
                        ? 'Las delegaciones pueden registrar y confirmar tallas de vestuario.'
                        : 'La captura de tallas no está activa. Ajuste el periodo desde Administración si corresponde.'}
                </p>
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

function AdminDashLink({ routeName, label, hint, badge, icon: Icon }) {
    return (
        <Link
            href={route(routeName)}
            className="group flex min-h-[3rem] items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-3.5 py-2.5 shadow-sm transition-colors hover:border-brand-gold/35 hover:bg-zinc-50/90 dark:border-zinc-800 dark:bg-zinc-950/50 dark:hover:border-brand-gold-soft/30 dark:hover:bg-zinc-900/40"
        >
            <span className="flex min-w-0 flex-1 items-start gap-2.5">
                {Icon ? (
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 dark:bg-zinc-800/80 dark:text-zinc-400">
                        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
                    </span>
                ) : null}
                <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[13px] font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                        {badge != null && badge > 0 ? (
                            <span className="shrink-0 rounded-md bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-white dark:bg-zinc-900 dark:text-zinc-100">
                                {badge > 9 ? '9+' : badge}
                            </span>
                        ) : null}
                    </span>
                    {hint ? (
                        <span className="mt-0.5 block truncate text-[11px] text-zinc-500 dark:text-zinc-400">{hint}</span>
                    ) : null}
                </span>
            </span>
            <ChevronRight
                className="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold/70 dark:text-zinc-600 dark:group-hover:text-brand-gold-soft/75"
                strokeWidth={1.75}
                aria-hidden
            />
        </Link>
    );
}

function AdminSection({ title, children }) {
    if (!children || (Array.isArray(children) && children.length === 0)) {
        return null;
    }
    return (
        <section className="space-y-3">
            <SectionLabel>{title}</SectionLabel>
            <div className="grid gap-2 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function DashboardPage({ periodo = null, resumen_admin = {} }) {
    const { auth, notificaciones = [] } = usePage().props;
    const can = useAuthCan();
    const notifCount = Array.isArray(notificaciones) ? notificaciones.length : 0;
    const user = auth?.user;
    const delegado = auth?.delegado;
    const isSuperAdmin = Boolean(auth?.is_super_admin);
    const isSivsoAdmin = Boolean(auth?.is_sivso_administrator);

    const displayId = user?.rfc || user?.email || 'Usuario';

    const hayPeriodo = periodo != null;
    const capturaAbierta = hayPeriodo && periodo.estado === 'abierto';

    const anioVestuario = periodo?.anio ?? new Date().getFullYear();

    const kpiTiles = useMemo(() => {
        const tiles = [];
        const r = resumen_admin || {};
        if (r.empleados != null) {
            tiles.push({
                key: 'emp',
                icon: Users,
                label: 'Empleados',
                value: r.empleados,
                hint: 'En sistema',
            });
        }
        if (r.solicitudes_pendientes != null) {
            tiles.push({
                key: 'sol',
                icon: ClipboardList,
                label: 'Solicitudes',
                value: r.solicitudes_pendientes,
                hint: 'Pendientes',
            });
        }
        if (r.delegaciones != null) {
            tiles.push({
                key: 'delg',
                icon: MapPin,
                label: 'Delegaciones',
                value: r.delegaciones,
                hint: 'Registradas',
            });
        }
        if (r.delegados != null) {
            tiles.push({
                key: 'delo',
                icon: UserSquare2,
                label: 'Delegados',
                value: r.delegados,
                hint: 'Perfiles',
            });
        }
        if (r.usuarios != null) {
            tiles.push({
                key: 'usr',
                icon: UserCircle,
                label: 'Usuarios',
                value: r.usuarios,
                hint: 'Cuentas',
            });
        }
        tiles.push({
            key: 'notif',
            icon: Bell,
            label: 'Notificaciones',
            value: notifCount,
            hint: 'Sin leer',
        });
        return tiles;
    }, [resumen_admin, notifCount]);

    const principal = useMemo(() => {
        const rows = [];
        rows.push(
            <AdminDashLink
                key="notif"
                routeName="notificaciones.index"
                label="Notificaciones"
                hint={notifCount > 0 ? `${notifCount} sin leer` : 'Avisos del sistema'}
                badge={notifCount}
                icon={Bell}
            />,
        );
        rows.push(
            <AdminDashLink
                key="prof"
                routeName="profile.edit"
                label="Mi cuenta"
                hint="Datos personales y contraseña"
                icon={UserCircle}
            />,
        );
        return rows;
    }, [notifCount]);

    const vestuario = useMemo(() => {
        const rows = [];
        if (can('Ver empleados')) {
            rows.push(
                <AdminDashLink key="emp" routeName="empleados.index" label="Empleados" hint="Catálogo y altas" icon={Users} />,
            );
        }
        if (can('Ver productos')) {
            rows.push(
                <AdminDashLink
                    key="prod"
                    routeName="productos.index"
                    label="Productos"
                    hint="Catálogo de vestuario"
                    icon={Package}
                />,
            );
        }
        if (can('Ver partidas')) {
            rows.push(
                <AdminDashLink key="part" routeName="partidas.index" label="Partidas" hint="Estructura presupuestal" icon={Layers} />,
            );
        }
        if (can('Ver líneas presupuestales')) {
            rows.push(
                <AdminDashLink
                    key="lin"
                    routeName="partidas-especificas.index"
                    label="Líneas presupuestales"
                    hint="Detalle por línea"
                    icon={LayoutList}
                />,
            );
        }
        return rows;
    }, [can]);

    const estructura = useMemo(() => {
        const rows = [];
        if (can('Ver dependencias')) {
            rows.push(
                <AdminDashLink key="dep" routeName="dependencias.index" label="Dependencias" hint="Unidades responsables" icon={Building2} />,
            );
        }
        if (can('Ver delegaciones')) {
            rows.push(
                <AdminDashLink key="delg" routeName="delegaciones.index" label="Delegaciones" hint="Catálogo" icon={MapPin} />,
            );
        }
        if (can('Ver delegados')) {
            rows.push(
                <AdminDashLink key="delgo" routeName="delegados.index" label="Delegados" hint="Asignación de perfiles" icon={UserSquare2} />,
            );
        }
        return rows;
    }, [can]);

    const administracion = useMemo(() => {
        const rows = [];
        if (can('Ver periodos')) {
            rows.push(
                <AdminDashLink key="per" routeName="periodos.index" label="Periodos" hint="Calendario de captura" icon={Calendar} />,
            );
        }
        if (can('Ver usuarios')) {
            rows.push(
                <AdminDashLink key="usr" routeName="users.index" label="Usuarios" hint="Cuentas del sistema" icon={Users} />,
            );
        }
        if (can('Ver roles')) {
            rows.push(<AdminDashLink key="rol" routeName="roles.index" label="Roles" hint="Spatie" icon={Shield} />);
        }
        if (can('Ver permisos')) {
            rows.push(<AdminDashLink key="perm" routeName="permissions.index" label="Permisos" hint="Listado" icon={Shield} />);
        }
        if (can('Ver solicitudes')) {
            rows.push(
                <AdminDashLink
                    key="sol"
                    routeName="solicitudes-movimiento.index"
                    label="Solicitudes de movimiento"
                    hint="Bajas y cambios"
                    icon={ClipboardList}
                />,
            );
        }
        return rows;
    }, [can]);

    return (
        <>
            <Head title="Panel" />

            <div className="mx-auto w-full max-w-5xl">
                <div className="space-y-8 rounded-3xl border border-zinc-200/80 bg-white px-4 py-6 shadow-sm shadow-zinc-200/50 sm:px-6 sm:py-8 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">
                    <header className="space-y-4">
                        <div className="flex min-w-0 gap-2.5 sm:gap-3">
                            <span
                                className="mt-0.5 h-6 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-brand-gold/50 to-brand-gold/20 sm:h-7 sm:w-1 dark:from-brand-gold-soft/45 dark:to-brand-gold-soft/15"
                                aria-hidden
                            />
                            <div className="min-w-0 flex-1 space-y-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold/90 dark:text-brand-gold-soft/85">
                                    Sistema integral de vestuario
                                </p>
                                <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">
                                    Panel de administración
                                </h1>
                                <p className="text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                                    <span className="font-medium text-zinc-800 dark:text-zinc-200">{user?.name ?? 'Usuario'}</span>
                                    <span className="text-zinc-300 dark:text-zinc-600"> · </span>
                                    <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400 sm:text-[12px]">{displayId}</span>
                                </p>
                                {isSuperAdmin ? (
                                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Super administrador</p>
                                ) : isSivsoAdmin ? (
                                    <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Administrador SIVSO</p>
                                ) : null}
                                {delegado?.nombre_completo ? (
                                    <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                                        También perfil delegado:{' '}
                                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{delegado.nombre_completo}</span>
                                    </p>
                                ) : null}
                            </div>
                        </div>
                        <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/90 to-transparent dark:via-zinc-700/70" aria-hidden />
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                                <span
                                    className="mr-1 inline-block size-1 rounded-full bg-brand-gold/70 align-middle dark:bg-brand-gold-soft/60"
                                    aria-hidden
                                />
                                Vestuario{' '}
                                <span className="tabular-nums text-brand-gold/80 dark:text-brand-gold-soft/75">{anioVestuario}</span>
                            </p>
                        </div>
                    </header>

                    <div className="space-y-8">
                        <section className="space-y-2" aria-label="Periodo de vestuario">
                            <SectionLabel compact>Periodo de captura</SectionLabel>
                            {hayPeriodo ? (
                                <PeriodoBloqueAdmin periodo={periodo} capturaAbierta={capturaAbierta} />
                            ) : (
                                <SinPeriodoAdminMensaje canPeriodos={can('Ver periodos')} />
                            )}
                        </section>

                        {kpiTiles.length > 0 ? (
                            <section className="space-y-3" aria-label="Indicadores">
                                <SectionLabel>Resumen</SectionLabel>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                                    {kpiTiles.map((t) => (
                                        <StatTile
                                            key={t.key}
                                            icon={t.icon}
                                            label={t.label}
                                            value={t.value}
                                            hint={t.hint}
                                        />
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        <div className="space-y-8 border-t border-zinc-200/80 pt-8 dark:border-zinc-800/80">
                            <AdminSection title="Principal">{principal}</AdminSection>
                            <AdminSection title="Vestuario">{vestuario}</AdminSection>
                            <AdminSection title="Estructura">{estructura}</AdminSection>
                            <AdminSection title="Administración">{administracion}</AdminSection>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

DashboardPage.layout = createAdminPageLayout('Panel principal');

export default DashboardPage;
