const variants = {
    default: 'border-zinc-300/60 bg-zinc-50 text-zinc-600 dark:border-zinc-700/50 dark:bg-zinc-800/60 dark:text-zinc-300',
    success: 'border-emerald-300/50 bg-emerald-50 text-emerald-700 dark:border-emerald-700/40 dark:bg-emerald-950/40 dark:text-emerald-400',
    warning: 'border-amber-300/50 bg-amber-50 text-amber-700 dark:border-amber-700/40 dark:bg-amber-950/40 dark:text-amber-400',
    danger: 'border-red-300/50 bg-red-50 text-red-700 dark:border-red-700/40 dark:bg-red-950/40 dark:text-red-400',
    gold: 'border-brand-gold/30 bg-brand-gold/10 text-brand-gold dark:border-brand-gold/25 dark:bg-brand-gold/15 dark:text-brand-gold-soft',
};

const dotColors = {
    default: 'bg-zinc-400 dark:bg-zinc-500',
    success: 'bg-emerald-500 dark:bg-emerald-400',
    warning: 'bg-amber-500 dark:bg-amber-400',
    danger: 'bg-red-500 dark:bg-red-400',
    gold: 'bg-brand-gold dark:bg-brand-gold-soft',
};

export default function Badge({ children, variant = 'default', dot = true }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5 ${variants[variant] ?? variants.default}`}
        >
            {dot && (
                <span className={`size-1.5 rounded-full ${dotColors[variant] ?? dotColors.default}`} aria-hidden />
            )}
            {children}
        </span>
    );
}
