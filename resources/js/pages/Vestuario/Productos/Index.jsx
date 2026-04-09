import AdminPageShell from '@/components/admin/AdminPageShell';
import DataTable from '@/components/admin/DataTable';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

function FiltroAnio({ anio, aniosDisponibles }) {
    return (
        <label className="flex items-center gap-2 text-[12px] text-zinc-600 dark:text-zinc-400">
            <span>Año</span>
            <select
                value={anio}
                onChange={(e) => {
                    router.get(
                        route('productos.index'),
                        { anio: Number(e.target.value) },
                        { preserveState: true, preserveScroll: true, replace: true },
                    );
                }}
                className="cursor-pointer rounded-lg border border-zinc-200 bg-zinc-50 py-1.5 pl-2.5 pr-7 text-[12px] font-medium text-zinc-800 shadow-sm outline-none transition-[border-color] focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-900/40"
            >
                {aniosDisponibles.map((a) => (
                    <option key={a} value={a}>
                        {a}
                    </option>
                ))}
            </select>
        </label>
    );
}

function EditarProductoModal({ open, item, tipo, categorias, onClose, onSaved }) {
    const [form, setForm] = useState({ clave: '', descripcion: '', categoria_id: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!open || !item) return;
        setForm({
            clave: item.clave ?? '',
            descripcion: item.descripcion ?? '',
            categoria_id: item.categoria_id ? String(item.categoria_id) : '',
        });
    }, [open, item]);

    if (!open || !item) return null;

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.patch(route('productos.update', { tipo, id: item.id }), {
                clave: form.clave,
                descripcion: form.descripcion,
                categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
            });
            onSaved();
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-zinc-900/40" onClick={onClose} />
            <form onSubmit={submit} className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
                <h3 className="mb-3 text-[14px] font-semibold text-zinc-900 dark:text-zinc-100">Editar producto</h3>
                <div className="space-y-3">
                    <input
                        value={form.clave}
                        onChange={(e) => setForm((p) => ({ ...p, clave: e.target.value }))}
                        placeholder="Clave"
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-800"
                        required
                    />
                    <input
                        value={form.descripcion}
                        onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                        placeholder="Descripcion"
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-800"
                        required
                    />
                    <select
                        value={form.categoria_id}
                        onChange={(e) => setForm((p) => ({ ...p, categoria_id: e.target.value }))}
                        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[12px] dark:border-zinc-700 dark:bg-zinc-800"
                    >
                        <option value="">Sin categoria</option>
                        {categorias.map((c) => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-[12px] dark:border-zinc-700">Cancelar</button>
                    <button type="submit" disabled={saving} className="rounded-lg bg-zinc-900 px-3 py-1.5 text-[12px] text-white dark:bg-zinc-100 dark:text-zinc-900">
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function ProductosIndex({ anio, anios_disponibles = [], licitados = [], cotizados = [], categorias = [] }) {
    const [tab, setTab] = useState('licitados');
    const canGestionar = useAuthCan()('Gestionar productos');
    const [editing, setEditing] = useState(null);

    const openEdit = (item, tipo) => {
        setEditing({
            id: item.id,
            tipo,
            clave: tipo === 'licitado' ? (item.codigo_catalogo ?? '') : (item.clave ?? ''),
            descripcion: item.descripcion ?? '',
            categoria_id: categorias.find((c) => c.nombre === item.categoria)?.id ?? '',
        });
    };

    const columnsLicitados = useMemo(
        () => [
            { key: 'codigo_catalogo', header: 'Clave', cellClassName: 'font-mono' },
            { key: 'descripcion', header: 'Descripción' },
            {
                key: 'categoria',
                header: 'Categoría',
                render: (row) => row.categoria || '—',
            },
            ...(canGestionar
                ? [
                      {
                          key: 'acciones',
                          render: (row) => (
                              <button
                                  type="button"
                                  onClick={() => openEdit(row, 'licitado')}
                                  className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] dark:border-zinc-700"
                              >
                                  Editar
                              </button>
                          ),
                      },
                  ]
                : []),
        ],
        [canGestionar],
    );

    const columnsCotizados = useMemo(
        () => [
            { key: 'clave', header: 'Clave', cellClassName: 'font-mono' },
            { key: 'descripcion', header: 'Descripción' },
            {
                key: 'categoria',
                header: 'Categoría',
                render: (row) => row.categoria || '—',
            },
            ...(canGestionar
                ? [
                      {
                          key: 'acciones',
                          render: (row) => (
                              <button
                                  type="button"
                                  onClick={() => openEdit(row, 'cotizado')}
                                  className="rounded-md border border-zinc-200 px-2 py-1 text-[11px] dark:border-zinc-700"
                              >
                                  Editar
                              </button>
                          ),
                      },
                  ]
                : []),
        ],
        [canGestionar],
    );

    return (
        <>
            <Head title="Productos" />
            <AdminPageShell
                title="Productos"
                description={<span className="tabular-nums">Consulta por año de productos licitados y cotizados</span>}
            >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <FiltroAnio anio={anio} aniosDisponibles={anios_disponibles} />
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        Licitados: {licitados.length} · Cotizados: {cotizados.length}
                    </span>
                </div>

                <div className="mb-3 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setTab('licitados')}
                        className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition ${
                            tab === 'licitados'
                                ? 'border-brand-gold/55 bg-brand-gold/[0.12] text-zinc-900 dark:border-brand-gold-soft/45 dark:bg-brand-gold-soft/[0.12] dark:text-zinc-50'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300'
                        }`}
                    >
                        Licitados
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('cotizados')}
                        className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition ${
                            tab === 'cotizados'
                                ? 'border-brand-gold/55 bg-brand-gold/[0.12] text-zinc-900 dark:border-brand-gold-soft/45 dark:bg-brand-gold-soft/[0.12] dark:text-zinc-50'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300'
                        }`}
                    >
                        Cotizados
                    </button>
                </div>

                {tab === 'licitados' ? (
                    <DataTable
                        columns={columnsLicitados}
                        rows={licitados}
                        keyExtractor={(row) => row.id}
                        emptyTitle="Sin productos licitados"
                        emptyDescription="No hay productos licitados para el año seleccionado."
                    />
                ) : (
                    <DataTable
                        columns={columnsCotizados}
                        rows={cotizados}
                        keyExtractor={(row) => row.id}
                        emptyTitle="Sin productos cotizados"
                        emptyDescription="No hay productos cotizados para el año seleccionado."
                    />
                )}
            </AdminPageShell>
            <EditarProductoModal
                open={!!editing}
                item={editing}
                tipo={editing?.tipo}
                categorias={categorias}
                onClose={() => setEditing(null)}
                onSaved={() => router.reload({ preserveScroll: true })}
            />
        </>
    );
}

ProductosIndex.layout = createAdminPageLayout('Productos');
