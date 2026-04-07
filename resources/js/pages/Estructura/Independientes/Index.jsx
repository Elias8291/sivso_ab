import AdminPageShell from '@/components/admin/AdminPageShell';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import FormField from '@/components/admin/FormField';
import Modal from '@/components/admin/Modal';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
                        className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-[13px] font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                    >
                        <Plus className="size-4" />
                        Agregar
                    </button>
                ) : null}
            >
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900/30">
                    <Search className="size-4 text-zinc-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar codigo IND..."
                        className="w-full border-0 bg-transparent p-0 text-[13px] outline-none"
                    />
                </div>

                <div className="overflow-x-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                    <table className="min-w-[640px] w-full text-[12px]">
                        <thead>
                            <tr className="border-b border-zinc-200/70 dark:border-zinc-800">
                                <th className="px-3 py-2 text-left">Codigo</th>
                                <th className="px-3 py-2 text-left">UR referencia</th>
                                <th className="px-3 py-2 text-left">Dependencia</th>
                                <th className="px-3 py-2 text-right">Accion</th>
                            </tr>
                        </thead>
                        <tbody>
                            {independientes.data.map((row) => (
                                <tr key={row.codigo} className="border-b border-zinc-100/80 dark:border-zinc-800/60">
                                    <td className="px-3 py-2 font-mono">{row.codigo}</td>
                                    <td className="px-3 py-2">{row.ur_referencia ?? '—'}</td>
                                    <td className="px-3 py-2">{row.referencia_nombre ?? '—'}</td>
                                    <td className="px-3 py-2">
                                        <div className="flex justify-end gap-1.5">
                                            <Link
                                                href={route('my-delegation.index', { delegacion_codigo: row.codigo })}
                                                className="rounded-md border border-zinc-200 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                                            >
                                                Ver
                                            </Link>
                                            {puedeGestionar && (
                                                <>
                                                <button type="button" onClick={() => setShowEdit(row)} className="rounded-md border border-zinc-200 p-1.5 dark:border-zinc-700">
                                                    <Pencil className="size-3.5" />
                                                </button>
                                                <button type="button" onClick={() => setDeleteTarget(row)} className="rounded-md border border-zinc-200 p-1.5 dark:border-zinc-700">
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {independientes.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-3 py-6 text-center text-zinc-400">Sin registros</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
