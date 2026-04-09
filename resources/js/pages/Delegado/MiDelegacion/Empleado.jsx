import AdminPageShell from '@/components/admin/AdminPageShell';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft,
    Package,
    RotateCcw,
    Tag,
} from 'lucide-react';
import { route } from 'ziggy-js';
import { useEffect, useMemo, useState } from 'react';

const fmt$ = (v) =>
    v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : null;

const TABS = [
    { id: 'licitados', label: 'Licitados' },
    { id: 'cotizados', label: 'Cotizados' },
    { id: 'categorias', label: 'Categorías' },
];

function EmpleadoPage({ empleado, anios_disponibles = [], anio_default }) {
    const [anio, setAnio] = useState(String(anio_default ?? ''));
    const [tab, setTab] = useState('licitados');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!empleado?.id) return;
        setLoading(true);
        setError('');
        axios
            .get(route('my-delegation.empleado.productos', empleado.id), {
                params: anio ? { anio: Number(anio) } : {},
            })
            .then((r) => {
                const payload = r.data?.data ?? null;
                setData(payload);
                if (payload?.anio != null && !anio) {
                    setAnio(String(payload.anio));
                }
                if (!payload?.licitados?.length && payload?.cotizados?.length) {
                    setTab('cotizados');
                }
            })
            .catch(() => setError('No se pudieron cargar los productos.'))
            .finally(() => setLoading(false));
    }, [empleado?.id, anio]);

    const resumenCategorias = useMemo(() => {
        if (!data) return [];
        const fuente = data.cotizados?.length ? data.cotizados : data.licitados ?? [];
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

    const lista = data ? (tab === 'licitados' ? data.licitados : tab === 'cotizados' ? data.cotizados : []) : [];

    const estadoBadge = empleado.estado_delegacion === 'baja'
        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
        : empleado.estado_delegacion === 'cambio'
            ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            : null;

    return (
        <>
            <Head title={empleado.nombre_completo} />
            <AdminPageShell>
                {/* Header */}
                <div className="mb-8 space-y-4">
                    <Link
                        href={route('my-delegation.index')}
                        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 transition hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                        <ArrowLeft className="size-3.5" strokeWidth={1.75} />
                        Mi Delegación
                    </Link>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                                    {empleado.nombre_completo}
                                </h1>
                                {estadoBadge && (
                                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${estadoBadge}`}>
                                        {empleado.estado_delegacion}
                                    </span>
                                )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                                {empleado.nue && <span className="font-mono">{empleado.nue}</span>}
                                {empleado.ur && <span>UR {empleado.ur}</span>}
                                {empleado.dependencia_nombre && <span>{empleado.dependencia_nombre}</span>}
                            </div>
                        </div>

                        {anios_disponibles.length > 1 && (
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Año</span>
                                <select
                                    value={anio}
                                    onChange={(e) => setAnio(e.target.value)}
                                    className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[13px] font-medium tabular-nums text-zinc-800 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
                                >
                                    {anios_disponibles.map((a) => (
                                        <option key={a} value={String(a)}>{a}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-zinc-200/80 dark:border-zinc-800">
                    <div className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                                    className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[12px] font-semibold transition ${
                                        active
                                            ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50'
                                            : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                                    }`}
                                >
                                    {label}
                                    {count != null && (
                                        <span className={`ml-1.5 tabular-nums text-[10px] font-medium ${active ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                            {count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="mt-4">
                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-20 text-[12px] text-zinc-400">
                            <RotateCcw className="size-4 animate-spin" /> Cargando…
                        </div>
                    )}

                    {error && (
                        <p className="rounded-xl bg-rose-50 px-4 py-3 text-[12px] text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
                            {error}
                        </p>
                    )}

                    {/* Categorías */}
                    {data && tab === 'categorias' && (
                        resumenCategorias.length === 0 ? (
                            <EmptyState icon={Tag} text="Sin clasificaciones registradas." />
                        ) : (
                            <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200/80 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50">
                                {resumenCategorias.map((cat, i) => {
                                    const pct = cat.total > 0 ? Math.round((cat.confirmadas / cat.total) * 100) : 0;
                                    return (
                                        <div key={`${cat.codigo}-${i}`} className="flex items-center gap-4 px-4 py-3.5">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">{cat.nombre}</p>
                                                {cat.codigo !== '__sin__' && (
                                                    <p className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{cat.codigo}</p>
                                                )}
                                            </div>
                                            <div className="hidden w-20 sm:block">
                                                <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                    <div
                                                        className="h-full rounded-full bg-zinc-400/50 transition-all duration-500 dark:bg-zinc-500/40"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="min-w-[1.5rem] text-right text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                                                {cat.total}
                                            </span>
                                            <span className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                                                {cat.confirmadas}/{cat.total}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}

                    {/* Licitados / Cotizados */}
                    {data && tab !== 'categorias' && lista.length === 0 && !loading && (
                        <EmptyState icon={Package} text={`Sin productos ${tab}.`} />
                    )}

                    {data && tab !== 'categorias' && lista.length > 0 && (
                        <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200/80 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/50">
                            {lista.map((p) => {
                                const clasifs = Array.isArray(p.clasificaciones) ? p.clasificaciones : [];
                                const confirmado = p.estado === 'confirmado';

                                const campos = tab === 'licitados'
                                    ? [
                                        ['Partida', p.numero_partida, false],
                                        ['Marca', p.marca, false],
                                        ['Unidad', p.unidad, false],
                                        ['Medida', p.medida, false],
                                        ['Proveedor', p.proveedor, false],
                                        ['P.U.', fmt$(p.precio_unitario), false],
                                        ['Cant.', p.cantidad_asignada, false],
                                        ['Talla', p.talla, true],
                                        ['Rubro', p.clave_rubro, true],
                                    ]
                                    : [
                                        ['Partida', p.numero_partida, false],
                                        ['Ref.', p.referencia, true],
                                        ['P.U.', fmt$(p.precio_unitario), false],
                                        ['Total', fmt$(p.total), false],
                                        ['Cant.', p.cantidad_asignada, false],
                                        ['Talla', p.talla, true],
                                        ['Medida', p.medida, false],
                                        ['Rubro', p.clave_rubro, true],
                                    ];

                                const camposValidos = campos.filter(([, v]) => v != null && v !== '');

                                return (
                                    <div key={p.asignacion_id} className="px-4 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-[12px] font-semibold leading-tight text-zinc-900 dark:text-zinc-100 [overflow-wrap:anywhere]">
                                                    {p.descripcion}
                                                </p>
                                                {p.codigo && (
                                                    <p className="mt-0.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{p.codigo}</p>
                                                )}
                                            </div>
                                            {tab === 'cotizados' && p.estado && (
                                                <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${
                                                    confirmado
                                                        ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                                                        : 'bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500'
                                                }`}>
                                                    {p.estado}
                                                </span>
                                            )}
                                        </div>

                                        {clasifs.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {clasifs.map((c, ci) => (
                                                    <span
                                                        key={`${p.asignacion_id}-${c.codigo}-${ci}`}
                                                        className="rounded-full border border-zinc-200/80 px-2 py-px text-[10px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
                                                    >
                                                        {c.nombre}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {camposValidos.length > 0 && (
                                            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
                                                {camposValidos.map(([label, value, mono], fi) => (
                                                    <span key={`${p.asignacion_id}-${label}-${fi}`} className="flex items-baseline gap-1 text-[11px]">
                                                        <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
                                                        <span className={`text-zinc-700 dark:text-zinc-300 ${mono ? 'font-mono' : ''}`}>{value}</span>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </AdminPageShell>
        </>
    );
}

function EmptyState({ icon: Icon, text }) {
    return (
        <div className="flex flex-col items-center gap-2.5 py-20 text-center">
            <Icon className="size-8 text-zinc-200 dark:text-zinc-700" strokeWidth={1.25} />
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">{text}</p>
        </div>
    );
}

EmpleadoPage.layout = (page) => (
    <AuthenticatedLayout
        header={
            <span className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
                Empleado
            </span>
        }
    >
        {page}
    </AuthenticatedLayout>
);

export default EmpleadoPage;
