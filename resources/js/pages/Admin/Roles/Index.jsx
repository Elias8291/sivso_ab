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
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { route } from 'ziggy-js';

function PermissionPicker({ label, allPermissions, selectedIds, onChange }) {
    const toggle = useCallback(
        (id, checked) => {
            const set = new Set(selectedIds);
            if (checked) {
                set.add(id);
            } else {
                set.delete(id);
            }
            onChange([...set].sort((a, b) => a - b));
        },
        [selectedIds, onChange],
    );

    return (
        <div className="space-y-1.5">
            <p className="block text-[12px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/40">
                {allPermissions.length === 0 ? (
                    <p className="text-[12px] text-zinc-400">No hay permisos cargados.</p>
                ) : (
                    allPermissions.map((p) => (
                        <label key={p.id} className="flex cursor-pointer items-start gap-2 text-[13px] text-zinc-700 dark:text-zinc-300">
                            <input
                                type="checkbox"
                                className="mt-0.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
                                checked={selectedIds.includes(p.id)}
                                onChange={(e) => toggle(p.id, e.target.checked)}
                            />
                            <span>{p.name}</span>
                        </label>
                    ))
                )}
            </div>
        </div>
    );
}

function RolesIndex({ roles, allPermissions = [], filters = {} }) {
    const puedeGestionar = useAuthCan()('Gestionar roles');
    const { errors: pageErrors } = usePage().props;
    const [showCreate, setShowCreate] = useState(false);
    const [showView, setShowView] = useState(null);
    const [showEdit, setShowEdit] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const isFirstRender = useRef(true);

    const columns = useMemo(
        () => [
            { key: 'name', header: 'Rol' },
            {
                key: 'permissions_count',
                header: 'Permisos',
                className: 'w-28 text-right',
                cellClassName: 'text-right tabular-nums',
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
                        showDelete={puedeGestionar && !row.es_rol_protegido}
                    />
                ),
            },
        ],
        [puedeGestionar],
    );

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(route('roles.index'), { search }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    const form = useForm({
        name: '',
        permission_ids: [],
    });

    const editForm = useForm({
        name: '',
        permission_ids: [],
    });

    useEffect(() => {
        if (showEdit) {
            editForm.setData({
                name: showEdit.name ?? '',
                permission_ids: [...(showEdit.permission_ids ?? [])],
            });
        }
    }, [showEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('roles.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                form.reset();
                form.setData('permission_ids', []);
            },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!showEdit) return;
        editForm.patch(route('roles.update', showEdit.id), {
            preserveScroll: true,
            onSuccess: () => setShowEdit(null),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route('roles.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    return (
        <>
            <Head title="Roles" />
            <AdminPageShell
                title="Roles"
                description="Roles y permisos. «Administrador SIVSO» y «Delegado» no se pueden eliminar ni renombrar; el resto admite edición y borrado si ningún usuario los usa."
                actions={
                    puedeGestionar ? (
                        <button
                            type="button"
                            onClick={() => {
                                form.reset();
                                form.setData('permission_ids', []);
                                setShowCreate(true);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            <Plus className="size-4" strokeWidth={2} />
                            Agregar
                        </button>
                    ) : null
                }
            >
                {pageErrors?.role && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-800 dark:bg-red-950/50 dark:text-red-200">
                        {pageErrors.role}
                    </p>
                )}
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                    <Search className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar rol..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>
                <DataTable
                    columns={columns}
                    rows={roles.data}
                    keyExtractor={(row) => row.id ?? row.name}
                    emptyTitle="Sin roles"
                    emptyDescription="Ejecuta php artisan db:seed --class=RbacSeeder para crear Administrador SIVSO y Delegado."
                    footer={roles.last_page > 1 ? <TablePagination pagination={roles} /> : null}
                />
            </AdminPageShell>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo rol">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Nombre del rol"
                        id="role-name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        error={form.errors.name}
                        placeholder="Ej. Auditor"
                        required
                    />
                    <PermissionPicker
                        label="Permisos (opcional)"
                        allPermissions={allPermissions}
                        selectedIds={form.data.permission_ids}
                        onChange={(ids) => form.setData('permission_ids', ids)}
                    />
                    {form.errors.permission_ids && (
                        <p className="text-[11px] text-red-500 dark:text-red-400">{form.errors.permission_ids}</p>
                    )}
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
                            {form.processing ? 'Guardando…' : 'Crear rol'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(showView)} onClose={() => setShowView(null)} title="Detalle rol">
                {showView && (
                    <div className="space-y-4 text-[13px]">
                        <dl className="grid gap-3">
                            <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Nombre</dt>
                                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{showView.name}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Guard</dt>
                                <dd className="mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">{showView.guard_name}</dd>
                            </div>
                            <div>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Permisos ({showView.permissions_count ?? showView.permission_names?.length ?? 0})</dt>
                                <dd className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/40">
                                    {showView.permission_names?.length ? (
                                        <ul className="list-inside list-disc space-y-1 text-zinc-700 dark:text-zinc-300">
                                            {showView.permission_names.map((n) => (
                                                <li key={n}>{n}</li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <span className="text-zinc-400">Ninguno asignado</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                        {showView.es_rol_protegido ? (
                            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-[12px] text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-300">
                                Rol base del sistema: no se puede renombrar ni eliminar.
                            </p>
                        ) : null}
                    </div>
                )}
            </Modal>

            <Modal open={Boolean(showEdit)} onClose={() => setShowEdit(null)} title="Editar rol">
                {showEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        {showEdit.es_rol_protegido ? (
                            <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                                El nombre no se puede cambiar. Puedes ajustar los permisos asignados.
                            </p>
                        ) : null}
                        <FormField
                            label="Nombre del rol"
                            id="role-edit-name"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                            error={editForm.errors.name}
                            required
                            disabled={showEdit.es_rol_protegido}
                        />
                        <PermissionPicker
                            label="Permisos"
                            allPermissions={allPermissions}
                            selectedIds={editForm.data.permission_ids}
                            onChange={(ids) => editForm.setData('permission_ids', ids)}
                        />
                        {editForm.errors.permission_ids && (
                            <p className="text-[11px] text-red-500 dark:text-red-400">{editForm.errors.permission_ids}</p>
                        )}
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
                        ? `¿Eliminar el rol «${deleteTarget.name}»? Solo es posible si ningún usuario lo tiene asignado.`
                        : ''
                }
                onConfirm={handleDeleteConfirm}
                processing={deleting}
            />
        </>
    );
}

RolesIndex.layout = createAdminPageLayout('Roles');

export default RolesIndex;
