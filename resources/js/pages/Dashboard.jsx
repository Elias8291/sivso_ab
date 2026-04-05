import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { useAuthCan } from '@/hooks/useAuthCan';
import { Head, Link, usePage } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { route } from 'ziggy-js';

function DashSection({ title, children }) {
    if (!children || (Array.isArray(children) && children.length === 0)) {
        return null;
    }
    return (
        <section className="space-y-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                {title}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">{children}</div>
        </section>
    );
}

function DashLink({ routeName, label, hint, badge }) {
    return (
        <Link
            href={route(routeName)}
            className="group flex min-h-[3.5rem] items-center justify-between gap-3 rounded-xl border border-zinc-200/85 bg-white px-4 py-3 shadow-sm transition-colors hover:border-brand-gold/30 hover:bg-zinc-50/90 dark:border-zinc-800/90 dark:bg-zinc-950/50 dark:hover:border-brand-gold-soft/25 dark:hover:bg-zinc-900/40"
        >
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-medium text-zinc-900 dark:text-zinc-100">{label}</span>
                    {badge != null && badge > 0 ? (
                        <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-px text-[10px] font-bold tabular-nums text-white">
                            {badge > 9 ? '9+' : badge}
                        </span>
                    ) : null}
                </div>
                {hint ? (
                    <p className="mt-0.5 truncate text-[12px] text-zinc-500 dark:text-zinc-400">{hint}</p>
                ) : null}
            </div>
            <ChevronRight
                className="size-4 shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-gold/70 dark:text-zinc-600 dark:group-hover:text-brand-gold-soft/80"
                strokeWidth={1.75}
                aria-hidden
            />
        </Link>
    );
}

function DashboardPage() {
    const { auth, notificaciones = [] } = usePage().props;
    const can = useAuthCan();
    const delegado = auth?.delegado;
    const notifCount = Array.isArray(notificaciones) ? notificaciones.length : 0;
    const user = auth?.user;

    const principal = useMemo(() => {
        const rows = [];
        if (can('Ver mi delegación') || delegado) {
            rows.push(
                <DashLink
                    key="del"
                    routeName="my-delegation.index"
                    label="Mi delegación"
                    hint="Empleados, vestuario y solicitudes"
                />,
            );
        }
        rows.push(
            <DashLink
                key="notif"
                routeName="notificaciones.index"
                label="Notificaciones"
                hint={notifCount > 0 ? `${notifCount} sin leer` : 'Avisos del sistema'}
                badge={notifCount}
            />,
        );
        rows.push(
            <DashLink key="prof" routeName="profile.edit" label="Mi cuenta" hint="Datos personales y contraseña" />,
        );
        return rows;
    }, [can, delegado, notifCount]);

    const vestuario = useMemo(() => {
        const rows = [];
        if (can('Ver empleados')) {
            rows.push(<DashLink key="emp" routeName="empleados.index" label="Empleados" hint="Catálogo y altas" />);
        }
        if (can('Ver productos')) {
            rows.push(<DashLink key="prod" routeName="productos.index" label="Productos" hint="Catálogo de vestuario" />);
        }
        if (can('Ver partidas')) {
            rows.push(<DashLink key="part" routeName="partidas.index" label="Partidas" hint="Estructura presupuestal" />);
        }
        if (can('Ver líneas presupuestales')) {
            rows.push(
                <DashLink
                    key="lin"
                    routeName="partidas-especificas.index"
                    label="Líneas presupuestales"
                    hint="Detalle por línea"
                />,
            );
        }
        return rows;
    }, [can]);

    const estructura = useMemo(() => {
        const rows = [];
        if (can('Ver dependencias')) {
            rows.push(<DashLink key="dep" routeName="dependencias.index" label="Dependencias" />);
        }
        if (can('Ver delegaciones')) {
            rows.push(<DashLink key="delg" routeName="delegaciones.index" label="Delegaciones" />);
        }
        if (can('Ver delegados')) {
            rows.push(<DashLink key="delgo" routeName="delegados.index" label="Delegados" />);
        }
        return rows;
    }, [can]);

    const admin = useMemo(() => {
        const rows = [];
        if (can('Ver periodos')) {
            rows.push(<DashLink key="per" routeName="periodos.index" label="Periodos" />);
        }
        if (can('Ver usuarios')) {
            rows.push(<DashLink key="usr" routeName="users.index" label="Usuarios" />);
        }
        if (can('Ver roles')) {
            rows.push(<DashLink key="rol" routeName="roles.index" label="Roles" />);
        }
        if (can('Ver permisos')) {
            rows.push(<DashLink key="perm" routeName="permissions.index" label="Permisos" />);
        }
        if (can('Ver solicitudes')) {
            rows.push(<DashLink key="sol" routeName="solicitudes-movimiento.index" label="Solicitudes de movimiento" />);
        }
        return rows;
    }, [can]);

    const displayId = user?.rfc || user?.email || 'Usuario';
    const isSuperAdmin = Boolean(auth?.is_super_admin);

    return (
        <>
            <Head title="Panel" />
            <div className="mx-auto w-full max-w-3xl space-y-10">
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
                            Panel principal
                        </h1>
                        <div className="flex flex-col gap-1 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                            <p>
                                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                    {user?.name ?? 'Usuario'}
                                </span>
                                <span className="text-zinc-400 dark:text-zinc-600" aria-hidden>
                                    {' · '}
                                </span>
                                <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400">{displayId}</span>
                            </p>
                            {delegado?.nombre_completo ? (
                                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                                    Perfil delegado:{' '}
                                    <span className="text-zinc-700 dark:text-zinc-300">{delegado.nombre_completo}</span>
                                    {delegado.delegaciones?.length ? (
                                        <>
                                            <span className="text-zinc-400"> — </span>
                                            <span className="font-mono text-[12px]">{delegado.delegaciones.join(' · ')}</span>
                                        </>
                                    ) : null}
                                </p>
                            ) : null}
                            {isSuperAdmin ? (
                                <p className="text-[12px] font-medium text-zinc-500 dark:text-zinc-400">Super administrador</p>
                            ) : null}
                        </div>
                    </div>
                </header>

                <div className="space-y-8">
                    <DashSection title="Principal">{principal}</DashSection>
                    <DashSection title="Vestuario">{vestuario}</DashSection>
                    <DashSection title="Estructura">{estructura}</DashSection>
                    <DashSection title="Administración">{admin}</DashSection>
                </div>
            </div>
        </>
    );
}

DashboardPage.layout = (page) => (
    <AuthenticatedLayout
        header={
            <span className="truncate text-base font-medium tracking-wide text-zinc-900 dark:text-zinc-50 sm:text-lg">
                Panel principal
            </span>
        }
    >
        {page}
    </AuthenticatedLayout>
);

export default DashboardPage;
