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

function PermissionsIndex({ permissions, filters = {} }) {
    const puedeGestionar = useAuthCan()('Gestionar permisos');
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
            router.get(route('permissions.index'), { search }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    const form = useForm({
        name: '',
        guard_name: 'web',
    });

    const editForm = useForm({
        name: '',
        guard_name: 'web',
    });

    useEffect(() => {
        if (showEdit) {
            editForm.setData({
                name: showEdit.name ?? '',
                guard_name: showEdit.guard_name ?? 'web',
            });
        }
    }, [showEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('permissions.store'), {
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
        editForm.patch(route('permissions.update', showEdit.id), {
            preserveScroll: true,
            onSuccess: () => setShowEdit(null),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route('permissions.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const columns = useMemo(
        () => [
            { key: 'name', header: 'Permiso' },
            { key: 'guard_name', header: 'Guard', className: 'w-32' },
            {
                key: 'acciones',
                header: 'Acciones',
                render: (row) => (
                    <CrudRowActions
                        onView={() => setShowView(row)}
                        onEdit={() => setShowEdit(row)}
                        onDelete={() => setDeleteTarget(row)}
                        showEdit={puedeGestionar}
                        showDelete={puedeGestionar && !row.es_del_catalogo}
                    />
                ),
            },
        ],
        [puedeGestionar],
    );

    return (
        <>
            <Head title="Permisos" />
            <AdminPageShell
                title="Permisos"
                description="Permisos del sistema. Los del catálogo base no se pueden renombrar ni eliminar; los demás son editables."
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
                {pageErrors?.permission && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-800 dark:bg-red-950/50 dark:text-red-200">
                        {pageErrors.permission}
                    </p>
                )}
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                    <Search className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar permiso..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>
                <DataTable
                    columns={columns}
                    rows={permissions.data}
                    keyExtractor={(row) => row.id ?? row.name}
                    emptyTitle="Sin permisos"
                    emptyDescription="Ejecuta php artisan db:seed --class=RbacSeeder o el DatabaseSeeder completo para cargar el catálogo base."
                    footer={permissions.last_page > 1 ? <TablePagination pagination={permissions} /> : null}
                />
            </AdminPageShell>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo permiso">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Nombre del permiso"
                        id="perm-name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        error={form.errors.name}
                        placeholder="Ej. Ver reportes"
                        required
                    />
                    <FormField
                        label="Guard"
                        id="perm-guard"
                        value={form.data.guard_name}
                        onChange={(e) => form.setData('guard_name', e.target.value)}
                        error={form.errors.guard_name}
                        placeholder="web"
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
                            {form.processing ? 'Guardando…' : 'Crear permiso'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(showView)} onClose={() => setShowView(null)} title="Detalle permiso">
                {showView && (
                    <dl className="grid gap-3 text-[13px]">
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Nombre</dt>
                            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{showView.name}</dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Guard</dt>
                            <dd className="mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">{showView.guard_name}</dd>
                        </div>
                        {showView.es_del_catalogo ? (
                            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-[12px] text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                                Permiso del catálogo base: no se puede renombrar ni eliminar desde aquí.
                            </p>
                        ) : null}
                    </dl>
                )}
            </Modal>

            <Modal open={Boolean(showEdit)} onClose={() => setShowEdit(null)} title="Editar permiso">
                {showEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        {showEdit.es_del_catalogo ? (
                            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">El nombre no se puede cambiar (catálogo base). Solo el guard.</p>
                        ) : null}
                        <FormField
                            label="Nombre del permiso"
                            id="perm-edit-name"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                            error={editForm.errors.name}
                            required
                            disabled={showEdit.es_del_catalogo}
                            className={showEdit.es_del_catalogo ? 'opacity-60' : ''}
                        />
                        <FormField
                            label="Guard"
                            id="perm-edit-guard"
                            value={editForm.data.guard_name}
                            onChange={(e) => editForm.setData('guard_name', e.target.value)}
                            error={editForm.errors.guard_name}
                            placeholder="web"
                        />
                        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                            <button
                                type="button"
                                onClick={() => setShowEdit(null)}
                                className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={editForm.processing}
                                className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
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
                        ? `¿Eliminar el permiso «${deleteTarget.name}»? Se quitará de los roles que lo tengan.`
                        : ''
                }
                onConfirm={handleDeleteConfirm}
                processing={deleting}
            />
        </>
    );
}

PermissionsIndex.layout = createAdminPageLayout('Permisos');

export default PermissionsIndex;
