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

function DependenciasIndex({ dependencias, filters = {} }) {
    const can = useAuthCan();
    const puedeGestionar = can('Gestionar dependencias');
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
                route('dependencias.index'),
                { search },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    const form = useForm({
        ur: '',
        nombre: '',
        nombre_corto: '',
    });

    const editForm = useForm({
        nombre: '',
        nombre_corto: '',
    });

    useEffect(() => {
        if (showEdit) {
            editForm.setData({
                nombre: showEdit.nombre ?? '',
                nombre_corto: showEdit.nombre_corto ?? '',
            });
        }
    }, [showEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('dependencias.store'), {
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
        editForm.patch(route('dependencias.update', showEdit.ur), {
            preserveScroll: true,
            onSuccess: () => setShowEdit(null),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route('dependencias.destroy', deleteTarget.ur), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const columns = useMemo(
        () => [
            {
                key: 'ur',
                header: 'UR',
                className: 'w-24 text-left tabular-nums',
                cellClassName: 'text-left font-mono text-xs tabular-nums',
            },
            { key: 'nombre', header: 'Nombre', cellClassName: 'text-left' },
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
            <Head title="Dependencias" />
            <AdminPageShell
                title="Dependencias"
                description="Unidades responsables del catálogo SIVSO (tabla dependencia). Datos cargados desde migración y seeders CSV."
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
                {pageErrors?.dependencia && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-800 dark:bg-red-950/50 dark:text-red-200">
                        {pageErrors.dependencia}
                    </p>
                )}
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                    <Search className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar dependencia..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>
                <DataTable
                    columns={columns}
                    rows={dependencias.data}
                    keyExtractor={(row) => row.ur}
                    emptyTitle="Sin dependencias"
                    emptyDescription="No hay registros en dependencia. Ejecuta migraciones y el seeder de dependencias si aún no lo has hecho."
                    footer={dependencias.last_page > 1 ? <TablePagination pagination={dependencias} /> : null}
                />
            </AdminPageShell>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva dependencia">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="UR (Unidad responsable)"
                        id="dep-ur"
                        type="number"
                        value={form.data.ur}
                        onChange={(e) => form.setData('ur', e.target.value)}
                        error={form.errors.ur}
                        placeholder="Ej. 310"
                        required
                    />
                    <FormField
                        label="Nombre"
                        id="dep-nombre"
                        value={form.data.nombre}
                        onChange={(e) => form.setData('nombre', e.target.value)}
                        error={form.errors.nombre}
                        placeholder="Nombre completo de la dependencia"
                        required
                    />
                    <FormField
                        label="Nombre corto"
                        id="dep-nombre-corto"
                        value={form.data.nombre_corto}
                        onChange={(e) => form.setData('nombre_corto', e.target.value)}
                        error={form.errors.nombre_corto}
                        placeholder="Abreviatura o nombre corto"
                    />
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
                            {form.processing ? 'Guardando…' : 'Crear dependencia'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(showView)} onClose={() => setShowView(null)} title="Detalle dependencia">
                {showView && (
                    <dl className="grid gap-3 text-[13px]">
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">UR</dt>
                            <dd className="mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">{showView.ur}</dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Nombre</dt>
                            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{showView.nombre}</dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Nombre corto</dt>
                            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{showView.nombre_corto || '—'}</dd>
                        </div>
                    </dl>
                )}
            </Modal>

            <Modal open={Boolean(showEdit)} onClose={() => setShowEdit(null)} title="Editar dependencia">
                {showEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                            UR <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{showEdit.ur}</span>{' '}
                            (no editable)
                        </p>
                        <FormField
                            label="Nombre"
                            id="edit-dep-nombre"
                            value={editForm.data.nombre}
                            onChange={(e) => editForm.setData('nombre', e.target.value)}
                            error={editForm.errors.nombre}
                            required
                        />
                        <FormField
                            label="Nombre corto"
                            id="edit-dep-nc"
                            value={editForm.data.nombre_corto}
                            onChange={(e) => editForm.setData('nombre_corto', e.target.value)}
                            error={editForm.errors.nombre_corto}
                        />
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
                    deleteTarget
                        ? `¿Eliminar la dependencia UR ${deleteTarget.ur} «${deleteTarget.nombre}»?`
                        : ''
                }
                onConfirm={handleDeleteConfirm}
                processing={deleting}
            />
        </>
    );
}

DependenciasIndex.layout = createAdminPageLayout('Dependencias');

export default DependenciasIndex;
