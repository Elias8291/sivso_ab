import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal reutilizable para formularios CRUD.
 *
 * @param {{ open: boolean, onClose: () => void, title: string, children: React.ReactNode, maxWidth?: string }} props
 */
export default function Modal({
    open,
    onClose,
    title,
    children,
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={title}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] dark:bg-black/60"
                onClick={onClose}
                aria-hidden
            />

            {/* Panel */}
            <div
                ref={panelRef}
                className={`relative w-full ${maxWidth} rounded-xl border border-zinc-200/70 bg-white shadow-xl dark:border-zinc-800/70 dark:bg-zinc-950`}
            >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800/60">
                    <h2 className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    >
                        <X className="size-4" strokeWidth={2} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {children}
                </div>
            </div>
        </div>
    );
}
