import AdminPageShell from '@/components/admin/AdminPageShell';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    ArrowLeftRight,
    Check,
    FileDown,
    Package,
    Pencil,
    RotateCcw,
    Tag,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';

/* ── utilidades ──────────────────────────────────────────────────── */

/** PHP puede serializar listas como objeto JSON `{ "0": {...} }`; axios siempre debe recibir un array. */
function asListaProductos(v) {
    if (Array.isArray(v)) return v;
    if (v != null && typeof v === 'object') return Object.values(v);
    return [];
}

/* ── sub-componentes ──────────────────────────────────────────────── */

function EmptyState({ icon: Icon, text }) {
    return (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
            <Icon className="size-9 text-zinc-200 dark:text-zinc-700" strokeWidth={1.25} />
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">{text}</p>
        </div>
    );
}

/** Badge de estado de delegación */
function EstadoBadge({ estado }) {
    if (!estado || estado === 'activo') return null;
    if (estado === 'baja') {
        return (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:bg-rose-950/30 dark:text-rose-400">
                <XCircle className="size-3" strokeWidth={1.75} /> Baja
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            <ArrowLeftRight className="size-3" strokeWidth={1.75} /> Cambio
        </span>
    );
}

/** Edición inline del NUE — compacta para la zona de descripción */
function NueEditor({ empleadoId, nueInicial, onChange }) {
    const [editando, setEditando] = useState(false);
    const [input, setInput]       = useState('');
    const [saving, setSaving]     = useState(false);
    const [error, setError]       = useState('');

    const abrir  = () => { setInput(nueInicial || ''); setError(''); setEditando(true); };
    const cerrar = () => { setEditando(false); setError(''); };

    const guardar = async () => {
        const v = input.trim();
        if (!v) { setError('Ingresa el NUE.'); return; }
        setSaving(true); setError('');
        try {
            const { data } = await axios.patch(route('my-delegation.empleado.nue', empleadoId, false), { nue: v });
            onChange(data.data?.nue ?? v);
            setEditando(false);
        } catch (e) {
            setError(e?.response?.data?.message ?? 'Error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    if (editando) {
        return (
            <span className="inline-flex flex-col gap-1">
                <span className="inline-flex items-center gap-1.5">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => { setInput(e.target.value); setError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') guardar(); if (e.key === 'Escape') cerrar(); }}
                        maxLength={15}
                        placeholder="NUE"
                        autoFocus
                        className="w-28 rounded-lg border border-zinc-300 bg-white px-2.5 py-1 font-mono text-[12px] text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                    <button type="button" onClick={guardar} disabled={saving}
                        className="flex size-6 items-center justify-center rounded-md bg-zinc-900 text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
                        {saving ? <RotateCcw className="size-3 animate-spin" /> : <Check className="size-3" strokeWidth={2.5} />}
                    </button>
                    <button type="button" onClick={cerrar}
                        className="flex size-6 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                        <X className="size-3" strokeWidth={2} />
                    </button>
                </span>
                {error && <span className="text-[10px] text-rose-500">{error}</span>}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5">
            {nueInicial
                ? <span className="font-mono text-[13px] text-zinc-700 dark:text-zinc-300">{nueInicial}</span>
                : <span className="text-[12px] italic text-zinc-400 dark:text-zinc-500">Sin NUE</span>
            }
            <button type="button" onClick={abrir} title="Editar NUE"
                className="flex size-5 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200">
                <Pencil className="size-3" strokeWidth={2} />
            </button>
        </span>
    );
}

/** Tarjeta numerada de un producto (licitado o cotizado) */
function ProductoCard({ p, tipo, numero }) {
    const clasifs    = Array.isArray(p.clasificaciones) ? p.clasificaciones : [];
    const confirmado = p.estado === 'confirmado';

    const campos = [
        ['Partida',   p.numero_partida,    false],
        ['Marca',     p.marca,             false],
        ['Unidad',    p.unidad,            false],
        ['Proveedor', p.proveedor,         false],
        ['Cant.',     p.cantidad_asignada, false],
        ['Talla',     p.talla,             true ],
        ['Medida',    p.medida,            false],
        ['Rubro',     p.clave_rubro,       true ],
    ];

    const validos = campos.filter(([, v]) => v != null && v !== '');

    return (
        <div className="flex gap-4 px-4 py-4">
            {/* Número */}
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <span className="text-[10px] font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">{numero}</span>
            </div>

            {/* Contenido */}
            <div className="min-w-0 flex-1">
                {/* Descripción + código + estado */}
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold leading-snug text-zinc-900 dark:text-zinc-100 [overflow-wrap:anywhere]">
                            {p.descripcion}
                        </p>
                        {p.codigo && (
                            <p className="mt-0.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{p.codigo}</p>
                        )}
                    </div>
                    {tipo === 'cotizados' && p.estado && (
                        <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
                            confirmado
                                ? 'bg-stone-100 text-stone-700 dark:bg-stone-800/50 dark:text-stone-300'
                                : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}>
                            {p.estado}
                        </span>
                    )}
                </div>

                {/* Clasificaciones */}
                {clasifs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {clasifs.map((c, ci) => (
                            <span key={`${p.asignacion_id}-${c.codigo}-${ci}`}
                                className="rounded-full border border-zinc-200/80 bg-zinc-50 px-2 py-px text-[10px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-400">
                                {c.nombre}
                            </span>
                        ))}
                    </div>
                )}

                {/* Campos de detalle en grid */}
                {validos.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2.5 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 sm:grid-cols-3 lg:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-900/20">
                        {validos.map(([label, value, mono], fi) => (
                            <div key={`${p.asignacion_id}-${label}-${fi}`} className="min-w-0">
                                <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{label}</p>
                                <p className={`mt-0.5 truncate text-[12px] text-zinc-700 dark:text-zinc-300 ${mono ? 'font-mono' : ''}`}>
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ── Página principal ────────────────────────────────────────────── */

const TABS = [
    { id: 'licitados',  label: 'Licitados'  },
    { id: 'cotizados',  label: 'Cotizados'  },
    { id: 'categorias', label: 'Categorías' },
];

function EmpleadoPage({ empleado: empleadoProp, anios_disponibles = [], anio_default }) {
    const [empleado, setEmpleado] = useState(empleadoProp);
    const [anio, setAnio]         = useState(String(anio_default ?? ''));
    const [tab, setTab]           = useState('licitados');
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState('');

    useEffect(() => {
        if (!empleado?.id) return;
        setLoading(true);
        setError('');
        const url = `/mi-delegacion/empleado/${encodeURIComponent(String(empleado.id))}/productos`;
        axios
            .get(url, {
                params: anio ? { anio: Number(anio) } : {},
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            })
            .then((r) => {
                const raw = r.data?.data ?? r.data ?? null;
                if (!raw || typeof raw !== 'object') {
                    setData(null);
                    return;
                }
                const payload = {
                    ...raw,
                    licitados: asListaProductos(raw.licitados),
                    cotizados: asListaProductos(raw.cotizados),
                };
                setData(payload);
                if (payload.anio != null && String(payload.anio) !== anio) setAnio(String(payload.anio));
                if (!payload.licitados.length && payload.cotizados.length) setTab('cotizados');
            })
            .catch(() => setError('No se pudieron cargar los productos.'))
            .finally(() => setLoading(false));
    }, [empleado?.id, anio]);

    const resumenCategorias = useMemo(() => {
        if (!data) return [];
        const cot = data.cotizados ?? [];
        const lic = data.licitados ?? [];
        const fuente = cot.length ? cot : lic;
        const mapa = new Map();
        fuente.forEach((p) => {
            (p.clasificaciones ?? []).forEach((c) => {
                const entry = mapa.get(c.codigo) ?? { codigo: c.codigo, nombre: c.nombre, total: 0, confirmadas: 0 };
                entry.total += 1;
                if (p.estado === 'confirmado') entry.confirmadas += 1;
                mapa.set(c.codigo, entry);
            });
            if (!p.clasificaciones?.length) {
                const entry = mapa.get('__sin__') ?? { codigo: '__sin__', nombre: 'Sin clasificación', total: 0, confirmadas: 0 };
                entry.total += 1;
                if (p.estado === 'confirmado') entry.confirmadas += 1;
                mapa.set('__sin__', entry);
            }
        });
        return [...mapa.values()].sort((a, b) => b.total - a.total);
    }, [data]);

    const lista = !data
        ? []
        : tab === 'licitados'
            ? (data.licitados ?? [])
            : tab === 'cotizados'
                ? (data.cotizados ?? [])
                : [];

    return (
        <>
            <Head title={empleado.nombre_completo} />

            <AdminPageShell
                title={empleado.nombre_completo}
                description={
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-0.5">
                        <EstadoBadge estado={empleado.estado_delegacion} />
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500">NUE</span>
                        <NueEditor
                            empleadoId={empleado.id}
                            nueInicial={empleado.nue}
                            onChange={(nuevoNue) => setEmpleado((prev) => ({ ...prev, nue: nuevoNue }))}
                        />
                        {empleado.delegacion_codigo && (
                            <>
                                <span className="text-zinc-200 dark:text-zinc-700" aria-hidden>·</span>
                                <span className="text-[12px] font-mono text-zinc-500 dark:text-zinc-400">{empleado.delegacion_codigo}</span>
                            </>
                        )}
                        {empleado.ur && (
                            <>
                                <span className="text-zinc-200 dark:text-zinc-700" aria-hidden>·</span>
                                <span className="text-[12px] text-zinc-500 dark:text-zinc-400">UR {empleado.ur}</span>
                            </>
                        )}
                        {empleado.dependencia_nombre && (
                            <>
                                <span className="text-zinc-200 dark:text-zinc-700" aria-hidden>·</span>
                                <span className="text-[12px] text-zinc-500 dark:text-zinc-400">{empleado.dependencia_nombre}</span>
                            </>
                        )}
                    </div>
                }
                actions={
                    <a
                        href={route('my-delegation.empleado.acuse-pdf', empleado.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[12px] font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                        <FileDown className="size-3.5 shrink-0" strokeWidth={1.75} />
                        Acuse PDF
                    </a>
                }
            >
                {/* Volver */}
                <Link
                    href={route('my-delegation.index')}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                    <ArrowLeft className="size-3.5" strokeWidth={1.75} />
                    Volver a Mi Delegación
                </Link>

                {/* Selector de año */}
                {anios_disponibles.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                            Año
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                            {anios_disponibles.length === 1 ? (
                                <span className="rounded-lg bg-zinc-900 px-3 py-1 text-[12px] font-semibold tabular-nums text-white dark:bg-zinc-100 dark:text-zinc-900">
                                    {anios_disponibles[0]}
                                </span>
                            ) : (
                                anios_disponibles.map((a) => {
                                    const activo = String(a) === anio;
                                    return (
                                        <button
                                            key={a}
                                            type="button"
                                            onClick={() => setAnio(String(a))}
                                            className={`rounded-lg px-3 py-1 text-[12px] font-semibold tabular-nums transition ${
                                                activo
                                                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                                    : 'border border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                            }`}
                                        >
                                            {a}
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="-mt-2">
                    <div className="border-b border-zinc-200/80 dark:border-zinc-800">
                        <div className="-mb-px flex gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {TABS.map(({ id, label }) => {
                                const count = id === 'categorias'
                                    ? (data ? resumenCategorias.length : null)
                                    : (data?.[id]?.length ?? null);
                                const active = tab === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setTab(id)}
                                        className={`shrink-0 whitespace-nowrap border-b-2 px-4 py-2.5 text-[12px] font-semibold transition ${
                                            active
                                                ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50'
                                                : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                                        }`}
                                    >
                                        {label}
                                        {count != null && (
                                            <span className={`ml-1.5 tabular-nums text-[10px] ${active ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                                {count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="mt-4">
                        {loading && (
                            <div className="flex items-center justify-center gap-2 py-20 text-[12px] text-zinc-400">
                                <RotateCcw className="size-4 animate-spin" /> Cargando…
                            </div>
                        )}

                        {!loading && error && (
                            <p className="rounded-xl bg-rose-50 px-4 py-3 text-[12px] text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                                {error}
                            </p>
                        )}

                        {/* Categorías */}
                        {!loading && data && tab === 'categorias' && (
                            resumenCategorias.length === 0 ? (
                                <EmptyState icon={Tag} text="Sin clasificaciones registradas." />
                            ) : (
                                <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200/80 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50">
                                    {resumenCategorias.map((cat, i) => {
                                        const pct = cat.total > 0 ? Math.round((cat.confirmadas / cat.total) * 100) : 0;
                                        return (
                                            <div key={`${cat.codigo}-${i}`} className="flex items-center gap-4 px-4 py-3.5">
                                                {/* número */}
                                                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-[10px] font-semibold tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                                    {i + 1}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">{cat.nombre}</p>
                                                    {cat.codigo !== '__sin__' && (
                                                        <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{cat.codigo}</p>
                                                    )}
                                                </div>
                                                <div className="hidden w-24 sm:block">
                                                    <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                        <div
                                                            className="h-full rounded-full bg-zinc-400/50 transition-all duration-500 dark:bg-zinc-500/40"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-baseline gap-1 text-right">
                                                    <span className="text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{cat.total}</span>
                                                    <span className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">({cat.confirmadas} conf.)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )}

                        {/* Licitados / Cotizados */}
                        {!loading && data && tab !== 'categorias' && lista.length === 0 && (
                            <EmptyState icon={Package} text={`Sin productos ${tab} para este año.`} />
                        )}

                        {!loading && data && tab !== 'categorias' && lista.length > 0 && (
                            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200/80 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50">
                                {lista.map((p, idx) => (
                                    <ProductoCard key={p.asignacion_id} p={p} tipo={tab} numero={idx + 1} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </AdminPageShell>
        </>
    );
}

/* El header del layout usa un título estático fiable; el nombre del empleado
   aparece como <h1> dentro de AdminPageShell, que es el lugar correcto. */
EmpleadoPage.layout = (page) => (
    <AuthenticatedLayout
        header={
            <span className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
                Mi Delegación
            </span>
        }
    >
        {page}
    </AuthenticatedLayout>
);

export default EmpleadoPage;
