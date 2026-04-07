import AdminPageShell from '@/components/admin/AdminPageShell';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import CrudRowActions from '@/components/admin/CrudRowActions';
import DataTable from '@/components/admin/DataTable';
import FormField from '@/components/admin/FormField';
import Modal from '@/components/admin/Modal';
import TablePagination from '@/components/admin/TablePagination';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { route } from 'ziggy-js';

function IndependientesIndex({ independientes, dependenciasList = [], filters = {} }) {
    const can = useAuthCan();
    const puedeGestionar = can('Gestionar delegaciones');
    const [search, setSearch] = useState(filters.search || '');
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const first = useRef(true);

    const createForm = useForm({ codigo: '', ur_referencia: '' });
    const editForm = useForm({ ur_referencia: '' });

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get(route('independientes.index'), { search }, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        if (!showEdit) return;
        editForm.setData('ur_referencia', showEdit.ur_referencia != null ? String(showEdit.ur_referencia) : '');
    }, [showEdit]);

    const onCreate = (e) => {
        e.preventDefault();
        createForm.post(route('independientes.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
            },
        });
    };

    const onEdit = (e) => {
        e.preventDefault();
        if (!showEdit) return;
        editForm.patch(route('independientes.update', showEdit.codigo), {
            preserveScroll: true,
            onSuccess: () => setShowEdit(null),
        });
    };

    const onDelete = () => {
        if (!deleteTarget) return;
        router.delete(route('independientes.destroy', deleteTarget.codigo), {
            preserveScroll: true,
            onFinish: () => setDeleteTarget(null),
        });
    };

    const columns = useMemo(
        () => [
            { key: 'codigo', header: 'Código', cellClassName: 'font-mono text-xs' },
            { key: 'ur_referencia', header: 'UR referencia', cellClassName: 'font-mono text-xs' },
            {
                key: 'referencia_nombre',
                header: 'Dependencia',
                render: (row) => row.referencia_nombre || <span className="text-zinc-400">—</span>,
            },
            { key: 'total_empleados', header: 'Empleados', cellClassName: 'text-right tabular-nums' },
            { key: 'actualizados', header: 'Actualizados', cellClassName: 'text-right tabular-nums' },
            { key: 'faltan', header: 'Faltan', cellClassName: 'text-right tabular-nums' },
            {
                key: 'acciones',
                header: 'Acciones',
                render: (row) => (
                    <CrudRowActions
                        onView={() => router.visit(route('my-delegation.index', { delegacion_codigo: row.codigo, modo: 'independiente' }))}
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
            <Head title="Independientes" />
            <AdminPageShell
                title="Independientes (IND-UR)"
                description="Catalogo de codigos independientes tipo IND-101, IND-102."
                actions={puedeGestionar ? (
                    <button
                        type="button"
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        <Plus className="size-4" />
                        Agregar
                    </button>
                ) : null}
            >
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                    <Search className="size-4 text-zinc-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar codigo IND..."
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>

                <DataTable
                    columns={columns}
                    rows={independientes.data}
                    keyExtractor={(row) => row.codigo}
                    emptyTitle="Sin independientes"
                    emptyDescription="No hay códigos independientes o el filtro actual no devuelve resultados."
                    footer={independientes.last_page > 1 ? <TablePagination pagination={independientes} /> : null}
                />
            </AdminPageShell>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo independiente">
                <form onSubmit={onCreate} className="space-y-3">
                    <FormField label="Codigo" id="ind-codigo" value={createForm.data.codigo} onChange={(e) => createForm.setData('codigo', e.target.value.toUpperCase())} placeholder="IND-101" required />
                    <FormField label="UR referencia" id="ind-ur">
                        <select
                            id="ind-ur"
                            value={createForm.data.ur_referencia}
                            onChange={(e) => createForm.setData('ur_referencia', e.target.value)}
                            className="block w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] dark:border-zinc-700"
                        >
                            <option value="">Sin referencia</option>
                            {dependenciasList.map((dep) => <option key={dep.ur} value={dep.ur}>{dep.ur} — {dep.nombre_corto || dep.nombre}</option>)}
                        </select>
                    </FormField>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg px-4 py-2 text-[13px]">Cancelar</button>
                        <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] text-white dark:bg-zinc-100 dark:text-zinc-900">Guardar</button>
                    </div>
                </form>
            </Modal>

            <Modal open={Boolean(showEdit)} onClose={() => setShowEdit(null)} title="Editar independiente">
                {showEdit && (
                    <form onSubmit={onEdit} className="space-y-3">
                        <p className="text-[12px] text-zinc-500">Codigo: <span className="font-mono">{showEdit.codigo}</span></p>
                        <FormField label="UR referencia" id="ind-edit-ur">
                            <select
                                id="ind-edit-ur"
                                value={editForm.data.ur_referencia}
                                onChange={(e) => editForm.setData('ur_referencia', e.target.value)}
                                className="block w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] dark:border-zinc-700"
                            >
                                <option value="">Sin referencia</option>
                                {dependenciasList.map((dep) => <option key={dep.ur} value={dep.ur}>{dep.ur} — {dep.nombre_corto || dep.nombre}</option>)}
                            </select>
                        </FormField>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowEdit(null)} className="rounded-lg px-4 py-2 text-[13px]">Cancelar</button>
                            <button type="submit" className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] text-white dark:bg-zinc-100 dark:text-zinc-900">Guardar</button>
                        </div>
                    </form>
                )}
            </Modal>

            <ConfirmDeleteModal
                open={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                message={deleteTarget ? `¿Eliminar ${deleteTarget.codigo}?` : ''}
                onConfirm={onDelete}
                processing={false}
            />
        </>
    );
}

IndependientesIndex.layout = createAdminPageLayout('Independientes');
export default IndependientesIndex;
