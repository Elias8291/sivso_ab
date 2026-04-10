import axios from 'axios';
import { AlertTriangle, CheckCircle2, Package, RotateCcw, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { route } from 'ziggy-js';
import { Modal } from './Modal';

const moneyFmt = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMoney = (v) => moneyFmt.format(Number(v) || 0);

export function ModalAgregarProducto({ open, onClose, empleadoId, empleadoNombre, onAgregado }) {
    const [catalogo, setCatalogo]                   = useState([]);
    const [presupuestoTotal, setPresupuestoTotal]   = useState(0);
    const [presupuestoUsado, setPresupuestoUsado]   = useState(0);
    const [presupuestoDisp, setPresupuestoDisp]     = useState(0);
    const [loading, setLoading]                     = useState(false);
    const [error, setError]                         = useState('');
    const [saving, setSaving]                       = useState(false);
    const [selProducto, setSelProducto]             = useState('');
    const [busqueda, setBusqueda]                   = useState('');
    const [mensajeExito, setMensajeExito]           = useState('');

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setError(''); setMensajeExito(''); setSelProducto(''); setBusqueda('');
        axios.get(route('my-delegation.recurso-baja'))
            .then((r) => {
                setCatalogo(r.data?.data?.catalogo ?? []);
                setPresupuestoTotal(r.data?.data?.presupuesto_total ?? 0);
                setPresupuestoUsado(r.data?.data?.presupuesto_usado ?? 0);
                setPresupuestoDisp(r.data?.data?.presupuesto_disponible ?? 0);
            })
            .catch(() => setError('No se pudo cargar el catálogo.'))
            .finally(() => setLoading(false));
    }, [open]);

    const catalogoFiltrado = useMemo(() => {
        if (!busqueda.trim()) return catalogo;
        const t = busqueda.toLowerCase();
        return catalogo.filter((p) =>
            (p.descripcion ?? '').toLowerCase().includes(t) || (p.clave ?? '').toLowerCase().includes(t),
        );
    }, [catalogo, busqueda]);

    const productoSel = catalogo.find((c) => c.producto_cotizado_id === Number(selProducto));
    const precioSel   = productoSel?.precio_unitario ?? 0;

    const handleAgregar = async () => {
        if (!selProducto || !empleadoId) return;
        setSaving(true);
        setError(''); setMensajeExito('');
        try {
            const { data } = await axios.post(route('my-delegation.agregar-producto', empleadoId), {
                producto_cotizado_id: Number(selProducto),
            });
            const nuevoDisp = data.data?.presupuesto_disponible ?? Math.max(0, presupuestoDisp - precioSel);
            setPresupuestoDisp(nuevoDisp);
            setPresupuestoUsado((prev) => prev + precioSel);
            setSelProducto('');
            setMensajeExito(`${productoSel?.descripcion ?? 'Producto'} agregado.`);
            setTimeout(() => setMensajeExito(''), 3000);
            if (onAgregado) onAgregado(nuevoDisp);
        } catch (e) {
            setError(e?.response?.data?.message ?? 'Error al agregar el producto.');
        } finally {
            setSaving(false);
        }
    };

    const excedeSaldo = precioSel > 0 && precioSel > presupuestoDisp;

    return (
        <Modal open={open} onClose={onClose} maxWidthClass="max-w-lg">
            {/* Cabecera */}
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
                <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100">Agregar producto</h2>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">{empleadoNombre}</p>
                </div>
                <button type="button" onClick={onClose}
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
                    <X className="size-4" />
                </button>
            </div>

            <div className="mx-5 h-px bg-zinc-100 dark:bg-zinc-800 sm:mx-6" />

            {/* Cuerpo scrollable */}
            <div className="max-h-[min(65dvh,500px)] overflow-y-auto overscroll-y-contain px-5 py-4 sm:px-6">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RotateCcw className="size-5 animate-spin text-zinc-400" />
                    </div>
                ) : (
                    <>
                        {/* Presupuesto disponible */}
                        <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 px-3.5 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/30">
                            <Package className="size-4 shrink-0 text-zinc-400" strokeWidth={1.8} />
                            <div className="min-w-0 flex-1">
                                <p className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                                    <span className="tabular-nums font-bold text-zinc-900 dark:text-zinc-100">${fmtMoney(presupuestoDisp)}</span>{' '}
                                    disponible
                                </p>
                                {presupuestoTotal > 0 && (
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                                            <div
                                                className="h-full rounded-full bg-zinc-500 transition-all duration-500 dark:bg-zinc-400"
                                                style={{ width: `${Math.min(100, Math.round((presupuestoUsado / presupuestoTotal) * 100))}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-500">
                                            ${fmtMoney(presupuestoUsado)} / ${fmtMoney(presupuestoTotal)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {presupuestoDisp <= 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
                                <Package className="size-7 text-zinc-300 dark:text-zinc-600" strokeWidth={1.25} />
                                <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Sin presupuesto disponible</p>
                                <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
                                    Se ha utilizado todo el presupuesto de recurso de bajas.
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Buscador */}
                                <div className="mb-3">
                                    <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                                        Buscar en catálogo
                                    </label>
                                    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                                        <Search className="size-3.5 shrink-0 text-zinc-400" />
                                        <input
                                            type="text"
                                            value={busqueda}
                                            onChange={(e) => setBusqueda(e.target.value)}
                                            placeholder="Clave o descripción…"
                                            className="w-full border-0 bg-transparent p-0 text-[12px] text-zinc-800 outline-none placeholder:text-zinc-400 focus:ring-0 dark:text-zinc-200"
                                        />
                                    </div>
                                </div>

                                {/* Lista de productos */}
                                <div className="mb-4 max-h-48 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-700">
                                    {catalogoFiltrado.length === 0 ? (
                                        <p className="px-3 py-4 text-center text-[12px] text-zinc-400">Sin resultados.</p>
                                    ) : (
                                        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {catalogoFiltrado.map((p) => {
                                                const selected = selProducto === String(p.producto_cotizado_id);
                                                return (
                                                    <li key={p.producto_cotizado_id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelProducto(String(p.producto_cotizado_id))}
                                                            className={`w-full px-3 py-2 text-left text-[12px] transition ${
                                                                selected
                                                                    ? 'bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                                                                    : 'text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50'
                                                            }`}
                                                        >
                                                            <span className="flex items-center justify-between gap-2">
                                                                <span className="min-w-0 truncate">{p.descripcion}</span>
                                                                <span className="shrink-0 tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">${fmtMoney(p.precio_unitario)}</span>
                                                            </span>
                                                            <span className="mt-0.5 block font-mono text-[10px] text-zinc-400 dark:text-zinc-500">{p.clave}</span>
                                                        </button>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </>
                        )}

                        {error && (
                            <p className="mb-3 flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-600 ring-1 ring-rose-200/50 dark:bg-rose-950/20 dark:text-rose-400 dark:ring-rose-800/30">
                                <AlertTriangle className="size-4 shrink-0" /> {error}
                            </p>
                        )}
                        {mensajeExito && (
                            <div className="mb-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[12px] font-medium text-emerald-700 ring-1 ring-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-400 dark:ring-emerald-800/30">
                                <CheckCircle2 className="size-4 shrink-0" /> {mensajeExito}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Pie */}
            <div className="border-t border-zinc-100 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800 sm:px-6">
                {selProducto && precioSel > 0 && (
                    <p className={`mb-2 text-center text-[11px] font-medium tabular-nums ${excedeSaldo ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
                        Precio: ${fmtMoney(precioSel)}{excedeSaldo && ' — excede el presupuesto disponible'}
                    </p>
                )}
                <div className="flex gap-2">
                    <button
                        type="button"
                        disabled={!selProducto || saving || presupuestoDisp <= 0 || excedeSaldo}
                        onClick={handleAgregar}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-zinc-500/80 bg-white px-4 py-2.5 text-[13px] font-medium text-zinc-800 transition disabled:opacity-40 hover:bg-zinc-50 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/50"
                    >
                        {saving ? <RotateCcw className="size-4 animate-spin" /> : <Package className="size-4" strokeWidth={2} />}
                        {saving ? 'Agregando…' : 'Agregar producto'}
                    </button>
                    <button type="button" onClick={onClose}
                        className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-[13px] font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800">
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
