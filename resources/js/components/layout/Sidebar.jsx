import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Bell,
    Building2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    FileText,
    Key,
    LayoutDashboard,
    ListTree,
    LogOut,
    MapPin,
    Package,
    ShieldCheck,
    User,
    Users,
    Users2,
} from 'lucide-react';
import { route } from 'ziggy-js';

export default function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }) {
    const { auth, notificaciones = [] } = usePage().props;
    const isSuperAdmin = Boolean(auth?.is_super_admin);
    const isSivsoAdministrator = Boolean(auth?.is_sivso_administrator);
    const tienePerfilDelegado = Boolean(auth?.delegado);
    const permissions = Array.isArray(auth?.permissions) ? auth.permissions : [];
    const can = (name) => isSuperAdmin || isSivsoAdministrator || permissions.includes(name);
    const displayName = auth?.user?.name || 'Usuario';

    const navLink = (active) =>
        [
            'group flex items-center gap-3 rounded-lg py-2 px-3 text-[12px] font-bold tracking-wide transition-colors duration-200',
            active
                ? 'bg-brand-gold/10 text-brand-gold dark:bg-brand-gold/20 dark:text-brand-gold-soft'
                : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200',
            collapsed ? 'lg:justify-center lg:px-0' : '',
        ]
            .filter(Boolean)
            .join(' ');

    const iconClass = (active) =>
        [
            'size-[16px] shrink-0 transition-colors',
            active
                ? 'text-brand-gold dark:text-brand-gold-soft'
                : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300',
        ].join(' ');

    const SectionHeader = ({ title }) => {
        if (collapsed) {
            return <div className="my-2 hidden h-px w-full bg-zinc-100 dark:bg-zinc-800/60 lg:block" />;
        }
        return (
            <div className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                {title}
            </div>
        );
    };

    const handleNav = () => {
        if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            onClose();
        }
    };

    return (
        <>
            <div
                className={`fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-[1px] transition-opacity lg:hidden ${
                    isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={onClose}
                aria-hidden="true"
            />

            <aside
                className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-200/60 bg-zinc-50/95 backdrop-blur-xl transition-[transform,width] duration-300 ease-out dark:border-zinc-800/60 dark:bg-[#0A0A0B]/95 ${
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                } w-64 lg:translate-x-0 ${collapsed ? 'lg:w-16' : 'lg:w-64'}`}
            >
                <div
                    className={`flex h-16 shrink-0 items-center border-b border-zinc-200/60 dark:border-zinc-800/60 ${
                        collapsed ? 'lg:justify-center lg:px-0' : 'justify-between px-6'
                    }`}
                >
                    <Link
                        href={route('dashboard')}
                        onClick={handleNav}
                        className={`flex min-w-0 items-center ${collapsed ? 'lg:justify-center' : 'gap-1'}`}
                    >
                        <span
                            className={`truncate text-[13px] font-black uppercase tracking-[0.25em] text-zinc-800 dark:text-zinc-100 ${collapsed ? 'lg:hidden' : ''}`}
                        >
                            SIVSO
                        </span>
                        <span
                            className={`hidden text-[12px] font-black uppercase tracking-[0.35em] text-brand-gold dark:text-brand-gold-soft ${collapsed ? 'lg:inline' : ''}`}
                            aria-hidden={!collapsed}
                        >
                            S
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        className="hidden h-7 w-7 shrink-0 items-center justify-center rounded border border-zinc-200 text-zinc-400 transition hover:bg-zinc-50 hover:text-zinc-700 dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 lg:inline-flex"
                        aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
                    >
                        {collapsed ? (
                            <ChevronRight className="size-3.5" strokeWidth={2} aria-hidden />
                        ) : (
                            <ChevronLeft className="size-3.5" strokeWidth={2} aria-hidden />
                        )}
                    </button>
                </div>

                <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden p-3 scrollbar-hide">
                    <SectionHeader title="Principal" />
                    <nav className="flex flex-col gap-0.5">
                        <Link
                            href={route('dashboard')}
                            onClick={handleNav}
                            className={navLink(route().current('dashboard'))}
                            title="Dashboard"
                        >
                            <LayoutDashboard className={iconClass(route().current('dashboard'))} strokeWidth={2} aria-hidden />
                            <span className={collapsed ? 'lg:hidden' : ''}>Dashboard</span>
                        </Link>

                        {(can('Ver mi delegación') || tienePerfilDelegado) && (
                            <Link
                                href={route('my-delegation.index')}
                                onClick={handleNav}
                                className={navLink(route().current('my-delegation.*'))}
                                title="Mi Delegación"
                            >
                                <MapPin className={iconClass(route().current('my-delegation.*'))} strokeWidth={2} aria-hidden />
                                <span className={collapsed ? 'lg:hidden' : ''}>Mi Delegación</span>
                            </Link>
                        )}
                        <Link
                            href={route('notificaciones.index')}
                            onClick={handleNav}
                            className={navLink(route().current('notificaciones.*'))}
                            title="Notificaciones"
                        >
                            <span className="relative shrink-0">
                                <Bell className={iconClass(route().current('notificaciones.*'))} strokeWidth={2} aria-hidden />
                                {notificaciones.length > 0 && (
                                    <span className="absolute -right-1 -top-1 flex size-3.5 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold leading-none text-white">
                                        {notificaciones.length > 9 ? '9+' : notificaciones.length}
                                    </span>
                                )}
                            </span>
                            <span className={collapsed ? 'lg:hidden' : ''}>Notificaciones</span>
                        </Link>

                        <Link
                            href={route('profile.edit')}
                            onClick={handleNav}
                            className={navLink(route().current('profile.edit'))}
                            title="Mi Cuenta"
                        >
                            <span
                                className={`hidden size-4 shrink-0 items-center justify-center text-[9px] font-bold uppercase leading-none tabular-nums ${iconClass(route().current('profile.edit'))} ${collapsed ? 'lg:flex' : ''}`}
                                aria-hidden
                            >
                                MC
                            </span>
                            <span className={collapsed ? 'lg:hidden' : ''}>Mi Cuenta</span>
                        </Link>
                    </nav>

                    {(can('Ver empleados') ||
                        can('Ver productos') ||
                        can('Ver partidas') ||
                        can('Ver líneas presupuestales')) && (
                        <>
                            <SectionHeader title="Vestuario" />
                            <nav className="flex flex-col gap-0.5">
                                {can('Ver empleados') && (
                                    <Link
                                        href={route('empleados.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('empleados.*'))}
                                        title="Empleados"
                                    >
                                        <Users2 className={iconClass(route().current('empleados.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Empleados</span>
                                    </Link>
                                )}
                                {can('Ver productos') && (
                                    <Link
                                        href={route('productos.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('productos.*'))}
                                        title="Productos"
                                    >
                                        <Package className={iconClass(route().current('productos.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Productos</span>
                                    </Link>
                                )}
                                {can('Ver partidas') && (
                                    <Link
                                        href={route('partidas.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('partidas.*'))}
                                        title="Partidas"
                                    >
                                        <ListTree className={iconClass(route().current('partidas.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Partidas</span>
                                    </Link>
                                )}
                                {can('Ver líneas presupuestales') && (
                                    <Link
                                        href={route('partidas-especificas.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('partidas-especificas.*'))}
                                        title="Líneas Presupuestales"
                                    >
                                        <FileText className={iconClass(route().current('partidas-especificas.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Líneas Presupuestales</span>
                                    </Link>
                                )}
                            </nav>
                        </>
                    )}

                    {(can('Ver dependencias') || can('Ver delegaciones') || can('Ver delegados')) && (
                        <>
                            <SectionHeader title="Estructura" />
                            <nav className="flex flex-col gap-0.5">
                                {can('Ver dependencias') && (
                                    <Link
                                        href={route('dependencias.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('dependencias.*'))}
                                        title="Dependencias"
                                    >
                                        <Building2 className={iconClass(route().current('dependencias.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Dependencias</span>
                                    </Link>
                                )}
                                {can('Ver delegaciones') && (
                                    <Link
                                        href={route('delegaciones.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('delegaciones.*'))}
                                        title="Delegaciones"
                                    >
                                        <MapPin className={iconClass(route().current('delegaciones.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Delegaciones</span>
                                    </Link>
                                )}
                                {can('Ver delegados') && (
                                    <Link
                                        href={route('delegados.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('delegados.*'))}
                                        title="Delegados"
                                    >
                                        <User className={iconClass(route().current('delegados.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Delegados</span>
                                    </Link>
                                )}
                            </nav>
                        </>
                    )}

                    {(can('Ver periodos') ||
                        can('Ver usuarios') ||
                        can('Ver roles') ||
                        can('Ver permisos') ||
                        can('Ver solicitudes')) && (
                        <>
                            <SectionHeader title="Administración" />
                            <nav className="flex flex-col gap-0.5">
                                {can('Ver periodos') && (
                                    <Link
                                        href={route('periodos.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('periodos.*'))}
                                        title="Periodos"
                                    >
                                        <Calendar className={iconClass(route().current('periodos.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Periodos</span>
                                    </Link>
                                )}
                                {can('Ver usuarios') && (
                                    <Link
                                        href={route('users.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('users.index'))}
                                        title="Usuarios"
                                    >
                                        <Users className={iconClass(route().current('users.index'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Usuarios</span>
                                    </Link>
                                )}
                                {can('Ver roles') && (
                                    <Link
                                        href={route('roles.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('roles.*'))}
                                        title="Roles"
                                    >
                                        <ShieldCheck className={iconClass(route().current('roles.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Roles</span>
                                    </Link>
                                )}
                                {can('Ver permisos') && (
                                    <Link
                                        href={route('permissions.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('permissions.*'))}
                                        title="Permisos"
                                    >
                                        <Key className={iconClass(route().current('permissions.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Permisos</span>
                                    </Link>
                                )}
                                {can('Ver solicitudes') && (
                                    <Link
                                        href={route('solicitudes-movimiento.index')}
                                        onClick={handleNav}
                                        className={navLink(route().current('solicitudes-movimiento.*'))}
                                        title="Solicitudes de movimiento"
                                    >
                                        <ArrowLeftRight className={iconClass(route().current('solicitudes-movimiento.*'))} strokeWidth={2} aria-hidden />
                                        <span className={collapsed ? 'lg:hidden' : ''}>Solicitudes</span>
                                    </Link>
                                )}
                            </nav>
                        </>
                    )}
                </div>

                <div className="border-t border-zinc-200/60 p-4 dark:border-zinc-800/60">
                    {!collapsed && (
                        <div className="mb-4 px-2">
                            <p className="truncate text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{displayName}</p>
                        </div>
                    )}
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className={`group flex w-full items-center gap-3 rounded-lg py-2 px-2 text-[12px] font-bold tracking-wide text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 ${
                            collapsed ? 'lg:justify-center lg:px-0' : ''
                        }`}
                        title="Cerrar sesión"
                    >
                        <LogOut
                            className="size-[16px] shrink-0 text-zinc-400 transition-colors group-hover:text-zinc-600 dark:text-zinc-500 dark:group-hover:text-zinc-300"
                            strokeWidth={2}
                            aria-hidden
                        />
                        <span className={collapsed ? 'lg:hidden' : ''}>Cerrar Sesión</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
