import AdminPageShell from '@/components/admin/AdminPageShell';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import CrudRowActions from '@/components/admin/CrudRowActions';
import DataTable from '@/components/admin/DataTable';
import FormField from '@/components/admin/FormField';
import Modal from '@/components/admin/Modal';
import TablePagination from '@/components/admin/TablePagination';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Search, CheckCircle2, Clock, Users, TrendingUp } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { route } from 'ziggy-js';

/* ──────────────────────────────────────────────
   Tarjeta de resumen global
────────────────────────────────────────────── */
function ResumenCard({ icon: Icon, label, value, subValue, colorClass }) {
    return (
        <div className="flex items-center gap-3.5 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
            <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                <Icon className="size-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
                <p className="mt-0.5 text-xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</p>
                {subValue && (
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{subValue}</p>
                )}
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Barra de progreso
────────────────────────────────────────────── */
function ProgressBar({ porcentaje, confirmadas, total }) {
    const pct = Math.min(100, Math.max(0, porcentaje));
    const color =
        pct === 100
            ? 'bg-emerald-500'
            : pct >= 50
              ? 'bg-amber-400'
              : 'bg-rose-400';

    return (
        <div className="min-w-[140px]">
            <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                    {confirmadas}/{total}
                </span>
                <span
                    className={`text-[11px] font-semibold tabular-nums ${
                        pct === 100
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : pct >= 50
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-rose-600 dark:text-rose-400'
                    }`}
                >
                    {pct}%
                </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Chip de estado
────────────────────────────────────────────── */
function StatusChip({ pendientes }) {
    if (pendientes === 0) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <CheckCircle2 className="size-3" strokeWidth={2.5} />
                Completa
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Clock className="size-3" strokeWidth={2.5} />
            {pendientes} pend.
        </span>
    );
}

/* ──────────────────────────────────────────────
   Página principal
────────────────────────────────────────────── */
function DelegacionesIndex({
    delegaciones,
    dependenciasList = [],
    filters = {},
    anio,
    resumen = { total: 0, confirmadas: 0, pendientes: 0, porcentaje: 0 },
}) {
    const can = useAuthCan();
    const puedeGestionar = can('Gestionar delegaciones');
    const { errors: pageErrors } = usePage().props;
    const [showCreate, setShowCreate] = useState(false);
    const [showView, setShowView] = useState(null);
    const [showEdit, setShowEdit] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const timeout = setTimeout(() => {
            router.get(
                route('delegaciones.index'),
                { search },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    const form = useForm({ codigo: '', ur_referencia: '' });
    const editForm = useForm({ ur_referencia: '' });

    useEffect(() => {
        if (showEdit) {
            editForm.setData({
                ur_referencia:
                    showEdit.ur_referencia != null ? String(showEdit.ur_referencia) : '',
            });
        }
    }, [showEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('delegaciones.store'), {
            preserveScroll: true,
            onSuccess: () => { setShowCreate(false); form.reset(); },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!showEdit) return;
        editForm.patch(route('delegaciones.update', showEdit.codigo), {
            preserveScroll: true,
            onSuccess: () => setShowEdit(null),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route('delegaciones.destroy', deleteTarget.codigo), {
            preserveScroll: true,
            onFinish: () => { setDeleting(false); setDeleteTarget(null); },
        });
    };

    const selectClass =
        'block w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] text-zinc-800 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 dark:border-zinc-700 dark:text-zinc-200 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20';

    const columns = useMemo(
        () => [
            {
                key: 'codigo',
                header: 'Código',
                className: 'w-[12%] text-left',
                cellClassName: 'text-left font-mono text-xs',
            },
            {
                key: 'referencia_nombre',
                header: 'Dependencia',
                className: 'text-left',
                cellClassName: 'text-left text-[13px]',
                render: (row) =>
                    row.referencia_nombre ?? (
                        <span className="text-zinc-400">—</span>
                    ),
            },
            {
                key: 'empleados',
                header: 'Empleados',
                className: 'w-[8%] text-center',
                cellClassName: 'text-center tabular-nums text-zinc-600 dark:text-zinc-400',
                render: (row) => row.total_empleados,
            },
            {
                key: 'progreso',
                header: `Progreso ${anio ?? ''}`,
                className: 'w-[28%] text-left',
                cellClassName: 'text-left',
                render: (row) =>
                    row.total_asignaciones > 0 ? (
                        <ProgressBar
                            porcentaje={row.porcentaje}
                            confirmadas={row.confirmadas}
                            total={row.total_asignaciones}
                        />
                    ) : (
                        <span className="text-[11px] text-zinc-400">Sin asignaciones</span>
                    ),
            },
            {
                key: 'estado',
                header: 'Estado',
                className: 'w-[10%] text-center',
                cellClassName: 'text-center',
                render: (row) =>
                    row.total_asignaciones > 0 ? (
                        <StatusChip pendientes={row.pendientes} />
                    ) : null,
            },
            {
                key: 'acciones',
                header: 'Acciones',
                className: 'w-[10%]',
                render: (row) => (
                    <CrudRowActions
                        onView={() => setShowView(row)}
                        onEdit={() => setShowEdit(row)}
                        onDelete={() => setDeleteTarget(row)}
                        showEdit={puedeGestionar}
                        showDelete={puedeGestionar}
                    />
                ),
            },
        ],
        [puedeGestionar, anio],
    );

    return (
        <>
            <Head title="Delegaciones" />
            <AdminPageShell
                title="Delegaciones"
                description={`Progreso de actualización de tallas por delegación — ejercicio ${anio ?? ''}.`}
                actions={
                    puedeGestionar ? (
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            <Plus className="size-4" strokeWidth={2} />
                            Agregar
                        </button>
                    ) : null
                }
            >
                {/* ── Tarjetas de resumen global ── */}
                <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <ResumenCard
                        icon={TrendingUp}
                        label="Progreso global"
                        value={`${resumen.porcentaje}%`}
                        subValue={`Ejercicio ${anio ?? ''}`}
                        colorClass="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                    />
                    <ResumenCard
                        icon={CheckCircle2}
                        label="Confirmadas"
                        value={resumen.confirmadas.toLocaleString()}
                        subValue={`de ${resumen.total.toLocaleString()} asignaciones`}
                        colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                    />
                    <ResumenCard
                        icon={Clock}
                        label="Pendientes"
                        value={resumen.pendientes.toLocaleString()}
                        subValue="aún sin confirmar"
                        colorClass="bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                    />
                    <ResumenCard
                        icon={Users}
                        label="Total asignaciones"
                        value={resumen.total.toLocaleString()}
                        subValue="empleados activos"
                        colorClass="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    />
                </div>

                {/* ── Barra de progreso global ── */}
                <div className="mb-5 rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">
                            Avance general de todas las delegaciones
                        </span>
                        <span className="text-[12px] font-bold tabular-nums text-zinc-800 dark:text-zinc-200">
                            {resumen.confirmadas.toLocaleString()} / {resumen.total.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${
                                resumen.porcentaje === 100
                                    ? 'bg-emerald-500'
                                    : resumen.porcentaje >= 50
                                      ? 'bg-amber-400'
                                      : 'bg-rose-400'
                            }`}
                            style={{ width: `${resumen.porcentaje}%` }}
                        />
                    </div>
                </div>

                {pageErrors?.delegacion && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-800 dark:bg-red-950/50 dark:text-red-200">
                        {pageErrors.delegacion}
                    </p>
                )}

                {/* ── Buscador ── */}
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                    <Search className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar delegación..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>

                <DataTable
                    columns={columns}
                    rows={delegaciones.data}
                    keyExtractor={(row) => row.codigo}
                    emptyTitle="Sin delegaciones"
                    emptyDescription="No hay registros en delegación. Ejecuta migraciones y seeders correspondientes."
                    footer={
                        delegaciones.last_page > 1 ? (
                            <TablePagination pagination={delegaciones} />
                        ) : null
                    }
                />
            </AdminPageShell>

            {/* ── Modal crear ── */}
            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva delegación">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Código"
                        id="delegacion-codigo"
                        value={form.data.codigo}
                        onChange={(e) => form.setData('codigo', e.target.value)}
                        error={form.errors.codigo}
                        placeholder="Ej. DEL-001"
                        required
                    />
                    <FormField label="UR de referencia" id="delegacion-ur" error={form.errors.ur_referencia}>
                        <select
                            id="delegacion-ur"
                            value={form.data.ur_referencia}
                            onChange={(e) => form.setData('ur_referencia', e.target.value)}
                            className={selectClass}
                        >
                            <option value="">Sin referencia</option>
                            {dependenciasList.map((dep) => (
                                <option key={dep.ur} value={dep.ur}>
                                    {dep.ur} — {dep.nombre_corto || dep.nombre}
                                </option>
                            ))}
                        </select>
                    </FormField>
                    <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                        <button
                            type="button"
                            onClick={() => setShowCreate(false)}
                            className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            {form.processing ? 'Guardando…' : 'Crear delegación'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* ── Modal ver detalle ── */}
            <Modal open={Boolean(showView)} onClose={() => setShowView(null)} title="Detalle delegación">
                {showView && (
                    <div className="space-y-4 text-[13px]">
                        <dl className="grid gap-3">
                            <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Código</dt>
                                <dd className="mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">{showView.codigo}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Dependencia</dt>
                                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                                    {showView.referencia_nombre ?? '—'}
                                    {showView.ur_referencia != null && (
                                        <span className="ml-1 text-zinc-400">(UR {showView.ur_referencia})</span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Empleados activos</dt>
                                <dd className="mt-0.5 tabular-nums text-zinc-900 dark:text-zinc-100">{showView.total_empleados}</dd>
                            </div>
                        </dl>

                        {showView.total_asignaciones > 0 && (
                            <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
                                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                                    Progreso {anio}
                                </p>
                                <ProgressBar
                                    porcentaje={showView.porcentaje}
                                    confirmadas={showView.confirmadas}
                                    total={showView.total_asignaciones}
                                />
                                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <p className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                            {showView.confirmadas}
                                        </p>
                                        <p className="text-[10px] text-zinc-500">Confirmadas</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                                            {showView.pendientes}
                                        </p>
                                        <p className="text-[10px] text-zinc-500">Pendientes</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold tabular-nums text-zinc-700 dark:text-zinc-200">
                                            {showView.total_asignaciones}
                                        </p>
                                        <p className="text-[10px] text-zinc-500">Total</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── Modal editar ── */}
            <Modal open={Boolean(showEdit)} onClose={() => setShowEdit(null)} title="Editar delegación">
                {showEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                            Código{' '}
                            <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{showEdit.codigo}</span>{' '}
                            (no editable; solo UR de referencia)
                        </p>
                        <FormField label="UR de referencia" id="edit-del-ur" error={editForm.errors.ur_referencia}>
                            <select
                                id="edit-del-ur"
                                value={editForm.data.ur_referencia}
                                onChange={(e) => editForm.setData('ur_referencia', e.target.value)}
                                className={selectClass}
                            >
                                <option value="">Sin referencia</option>
                                {dependenciasList.map((dep) => (
                                    <option key={dep.ur} value={dep.ur}>
                                        {dep.ur} — {dep.nombre_corto || dep.nombre}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                            <button
                                type="button"
                                onClick={() => setShowEdit(null)}
                                className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                            >
                                {editForm.processing ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            <ConfirmDeleteModal
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                message={
                    deleteTarget ? `¿Eliminar la delegación «${deleteTarget.codigo}»?` : ''
                }
                onConfirm={handleDeleteConfirm}
                processing={deleting}
            />
        </>
    );
}

DelegacionesIndex.layout = createAdminPageLayout('Delegaciones');

export default DelegacionesIndex;
