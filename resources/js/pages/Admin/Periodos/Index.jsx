import AdminPageShell from '@/components/admin/AdminPageShell';
import DataTable from '@/components/admin/DataTable';
import FormField from '@/components/admin/FormField';
import Modal from '@/components/admin/Modal';
import TablePagination from '@/components/admin/TablePagination';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { Plus, Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { route } from 'ziggy-js';

const columns = [
    { key: 'ejercicio', header: 'Ejercicio', className: 'w-28' },
    { key: 'nombre', header: 'Periodo' },
    { key: 'estado', header: 'Estado', className: 'w-36' },
    { key: 'fecha_inicio', header: 'Inicio', className: 'w-36' },
    { key: 'fecha_fin', header: 'Fin', className: 'w-36' },
];

function PeriodosIndex({ periodos, filters = {} }) {
    const puedeGestionar = useAuthCan()('Gestionar periodos');
    const [showCreate, setShowCreate] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const timeout = setTimeout(() => {
            router.get(
                route('periodos.index'),
                { search },
                { preserveState: true, preserveScroll: true, replace: true }
            );
        }, 300);

        return () => clearTimeout(timeout);
    }, [search]);

    const form = useForm({
        ejercicio: new Date().getFullYear().toString(),
        nombre: '',
        fecha_inicio: '',
        fecha_fin: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        form.post(route('periodos.store'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                form.reset();
            },
        });
    };

    return (
        <>
            <Head title="Periodos" />
            <AdminPageShell
                title="Periodos"
                description="Ejercicios y ventanas de vestuario. Los datos se cargarán desde la tabla de periodos cuando esté migrada al esquema SIVSO."
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
                <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm ring-1 ring-zinc-900/5 dark:bg-zinc-900/50 dark:ring-white/10">
                    <Search className="size-4 text-zinc-400 dark:text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Buscar periodo..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full border-0 bg-transparent p-0 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                    />
                </div>
                <DataTable
                    columns={columns}
                    rows={periodos.data}
                    keyExtractor={(row) => row.id ?? `${row.ejercicio}-${row.nombre}`}
                    emptyTitle="Sin periodos registrados"
                    emptyDescription="Cuando exista el modelo y los datos, aparecerán aquí. Por ahora la lista está vacía."
                    footer={periodos.last_page > 1 ? <TablePagination pagination={periodos} /> : null}
                />
            </AdminPageShell>

            <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo periodo">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label="Ejercicio"
                            id="periodo-ejercicio"
                            value={form.data.ejercicio}
                            onChange={(e) => form.setData('ejercicio', e.target.value)}
                            error={form.errors.ejercicio}
                            placeholder="2026"
                            required
                        />
                        <FormField
                            label="Nombre del periodo"
                            id="periodo-nombre"
                            value={form.data.nombre}
                            onChange={(e) => form.setData('nombre', e.target.value)}
                            error={form.errors.nombre}
                            placeholder="Ej. Primavera-Verano"
                            required
                        />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                            label="Fecha de inicio"
                            id="periodo-inicio"
                            type="date"
                            value={form.data.fecha_inicio}
                            onChange={(e) => form.setData('fecha_inicio', e.target.value)}
                            error={form.errors.fecha_inicio}
                            required
                        />
                        <FormField
                            label="Fecha de fin"
                            id="periodo-fin"
                            type="date"
                            value={form.data.fecha_fin}
                            onChange={(e) => form.setData('fecha_fin', e.target.value)}
                            error={form.errors.fecha_fin}
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
                            {form.processing ? 'Guardando…' : 'Crear periodo'}
                        </button>
                    </div>
                </form>
            </Modal>
        </>
    );
}

PeriodosIndex.layout = createAdminPageLayout('Periodos');

export default PeriodosIndex;
