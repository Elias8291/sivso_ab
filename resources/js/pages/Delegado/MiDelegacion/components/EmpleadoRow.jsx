import { Link } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeftRight,
    Check,
    ChevronDown,
    Clock,
    Eye,
    Info,
    MoreHorizontal,
    Package,
    Pencil,
    RotateCcw,
    Shirt,
    X,
    XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { route } from 'ziggy-js';
import { ModalAccionEmpleado } from './ModalAccionEmpleado';
import { VestuarioPanel } from './VestuarioPanel';

/**
 * Tarjeta de un empleado en Mi Delegación.
 * Gestiona: vestuario accordion, solicitudes baja/cambio, edición de NUE, menú de acciones.
 */
export function EmpleadoRow({ empleado, delegaciones, anioActual, periodoAbierto = true, presupuestoBaja = 0, onAbrirAgregarProducto }) {
    const [vestuarioAbierto, setVestuarioAbierto]       = useState(false);
    const [modal, setModal]                             = useState(null);
    const [vestuario, setVestuario]                     = useState(empleado.vestuario);
    const [vestuarioCargando, setVestuarioCargando]     = useState(false);
    const [vestuarioFetchKey, setVestuarioFetchKey]     = useState(0);
    const [estadoDelegacion, setEstadoDelegacion]       = useState(empleado.estado_delegacion || 'activo');
    const [obsDelegacion, setObsDelegacion]             = useState(empleado.observacion_delegacion || '');
    const [solicitudPendiente, setSolicitudPendiente]   = useState(empleado.solicitud_pendiente ?? null);
    const [reactivando, setReactivando]                 = useState(false);
    const [nueLocal, setNueLocal]                       = useState(empleado.nue ?? '');
    const [editandoNue, setEditandoNue]                 = useState(false);
    const [nueInput, setNueInput]                       = useState('');
    const [nueSaving, setNueSaving]                     = useState(false);
    const [nueError, setNueError]                       = useState('');
    const [masMenu, setMasMenu]                         = useState(false);
    const masWrapRef                                    = useRef(null);

    const cerrarModal = () => setModal(null);

    /* ── reactivar ── */
    const handleReactivar = async () => {
        setReactivando(true);
        try {
            await axios.patch(route('my-delegation.empleado.reactivar', empleado.id));
            setEstadoDelegacion('activo');
            setObsDelegacion('');
        } catch { /* sin acción */ } finally { setReactivando(false); }
    };

    /* ── NUE ── */
    const iniciarEdicionNue = () => { setNueInput(nueLocal || ''); setNueError(''); setEditandoNue(true); };
    const guardarNue = async () => {
        const v = nueInput.trim();
        if (!v) { setNueError('Ingresa un NUE.'); return; }
        setNueSaving(true); setNueError('');
        try {
            const { data } = await axios.patch(route('my-delegation.empleado.nue', empleado.id), { nue: v });
            setNueLocal(data.data?.nue ?? v);
            setEditandoNue(false);
        } catch (e) {
            setNueError(e?.response?.data?.message ?? 'Error al guardar NUE.');
        } finally { setNueSaving(false); }
    };

    /* ── vestuario ── */
    const handlePrendaGuardada = useCallback((id, nuevaTalla, nuevaMedida) => {
        setVestuario((prev) => prev.map((v) =>
            v.id === id ? { ...v, talla: nuevaTalla, medida: nuevaMedida, estado: 'confirmado' } : v,
        ));
    }, []);

    /* ── solicitudes ── */
    const handleSolicitudEnviada = useCallback((tipo, obs, destino, solicitudId, meta = {}) => {
        setSolicitudPendiente({ id: solicitudId, tipo, delegacion_destino: destino, baja_modo: meta.baja_modo ?? null });
        cerrarModal();
    }, []);

    const handleCancelarSolicitud = async () => {
        if (!solicitudPendiente?.id) return;
        try {
            await axios.delete(route('my-delegation.solicitud.cancelar', solicitudPendiente.id));
            setSolicitudPendiente(null);
        } catch { /* sin acción */ }
    };

    /* ── cierre del menú flotante ── */
    useEffect(() => {
        if (!masMenu) return;
        const onDoc = (e) => { if (masWrapRef.current && !masWrapRef.current.contains(e.target)) setMasMenu(false); };
        const onKey = (e) => { if (e.key === 'Escape') setMasMenu(false); };
        document.addEventListener('click', onDoc, true);
        document.addEventListener('keydown', onKey);
        return () => { document.removeEventListener('click', onDoc, true); document.removeEventListener('keydown', onKey); };
    }, [masMenu]);

    /* ── carga del detalle de vestuario al abrir el accordion ── */
    useEffect(() => {
        if (!vestuarioAbierto) return;
        let cancelled = false;
        setVestuarioCargando(true);
        axios
            .get(route('my-delegation.empleado.vestuario', empleado.id))
            .then((r) => {
                if (cancelled) return;
                const list = r.data?.data?.vestuario;
                if (Array.isArray(list)) { setVestuario(list); setVestuarioFetchKey((k) => k + 1); }
            })
            .catch(() => { /* mantener lista previa */ })
            .finally(() => { if (!cancelled) setVestuarioCargando(false); });
        return () => { cancelled = true; };
    }, [vestuarioAbierto, empleado.id]);

    /* ── métricas locales ── */
    const tieneDetalle      = vestuario.length > 0;
    const totalPrendas      = tieneDetalle ? vestuario.length : (empleado.total_prendas ?? 0);
    const enBajaCount       = tieneDetalle ? vestuario.filter((v) => v.estado === 'baja').length : (empleado.bajas_vestuario ?? 0);
    const confirmadasOCambio = tieneDetalle
        ? vestuario.filter((v) => v.estado === 'confirmado' || v.estado === 'cambio').length
        : (empleado.confirmadas ?? 0);
    const requeridas        = totalPrendas - enBajaCount;
    const listos            = confirmadasOCambio;
    const completo          = tieneDetalle ? totalPrendas > 0 && confirmadasOCambio >= requeridas : empleado.vestuario_listo === true;
    const vestuarioListo    = empleado.vestuario_listo === true || completo;
    const pendienteVestuario = totalPrendas > 0 && !completo;

    const esBaja   = estadoDelegacion === 'baja';
    const esCambio = estadoDelegacion === 'cambio';

    /* ── permisos de acciones ── */
    const puedeAgregar      = !esBaja && periodoAbierto && presupuestoBaja > 0 && onAbrirAgregarProducto;
    const puedeTramites     = !esBaja && !solicitudPendiente;
    const puedeReactivar    = esCambio && !solicitudPendiente;
    const tieneMenuMas      = puedeAgregar || puedeTramites || puedeReactivar;

    /* ── estilos dinámicos ── */
    const cardCls = esBaja
        ? 'border-rose-200/50 bg-rose-50/20 dark:border-rose-900/25 dark:bg-rose-950/10'
        : esCambio
            ? 'border-zinc-200/80 bg-zinc-50/40 dark:border-zinc-800 dark:bg-zinc-950/25'
            : vestuarioListo
                ? 'border-zinc-200/80 border-l-[3px] border-l-stone-300/80 bg-stone-50/30 shadow-sm shadow-zinc-900/[0.02] hover:border-zinc-300/90 dark:border-zinc-800 dark:border-l-stone-600/50 dark:bg-zinc-950/35 dark:shadow-none dark:hover:border-zinc-700'
                : vestuarioAbierto
                    ? 'border-zinc-300/90 bg-white dark:border-zinc-600 dark:bg-zinc-950/50'
                    : 'border-zinc-200/70 bg-white hover:border-zinc-300/80 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:border-zinc-700';

    const avatarCls = esBaja
        ? 'bg-rose-50/90 text-rose-700/90 ring-1 ring-rose-100/80 dark:bg-rose-950/25 dark:text-rose-400/90 dark:ring-rose-900/30'
        : esCambio
            ? 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700'
            : vestuarioListo
                ? 'bg-stone-100/80 text-stone-700 ring-1 ring-stone-200/60 dark:bg-stone-800/50 dark:text-stone-300 dark:ring-stone-600/40'
                : 'bg-zinc-100 text-zinc-500 ring-1 ring-zinc-200/60 dark:bg-zinc-800/80 dark:text-zinc-400 dark:ring-zinc-700/80';

    return (
        <div className={`rounded-2xl border transition-colors ${cardCls}`}>

            {/* ── cabecera: datos del empleado + acciones ── */}
            <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                {/* avatar + datos */}
                <div className="flex min-w-0 flex-1 gap-3">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${avatarCls}`}>
                        {esBaja ? <XCircle className="size-4" strokeWidth={1.5} />
                            : esCambio ? <ArrowLeftRight className="size-4" strokeWidth={1.5} />
                            : empleado.nombre_completo.charAt(0)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                        {/* nombre + estado badge */}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`min-w-0 break-words text-[13px] font-medium leading-snug tracking-tight ${
                                esBaja ? 'text-rose-600/75 line-through decoration-rose-200/70 dark:text-rose-400/75' : 'text-zinc-800 dark:text-zinc-100'
                            }`}>
                                {empleado.nombre_completo}
                            </span>

                            {esBaja && (
                                <span className="inline-flex shrink-0 items-center rounded-full bg-rose-50/90 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-rose-700/85 dark:bg-rose-950/30 dark:text-rose-400/90">
                                    Baja
                                </span>
                            )}
                            {esCambio && (
                                <span className="inline-flex shrink-0 items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                    Cambio
                                </span>
                            )}
                            {!esBaja && !esCambio && (
                                <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${
                                    vestuarioListo
                                        ? 'bg-stone-100/90 text-stone-700 dark:bg-stone-800/60 dark:text-stone-300'
                                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/90 dark:text-zinc-400'
                                }`}>
                                    {vestuarioListo ? 'Actualizado' : `${listos}/${totalPrendas}`}
                                </span>
                            )}
                        </div>

                        {/* NUE */}
                        {nueLocal ? (
                            <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">{nueLocal}</p>
                        ) : editandoNue ? (
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="text"
                                    value={nueInput}
                                    onChange={(e) => { setNueInput(e.target.value); setNueError(''); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') guardarNue(); if (e.key === 'Escape') setEditandoNue(false); }}
                                    maxLength={15}
                                    placeholder="NUE"
                                    autoFocus
                                    className="w-24 rounded border border-zinc-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-zinc-800 outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
                                />
                                <button type="button" onClick={guardarNue} disabled={nueSaving}
                                    className="flex size-5 items-center justify-center rounded text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
                                    {nueSaving ? <RotateCcw className="size-3 animate-spin" /> : <Check className="size-3" strokeWidth={2.5} />}
                                </button>
                                <button type="button" onClick={() => setEditandoNue(false)}
                                    className="flex size-5 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                    <X className="size-3" strokeWidth={2} />
                                </button>
                                {nueError && <span className="text-[10px] text-rose-500">{nueError}</span>}
                            </div>
                        ) : (
                            <button type="button" onClick={iniciarEdicionNue}
                                className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-600/80 transition hover:text-amber-700 dark:text-amber-400/80 dark:hover:text-amber-300">
                                <Pencil className="size-2.5" strokeWidth={2} />
                                Sin NUE — asignar
                            </button>
                        )}

                        {obsDelegacion && (
                            <p className="break-words text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                                "{obsDelegacion}"
                            </p>
                        )}
                        {esBaja && !solicitudPendiente && (
                            <p className="mt-1 flex items-start gap-1.5 rounded-lg bg-rose-50/60 px-2.5 py-1.5 text-[10px] leading-snug text-rose-700/80 dark:bg-rose-950/20 dark:text-rose-400/90">
                                <Info className="mt-px size-3 shrink-0" strokeWidth={2} />
                                Sus productos y presupuesto quedan en la delegación y se pueden repartir entre los demás empleados.
                            </p>
                        )}
                    </div>
                </div>

                <div className="h-px bg-zinc-100/70 sm:hidden dark:bg-zinc-800/50" aria-hidden />

                {/* ── grupo de acciones ── */}
                <div className="flex w-full items-center justify-end gap-1 sm:w-auto sm:shrink-0">
                    {/* Vestuario accordion trigger */}
                    {!esBaja && (
                        <button
                            type="button"
                            onClick={() => { setMasMenu(false); setVestuarioAbierto((p) => !p); }}
                            title={periodoAbierto ? (pendienteVestuario ? 'Actualizar tallas' : 'Vestuario') : 'Consultar vestuario'}
                            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium transition ${
                                vestuarioAbierto
                                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                                    : periodoAbierto && pendienteVestuario
                                        ? 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                            }`}
                        >
                            <Shirt className="size-3.5" strokeWidth={1.75} />
                            <span className="hidden sm:inline">Vestuario</span>
                            {totalPrendas > 0 && <span className="tabular-nums text-[10px] opacity-60">{listos}/{totalPrendas}</span>}
                            <ChevronDown className={`size-3 opacity-50 transition-transform duration-150 ${vestuarioAbierto ? 'rotate-180' : ''}`} strokeWidth={2} />
                        </button>
                    )}

                    {/* Ver historial */}
                    <Link
                        href={route('my-delegation.empleado.show', empleado.id)}
                        title="Ver historial por año"
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                    >
                        <Eye className="size-3.5" strokeWidth={1.75} />
                        <span className="hidden sm:inline">Ver</span>
                    </Link>

                    {/* Menú "Más" */}
                    {tieneMenuMas && (
                        <div className="relative" ref={masWrapRef}>
                            <button
                                type="button"
                                aria-expanded={masMenu}
                                aria-haspopup="menu"
                                aria-label="Más acciones"
                                onClick={() => setMasMenu((m) => !m)}
                                className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                                <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
                                <span className="hidden sm:inline">Más</span>
                            </button>
                            {masMenu && (
                                <div
                                    role="menu"
                                    className="absolute right-0 z-40 mt-1 min-w-[13.5rem] rounded-xl border border-zinc-200/90 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                                >
                                    {puedeReactivar && (
                                        <button type="button" role="menuitem" disabled={reactivando}
                                            onClick={() => { setMasMenu(false); handleReactivar(); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-40 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                        >
                                            {reactivando ? <RotateCcw className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" strokeWidth={1.75} />}
                                            Reactivar empleado
                                        </button>
                                    )}
                                    {puedeTramites && (
                                        <>
                                            <button type="button" role="menuitem"
                                                onClick={() => { setMasMenu(false); setModal('cambio'); }}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-zinc-700 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                                            >
                                                <ArrowLeftRight className="size-3.5 shrink-0 opacity-70" strokeWidth={1.75} />
                                                Cambio de delegación
                                            </button>
                                            <button type="button" role="menuitem"
                                                onClick={() => { setMasMenu(false); setModal('baja'); }}
                                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
                                            >
                                                <XCircle className="size-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                                                Solicitar baja
                                            </button>
                                        </>
                                    )}
                                    {puedeAgregar && (
                                        <button type="button" role="menuitem"
                                            onClick={() => { setMasMenu(false); onAbrirAgregarProducto(empleado); }}
                                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-emerald-700 transition hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/25"
                                        >
                                            <Package className="size-3.5 shrink-0 opacity-80" strokeWidth={1.75} />
                                            Agregar con presupuesto de baja
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── solicitud pendiente ── */}
            {solicitudPendiente && (
                <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/35 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-2.5 text-[12px] leading-relaxed text-zinc-600 dark:text-zinc-400 sm:items-center">
                        <Clock className="mt-0.5 size-4 shrink-0 text-zinc-400 dark:text-zinc-500 sm:mt-0" strokeWidth={1.5} />
                        <span className="min-w-0 break-words">
                            Solicitud de{' '}
                            <span className="font-medium text-zinc-800 dark:text-zinc-200">
                                {solicitudPendiente.tipo === 'baja' && solicitudPendiente.baja_modo === 'sustitucion'
                                    ? 'baja con sustituto'
                                    : solicitudPendiente.tipo}
                            </span>{' '}
                            en revisión
                            {solicitudPendiente.delegacion_destino && (
                                <> · <span className="break-all font-mono text-[11px] sm:break-normal">{solicitudPendiente.delegacion_destino}</span></>
                            )}
                        </span>
                    </div>
                    <button type="button" onClick={handleCancelarSolicitud}
                        className="flex h-9 shrink-0 items-center justify-center gap-1 self-end rounded-full border border-zinc-200 bg-white px-3 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 sm:self-auto">
                        <X className="size-3.5" strokeWidth={2} /> Cancelar
                    </button>
                </div>
            )}

            {/* ── accordion de vestuario ── */}
            <div className={`grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none ${vestuarioAbierto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <VestuarioPanel
                        key={`${empleado.id}-${vestuarioFetchKey}`}
                        empleadoId={empleado.id}
                        vestuario={vestuario}
                        onPrendasGuardadas={handlePrendaGuardada}
                        anioActual={anioActual}
                        periodoAbierto={periodoAbierto}
                        loading={vestuarioCargando}
                    />
                </div>
            </div>

            {/* ── modales ── */}
            <ModalAccionEmpleado open={modal === 'baja'}   accion="baja"   empleado={empleado} delegaciones={delegaciones} onCerrar={cerrarModal} onGuardado={handleSolicitudEnviada} />
            <ModalAccionEmpleado open={modal === 'cambio'} accion="cambio" empleado={empleado} delegaciones={delegaciones} onCerrar={cerrarModal} onGuardado={handleSolicitudEnviada} />
        </div>
    );
}
