import AdminPageShell from '@/components/admin/AdminPageShell';
import TablePagination from '@/components/admin/TablePagination';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { ChevronDown, FileDown, Info, Lock, Package, Search, Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { EmpleadoRow } from './components/EmpleadoRow';
import { ModalAgregarProducto } from './components/ModalAgregarProducto';
import { ResumenProgreso, StatsBar } from './components/ResumenProgreso';

const FILTROS = [
    { key: 'todos',       label: 'Todos'        },
    { key: 'listos',      label: 'Actualizados' },
    { key: 'sin_empezar', label: 'Pendientes'   },
    { key: 'bajas',       label: 'Bajas'        },
    { key: 'sin_nue',     label: 'Sin NUE'      },
];

const PER_PAGE_OPTS = [10, 15, 20, 30, 50, 100];

const moneyFmt = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney = (v) => moneyFmt.format(Number(v) || 0);

/* ─── Bloque de período (compacto, en la sección de cabecera) ──────── */
function PeriodoTag({ periodo }) {
    if (!periodo) return null;
    const abierto = periodo.estado === 'abierto';

    if (!abierto) {
        return (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                <Lock className="size-3 shrink-0 opacity-60" strokeWidth={1.5} aria-hidden />
                <span className="font-medium">{periodo.estado === 'cerrado' ? 'Período cerrado' : 'Período próximo'}</span>
                <span className="text-zinc-400 dark:text-zinc-500">· {periodo.nombre}</span>
            </span>
        );
    }

    const fechaFin = periodo.fecha_fin
        ? new Date(periodo.fecha_fin + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

    return (
        <span className="inline-flex items-center gap-1.5 text-[12px]">
            <span className="size-1.5 rounded-full bg-brand-gold dark:bg-brand-gold-soft" aria-hidden />
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{periodo.nombre}</span>
            {fechaFin && (
                <span className="tabular-nums text-zinc-500 dark:text-zinc-400">· hasta {fechaFin}</span>
            )}
        </span>
    );
}

/* ─── Página principal ──────────────────────────────────────────────── */
function MiDelegacionIndex({
    empleados,
    delegaciones = [],
    contexto     = {},
    resumen      = {},
    periodo      = null,
    filters      = {},
    acuse_anios_disponibles = [],
    acuse_anio_default      = null,
    presupuesto_baja_disponible = 0,
}) {
    const [search, setSearch]           = useState(filters.search || '');
    const [filtro, setFiltro]           = useState(filters.filtro || 'todos');
    const [agregarTarget, setAgregarTarget] = useState(null);
    const [presupuestoBaja, setPresupuestoBaja] = useState(presupuesto_baja_disponible ?? 0);
    const isFirstRender = useRef(true);

    useEffect(() => { setPresupuestoBaja(presupuesto_baja_disponible ?? 0); }, [presupuesto_baja_disponible]);

    const anioRef      = resumen.anio_ref ?? resumen.anio_actual ?? new Date().getFullYear();
    const anioVestuario = resumen.anio_actual ?? new Date().getFullYear();

    const perPage = PER_PAGE_OPTS.includes(Number(filters.per_page)) ? Number(filters.per_page) : 20;

    const esVistaInd = filters.modo === 'independiente'
        || (typeof filters.delegacion_codigo === 'string' && filters.delegacion_codigo.startsWith('IND-'));
    const moduleTitle = esVistaInd ? 'Delegación independiente' : 'Mi Delegación';

    const aniosAcuse = Array.isArray(acuse_anios_disponibles) ? acuse_anios_disponibles : [];
    const acuseAnio  = aniosAcuse.length > 0
        ? String(acuse_anio_default && aniosAcuse.includes(acuse_anio_default) ? acuse_anio_default : aniosAcuse[0])
        : '';
    const exportParams = {
        search:             search || undefined,
        filtro,
        delegacion_codigo:  filters.delegacion_codigo ?? undefined,
        modo:               filters.modo ?? undefined,
        anio:               acuseAnio ? Number(acuseAnio) : undefined,
    };

    /* ── navegación con filtros ── */
    const navegar = (overrides = {}) => {
        const q = {
            filtro:            overrides.filtro    !== undefined ? overrides.filtro    : filtro,
            per_page:          overrides.per_page  !== undefined ? overrides.per_page  : perPage,
            page:              overrides.page      !== undefined ? overrides.page      : 1,
            delegacion_codigo: filters.delegacion_codigo ?? undefined,
            modo:              filters.modo ?? undefined,
        };
        const s = overrides.search !== undefined ? overrides.search : search;
        if (s) q.search = s;
        router.get(route('my-delegation.index'), q, {
            preserveState:  true,
            preserveScroll: overrides.preserveScroll !== false,
            replace:        true,
        });
    };

    useEffect(() => {
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        const t = setTimeout(() => navegar({ page: 1 }), 300);
        return () => clearTimeout(t);
    }, [search]);

    const handleFiltro       = (key) => { setFiltro(key); navegar({ filtro: key, page: 1 }); };
    const handlePerPage      = (e)   => navegar({ per_page: Number(e.target.value), page: 1, preserveScroll: false });

    const hayAcuseCompleto = (resumen.total ?? 0) > 0 && (resumen.listos ?? 0) >= (resumen.total ?? 0);
    const periodoAbierto   = periodo?.estado === 'abierto';

    return (
        <>
            <Head title={moduleTitle} />
            <AdminPageShell
                title={moduleTitle}
                description={
                    contexto.modo === 'super_admin' ? (
                        <>Vista global (super admin). <span className="tabular-nums">Vestuario {resumen.anio_actual ?? new Date().getFullYear()} · ref. {anioRef}</span></>
                    ) : contexto.modo === 'delegado' && contexto.delegaciones?.length ? (
                        <p className="text-[13px] leading-snug text-zinc-600 dark:text-zinc-400">
                            <span className="font-medium text-zinc-800 dark:text-zinc-100">{contexto.delegado_nombre ?? 'Delegado'}</span>
                            <span className="text-zinc-300 dark:text-zinc-600" aria-hidden> · </span>
                            <span className="font-mono text-[12px] text-zinc-500 dark:text-zinc-400">{contexto.delegaciones.join(' · ')}</span>
                        </p>
                    ) : (
                        <span className="tabular-nums">Vestuario {resumen.anio_actual ?? new Date().getFullYear()} · ref. {anioRef}</span>
                    )
                }
            >
                {/* Sin perfil */}
                {contexto.modo === 'sin_perfil' && (
                    <div className="mb-5 flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
                        <Info className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500" strokeWidth={1.5} />
                        <p className="text-[12px] leading-tight text-zinc-600 dark:text-zinc-400">
                            Tu cuenta no está vinculada a un registro de <strong className="font-medium text-zinc-800 dark:text-zinc-200">delegado</strong>.
                            Un administrador debe asociarte en <strong className="font-medium text-zinc-800 dark:text-zinc-200">Estructura → Delegados</strong>.
                        </p>
                    </div>
                )}

                {/* Cabecera: período + descarga de lista ─────────────── */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800/80">
                    <PeriodoTag periodo={periodo} />

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Acuse general */}
                        {hayAcuseCompleto ? (
                            <a
                                href={route('my-delegation.acuse-general.pdf', exportParams)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-700 underline decoration-zinc-300 underline-offset-4 transition hover:text-zinc-900 hover:decoration-zinc-500 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:text-white"
                            >
                                <FileDown className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                                Acuse general
                            </a>
                        ) : (
                            <span
                                className="inline-flex cursor-not-allowed items-center gap-1.5 text-[12px] font-medium text-zinc-400 dark:text-zinc-600"
                                title="Actualiza el vestuario de todos los empleados para habilitar el acuse general"
                            >
                                <Lock className="size-3 shrink-0 opacity-60" strokeWidth={2} aria-hidden />
                                Acuse general
                            </span>
                        )}

                        {/* Lista de empleados */}
                        <a
                            href={route('my-delegation.empleados.lista.pdf', exportParams)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-600 underline decoration-zinc-200 underline-offset-4 transition hover:text-zinc-900 hover:decoration-zinc-400 dark:text-zinc-400 dark:decoration-zinc-700 dark:hover:text-zinc-200"
                        >
                            <Users className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                            Lista
                        </a>

                        {/* Presupuesto de bajas disponible */}
                        {periodoAbierto && presupuestoBaja > 0 && (
                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200/70 bg-emerald-50/50 px-3 py-1.5 text-[12px] font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                                <Package className="size-3.5 shrink-0 opacity-70" strokeWidth={2} aria-hidden />
                                ${fmtMoney(presupuestoBaja)} de baja
                            </span>
                        )}
                    </div>
                </div>

                {/* Resumen de progreso ─────────────────────────────── */}
                <div className="mb-6">
                    <ResumenProgreso resumen={resumen} />
                </div>

                {/* Filtros + stats + ayuda ─────────────────────────── */}
                <section className="mb-6 space-y-3" aria-label="Filtros y resumen">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Filtros de estado */}
                        <div role="tablist" aria-label="Filtrar empleados por estado" className="flex flex-wrap gap-1">
                            {FILTROS.map((f) => {
                                const active = filtro === f.key;
                                return (
                                    <button
                                        key={f.key}
                                        type="button"
                                        role="tab"
                                        aria-selected={active}
                                        onClick={() => handleFiltro(f.key)}
                                        className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                            active
                                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-200'
                                        }`}
                                    >
                                        {f.label}
                                    </button>
                                );
                            })}
                        </div>

                        <StatsBar resumen={resumen} />
                    </div>

                    {/* Acordeón de ayuda */}
                    <details className="group rounded-lg border border-zinc-100 bg-zinc-50/50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/20">
                        <summary className="cursor-pointer list-none text-[12px] font-medium text-zinc-500 marker:content-none dark:text-zinc-400 [&::-webkit-details-marker]:hidden">
                            <span className="inline-flex items-center gap-1.5">
                                <ChevronDown className="size-3.5 shrink-0 opacity-60 transition group-open:rotate-180" strokeWidth={2} aria-hidden />
                                ¿Cómo funciona esta pantalla?
                            </span>
                        </summary>
                        <p className="mt-2 border-t border-zinc-100 pt-2 text-[11px] leading-relaxed text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                            <strong className="font-medium text-zinc-700 dark:text-zinc-300">Vestuario</strong>: tallas y medidas del periodo.{' '}
                            <strong className="font-medium text-zinc-700 dark:text-zinc-300">Ver</strong>: productos por año.{' '}
                            <strong className="font-medium text-zinc-700 dark:text-zinc-300">Más</strong>: cambio de delegación, baja y agregar con presupuesto de bajas.
                        </p>
                    </details>
                </section>

                {/* Buscador ───────────────────────────────────────── */}
                <div className="mb-6 max-w-md">
                    <label htmlFor="mi-del-busqueda" className="mb-2 block text-[11px] text-zinc-400 dark:text-zinc-500">
                        Buscar empleado
                    </label>
                    <div className="group flex items-center gap-3 border-b border-zinc-200 pb-2 transition-colors focus-within:border-zinc-400 dark:border-zinc-700 dark:focus-within:border-zinc-500">
                        <Search className="size-4 shrink-0 text-zinc-300 transition group-focus-within:text-zinc-500 dark:text-zinc-600 dark:group-focus-within:text-zinc-400" aria-hidden />
                        <input
                            id="mi-del-busqueda"
                            type="search"
                            placeholder="Nombre o NUE"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-zinc-900 placeholder:text-zinc-300 outline-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                        />
                        {search && (
                            <button type="button" onClick={() => setSearch('')}
                                className="shrink-0 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300">
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Cabecera de la lista ───────────────────────────── */}
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500">
                        Empleados
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                        <label className="flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
                            <span className="whitespace-nowrap">Ver</span>
                            <select
                                value={perPage}
                                onChange={handlePerPage}
                                aria-label="Empleados por página"
                                className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-2.5 pr-8 text-[12px] font-medium text-zinc-800 shadow-sm outline-none transition-[border-color,box-shadow] focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                            >
                                {PER_PAGE_OPTS.map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                            <span className="whitespace-nowrap text-zinc-500 dark:text-zinc-400">por página</span>
                        </label>
                        <span className="tabular-nums text-[12px] text-zinc-400 dark:text-zinc-500">
                            {empleados.data.length} / {empleados.total}
                        </span>
                    </div>
                </div>

                {/* Lista de empleados ──────────────────────────────── */}
                {empleados.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 py-16 dark:border-zinc-800 dark:bg-zinc-900/20">
                        <Users className="size-8 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} aria-hidden />
                        <div className="text-center">
                            <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Sin resultados</p>
                            <p className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">Ajusta la búsqueda o el filtro.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {empleados.data.map((emp) => (
                            <EmpleadoRow
                                key={emp.id}
                                empleado={emp}
                                delegaciones={delegaciones}
                                anioActual={anioVestuario}
                                periodoAbierto={periodoAbierto}
                                presupuestoBaja={presupuestoBaja}
                                onAbrirAgregarProducto={(e) => setAgregarTarget(e)}
                            />
                        ))}
                    </div>
                )}

                {empleados.last_page > 1 && (
                    <div className="mt-6"><TablePagination pagination={empleados} /></div>
                )}

                {/* Modal agregar producto (nivel página, una sola instancia) */}
                <ModalAgregarProducto
                    open={!!agregarTarget}
                    onClose={() => setAgregarTarget(null)}
                    empleadoId={agregarTarget?.id}
                    empleadoNombre={agregarTarget?.nombre_completo}
                    onAgregado={(nuevoPresupuesto) => setPresupuestoBaja(nuevoPresupuesto)}
                />
            </AdminPageShell>
        </>
    );
}

MiDelegacionIndex.layout = (page) => {
    const filtroCodigo = page?.props?.filters?.delegacion_codigo;
    const modo         = page?.props?.filters?.modo;
    const esVistaInd   = modo === 'independiente'
        || (typeof filtroCodigo === 'string' && filtroCodigo.startsWith('IND-'));
    const layoutTitle  = esVistaInd ? 'Delegación independiente' : 'Mi Delegación';

    return (
        <AuthenticatedLayout
            header={<span className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">{layoutTitle}</span>}
        >
            {page}
        </AuthenticatedLayout>
    );
};

export default MiDelegacionIndex;
