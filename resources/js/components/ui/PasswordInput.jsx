import { useState } from 'react';

export default function PasswordInput({
    name,
    value,
    onChange,
    placeholder = '',
    id,
    autoComplete = 'current-password',
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="relative">
            <input
                id={id}
                type={showPassword ? 'text' : 'password'}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="auth-field w-full rounded-xl border border-brand-gold/20 bg-white px-4 py-3 pr-12 text-[14px] text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-brand-gold/50 dark:focus:ring-brand-gold/20"
                autoComplete={autoComplete}
            />
            <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-gold/60 transition hover:text-brand-gold/80 dark:text-brand-gold/50 dark:hover:text-brand-gold/70"
            >
                {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
        </div>
    );
}
