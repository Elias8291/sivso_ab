import AdminPageShell from '@/components/admin/AdminPageShell';
import DataTable from '@/components/admin/DataTable';
import FormField from '@/components/admin/FormField';
import Modal from '@/components/admin/Modal';
import { useAuthCan } from '@/hooks/useAuthCan';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

function money(value) {
    return value != null
        ? Number(value).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
        : '—';
}

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

function TabButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-full border px-4 py-2 text-[12px] font-semibold transition ${
                active
                    ? 'border-brand-gold/55 bg-brand-gold/[0.12] text-zinc-900 dark:border-brand-gold-soft/45 dark:bg-brand-gold-soft/[0.12] dark:text-zinc-50'
                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-300'
            }`}
        >
            {children}
        </button>
    );
}

function EditarProductoModal({ open, item, tipo, categorias: categoriasProp, onClose, onSaved }) {
    const [form, setForm] = useState({ clave: '', descripcion: '', categoria_id: '' });
    const [saving, setSaving] = useState(false);
    const [categorias, setCategorias] = useState(categoriasProp);
    const [showNuevaCat, setShowNuevaCat] = useState(false);
    const [nuevaCat, setNuevaCat] = useState({ codigo: '', nombre: '' });
    const [savingCat, setSavingCat] = useState(false);
    const [catError, setCatError] = useState('');

    useEffect(() => {
        setCategorias(categoriasProp);
    }, [categoriasProp]);

    useEffect(() => {
        if (!open || !item) return;
        setForm({
            clave: item.clave ?? '',
            descripcion: item.descripcion ?? '',
            categoria_id: item.categoria_id ? String(item.categoria_id) : '',
        });
        setShowNuevaCat(false);
        setNuevaCat({ codigo: '', nombre: '' });
        setCatError('');
    }, [open, item]);

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

    const guardarCategoria = async (e) => {
        e.preventDefault();
        setCatError('');
        setSavingCat(true);
        try {
            const res = await axios.post(route('categorias.store'), {
                codigo: nuevaCat.codigo,
                nombre: nuevaCat.nombre,
            });
            const creada = res.data.data;
            setCategorias((prev) => [...prev, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)));
            setForm((p) => ({ ...p, categoria_id: String(creada.id) }));
            setNuevaCat({ codigo: '', nombre: '' });
            setShowNuevaCat(false);
        } catch (err) {
            const msgs = err?.response?.data?.errors;
            if (msgs) {
                const first = Object.values(msgs)[0];
                setCatError(Array.isArray(first) ? first[0] : first);
            } else {
                setCatError('Error al guardar la categoría.');
            }
        } finally {
            setSavingCat(false);
        }
    };

    const detalles = useMemo(() => {
        if (!item) return [];
        const fields = [];
        if (tipo === 'licitado') {
            if (item.precio_unitario != null) fields.push({ label: 'Precio unitario', value: money(item.precio_unitario) });
            if (item.cantidad_propuesta) fields.push({ label: 'Cantidad', value: item.cantidad_propuesta });
            if (item.unidad) fields.push({ label: 'Unidad', value: item.unidad });
            if (item.marca) fields.push({ label: 'Marca', value: item.marca });
            if (item.proveedor) fields.push({ label: 'Proveedor', value: item.proveedor });
            if (item.medida) fields.push({ label: 'Medida', value: item.medida });
        } else {
            if (item.precio_unitario != null) fields.push({ label: 'Precio unitario', value: money(item.precio_unitario) });
            if (item.total != null) fields.push({ label: 'Total', value: money(item.total) });
            if (item.referencia_codigo) fields.push({ label: 'Referencia', value: item.referencia_codigo });
        }
        if (item.partida_especifica) fields.push({ label: 'Partida', value: item.partida_especifica });
        return fields;
    }, [item, tipo]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Editar producto ${tipo === 'licitado' ? 'licitado' : 'cotizado'}`}
            maxWidth="max-w-xl sm:max-w-2xl"
            footer={
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-zinc-300 px-4 py-2 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        Cancelar
                    </button>
                    <button
                        form="form-editar-producto"
                        type="submit"
                        disabled={saving}
                        className="rounded-lg bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            }
        >
            {detalles.length > 0 && (
                <dl className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-zinc-200/80 bg-zinc-50 px-4 py-3 sm:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900/30">
                    {detalles.map((d) => (
                        <div key={d.label}>
                            <dt className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{d.label}</dt>
                            <dd className="mt-0.5 text-[12px] tabular-nums text-zinc-700 dark:text-zinc-300">{d.value}</dd>
                        </div>
                    ))}
                </dl>
            )}
            <form id="form-editar-producto" onSubmit={submit} className="space-y-4">
                <FormField label="Clave" id="prod-clave">
                    <input
                        id="prod-clave"
                        value={form.clave}
                        onChange={(e) => setForm((p) => ({ ...p, clave: e.target.value }))}
                        placeholder="Clave"
                        className="block w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] text-zinc-800 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 dark:border-zinc-700 dark:text-zinc-200"
                        required
                    />
                </FormField>
                <FormField label="Descripción" id="prod-descripcion">
                    <textarea
                        id="prod-descripcion"
                        value={form.descripcion}
                        onChange={(e) => setForm((p) => ({ ...p, descripcion: e.target.value }))}
                        placeholder="Descripción del producto"
                        rows={4}
                        className="block w-full resize-y rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] leading-relaxed text-zinc-800 outline-none transition-colors focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 dark:border-zinc-700 dark:text-zinc-200"
                        required
                    />
                </FormField>
                <FormField label="Categoría" id="prod-categoria">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <select
                            id="prod-categoria"
                            value={form.categoria_id}
                            onChange={(e) => setForm((p) => ({ ...p, categoria_id: e.target.value }))}
                            className="flex-1 rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] dark:border-zinc-700 dark:text-zinc-200"
                        >
                            <option value="">Sin categoría</option>
                            {categorias.map((c) => (
                                <option key={c.id} value={c.id}>{c.nombre}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => { setShowNuevaCat((v) => !v); setCatError(''); }}
                            className="whitespace-nowrap rounded-lg border border-zinc-200 px-3 py-2 text-[12px] font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                            {showNuevaCat ? '✕ Cancelar' : '+ Nueva'}
                        </button>
                    </div>
                    {showNuevaCat && (
                        <div className="mt-3 rounded-lg border border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-800/60">
                            <p className="mb-3 text-[12px] font-semibold text-zinc-700 dark:text-zinc-300">Nueva categoría</p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <input
                                    value={nuevaCat.codigo}
                                    onChange={(e) => setNuevaCat((p) => ({ ...p, codigo: e.target.value }))}
                                    placeholder="Código"
                                    maxLength={40}
                                    className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-[13px] dark:border-zinc-600 sm:w-28"
                                />
                                <input
                                    value={nuevaCat.nombre}
                                    onChange={(e) => setNuevaCat((p) => ({ ...p, nombre: e.target.value }))}
                                    placeholder="Nombre"
                                    maxLength={120}
                                    className="flex-1 rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-[13px] dark:border-zinc-600"
                                />
                                <button
                                    type="button"
                                    disabled={savingCat || !nuevaCat.codigo.trim() || !nuevaCat.nombre.trim()}
                                    onClick={guardarCategoria}
                                    className="whitespace-nowrap rounded-md bg-zinc-900 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {savingCat ? 'Guardando...' : 'Agregar'}
                                </button>
                            </div>
                            {catError && <p className="mt-2 text-[12px] text-red-600 dark:text-red-400">{catError}</p>}
                        </div>
                    )}
                </FormField>
            </form>
        </Modal>
    );
}

export default function ProductosIndex({ anio, anios_disponibles = [], licitados = [], cotizados = [], categorias = [] }) {
    const [tab, setTab] = useState('licitados');
    const canGestionar = useAuthCan()('Gestionar productos');
    const [editing, setEditing] = useState(null);

    const openEdit = (item, tipo) => {
        setEditing({
            ...item,
            tipo,
            clave: tipo === 'licitado' ? (item.codigo_catalogo ?? '') : (item.clave ?? ''),
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
            {
                key: 'precio_unitario',
                header: 'Precio unit.',
                className: 'text-right',
                cellClassName: 'text-right tabular-nums',
                render: (row) => money(row.precio_unitario),
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
            {
                key: 'precio_unitario',
                header: 'Precio unit.',
                className: 'text-right',
                cellClassName: 'text-right tabular-nums',
                render: (row) => money(row.precio_unitario),
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
                </div>

                <div className="mb-3 flex items-center gap-2">
                    <TabButton active={tab === 'licitados'} onClick={() => setTab('licitados')}>
                        Licitados
                        <span className="ml-1.5 rounded-full bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-zinc-600 dark:bg-zinc-700/60 dark:text-zinc-400">
                            {licitados.length}
                        </span>
                    </TabButton>
                    <TabButton active={tab === 'cotizados'} onClick={() => setTab('cotizados')}>
                        Cotizados
                        <span className="ml-1.5 rounded-full bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-zinc-600 dark:bg-zinc-700/60 dark:text-zinc-400">
                            {cotizados.length}
                        </span>
                    </TabButton>
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
