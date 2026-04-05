import AdminPageShell from '@/components/admin/AdminPageShell';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import CrudRowActions from '@/components/admin/CrudRowActions';
import DataTable from '@/components/admin/DataTable';
import FormField from '@/components/admin/FormField';
import Modal from '@/components/admin/Modal';
import TablePagination from '@/components/admin/TablePagination';
import EmpleadoBusquedaInput from '@/components/estructura/EmpleadoBusquedaInput';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { route } from 'ziggy-js';

const ROL_DELEGADO = 'Delegado';

function RoleCheckboxesDelegado({ rolesDisponibles, value, onChange, error }) {
    return (
        <div>
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Roles del usuario
            </span>
            <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-900/20">
                {rolesDisponibles.length === 0 ? (
                    <p className="text-[12px] text-zinc-500 dark:text-zinc-400">No hay roles definidos.</p>
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

function defaultRolesDelegado(rolesDisponibles) {
    const names = rolesDisponibles.map((r) => r.name);
    return names.includes(ROL_DELEGADO) ? [ROL_DELEGADO] : [];
}

function DelegadosIndex({
    delegados,
    usuariosParaVincular = [],
    rolesDisponibles = [],
    filters = {},
}) {
    const can = useAuthCan();
    const puedeGestionar = can('Gestionar delegados');
    const { errors: pageErrors } = usePage().props;
    const [showViewDelegado, setShowViewDelegado] = useState(null);
    const [deleteDelegado, setDeleteDelegado] = useState(null);
    const [deletingDelegado, setDeletingDelegado] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [createModalKey, setCreateModalKey] = useState(0);
    const [vincularDelegado, setVincularDelegado] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                route('delegados.index'),
                { search },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    const form = useForm({
        nombre_completo: '',
        nue: '',
        empleado_id: '',
    });

    const vinculoForm = useForm({
        user_id: '',
        empleado_id: '',
        crear_usuario: false,
        nuevo_usuario: {
            name: '',
            email: '',
            rfc: '',
            nue: '',
            password: '',
            password_confirmation: '',
        },
    });

    useEffect(() => {
        if (vincularDelegado) {
            vinculoForm.setData({
                user_id:
                    vincularDelegado.user_id != null ? String(vincularDelegado.user_id) : '',
                empleado_id:
                    vincularDelegado.empleado_id != null
                        ? String(vincularDelegado.empleado_id)
                        : '',
                crear_usuario: false,
                nuevo_usuario: {
                    name: (vincularDelegado.nombre_completo || '').trim(),
                    email: '',
                    rfc: '',
                    nue: '',
                    password: '',
                    password_confirmation: '',
                    roles: defaultRolesDelegado(rolesDisponibles),
                },
            });
        }
    }, [vincularDelegado, rolesDisponibles]);

    const desdeCatalogo = Boolean(form.data.empleado_id);

    const handleSubmit = (e) => {
        e.preventDefault();
        form.transform((data) => ({
            nombre_completo: data.nombre_completo,
            nue: data.nue,
            empleado_id:
                data.empleado_id === '' || data.empleado_id == null
                    ? null
                    : Number(data.empleado_id),
        }));
        form.post(route('delegados.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                form.reset();
            },
        });
    };

    const handleVincularSubmit = (e) => {
        e.preventDefault();
        if (!vincularDelegado) return;
        vinculoForm.transform((data) => {
            const empleadoId =
                data.empleado_id === '' || data.empleado_id == null
                    ? null
                    : Number(data.empleado_id);
            if (data.crear_usuario) {
                return {
                    crear_usuario: true,
                    empleado_id: empleadoId,
                    nuevo_usuario: {
                        name: data.nuevo_usuario.name,
                        email: data.nuevo_usuario.email,
                        rfc: data.nuevo_usuario.rfc || null,
                        nue: data.nuevo_usuario.nue || null,
                        password: data.nuevo_usuario.password,
                        password_confirmation: data.nuevo_usuario.password_confirmation,
                        roles: Array.isArray(data.nuevo_usuario.roles) ? data.nuevo_usuario.roles : [],
                    },
                };
            }
            return {
                crear_usuario: false,
                empleado_id: empleadoId,
                user_id: data.user_id === '' ? null : Number(data.user_id),
            };
        });
        vinculoForm.patch(route('delegados.update', vincularDelegado.id), {
            preserveScroll: true,
            onSuccess: () => {
                setVincularDelegado(null);
                vinculoForm.reset();
            },
        });
    };

    const handleDeleteDelegado = () => {
        if (!deleteDelegado) return;
        setDeletingDelegado(true);
        router.delete(route('delegados.destroy', deleteDelegado.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeletingDelegado(false);
                setDeleteDelegado(null);
            },
        });
    };

    const columns = useMemo(
        () => [
            {
                key: 'nombre_completo',
                header: 'Nombre',
                className: 'min-w-[140px] text-left',
                cellClassName: 'text-left',
            },
            {
                key: 'nue',
                header: 'NUE',
                className: 'min-w-[90px] text-left',
                cellClassName: 'text-left font-mono text-[11px] uppercase',
            },
            {
                key: 'delegaciones',
                header: 'Delegaciones',
                className: 'min-w-[120px] text-left',
                cellClassName: 'text-left text-[12px]',
                render: (row) => row.delegaciones || <span className="text-zinc-400">—</span>,
            },
            {
                key: 'empleado',
                header: 'Empleado (catálogo)',
                className: 'min-w-[130px] text-left',
                cellClassName: 'text-left text-[12px]',
                render: (row) =>
                    row.empleado ? (
                        <span className="text-zinc-800 dark:text-zinc-200">
                            {row.empleado.nombre_completo}
                            {row.empleado.nue ? (
                                <span className="ml-1 font-mono text-[11px] text-zinc-500">
                                    {row.empleado.nue}
                                </span>
                            ) : null}
                        </span>
                    ) : (
                        <span className="text-zinc-400">—</span>
                    ),
            },
            {
                key: 'usuario',
                header: 'Usuario',
                className: 'min-w-[120px] text-left',
                cellClassName: 'text-left text-[12px]',
                render: (row) =>
                    row.usuario ? (
                        <span className="text-zinc-800 dark:text-zinc-200">
                            {row.usuario.name}
                            {row.usuario.rfc ? (
                                <span className="ml-1 font-mono text-[11px] text-zinc-500">
                                    {row.usuario.rfc}
                                </span>
                            ) : null}
                        </span>
                    ) : (
                        <span className="text-zinc-400">Sin vincular</span>
                    ),
            },
            {
                key: 'acciones',
                header: 'Acciones',
                render: (row) => (
                    <CrudRowActions
                        onView={() => setShowViewDelegado(row)}
                        onEdit={() => setVincularDelegado(row)}
                        onDelete={() => setDeleteDelegado(row)}
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
            <Head title="Delegados" />
            <AdminPageShell
                title="Delegados"
                description="Vincula empleado (búsqueda rápida, filtrada por las delegaciones del registro) y usuario para «Mi delegación»."
                actions={
                    puedeGestionar ? (
                        <button
                            type="button"
                            onClick={() => {
                                setCreateModalKey((k) => k + 1);
                                form.reset();
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
                {pageErrors?.delegado && (
                    <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-800 dark:bg-red-950/50 dark:text-red-200">
                        {pageErrors.delegado}
                    </p>
                )}
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                    <Search className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar delegado..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>
                <DataTable
                    columns={columns}
                    rows={delegados.data}
                    keyExtractor={(row) => row.id}
                    emptyTitle="Sin delegados"
                    emptyDescription="No hay registros en delegado. Ejecuta migraciones y el seeder de delegados si aplica."
                    footer={delegados.last_page > 1 ? <TablePagination pagination={delegados} /> : null}
                />
            </AdminPageShell>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo delegado">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Empleado del catálogo (opcional)
                        </label>
                        <p className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                            Búsqueda en todo el personal; escribe al menos 2 caracteres (nombre, apellido o NUE).
                        </p>
                        <EmpleadoBusquedaInput
                            key={`create-${createModalKey}`}
                            delegadoId={null}
                            value={form.data.empleado_id}
                            onValueChange={(id) => form.setData('empleado_id', id)}
                            error={form.errors.empleado_id}
                            delegacionesCodigos={[]}
                        />
                    </div>
                    <FormField
                        label="Nombre completo"
                        id="delegado-nombre"
                        value={form.data.nombre_completo}
                        onChange={(e) => form.setData('nombre_completo', e.target.value)}
                        error={form.errors.nombre_completo}
                        placeholder="Ej. María García López"
                        disabled={desdeCatalogo}
                        required={!desdeCatalogo}
                    />
                    <FormField
                        label="NUE"
                        id="delegado-nue"
                        value={form.data.nue}
                        onChange={(e) => form.setData('nue', e.target.value.toUpperCase())}
                        error={form.errors.nue}
                        placeholder="Número Único de Empleado"
                        disabled={desdeCatalogo}
                        required={!desdeCatalogo}
                    />
                    {desdeCatalogo && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            El nombre y NUE se tomarán del empleado seleccionado al guardar.
                        </p>
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
                            {form.processing ? 'Guardando…' : 'Crear delegado'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(showViewDelegado)} onClose={() => setShowViewDelegado(null)} title="Detalle delegado">
                {showViewDelegado && (
                    <dl className="grid gap-3 text-[13px]">
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Nombre</dt>
                            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{showViewDelegado.nombre_completo}</dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">NUE</dt>
                            <dd className="mt-0.5 font-mono text-zinc-900 dark:text-zinc-100">{showViewDelegado.nue || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Delegaciones</dt>
                            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">{showViewDelegado.delegaciones || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Empleado (catálogo)</dt>
                            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                                {showViewDelegado.empleado
                                    ? `${showViewDelegado.empleado.nombre_completo} (${showViewDelegado.empleado.nue ?? '—'})`
                                    : '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Usuario</dt>
                            <dd className="mt-0.5 text-zinc-900 dark:text-zinc-100">
                                {showViewDelegado.usuario
                                    ? `${showViewDelegado.usuario.name} (${showViewDelegado.usuario.email ?? ''})`
                                    : 'Sin vincular'}
                            </dd>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Para cambiar vínculos usa <strong className="text-zinc-600 dark:text-zinc-300">Editar</strong> (icono lápiz).
                        </p>
                    </dl>
                )}
            </Modal>

            <Modal
                open={Boolean(vincularDelegado)}
                onClose={() => setVincularDelegado(null)}
                title="Vincular empleado y usuario"
            >
                {vincularDelegado && (
                    <form onSubmit={handleVincularSubmit} className="space-y-4">
                        <p className="text-[12px] text-zinc-500 dark:text-zinc-400">
                            Delegado:{' '}
                            <strong className="text-zinc-800 dark:text-zinc-200">
                                {vincularDelegado.nombre_completo}
                            </strong>
                        </p>
                        <div>
                            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                                Empleado en catálogo
                            </label>
                            <p className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                                Resultados limitados a empleados de las delegaciones asignadas a este delegado.
                            </p>
                            <EmpleadoBusquedaInput
                                key={vincularDelegado.id}
                                delegadoId={vincularDelegado.id}
                                value={vinculoForm.data.empleado_id}
                                onValueChange={(id) => vinculoForm.setData('empleado_id', id)}
                                error={vinculoForm.errors.empleado_id}
                                delegacionesCodigos={vincularDelegado.delegaciones_codigos ?? []}
                                seedLabel={
                                    vincularDelegado.empleado
                                        ? `${vincularDelegado.empleado.nombre_completo} · NUE ${vincularDelegado.empleado.nue ?? '—'} · ${vincularDelegado.empleado.delegacion_codigo}`
                                        : ''
                                }
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/40">
                                <input
                                    type="checkbox"
                                    className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900"
                                    checked={vinculoForm.data.crear_usuario}
                                    onChange={(e) => {
                                        const on = e.target.checked;
                                        vinculoForm.setData('crear_usuario', on);
                                        if (on) {
                                            vinculoForm.setData('user_id', '');
                                            vinculoForm.setData('nuevo_usuario', {
                                                ...vinculoForm.data.nuevo_usuario,
                                                roles: defaultRolesDelegado(rolesDisponibles),
                                            });
                                        }
                                    }}
                                />
                                <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
                                    Crear usuario nuevo aquí
                                </span>
                            </label>

                            {vinculoForm.data.crear_usuario ? (
                                <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900/40">
                                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                        Se creará una cuenta con estos datos. Si ya vinculaste empleado con NUE y dejas NUE
                                        vacío, se copiará del empleado. Debe coincidir con la regla de coherencia.
                                    </p>
                                    <FormField
                                        label="Nombre para mostrar"
                                        id="nu-name"
                                        value={vinculoForm.data.nuevo_usuario.name}
                                        onChange={(e) =>
                                            vinculoForm.setData('nuevo_usuario', {
                                                ...vinculoForm.data.nuevo_usuario,
                                                name: e.target.value,
                                            })
                                        }
                                        error={vinculoForm.errors['nuevo_usuario.name']}
                                        autoComplete="name"
                                    />
                                    <FormField
                                        label="Correo (inicio de sesión)"
                                        id="nu-email"
                                        type="email"
                                        value={vinculoForm.data.nuevo_usuario.email}
                                        onChange={(e) =>
                                            vinculoForm.setData('nuevo_usuario', {
                                                ...vinculoForm.data.nuevo_usuario,
                                                email: e.target.value,
                                            })
                                        }
                                        error={vinculoForm.errors['nuevo_usuario.email']}
                                        autoComplete="email"
                                    />
                                    <FormField
                                        label="RFC"
                                        id="nu-rfc"
                                        value={vinculoForm.data.nuevo_usuario.rfc}
                                        onChange={(e) =>
                                            vinculoForm.setData('nuevo_usuario', {
                                                ...vinculoForm.data.nuevo_usuario,
                                                rfc: e.target.value.toUpperCase(),
                                            })
                                        }
                                        error={vinculoForm.errors['nuevo_usuario.rfc']}
                                        autoComplete="off"
                                    />
                                    <FormField
                                        label="NUE (opcional si el empleado ya tiene)"
                                        id="nu-nue"
                                        value={vinculoForm.data.nuevo_usuario.nue}
                                        onChange={(e) =>
                                            vinculoForm.setData('nuevo_usuario', {
                                                ...vinculoForm.data.nuevo_usuario,
                                                nue: e.target.value.toUpperCase(),
                                            })
                                        }
                                        error={vinculoForm.errors['nuevo_usuario.nue']}
                                        autoComplete="off"
                                    />
                                    <FormField
                                        label="Contraseña"
                                        id="nu-password"
                                        type="password"
                                        value={vinculoForm.data.nuevo_usuario.password}
                                        onChange={(e) =>
                                            vinculoForm.setData('nuevo_usuario', {
                                                ...vinculoForm.data.nuevo_usuario,
                                                password: e.target.value,
                                            })
                                        }
                                        error={vinculoForm.errors['nuevo_usuario.password']}
                                        autoComplete="new-password"
                                    />
                                    <FormField
                                        label="Confirmar contraseña"
                                        id="nu-password-2"
                                        type="password"
                                        value={vinculoForm.data.nuevo_usuario.password_confirmation}
                                        onChange={(e) =>
                                            vinculoForm.setData('nuevo_usuario', {
                                                ...vinculoForm.data.nuevo_usuario,
                                                password_confirmation: e.target.value,
                                            })
                                        }
                                        autoComplete="new-password"
                                    />
                                    <RoleCheckboxesDelegado
                                        rolesDisponibles={rolesDisponibles}
                                        value={
                                            Array.isArray(vinculoForm.data.nuevo_usuario.roles)
                                                ? vinculoForm.data.nuevo_usuario.roles
                                                : []
                                        }
                                        onChange={(next) =>
                                            vinculoForm.setData('nuevo_usuario', {
                                                ...vinculoForm.data.nuevo_usuario,
                                                roles: next,
                                            })
                                        }
                                        error={vinculoForm.errors['nuevo_usuario.roles']}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label
                                        htmlFor="delegado-user-id"
                                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                                    >
                                        Usuario del sistema (inicio de sesión)
                                    </label>
                                    <select
                                        id="delegado-user-id"
                                        value={vinculoForm.data.user_id}
                                        onChange={(e) => vinculoForm.setData('user_id', e.target.value)}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-[13px] text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-800"
                                    >
                                        <option value="">— Sin usuario (desvincular) —</option>
                                        {usuariosParaVincular.map((u) => (
                                            <option key={u.id} value={String(u.id)}>
                                                {u.label}
                                            </option>
                                        ))}
                                    </select>
                                    {vinculoForm.errors.user_id && (
                                        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">
                                            {vinculoForm.errors.user_id}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-[11px] leading-relaxed text-zinc-400 dark:text-zinc-500">
                            Si vinculas usuario y empleado, el <strong className="font-medium text-zinc-600 dark:text-zinc-400">NUE</strong> del usuario
                            debe coincidir con el del empleado. El empleado debe pertenecer a una delegación ya asignada a este delegado (tabla de relación).
                        </p>
                        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                            <button
                                type="button"
                                onClick={() => setVincularDelegado(null)}
                                className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={vinculoForm.processing}
                                className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                            >
                                {vinculoForm.processing ? 'Guardando…' : 'Guardar vínculos'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            <ConfirmDeleteModal
                open={Boolean(deleteDelegado)}
                onClose={() => setDeleteDelegado(null)}
                message={
                    deleteDelegado
                        ? `¿Eliminar el delegado «${deleteDelegado.nombre_completo}»? Se quitarán sus vínculos con delegaciones.`
                        : ''
                }
                onConfirm={handleDeleteDelegado}
                processing={deletingDelegado}
            />
        </>
    );
}

DelegadosIndex.layout = createAdminPageLayout('Delegados');

export default DelegadosIndex;
