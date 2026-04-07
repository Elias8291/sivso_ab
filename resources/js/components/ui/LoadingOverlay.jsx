import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

export default function LoadingOverlay() {
    const [navigating, setNavigating] = useState(false);

    useEffect(() => {
        const onStart = () => setNavigating(true);
        const onFinish = () => setNavigating(false);

        const removeStart = router.on('start', onStart);
        const removeFinish = router.on('finish', onFinish);

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    if (!navigating) return null;

    return (
        <div className="animate-module-loading-overlay fixed inset-0 z-[150] flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-5">
                <span
                    className="size-14 animate-spin rounded-full border-[3px] border-brand-gold/20 border-t-brand-gold shadow-[0_0_28px_rgba(212,175,55,0.45)] dark:border-brand-gold/15 dark:border-t-brand-gold"
                    aria-hidden="true"
                />
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-gold/85 dark:text-brand-gold/75">
                    Cargando...
                </p>
            </div>
        </div>
    );
}
