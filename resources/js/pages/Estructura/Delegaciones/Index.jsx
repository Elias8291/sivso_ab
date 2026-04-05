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
import { CheckCircle2, Clock, LayoutList, Plus, Search, Users } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { route } from 'ziggy-js';

/* ──────────────────────────────────────────────
   Tarjeta de estadística — mismo estilo que MiDelegacion
────────────────────────────────────────────── */
function ResumenStatCard({ icon: Icon, label, value, hint }) {
    return (
        <div className="rounded-xl border border-zinc-200/80 border-l-2 border-l-brand-gold/35 bg-zinc-50 px-3.5 py-3 dark:border-zinc-800 dark:border-l-brand-gold-soft/30 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{label}</p>
                    <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
                        {value}
                    </p>
                    {hint && (
                        <p className="mt-0.5 text-[11px] leading-snug text-zinc-400 dark:text-zinc-500">{hint}</p>
                    )}
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

/* ──────────────────────────────────────────────
   Barra de progreso — gold gradient igual que VestuarioPanel
────────────────────────────────────────────── */
function ProgressBar({ porcentaje, confirmadas, total }) {
    const pct = Math.min(100, Math.max(0, porcentaje));

    return (
        <div className="min-w-[120px]">
            <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-[11px] tabular-nums text-zinc-500 dark:text-zinc-400">
                    {confirmadas}/{total}
                </span>
                <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                    {pct}%
                </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-gold/45 via-brand-gold/65 to-brand-gold-soft/55 dark:from-brand-gold-soft/35 dark:via-brand-gold-soft/50 dark:to-brand-gold/40 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Badge de estado — igual al estilo de EmpleadoRow
────────────────────────────────────────────── */
function StatusBadge({ pendientes, total }) {
    if (total === 0) return null;

    if (pendientes === 0) {
        return (
            <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-zinc-300 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
                <CheckCircle2 className="size-3" strokeWidth={2.5} />
                Completa
            </span>
        );
    }

    return (
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md border border-transparent bg-zinc-100/80 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
            <Clock className="size-3" strokeWidth={1.8} />
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
        if (isFirstRender.current) { isFirstRender.current = false; return; }
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
                cellClassName: 'text-left font-mono text-[12px]',
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
                header: 'Emp.',
                className: 'w-[6%] text-center',
                cellClassName: 'text-center tabular-nums text-[12px] text-zinc-500 dark:text-zinc-400',
                render: (row) => row.total_empleados,
            },
            {
                key: 'progreso',
                header: `Progreso ${anio ?? ''}`,
                className: 'w-[26%] text-left',
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
                header: '',
                className: 'w-[10%]',
                cellClassName: '',
                render: (row) => (
                    <StatusBadge pendientes={row.pendientes} total={row.total_asignaciones} />
                ),
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

    const pct = resumen.porcentaje ?? 0;

    return (
        <>
            <Head title="Delegaciones" />
            <AdminPageShell
                title="Delegaciones"
                description={
                    <span className="tabular-nums">
                        Progreso de actualización de tallas · ejercicio {anio ?? ''}
                    </span>
                }
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
                {/* ── Tarjetas resumen ── */}
                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                    <ResumenStatCard
                        icon={LayoutList}
                        label="Total asignaciones"
                        value={resumen.total.toLocaleString()}
                        hint={`Ejercicio ${anio ?? ''}`}
                    />
                    <ResumenStatCard
                        icon={CheckCircle2}
                        label="Confirmadas"
                        value={resumen.confirmadas.toLocaleString()}
                        hint={`${pct}% del total`}
                    />
                    <ResumenStatCard
                        icon={Users}
                        label="Pendientes"
                        value={resumen.pendientes.toLocaleString()}
                        hint="aún sin confirmar"
                    />
                </div>

                {/* ── Barra global ── */}
                <div className="mb-4">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                            <span
                                className="inline-block size-1 rounded-full bg-brand-gold/55 align-middle dark:bg-brand-gold-soft/45"
                                aria-hidden
                            />
                            Avance global · todas las delegaciones
                        </span>
                        <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-500">
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                                {resumen.confirmadas.toLocaleString()}
                            </span>
                            {' '}/ {resumen.total.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-gold/45 via-brand-gold/65 to-brand-gold-soft/55 dark:from-brand-gold-soft/35 dark:via-brand-gold-soft/50 dark:to-brand-gold/40 transition-all duration-700"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                {pageErrors?.delegacion && (
                    <p className="mb-3 rounded-lg border border-red-200/60 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                        {pageErrors.delegacion}
                    </p>
                )}

                {/* ── Buscador ── */}
                <div className="mb-3 flex min-h-[40px] items-center gap-2 rounded-lg border border-zinc-200/90 bg-zinc-50 px-3 py-2 transition-[border-color,box-shadow] focus-within:border-brand-gold/40 focus-within:ring-1 focus-within:ring-brand-gold/15 dark:border-zinc-800 dark:bg-zinc-900/30 dark:focus-within:border-brand-gold-soft/35 dark:focus-within:ring-brand-gold-soft/12">
                    <Search className="size-4 shrink-0 text-brand-gold/65 dark:text-brand-gold-soft/55" aria-hidden />
                    <input
                        type="text"
                        placeholder="Buscar delegación…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            className="shrink-0 text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                <DataTable
                    columns={columns}
                    rows={delegaciones.data}
                    keyExtractor={(row) => row.codigo}
                    emptyTitle="Sin delegaciones"
                    emptyDescription="No hay registros. Ejecuta migraciones y seeders correspondientes."
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
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                    Código
                                </dt>
                                <dd className="mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">
                                    {showView.codigo}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                    Dependencia
                                </dt>
                                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                                    {showView.referencia_nombre ?? '—'}
                                    {showView.ur_referencia != null && (
                                        <span className="ml-1 text-zinc-400">(UR {showView.ur_referencia})</span>
                                    )}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                                    Empleados activos
                                </dt>
                                <dd className="mt-0.5 tabular-nums text-zinc-900 dark:text-zinc-100">
                                    {showView.total_empleados}
                                </dd>
                            </div>
                        </dl>

                        {showView.total_asignaciones > 0 && (
                            <>
                                {/* divisor visible solo en móvil */}
                                <div className="h-px bg-zinc-100 dark:bg-zinc-800/50 sm:hidden" />

                                {/* sin contenedor en móvil; tarjeta en sm+ */}
                                <div className="sm:rounded-xl sm:border sm:border-l-2 sm:border-zinc-200/80 sm:border-l-brand-gold/35 sm:bg-zinc-50 sm:px-3.5 sm:py-3 sm:dark:border-zinc-800 sm:dark:border-l-brand-gold-soft/30 sm:dark:bg-zinc-900/30">
                                    <p className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                                        Progreso vestuario {anio}
                                    </p>
                                    <ProgressBar
                                        porcentaje={showView.porcentaje}
                                        confirmadas={showView.confirmadas}
                                        total={showView.total_asignaciones}
                                    />
                                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-zinc-100 pt-3 text-center dark:border-zinc-800/50">
                                        <div>
                                            <p className="text-lg font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-100">
                                                {showView.confirmadas}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Confirmadas</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-100">
                                                {showView.pendientes}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Pendientes</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-semibold tabular-nums tracking-tight text-zinc-800 dark:text-zinc-100">
                                                {showView.total_asignaciones}
                                            </p>
                                            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">Total</p>
                                        </div>
                                    </div>
                                </div>
                            </>
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
                            <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                                {showEdit.codigo}
                            </span>{' '}
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
