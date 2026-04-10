import axios from 'axios';
import { AlertTriangle, ArrowLeftRight, RotateCcw, Users, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { route } from 'ziggy-js';
import { Modal } from './Modal';

const MODAL_CFG = {
    baja: {
        iconBg:   'bg-stone-100/80 dark:bg-zinc-800',
        iconClr:  'text-stone-500 dark:text-zinc-400',
        warnBg:   'bg-stone-50/95 dark:bg-zinc-900/50',
        warnRing: 'ring-stone-200/45 dark:ring-zinc-700/80',
        warnTxt:  'text-stone-600 dark:text-zinc-400',
        inputCls: 'border-stone-200/80 bg-white focus:border-stone-400/90 focus:ring-stone-200/30 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500',
        btnCls:   'border-2 border-stone-500/75 bg-white text-stone-800 hover:bg-stone-50/90 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/50',
        icon:     <XCircle className="size-5" strokeWidth={1.8} />,
        title:    'Solicitar baja',
        label:    'Motivo de baja',
        ph:       'Ej. Renuncia voluntaria, licencia médica indefinida, jubilación…',
        btnLbl:   'Enviar solicitud',
        warn: (
            <>
                Elige si la baja es <strong className="font-semibold text-stone-700 dark:text-zinc-200">definitiva</strong> o si <strong className="font-semibold text-stone-700 dark:text-zinc-200">llega una persona en su lugar</strong>.
                En ambos casos se envía una <strong className="font-semibold text-stone-700 dark:text-zinc-200">solicitud</strong> a S.Administración; con sustituto incluye nombre y sexo (hombre/mujer) para el vestuario del nuevo empleado.
            </>
        ),
    },
    cambio: {
        iconBg:   'bg-zinc-100 dark:bg-zinc-800',
        iconClr:  'text-zinc-600 dark:text-zinc-400',
        warnBg:   'bg-zinc-50 dark:bg-zinc-900/50',
        warnRing: 'ring-zinc-200/80 dark:ring-zinc-700/80',
        warnTxt:  'text-zinc-600 dark:text-zinc-400',
        inputCls: 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-200/40 dark:border-zinc-700 dark:focus:border-zinc-500',
        selectCls:'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-200/40 dark:border-zinc-700 dark:focus:border-zinc-500',
        btnCls:   'border-2 border-zinc-500/80 bg-white text-zinc-800 hover:bg-zinc-50/90 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/50',
        icon:     <ArrowLeftRight className="size-5" strokeWidth={1.8} />,
        title:    'Solicitar cambio de delegación',
        label:    'Nota del cambio',
        ph:       'Ej. Asignado a nuevas funciones, cambio de área…',
        btnLbl:   'Enviar solicitud',
        warn: (
            <>
                Se enviará una <strong className="font-semibold">solicitud de cambio</strong> a S.Administración.
                Si el destino es de la misma UR, el recurso acompaña automáticamente al empleado.
                Si cambia de UR, la decisión de recurso y prendas se toma en Solicitudes.
                El movimiento se ejecuta hasta que sea aprobado.
            </>
        ),
    },
};

export function ModalAccionEmpleado({ open, accion, empleado, delegaciones = [], onCerrar, onGuardado }) {
    const [obs, setObs]                         = useState('');
    const [nuevaDelegacion, setNuevaDelegacion] = useState('');
    const [bajaModo, setBajaModo]               = useState('definitiva');
    const [sustNombre, setSustNombre]           = useState('');
    const [sustApPat, setSustApPat]             = useState('');
    const [sustApMat, setSustApMat]             = useState('');
    const [sustNue, setSustNue]                 = useState('');
    const [sustSexo, setSustSexo]               = useState('M');
    const [saving, setSaving]                   = useState(false);
    const [error, setError]                     = useState('');

    const delegacionesDisponibles = delegaciones.filter((d) => d.codigo !== empleado?.delegacion_codigo);

    useEffect(() => {
        if (open) {
            setObs(''); setNuevaDelegacion(''); setError('');
            setBajaModo('definitiva');
            setSustNombre(''); setSustApPat(''); setSustApMat(''); setSustNue(''); setSustSexo('M');
        }
    }, [open]);

    const cfg     = MODAL_CFG[accion] ?? MODAL_CFG.baja;
    const esBajaUi = accion === 'baja';

    const guardar = async () => {
        if (accion === 'cambio' && !nuevaDelegacion) {
            setError('Debes seleccionar la delegación destino.');
            return;
        }
        if (accion === 'baja' && bajaModo === 'sustitucion') {
            if (!sustNombre.trim() || !sustApPat.trim()) {
                setError('Indica nombre y primer apellido de quien llega en su lugar.');
                return;
            }
        }
        setError('');
        setSaving(true);
        try {
            const payload = {
                tipo:             accion,
                observacion:      obs || null,
                nueva_delegacion: accion === 'cambio' ? nuevaDelegacion : undefined,
            };
            if (accion === 'baja') {
                payload.baja_modo = bajaModo;
                if (bajaModo === 'sustitucion') {
                    payload.sustituto = {
                        nombre:            sustNombre.trim(),
                        apellido_paterno:  sustApPat.trim(),
                        apellido_materno:  sustApMat.trim() || '',
                        nue:               sustNue.trim() || null,
                        sexo:              sustSexo,
                    };
                }
            }
            const { data } = await axios.post(route('my-delegation.solicitar', empleado?.id), payload);
            onGuardado(accion, obs, nuevaDelegacion, data.data?.solicitud_id, { baja_modo: accion === 'baja' ? bajaModo : undefined });
        } catch (e) {
            setError(e?.response?.data?.message ?? 'No se pudo enviar la solicitud.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal open={open} onClose={onCerrar} maxWidthClass={esBajaUi ? 'max-w-2xl' : 'max-w-lg'} tone={esBajaUi ? 'bajaSoft' : 'default'}>
            {/* Cabecera */}
            <div className={`flex items-start justify-between gap-3 px-6 pb-4 pt-6 ${esBajaUi ? 'sm:px-8' : ''}`}>
                <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg}`}>
                        <span className={cfg.iconClr}>{cfg.icon}</span>
                    </div>
                    <div className="min-w-0">
                        <h2 className={`text-[15px] font-bold ${esBajaUi ? 'text-stone-800 dark:text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
                            {cfg.title}
                        </h2>
                        <p className={`mt-0.5 truncate text-[11px] ${esBajaUi ? 'text-stone-500 dark:text-zinc-400' : 'max-w-[210px] text-zinc-500 dark:text-zinc-400'}`}>
                            {empleado?.nombre_completo}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onCerrar}
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl transition dark:hover:bg-zinc-800 dark:hover:text-zinc-300 ${esBajaUi ? 'text-stone-400 hover:bg-stone-100 hover:text-stone-600' : 'text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600'}`}
                >
                    <X className="size-4" />
                </button>
            </div>

            <div className={`mx-6 h-px sm:mx-8 ${esBajaUi ? 'bg-stone-100 dark:bg-zinc-800' : 'bg-zinc-100 dark:bg-zinc-800'}`} />

            {/* Cuerpo */}
            <div className={`px-6 py-5 ${esBajaUi ? 'sm:px-8' : ''}`}>
                {/* Aviso */}
                <div className={`mb-5 flex items-start gap-3 rounded-lg px-4 py-3 ring-1 ${cfg.warnBg} ${cfg.warnRing}`}>
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${cfg.iconClr}`} />
                    <p className={`text-[12px] leading-snug ${cfg.warnTxt}`}>{cfg.warn}</p>
                </div>

                {/* Modalidad de baja */}
                {accion === 'baja' && (
                    <div className="mb-5 space-y-3">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 dark:text-zinc-500">Modalidad</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {[
                                { key: 'definitiva', lbl: 'Baja definitiva', sub: 'No hay relevo en el puesto' },
                                { key: 'sustitucion', lbl: 'Llega otra persona', sub: 'Se solicita alta del sustituto' },
                            ].map(({ key, lbl, sub }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => { setBajaModo(key); setError(''); }}
                                    className={`rounded-xl px-3 py-2.5 text-left text-[12px] font-medium transition ${
                                        bajaModo === key
                                            ? 'border-2 border-stone-500/75 bg-white text-stone-800 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100'
                                            : 'border border-stone-200/90 bg-stone-50/70 text-stone-700 hover:border-stone-300/90 hover:bg-stone-100/80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
                                    }`}
                                >
                                    {lbl}
                                    <span className="mt-0.5 block text-[10px] font-normal opacity-90">{sub}</span>
                                </button>
                            ))}
                        </div>

                        {bajaModo === 'sustitucion' && (
                            <div className="space-y-3 rounded-xl border border-stone-200/60 bg-stone-50/70 p-4 dark:border-zinc-700/80 dark:bg-zinc-900/30">
                                <div className="flex items-center gap-2 text-[11px] font-medium text-stone-600 dark:text-zinc-400">
                                    <Users className="size-3.5 shrink-0 opacity-80" strokeWidth={2} />
                                    Datos de quien llega (van a la solicitud)
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-[10px] font-medium text-stone-500 dark:text-zinc-500">
                                            Nombre <span className="text-stone-700 dark:text-zinc-200">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={sustNombre}
                                            onChange={(e) => setSustNombre(e.target.value)}
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-stone-800 outline-none dark:bg-zinc-900 dark:text-zinc-200 ${cfg.inputCls}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-medium text-stone-500 dark:text-zinc-500">
                                            Primer apellido <span className="text-stone-700 dark:text-zinc-200">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={sustApPat}
                                            onChange={(e) => setSustApPat(e.target.value)}
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-stone-800 outline-none dark:bg-zinc-900 dark:text-zinc-200 ${cfg.inputCls}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[10px] font-medium text-stone-500 dark:text-zinc-500">
                                            Segundo apellido
                                        </label>
                                        <input
                                            type="text"
                                            value={sustApMat}
                                            onChange={(e) => setSustApMat(e.target.value)}
                                            className={`w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-stone-800 outline-none dark:bg-zinc-900 dark:text-zinc-200 ${cfg.inputCls}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-[10px] font-medium text-stone-500 dark:text-zinc-500">
                                            NUE <span className="font-normal text-stone-400 dark:text-zinc-500">— opcional</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={sustNue}
                                            onChange={(e) => setSustNue(e.target.value)}
                                            maxLength={15}
                                            placeholder="Número de empleado único"
                                            className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-[13px] text-stone-800 outline-none placeholder:font-sans dark:bg-zinc-900 dark:text-zinc-200 ${cfg.inputCls}`}
                                            autoComplete="off"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <p className="mb-2 text-[10px] font-medium text-stone-500 dark:text-zinc-500">
                                            Sexo (vestuario) <span className="text-stone-700 dark:text-zinc-200">*</span>
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {[['M', 'Hombre'], ['F', 'Mujer']].map(([val, lbl]) => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setSustSexo(val)}
                                                    className={`rounded-full px-4 py-1.5 text-[12px] font-medium transition ${
                                                        sustSexo === val
                                                            ? 'border-2 border-stone-500/75 bg-white text-stone-800 dark:border-zinc-400/90 dark:bg-zinc-950/40 dark:text-zinc-100'
                                                            : 'border border-stone-200/90 bg-white/80 text-stone-600 hover:border-stone-300/80 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400'
                                                    }`}
                                                >
                                                    {lbl}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Selector de delegación destino */}
                {accion === 'cambio' && (
                    <div className="mb-5">
                        <label className="mb-2 block text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                            Delegación destino <span className="text-zinc-700 dark:text-zinc-300">*</span>
                        </label>
                        {delegacionesDisponibles.length === 0 ? (
                            <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-[12px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-400">
                                No hay delegaciones destino disponibles.
                            </p>
                        ) : (
                            <select
                                value={nuevaDelegacion}
                                onChange={(e) => { setNuevaDelegacion(e.target.value); setError(''); }}
                                className={`w-full rounded-lg border bg-zinc-50/60 px-4 py-2.5 text-[13px] text-zinc-800 outline-none transition-[border-color,box-shadow] focus:bg-zinc-100 focus:ring-2 dark:bg-zinc-800/40 dark:text-zinc-200 dark:focus:bg-zinc-800 ${cfg.selectCls}`}
                            >
                                <option value="">— Selecciona la delegación destino —</option>
                                {delegacionesDisponibles.map((d) => (
                                    <option key={d.codigo} value={d.codigo}>
                                        {d.codigo}{d.ur === empleado?.ur ? ' — Misma UR' : ` — UR ${d.ur ?? 'N/D'}`}
                                    </option>
                                ))}
                            </select>
                        )}
                        {error && accion === 'cambio' && (
                            <p className="mt-1.5 text-[11px] font-medium text-rose-500 dark:text-rose-400">{error}</p>
                        )}
                    </div>
                )}

                {/* Observación */}
                <div className="mb-6">
                    <label className={`mb-2 block text-[11px] font-semibold uppercase tracking-widest dark:text-zinc-500 ${esBajaUi ? 'text-stone-400' : 'text-zinc-400'}`}>
                        {cfg.label}
                        <span className={`ml-1.5 font-normal normal-case tracking-normal ${esBajaUi ? 'text-stone-400/90' : 'text-zinc-400'}`}> — opcional</span>
                    </label>
                    <textarea
                        value={obs}
                        onChange={(e) => setObs(e.target.value)}
                        rows={2}
                        maxLength={255}
                        placeholder={cfg.ph}
                        className={`w-full resize-none rounded-lg border px-4 py-3 text-[13px] outline-none transition-[border-color,box-shadow] focus:ring-2 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:bg-zinc-800 ${esBajaUi
                            ? 'border-stone-200/80 bg-white text-stone-800 placeholder:text-stone-400/80 focus:bg-stone-50/50 focus:ring-stone-200/35 dark:border-zinc-700 dark:bg-zinc-800/40 dark:focus:bg-zinc-800'
                            : 'bg-zinc-50/60 text-zinc-800 placeholder:text-zinc-400 focus:bg-zinc-100 dark:bg-zinc-800/40 dark:focus:bg-zinc-800'} ${cfg.inputCls}`}
                    />
                    <p className={`mt-1 text-right text-[10px] tabular-nums ${esBajaUi ? 'text-stone-400 dark:text-zinc-500' : 'text-zinc-400'}`}>{obs.length}/255</p>
                </div>

                {error && (
                    <p className={`mb-4 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-medium dark:bg-rose-900/20 dark:text-rose-400 dark:ring-rose-800/30 ${esBajaUi
                        ? 'bg-rose-50/90 text-rose-600/95 ring-1 ring-rose-200/40'
                        : 'bg-rose-50 text-rose-600 ring-1 ring-rose-200/50'}`}
                    >
                        <AlertTriangle className="size-4 shrink-0" /> {error}
                    </p>
                )}

                {/* Botones */}
                <div className="flex flex-col-reverse gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:pb-0">
                    <button
                        type="button"
                        onClick={guardar}
                        disabled={saving}
                        className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-opacity disabled:opacity-50 ${cfg.btnCls}`}
                    >
                        {saving ? <RotateCcw className="size-4 animate-spin" /> : cfg.icon}
                        {saving ? 'Enviando…' : cfg.btnLbl}
                    </button>
                    <button
                        type="button"
                        onClick={onCerrar}
                        className={`rounded-lg border px-4 py-2.5 text-[13px] font-medium sm:shrink-0 ${esBajaUi
                            ? 'border-stone-200/90 bg-stone-50/90 text-stone-600 hover:bg-stone-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'
                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400'}`}
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
