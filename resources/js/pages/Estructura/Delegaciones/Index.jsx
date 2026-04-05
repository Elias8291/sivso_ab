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
import { Plus, Search } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { route } from 'ziggy-js';

function DelegacionesIndex({ delegaciones, dependenciasList = [], filters = {} }) {
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

    const form = useForm({
        codigo: '',
        ur_referencia: '',
    });

    const editForm = useForm({
        ur_referencia: '',
    });

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
            onSuccess: () => {
                setShowCreate(false);
                form.reset();
            },
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
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const selectClass =
        'block w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] text-zinc-800 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 dark:border-zinc-700 dark:text-zinc-200 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20';

    const columns = useMemo(
        () => [
            { key: 'codigo', header: 'Código', className: 'w-1/3 text-left', cellClassName: 'text-left font-mono text-xs' },
            {
                key: 'ur_referencia',
                header: 'UR ref.',
                className: 'w-1/3 text-left tabular-nums',
                cellClassName: 'text-left tabular-nums text-zinc-600 dark:text-zinc-400',
                render: (row) => (row.ur_referencia != null ? row.ur_referencia : <span className="text-zinc-400">—</span>),
            },
            {
                key: 'referencia_nombre',
                header: 'Dependencia de referencia',
                className: 'w-1/3 text-left',
                cellClassName: 'text-left',
                render: (row) => row.referencia_nombre ?? <span className="text-zinc-400">—</span>,
            },
            {
                key: 'acciones',
                header: 'Acciones',
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
        [puedeGestionar],
    );

    return (
        <>
            <Head title="Delegaciones" />
            <AdminPageShell
                title="Delegaciones"
                description="Códigos de delegación y su vínculo opcional con una UR de dependencia (relación N:M detallada en dependencia_delegacion)."
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
                {pageErrors?.delegacion && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-800 dark:bg-red-950/50 dark:text-red-200">
                        {pageErrors.delegacion}
                    </p>
                )}
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
                    footer={delegaciones.last_page > 1 ? <TablePagination pagination={delegaciones} /> : null}
                />
            </AdminPageShell>

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

            <Modal open={Boolean(showView)} onClose={() => setShowView(null)} title="Detalle delegación">
                {showView && (
                    <dl className="grid gap-3 text-[13px]">
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Código</dt>
                            <dd className="mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">{showView.codigo}</dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">UR referencia</dt>
                            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                                {showView.ur_referencia ?? '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Dependencia</dt>
                            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{showView.referencia_nombre ?? '—'}</dd>
                        </div>
                    </dl>
                )}
            </Modal>

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
