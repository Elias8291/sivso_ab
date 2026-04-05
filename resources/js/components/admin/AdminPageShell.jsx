/**
 * Contenedor común para índices de administración: título, descripción opcional y acciones.
 */
export default function AdminPageShell({ title, description, actions = null, children }) {
    return (
        <div className="w-full max-w-none space-y-6">
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="flex min-w-0 flex-1 gap-2.5 sm:gap-3">
                    <span
                        className="mt-0.5 h-6 w-0.5 shrink-0 rounded-full bg-gradient-to-b from-brand-gold/45 to-brand-gold/20 sm:h-7 sm:w-1 dark:from-brand-gold-soft/40 dark:to-brand-gold-soft/15"
                        aria-hidden
                    />
                    <div className="min-w-0 flex-1 space-y-1.5">
                        <h1 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-xl">{title}</h1>
                        {description ? (
                            <div
                                className="w-full max-w-full whitespace-normal text-[13px] leading-relaxed [overflow-wrap:anywhere] break-words text-zinc-500 dark:text-zinc-400"
                            >
                                {description}
                            </div>
                        ) : null}
                    </div>
                </div>
                {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
            </div>
            {children}
        </div>
    );
}
