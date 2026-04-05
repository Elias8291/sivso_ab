import './bootstrap';
import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';

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
                <App {...props} />
            </ThemeProvider>,
        );
    },
    progress: {
        color: '#d4af37',
    },
});
