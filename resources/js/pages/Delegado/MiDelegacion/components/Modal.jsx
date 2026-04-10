import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ open, onClose, children, maxWidthClass = 'max-w-md', tone = 'default' }) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    if (!open) return null;

    const shellTone = tone === 'bajaSoft'
        ? 'border-stone-200/50 bg-white shadow-sm shadow-stone-900/[0.04] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none'
        : 'border-zinc-200/70 bg-zinc-50 shadow-md shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-900';

    const backdropTone = tone === 'bajaSoft'
        ? 'bg-stone-900/25 backdrop-blur-[3px] dark:bg-zinc-900/40'
        : 'bg-zinc-900/40 backdrop-blur-[2px]';

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto overscroll-contain sm:items-center sm:p-6">
            <div className={`fixed inset-0 ${backdropTone}`} onClick={onClose} />
            <div
                className={`relative z-10 w-full ${maxWidthClass} max-h-[min(95dvh,calc(100dvh-env(safe-area-inset-bottom)))] overflow-y-auto overscroll-y-contain rounded-t-2xl border sm:max-h-[min(90dvh,900px)] sm:rounded-2xl ${shellTone}`}
                style={{ animation: 'modalIn 0.16s cubic-bezier(.16,1,.3,1)' }}
            >
                {children}
            </div>
            <style>{`
                @keyframes modalIn {
                    from { opacity:0; transform:scale(0.96) translateY(10px); }
                    to   { opacity:1; transform:scale(1)    translateY(0);    }
                }
            `}</style>
        </div>,
        document.body,
    );
}
