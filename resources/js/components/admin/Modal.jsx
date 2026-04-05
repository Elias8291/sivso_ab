import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal reutilizable para formularios CRUD.
 *
 * @param {{ open: boolean, onClose: () => void, title: string, children: React.ReactNode, footer?: React.ReactNode, maxWidth?: string }} props
 */
export default function Modal({
    open,
    onClose,
    title,
    children,
    footer = null,
    maxWidth = 'max-w-lg md:max-w-3xl lg:max-w-5xl xl:max-w-6xl',
}) {
    const dialogRef = useRef(null);
    const panelRef = useRef(null);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (open) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            ref={dialogRef}
            className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto overscroll-contain p-0 sm:items-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/60"
                onClick={onClose}
                aria-hidden
            />

            {/* Panel: altura máxima + cuerpo con scroll (móvil: formularios largos y botones al final) */}
            <div
                ref={panelRef}
                className={`relative z-10 flex max-h-[min(92dvh,calc(100dvh-env(safe-area-inset-bottom)))] w-full flex-col rounded-t-2xl border border-zinc-200/70 bg-white shadow-xl sm:max-h-[min(88dvh,900px)] sm:rounded-xl dark:border-zinc-800/70 dark:bg-zinc-950 ${maxWidth}`}
            >
                {/* Header */}
                <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-zinc-800/60 sm:px-6">
                    <h2 className="pr-2 text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                        <X className="size-4" strokeWidth={2} />
                    </button>
                </div>

                {/* Body (scroll); footer opcional fijo abajo (p. ej. enviar con form=...) */}
                <div
                    className={`min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-5 sm:px-6 ${footer ? 'pb-4' : 'pb-[max(1.25rem,env(safe-area-inset-bottom))]'}`}
                >
                    {children}
                </div>
                {footer ? (
                    <div className="shrink-0 border-t border-zinc-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-zinc-800/60 sm:px-6">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
