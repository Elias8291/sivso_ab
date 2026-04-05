/**
 * Campo de formulario reutilizable con label + input minimalista.
 *
 * @param {{ label: string, id: string, error?: string, children?: React.ReactNode } & React.InputHTMLAttributes} props
 */
export default function FormField({ label, id, error, type = 'text', children, ...inputProps }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-[12px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                {label}
            </label>
            {children ?? (
                <input
                    id={id}
                    type={type}
                    className={`block w-full rounded-lg border bg-transparent px-3 py-2 text-[13px] text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:ring-1 dark:text-zinc-200 dark:placeholder:text-zinc-600 ${
                        error
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20 dark:border-red-700 dark:focus:border-red-600 dark:focus:ring-red-600/20'
                            : 'border-zinc-200 focus:border-zinc-400 focus:ring-zinc-400/20 dark:border-zinc-700 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20'
                    }`}
                    {...inputProps}
                />
            )}
            {error && <p className="text-[11px] text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
}
