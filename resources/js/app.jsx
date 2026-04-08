import './bootstrap';
import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';

function GlobalPageLoader() {
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [active, setActive] = useState(false);
    const timerRef = useRef(null);
    const hideRef = useRef(null);

    useEffect(() => {
        const clearTimer = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
        const clearHideTimer = () => {
            if (hideRef.current) {
                clearTimeout(hideRef.current);
                hideRef.current = null;
            }
        };

        const onStart = () => {
            clearTimer();
            clearHideTimer();
            // Evita parpadeo en navegaciones muy rápidas.
            timerRef.current = setTimeout(() => {
                setMounted(true);
                requestAnimationFrame(() => setActive(true));
                setVisible(true);
            }, 120);
        };
        const onDone = () => {
            clearTimer();
            setActive(false);
            setVisible(false);
            clearHideTimer();
            hideRef.current = setTimeout(() => setMounted(false), 180);
        };

        const unbindStart = router.on('start', onStart);
        const unbindFinish = router.on('finish', onDone);
        const unbindError = router.on('error', onDone);
        const unbindInvalid = router.on('invalid', onDone);
        const unbindException = router.on('exception', onDone);

        return () => {
            clearTimer();
            clearHideTimer();
            unbindStart();
            unbindFinish();
            unbindError();
            unbindInvalid();
            unbindException();
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="pointer-events-auto fixed inset-0 z-[9999]">
            <div
                className={`absolute inset-0 bg-zinc-950/25 backdrop-blur-sm transition-opacity duration-300 ease-out dark:bg-black/45 ${
                    active ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className={`relative flex w-[min(92vw,25rem)] flex-col items-center gap-4 rounded-3xl border border-zinc-200/80 bg-white/95 px-8 py-8 shadow-[0_24px_60px_rgba(24,24,27,0.24)] transition-all duration-300 ease-out dark:border-zinc-700/80 dark:bg-zinc-900/95 dark:shadow-[0_26px_64px_rgba(0,0,0,0.52)] ${
                        active ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-2 scale-95 opacity-0'
                    }`}
                >
                    <div className="relative grid place-items-center">
                        <span className="size-24 animate-spin rounded-full border-[3px] border-zinc-300/70 border-t-brand-gold dark:border-zinc-700/80 dark:border-t-brand-gold-soft" />
                        <span className="absolute size-14 rounded-full border border-brand-gold/35 dark:border-brand-gold-soft/40" />
                    </div>

                    <div className="space-y-1 text-center">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold/90 dark:text-brand-gold-soft/90">
                            SIVSO
                        </p>
                        <p className="text-[17px] font-medium text-zinc-700 dark:text-zinc-100">
                            Cargando...
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

createInertiaApp({
    title: (title) => (title ? `${title} — ${import.meta.env.VITE_APP_NAME ?? 'SIVSO'}` : (import.meta.env.VITE_APP_NAME ?? 'SIVSO')),
    resolve: (name) => {
        const pages = import.meta.glob('./pages/**/*.jsx', { eager: true });
        const page = pages[`./pages/${name}.jsx`];
        if (!page) {
            throw new Error(`Página Inertia no encontrada: ${name}`);
        }
        return page.default;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <ThemeProvider>
                <>
                    <App {...props} />
                    <GlobalPageLoader />
                </>
            </ThemeProvider>,
        );
    },
    progress: {
        color: '#d4af37',
    },
});
