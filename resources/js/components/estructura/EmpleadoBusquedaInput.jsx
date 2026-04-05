import axios from 'axios';
import { Loader2, Search, X } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { route } from 'ziggy-js';

/**
 * Búsqueda asíncrona de empleados. Con delegadoId filtra por delegaciones de ese delegado.
 */
export default function EmpleadoBusquedaInput({
    delegadoId = null,
    value = '',
    onValueChange,
    error,
    delegacionesCodigos = [],
    seedLabel = '',
    placeholder = 'Escribe nombre, apellido o NUE (mín. 2 caracteres)…',
    disabled = false,
}) {
    const uid      = useId();
    const inputRef = useRef(null);
    const rootRef  = useRef(null);

    const [q, setQ]             = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen]       = useState(false);
    const [meta, setMeta]       = useState(null);
    const [pickedLabel, setPickedLabel] = useState('');

    const debounceRef = useRef(null);

    const syncPickedFromSeed = useCallback(() => {
        if (value && seedLabel) {
            setPickedLabel(seedLabel);
        } else if (!value) {
            setPickedLabel('');
        }
    }, [value, seedLabel]);

    useEffect(() => {
        syncPickedFromSeed();
    }, [syncPickedFromSeed]);

    useEffect(() => {
        setMeta(null);
        setResults([]);
        setQ('');
        setOpen(false);
    }, [delegadoId]);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        const t = q.trim();
        if (t.length < 2) {
            setResults([]);
            setLoading(false);
            setMeta(null);
            return;
        }

        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const params = { q: t };
                if (delegadoId != null) {
                    params.delegado_id = delegadoId;
                }
                const { data } = await axios.get(route('delegados.buscar-empleados'), {
                    params,
                    headers: { Accept: 'application/json' },
                });
                setResults(Array.isArray(data.data) ? data.data : []);
                setMeta(data.meta ?? null);
            } catch {
                setResults([]);
                setMeta(null);
            } finally {
                setLoading(false);
            }
        }, 280);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [q, delegadoId]);

    useEffect(() => {
        const onDoc = (e) => {
            if (rootRef.current && !rootRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, []);

    const pick = (item) => {
        onValueChange(String(item.id));
        setPickedLabel(item.label);
        setQ('');
        setResults([]);
        setOpen(false);
    };

    const clear = () => {
        onValueChange('');
        setPickedLabel('');
        setQ('');
        setResults([]);
        inputRef.current?.focus();
    };

    const sinDel = meta?.sin_delegaciones_asignadas;
    const mostrarSugerenciaDelegaciones =
        delegadoId != null && delegacionesCodigos.length > 0;

    return (
        <div ref={rootRef} className="space-y-1.5">
            {mostrarSugerenciaDelegaciones && (
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    Búsqueda acotada a tus delegaciones:{' '}
                    <span className="font-mono normal-case text-zinc-700 dark:text-zinc-300">
                        {delegacionesCodigos.join(', ')}
                    </span>
                </p>
            )}
            {value && pickedLabel ? (
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-700 dark:bg-zinc-800/60">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-zinc-800 dark:text-zinc-200">
                        {pickedLabel}
                    </span>
                    <button
                        type="button"
                        onClick={clear}
                        disabled={disabled}
                        className="shrink-0 rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 disabled:opacity-40 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                        aria-label="Quitar empleado"
                    >
                        <X className="size-4" strokeWidth={2} />
                    </button>
                </div>
            ) : (
                <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                    <input
                        ref={inputRef}
                        id={uid}
                        type="text"
                        value={q}
                        disabled={disabled || Boolean(sinDel)}
                        onChange={(e) => {
                            setOpen(true);
                            setQ(e.target.value);
                        }}
                        onFocus={() => setOpen(true)}
                        placeholder={sinDel ? 'Asigne delegaciones al delegado primero…' : placeholder}
                        autoComplete="off"
                        className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-10 pr-3 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-zinc-800"
                    />
                    {loading && (
                        <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-zinc-400" />
                    )}
                    {open && !sinDel && results.length > 0 && (
                        <ul
                            className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
                            role="listbox"
                        >
                            {results.map((item) => (
                                <li key={item.id} role="option">
                                    <button
                                        type="button"
                                        className="w-full px-3 py-2 text-left text-[12px] leading-snug text-zinc-800 transition hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/80"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => pick(item)}
                                    >
                                        <span className="font-medium">{item.nombre_completo}</span>
                                        <span className="mt-0.5 block font-mono text-[11px] text-zinc-500">
                                            NUE {item.nue ?? '—'} · {item.delegacion_codigo}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            {sinDel && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                    Este delegado no tiene delegaciones en el catálogo. No se puede buscar personal acotado;
                    asigne delegaciones (relación delegado–delegación) y vuelva a intentar.
                </p>
            )}
            {!sinDel && q.trim().length >= 2 && !loading && results.length === 0 && open && (
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Sin coincidencias. Prueba con otra parte del nombre o del NUE.
                </p>
            )}
            {error && (
                <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
