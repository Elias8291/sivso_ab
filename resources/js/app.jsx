import './bootstrap';
import { createInertiaApp, router } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';

function GlobalPageLoader() {
    const [mounted, setMounted] = useState(false);
    const [active, setActive] = useState(false);
    const timerRef = useRef(null);
    const hideRef = useRef(null);

    useEffect(() => {
        const clearTimers = () => {
            [timerRef, hideRef].forEach(ref => {
                if (ref.current) {
                    clearTimeout(ref.current);
                    ref.current = null;
                }
            });
        };

        const onStart = () => {
            clearTimers();
            // Retraso de 150ms para no mostrar nada en conexiones ultra rápidas
            timerRef.current = setTimeout(() => {
                setMounted(true);
                requestAnimationFrame(() => setActive(true));
            }, 150);
        };

        const onDone = () => {
            clearTimers();
            setActive(false);
            // Esperamos a que la transición de opacidad termine antes de desmontar
            hideRef.current = setTimeout(() => setMounted(false), 400);
        };

        const unbindEvents = [
            router.on('start', onStart),
            router.on('finish', onDone),
            router.on('error', onDone),
            router.on('invalid', onDone),
            router.on('exception', onDone),
        ];

        return () => {
            clearTimers();
            unbindEvents.forEach(unbind => unbind());
        };
    }, []);

    if (!mounted) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden pointer-events-none">
            {/* Fondo con desenfoque cinematográfico */}
            <div
                className={`absolute inset-0 bg-white/40 backdrop-blur-md transition-opacity duration-500 ease-in-out dark:bg-zinc-950/60 ${
                    active ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Contenedor Principal */}
            <div
                className={`relative flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
            >
                {/* Spinner Elegante */}
                <div className="relative h-20 w-20 mb-6">
                    {/* Aro exterior tenue */}
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-zinc-200 dark:border-zinc-800" />
                    
                    {/* Aro de carga animado */}
                    <div className="absolute inset-0 rounded-full border-[1.5px] border-transparent border-t-brand-gold animate-spin shadow-[0_-4px_12px_-4px_rgba(212,175,55,0.3)]" />
                    
                    {/* Logo o inicial central sutil */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-light tracking-tighter text-zinc-400 dark:text-zinc-500 uppercase">
                            S
                        </span>
                    </div>
                </div>

                {/* Texto Refinado */}
                <div className="text-center space-y-1.5">
                    <h2 className="text-[11px] font-light uppercase tracking-[0.4em] text-zinc-900 dark:text-zinc-100 antialiased">
                        SIVSO
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                        <span className="h-[1px] w-4 bg-brand-gold/40" />
                        <p className="text-[12px] italic font-serif text-zinc-500 dark:text-zinc-400">
                            Cargando experiencia
                        </p>
                        <span className="h-[1px] w-4 bg-brand-gold/40" />
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
        if (!page) throw new Error(`Página Inertia no encontrada: ${name}`);
        return page.default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <ThemeProvider>
                <App {...props} />
                <GlobalPageLoader />
            </ThemeProvider>,
        );
    },
    progress: {
        color: '#d4af37',
        showSpinner: false, // Desactivamos el spinner por defecto de Inertia ya que tenemos el nuestro
    },
});