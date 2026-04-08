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
                className={`absolute inset-0 bg-zinc-950/16 backdrop-blur-[1px] transition-opacity duration-300 ease-out dark:bg-black/35 ${
                    active ? 'opacity-100' : 'opacity-0'
                }`}
            />
            <div className="absolute inset-0 flex items-center justify-center">
                <span
                    className={`size-20 animate-spin rounded-full border-2 border-white/40 border-t-brand-gold transition-all duration-300 ease-out dark:border-zinc-700/80 dark:border-t-brand-gold-soft ${
                        active ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
                    }`}
                />
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
