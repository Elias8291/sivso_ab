import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, usePage } from '@inertiajs/react';
import {
    Bell,
    Building2,
    Calendar,
    ClipboardList,
    ListChecks,
    KeyRound,
    ListTree,
    MapPin,
    MapPinned,
    Package,
    Shield,
    UserCircle,
    Users,
    UserSquare2,
} from 'lucide-react';
import { useMemo } from 'react';

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

function DashboardPage({ resumen_admin = {} }) {
    const { auth, notificaciones = [] } = usePage().props;
    const notifCount = Array.isArray(notificaciones) ? notificaciones.length : 0;
    const user = auth?.user;
    const delegado = auth?.delegado;
    const isSuperAdmin = Boolean(auth?.is_super_admin);
    const isSivsoAdmin = Boolean(auth?.is_sivso_administrator);

    const displayId = user?.rfc || user?.email || 'Usuario';

    const kpiTiles = useMemo(() => {
        const tiles = [];
        const r = resumen_admin || {};
        if (r.mi_delegacion != null) {
            tiles.push({
                key: 'mi_del',
                icon: MapPinned,
                label: 'Mi delegación',
                value: r.mi_delegacion,
                hint: 'UR asignadas',
            });
        }
        if (r.empleados != null) {
            tiles.push({
                key: 'emp',
                icon: Users,
                label: 'Empleados',
                value: r.empleados,
                hint: 'En sistema',
            });
        }
        if (r.productos != null) {
            tiles.push({
                key: 'prod',
                icon: Package,
                label: 'Productos',
                value: r.productos,
                hint: 'Catálogo',
            });
        }
        if (r.partidas != null) {
            tiles.push({
                key: 'part',
                icon: ListTree,
                label: 'Partidas',
                value: r.partidas,
                hint: 'Por ejercicio',
            });
        }
        if (r.dependencias != null) {
            tiles.push({
                key: 'dep',
                icon: Building2,
                label: 'Dependencias',
                value: r.dependencias,
                hint: 'Registradas',
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
        if (r.periodos != null) {
            tiles.push({
                key: 'per',
                icon: Calendar,
                label: 'Periodos',
                value: r.periodos,
                hint: 'Vestuario',
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
        if (r.roles != null) {
            tiles.push({
                key: 'rol',
                icon: Shield,
                label: 'Roles',
                value: r.roles,
                hint: 'Spatie',
            });
        }
        if (r.permisos != null) {
            tiles.push({
                key: 'perm',
                icon: KeyRound,
                label: 'Permisos',
                value: r.permisos,
                hint: 'Listado',
            });
        }
        if (r.solicitudes_totales != null) {
            tiles.push({
                key: 'sol_tot',
                icon: ClipboardList,
                label: 'Solicitudes',
                value: r.solicitudes_totales,
                hint: 'Todas',
            });
        }
        if (r.solicitudes_pendientes != null) {
            tiles.push({
                key: 'sol_pen',
                icon: ListChecks,
                label: 'Solicitudes pendientes',
                value: r.solicitudes_pendientes,
                hint: 'Por resolver',
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
                    </header>

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
                </div>
            </div>
        </>
    );
}

DashboardPage.layout = createAdminPageLayout('Panel principal');

export default DashboardPage;
