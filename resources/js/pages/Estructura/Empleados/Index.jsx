import AdminPageShell from '@/components/admin/AdminPageShell';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import CrudRowActions from '@/components/admin/CrudRowActions';
import DataTable from '@/components/admin/DataTable';
import FormField from '@/components/admin/FormField';
import Modal from '@/components/admin/Modal';
import TablePagination from '@/components/admin/TablePagination';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { useAuthCan } from '@/hooks/useAuthCan';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { route } from 'ziggy-js';

function EmpleadosIndex({ empleados, dependenciasList = [], delegacionesList = [], filters = {} }) {
    const can = useAuthCan();
    const puedeGestionar = can('Gestionar empleados');
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
                route('empleados.index'),
                { search },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    const form = useForm({
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        nue: '',
        ur: '',
        delegacion_codigo: '',
    });

    const editForm = useForm({
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        nue: '',
        ur: '',
        delegacion_codigo: '',
    });

    useEffect(() => {
        if (showEdit) {
            editForm.setData({
                nombre: showEdit.nombre ?? '',
                apellido_paterno: showEdit.apellido_paterno ?? '',
                apellido_materno: showEdit.apellido_materno ?? '',
                nue: showEdit.nue ?? '',
                ur: String(showEdit.ur ?? ''),
                delegacion_codigo: showEdit.delegacion_codigo ?? '',
            });
        }
    }, [showEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('empleados.store'), {
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
        editForm.patch(route('empleados.update', showEdit.id), {
            preserveScroll: true,
            onSuccess: () => setShowEdit(null),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route('empleados.destroy', deleteTarget.id), {
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
            { key: 'nombre', header: 'Nombre', className: 'w-36' },
            { key: 'apellido_paterno', header: 'Ap. Paterno' },
            { key: 'apellido_materno', header: 'Ap. Materno' },
            { key: 'nue', header: 'NUE', className: 'w-28', cellClassName: 'font-mono text-xs uppercase' },
            {
                key: 'dependencia_nombre',
                header: 'Dependencia',
                className: 'w-44',
                render: (row) => row.dependencia_nombre ?? <span className="text-zinc-400">—</span>,
            },
            {
                key: 'delegacion_codigo',
                header: 'Delegación',
                className: 'w-32',
                cellClassName: 'font-mono text-xs',
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
            <Head title="Empleados" />
            <AdminPageShell
                title="Empleados"
                description="Catálogo de empleados vinculados a dependencias y delegaciones del sistema SIVSO."
            >
                {pageErrors?.empleado && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-800 dark:bg-red-950/50 dark:text-red-200">
                        {pageErrors.empleado}
                    </p>
                )}
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                    <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                        <Search className="size-4 shrink-0 text-zinc-400 dark:text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar empleado..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full min-w-0 border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                        />
                    </div>
                    {puedeGestionar ? (
                        <button
                            type="button"
                            onClick={() => setShowCreate(true)}
                            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-zinc-900 px-4 py-3 text-[13px] font-medium text-white shadow-sm ring-1 ring-zinc-900/10 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-white/10 dark:hover:bg-zinc-200 sm:py-3"
                        >
                            <Plus className="size-4" strokeWidth={2} />
                            Agregar empleado
                        </button>
                    ) : null}
                </div>
                <DataTable
                    columns={columns}
                    rows={empleados.data}
                    keyExtractor={(row) => row.id}
                    emptyTitle="Sin empleados"
                    emptyDescription="No hay empleados registrados. Ejecuta migraciones y seeders para cargar el catálogo."
                    footer={empleados.last_page > 1 ? <TablePagination pagination={empleados} /> : null}
                />
            </AdminPageShell>

            <Modal
                open={showCreate}
                onClose={() => setShowCreate(false)}
                title="Nuevo empleado"
                footer={
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowCreate(false)}
                            className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="form-empleado-create"
                            disabled={form.processing}
                            className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            {form.processing ? 'Guardando…' : 'Crear empleado'}
                        </button>
                    </div>
                }
            >
                <form id="form-empleado-create" onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Nombre"
                        id="emp-nombre"
                        value={form.data.nombre}
                        onChange={(e) => form.setData('nombre', e.target.value)}
                        error={form.errors.nombre}
                        placeholder="Nombre(s)"
                        required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label="Apellido paterno"
                            id="emp-ap-paterno"
                            value={form.data.apellido_paterno}
                            onChange={(e) => form.setData('apellido_paterno', e.target.value)}
                            error={form.errors.apellido_paterno}
                            placeholder="Apellido paterno"
                            required
                        />
                        <FormField
                            label="Apellido materno"
                            id="emp-ap-materno"
                            value={form.data.apellido_materno}
                            onChange={(e) => form.setData('apellido_materno', e.target.value)}
                            error={form.errors.apellido_materno}
                            placeholder="Apellido materno"
                        />
                    </div>
                    <FormField
                        label="NUE"
                        id="emp-nue"
                        value={form.data.nue}
                        onChange={(e) => form.setData('nue', e.target.value.toUpperCase())}
                        error={form.errors.nue}
                        placeholder="Número Único de Empleado"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField label="Dependencia (UR)" id="emp-ur" error={form.errors.ur}>
                            <select
                                id="emp-ur"
                                value={form.data.ur}
                                onChange={(e) => form.setData('ur', e.target.value)}
                                className={selectClass}
                                required
                            >
                                <option value="">Seleccionar…</option>
                                {dependenciasList.map((dep) => (
                                    <option key={dep.ur} value={dep.ur}>
                                        {dep.ur} — {dep.nombre_corto || dep.nombre}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                        <FormField label="Delegación" id="emp-delegacion" error={form.errors.delegacion_codigo}>
                            <select
                                id="emp-delegacion"
                                value={form.data.delegacion_codigo}
                                onChange={(e) => form.setData('delegacion_codigo', e.target.value)}
                                className={selectClass}
                                required
                            >
                                <option value="">Seleccionar…</option>
                                {delegacionesList.map((del) => (
                                    <option key={del.codigo} value={del.codigo}>
                                        {del.codigo}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(showView)} onClose={() => setShowView(null)} title="Detalle empleado">
                {showView && (
                    <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
                        {[
                            ['Nombre', showView.nombre],
                            ['Apellido paterno', showView.apellido_paterno],
                            ['Apellido materno', showView.apellido_materno || '—'],
                            ['NUE', showView.nue || '—'],
                            ['UR / Dependencia', showView.dependencia_nombre ? `${showView.ur} — ${showView.dependencia_nombre}` : showView.ur],
                            ['Delegación', showView.delegacion_codigo],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{k}</dt>
                                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{v}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </Modal>

            <Modal
                open={Boolean(showEdit)}
                onClose={() => setShowEdit(null)}
                title="Editar empleado"
                footer={
                    showEdit ? (
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowEdit(null)}
                                className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="form-empleado-edit"
                                disabled={editForm.processing}
                                className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                            >
                                {editForm.processing ? 'Guardando…' : 'Guardar'}
                            </button>
                        </div>
                    ) : null
                }
            >
                {showEdit && (
                    <form id="form-empleado-edit" onSubmit={handleEditSubmit} className="space-y-4">
                        <FormField
                            label="Nombre"
                            id="edit-emp-nombre"
                            value={editForm.data.nombre}
                            onChange={(e) => editForm.setData('nombre', e.target.value)}
                            error={editForm.errors.nombre}
                            required
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label="Apellido paterno"
                                id="edit-emp-ap1"
                                value={editForm.data.apellido_paterno}
                                onChange={(e) => editForm.setData('apellido_paterno', e.target.value)}
                                error={editForm.errors.apellido_paterno}
                                required
                            />
                            <FormField
                                label="Apellido materno"
                                id="edit-emp-ap2"
                                value={editForm.data.apellido_materno}
                                onChange={(e) => editForm.setData('apellido_materno', e.target.value)}
                                error={editForm.errors.apellido_materno}
                            />
                        </div>
                        <FormField
                            label="NUE"
                            id="edit-emp-nue"
                            value={editForm.data.nue}
                            onChange={(e) => editForm.setData('nue', e.target.value.toUpperCase())}
                            error={editForm.errors.nue}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField label="Dependencia (UR)" id="edit-emp-ur" error={editForm.errors.ur}>
                                <select
                                    id="edit-emp-ur"
                                    value={editForm.data.ur}
                                    onChange={(e) => editForm.setData('ur', e.target.value)}
                                    className={selectClass}
                                    required
                                >
                                    {dependenciasList.map((dep) => (
                                        <option key={dep.ur} value={dep.ur}>
                                            {dep.ur} — {dep.nombre_corto || dep.nombre}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField
                                label="Delegación"
                                id="edit-emp-del"
                                error={editForm.errors.delegacion_codigo}
                            >
                                <select
                                    id="edit-emp-del"
                                    value={editForm.data.delegacion_codigo}
                                    onChange={(e) => editForm.setData('delegacion_codigo', e.target.value)}
                                    className={selectClass}
                                    required
                                >
                                    {delegacionesList.map((del) => (
                                        <option key={del.codigo} value={del.codigo}>
                                            {del.codigo}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                        </div>
                    </form>
                )}
            </Modal>

            <ConfirmDeleteModal
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                message={
                    deleteTarget
                        ? `¿Eliminar al empleado «${deleteTarget.nombre} ${deleteTarget.apellido_paterno}»? No podrá revertirse si hay datos ligados.`
                        : ''
                }
                onConfirm={handleDeleteConfirm}
                processing={deleting}
            />
        </>
    );
}

EmpleadosIndex.layout = createAdminPageLayout('Empleados');

export default EmpleadosIndex;
