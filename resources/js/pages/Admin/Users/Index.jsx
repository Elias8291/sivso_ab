import AdminPageShell from '@/components/admin/AdminPageShell';
import Badge from '@/components/admin/Badge';
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

function RoleCheckboxes({ rolesDisponibles, value, onChange, error }) {
    return (
        <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Roles
            </span>
            <div className="space-y-2 rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-700">
                {rolesDisponibles.length === 0 ? (
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400">No hay roles en el sistema.</p>
                ) : (
                    rolesDisponibles.map((r) => (
                        <label
                            key={r.name}
                            className="flex cursor-pointer items-center gap-2 text-[13px] text-zinc-800 dark:text-zinc-200"
                        >
                            <input
                                type="checkbox"
                                className="size-4 rounded border-zinc-300 dark:border-zinc-600"
                                checked={value.includes(r.name)}
                                onChange={(e) => {
                                    const on = e.target.checked;
                                    onChange(on ? [...value, r.name] : value.filter((x) => x !== r.name));
                                }}
                            />
                            {r.name}
                        </label>
                    ))
                )}
            </div>
            {error && <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}

function UsersIndex({ users, filters = {}, rolesDisponibles = [] }) {
    const can = useAuthCan();
    const puedeGestionar = can('Gestionar usuarios');
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
                route('users.index'),
                { search },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    const form = useForm({
        name: '',
        email: '',
        rfc: '',
        nue: '',
        password: '',
        password_confirmation: '',
        roles: [],
    });

    const editForm = useForm({
        name: '',
        email: '',
        rfc: '',
        nue: '',
        password: '',
        password_confirmation: '',
        activo: true,
        is_super_admin: false,
        roles: [],
    });

    useEffect(() => {
        if (showEdit) {
            editForm.setData({
                name: showEdit.name ?? '',
                email: showEdit.email ?? '',
                rfc: showEdit.rfc ?? '',
                nue: showEdit.nue ?? '',
                password: '',
                password_confirmation: '',
                activo: Boolean(showEdit.activo),
                is_super_admin: Boolean(showEdit.is_super_admin),
                roles: Array.isArray(showEdit.roles) ? [...showEdit.roles] : [],
            });
        }
    }, [showEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('users.store'), {
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
        editForm.transform((data) => {
            const out = {
                name: data.name,
                email: data.email,
                rfc: data.rfc || null,
                nue: data.nue || null,
                activo: Boolean(data.activo),
                is_super_admin: Boolean(data.is_super_admin),
                roles: Array.isArray(data.roles) ? data.roles : [],
            };
            if (data.password && String(data.password).length > 0) {
                out.password = data.password;
                out.password_confirmation = data.password_confirmation;
            }
            return out;
        });
        editForm.patch(route('users.update', showEdit.id), {
            preserveScroll: true,
            onSuccess: () => setShowEdit(null),
        });
    };

    const handleDeleteConfirm = () => {
        if (!deleteTarget) return;
        setDeleting(true);
        router.delete(route('users.destroy', deleteTarget.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const columns = useMemo(
        () => [
            { key: 'name', header: 'Nombre' },
            { key: 'email', header: 'Correo' },
            { key: 'rfc', header: 'RFC', cellClassName: 'font-mono text-xs uppercase' },
            {
                key: 'nue',
                header: 'NUE',
                cellClassName: 'font-mono text-xs',
                render: (row) => row.nue || <span className="text-zinc-400">—</span>,
            },
            {
                key: 'activo',
                header: 'Estado',
                render: (row) => (
                    <Badge variant={row.activo ? 'success' : 'danger'}>{row.activo ? 'Activo' : 'Inactivo'}</Badge>
                ),
            },
            {
                key: 'roles',
                header: 'Roles',
                className: 'min-w-[120px] text-left',
                cellClassName: 'text-left text-[12px]',
                render: (row) =>
                    row.roles?.length ? (
                        <span className="text-zinc-800 dark:text-zinc-200">{row.roles.join(', ')}</span>
                    ) : (
                        <span className="text-zinc-400">—</span>
                    ),
            },
            {
                key: 'is_super_admin',
                header: 'Privilegios',
                render: (row) =>
                    row.is_super_admin ? <Badge variant="gold">Super administrador</Badge> : <span className="text-zinc-400">—</span>,
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
            <Head title="Usuarios" />
            <AdminPageShell
                title="Usuarios"
                description="Listado de cuentas del sistema: ver, editar y eliminar. Las contraseñas en edición son opcionales."
                actions={
                    puedeGestionar ? (
                        <button
                            type="button"
                            onClick={() => {
                                form.setData('roles', []);
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
                {pageErrors?.user && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-800 dark:bg-red-950/50 dark:text-red-200">
                        {pageErrors.user}
                    </p>
                )}
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                    <Search className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>
                <DataTable
                    columns={columns}
                    rows={users.data}
                    keyExtractor={(row) => row.id}
                    emptyTitle="No hay usuarios"
                    emptyDescription="Aún no se han registrado usuarios o el filtro actual no devuelve resultados."
                    footer={users.last_page > 1 ? <TablePagination pagination={users} /> : null}
                />
            </AdminPageShell>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo usuario">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Nombre completo"
                        id="user-name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        error={form.errors.name}
                        placeholder="Ej. Juan Pérez López"
                        required
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label="Correo electrónico"
                            id="user-email"
                            type="email"
                            value={form.data.email}
                            onChange={(e) => form.setData('email', e.target.value)}
                            error={form.errors.email}
                            placeholder="correo@ejemplo.com"
                            required
                        />
                        <FormField
                            label="RFC"
                            id="user-rfc"
                            value={form.data.rfc}
                            onChange={(e) => form.setData('rfc', e.target.value.toUpperCase())}
                            error={form.errors.rfc}
                            placeholder="XXXX000000XXX"
                            maxLength={13}
                        />
                    </div>
                    <FormField
                        label="NUE"
                        id="user-nue"
                        value={form.data.nue}
                        onChange={(e) => form.setData('nue', e.target.value)}
                        error={form.errors.nue}
                        placeholder="Número Único de Empleado"
                    />
                    <RoleCheckboxes
                        rolesDisponibles={rolesDisponibles}
                        value={form.data.roles}
                        onChange={(next) => form.setData('roles', next)}
                        error={form.errors.roles}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label="Contraseña"
                            id="user-password"
                            type="password"
                            value={form.data.password}
                            onChange={(e) => form.setData('password', e.target.value)}
                            error={form.errors.password}
                            placeholder="••••••••"
                            required
                        />
                        <FormField
                            label="Confirmar contraseña"
                            id="user-password-confirm"
                            type="password"
                            value={form.data.password_confirmation}
                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                            error={form.errors.password_confirmation}
                            placeholder="••••••••"
                            required
                        />
                    </div>
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
                            {form.processing ? 'Guardando…' : 'Crear usuario'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(showView)} onClose={() => setShowView(null)} title="Detalle usuario">
                {showView && (
                    <dl className="grid gap-3 text-[13px] sm:grid-cols-2">
                        {[
                            ['Nombre', showView.name],
                            ['Correo', showView.email],
                            ['RFC', showView.rfc || '—'],
                            ['NUE', showView.nue || '—'],
                            ['Roles', showView.roles?.length ? showView.roles.join(', ') : '—'],
                            ['Estado', showView.activo ? 'Activo' : 'Inactivo'],
                            [
                                'Privilegios',
                                showView.is_super_admin ? 'Super administrador' : 'Usuario estándar',
                            ],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{k}</dt>
                                <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{v}</dd>
                            </div>
                        ))}
                    </dl>
                )}
            </Modal>

            <Modal open={Boolean(showEdit)} onClose={() => setShowEdit(null)} title="Editar usuario">
                {showEdit && (
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <FormField
                            label="Nombre completo"
                            id="edit-user-name"
                            value={editForm.data.name}
                            onChange={(e) => editForm.setData('name', e.target.value)}
                            error={editForm.errors.name}
                            required
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label="Correo electrónico"
                                id="edit-user-email"
                                type="email"
                                value={editForm.data.email}
                                onChange={(e) => editForm.setData('email', e.target.value)}
                                error={editForm.errors.email}
                                required
                            />
                            <FormField
                                label="RFC"
                                id="edit-user-rfc"
                                value={editForm.data.rfc}
                                onChange={(e) => editForm.setData('rfc', e.target.value.toUpperCase())}
                                error={editForm.errors.rfc}
                                maxLength={13}
                            />
                        </div>
                        <FormField
                            label="NUE"
                            id="edit-user-nue"
                            value={editForm.data.nue}
                            onChange={(e) => editForm.setData('nue', e.target.value)}
                            error={editForm.errors.nue}
                        />
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                label="Nueva contraseña (opcional)"
                                id="edit-user-pw"
                                type="password"
                                value={editForm.data.password}
                                onChange={(e) => editForm.setData('password', e.target.value)}
                                error={editForm.errors.password}
                            />
                            <FormField
                                label="Confirmar nueva contraseña"
                                id="edit-user-pw2"
                                type="password"
                                value={editForm.data.password_confirmation}
                                onChange={(e) => editForm.setData('password_confirmation', e.target.value)}
                            />
                        </div>
                        <RoleCheckboxes
                            rolesDisponibles={rolesDisponibles}
                            value={editForm.data.roles}
                            onChange={(next) => editForm.setData('roles', next)}
                            error={editForm.errors.roles}
                        />
                        <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 px-3 py-3 dark:border-zinc-700">
                            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-zinc-800 dark:text-zinc-200">
                                <input
                                    type="checkbox"
                                    className="size-4 rounded border-zinc-300 dark:border-zinc-600"
                                    checked={editForm.data.activo}
                                    onChange={(e) => editForm.setData('activo', e.target.checked)}
                                />
                                Cuenta activa
                            </label>
                            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-zinc-800 dark:text-zinc-200">
                                <input
                                    type="checkbox"
                                    className="size-4 rounded border-zinc-300 dark:border-zinc-600"
                                    checked={editForm.data.is_super_admin}
                                    onChange={(e) => editForm.setData('is_super_admin', e.target.checked)}
                                />
                                Super administrador
                            </label>
                        </div>
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
                    deleteTarget ? `¿Eliminar al usuario «${deleteTarget.name}» (${deleteTarget.email})? Esta acción no se puede deshacer.` : ''
                }
                onConfirm={handleDeleteConfirm}
                processing={deleting}
            />
        </>
    );
}

UsersIndex.layout = createAdminPageLayout('Usuarios');

export default UsersIndex;
