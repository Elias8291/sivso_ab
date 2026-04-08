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
                className={`absolute inset-0 bg-zinc-900/20 backdrop-blur-[2px] transition-opacity duration-200 ease-out dark:bg-zinc-950/35 ${
                    active ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <div
                    className={`flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-white/90 px-4 py-3 shadow-lg transition-all duration-200 ease-out dark:border-zinc-700/70 dark:bg-zinc-900/90 ${
                        active ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-1 scale-95 opacity-0'
                    }`}
                >
                    <span className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-brand-gold dark:border-zinc-600 dark:border-t-brand-gold-soft" />
                    <span className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200">
                        Cargando modulo...
                    </span>
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
