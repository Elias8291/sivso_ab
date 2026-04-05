import { Eye, EyeOff } from 'lucide-react';
import { useId, useState } from 'react';

/**
 * @param {{
 *   id?: string,
 *   name?: string,
 *   value: string,
 *   onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
 *   placeholder?: string,
 *   autoComplete?: string,
 *   disabled?: boolean,
 *   required?: boolean,
 *   variant?: 'auth' | 'panel',
 *   error?: string,
 *   className?: string,
 * }} props
 */
export default function PasswordInput({
    id: idProp,
    name,
    value,
    onChange,
    placeholder = '',
    autoComplete = 'current-password',
    disabled = false,
    required = false,
    variant = 'auth',
    error,
    className = '',
}) {
    const reactId = useId();
    const id = idProp ?? reactId;
    const [showPassword, setShowPassword] = useState(false);

    const authCls =
        'auth-field w-full rounded-xl border border-brand-gold/20 bg-white px-4 py-3 pr-12 text-[14px] text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-brand-gold/50 dark:focus:ring-brand-gold/20';

    const panelBase =
        'block w-full rounded-lg border bg-transparent px-3 py-2 pr-10 text-[13px] text-zinc-800 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:ring-1 dark:text-zinc-200 dark:placeholder:text-zinc-600';

    const panelOk =
        'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400/20 dark:border-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20';

    const panelErr =
        'border-red-300 focus:border-red-400 focus:ring-red-400/20 dark:border-red-700 dark:focus:border-red-600 dark:focus:ring-red-600/20';

    const inputCls =
        variant === 'auth'
            ? `${authCls} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`.trim()
            : `${panelBase} ${error ? panelErr : panelOk} ${className}`.trim();

    const btnCls =
        variant === 'auth'
            ? 'right-3 rounded-md p-1.5 text-brand-gold/70 transition hover:bg-brand-gold/10 hover:text-brand-gold dark:text-brand-gold-soft/60 dark:hover:bg-brand-gold-soft/10 dark:hover:text-brand-gold-soft'
            : 'right-2 rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300';

    return (
        <div className="relative">
            <input
                id={id}
                type={showPassword ? 'text' : 'password'}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={inputCls}
                autoComplete={autoComplete}
                disabled={disabled}
                required={required}
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? `${id}-error` : undefined}
            />
            <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className={`absolute top-1/2 -translate-y-1/2 ${btnCls}`}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar' : 'Mostrar'}
            >
                {showPassword ? (
                    <EyeOff className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                ) : (
                    <Eye className="size-4 shrink-0" strokeWidth={1.75} aria-hidden />
                )}
            </button>
            {error ? (
                <p
                    id={`${id}-error`}
                    className={`mt-1 font-medium text-red-600 dark:text-red-400 ${variant === 'auth' ? 'text-xs' : 'text-[11px]'}`}
                >
                    {error}
                </p>
            ) : null}
        </div>
    );
}
