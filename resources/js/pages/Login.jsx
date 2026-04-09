import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AuthLayout from '../components/layout/AuthLayout';
import PasswordInput from '../components/ui/PasswordInput';

export default function Login() {
    const [loading, setLoading] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        rfc: '',
        password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        post(route('login'), {
            onFinish: () => setLoading(false),
        });
    };

    return (
        <AuthLayout title="Inicio de Sesion" imageSrc="/images/login-hero.png">
            {(loading || processing) && (
                <div className="animate-auth-loading-overlay fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-white/92 to-[#faf8f3]/92 backdrop-blur-md dark:from-black/92 dark:to-zinc-950/92">
                    <div className="flex flex-col items-center gap-5">
                        <span
                            className="size-14 animate-spin rounded-full border-[3px] border-brand-gold/20 border-t-brand-gold shadow-[0_0_28px_rgba(212,175,55,0.45)] dark:border-brand-gold/15 dark:border-t-brand-gold"
                            aria-hidden
                        />
                        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-brand-gold/85 dark:text-brand-gold/75">
                            Iniciando sesión...
                        </p>
                    </div>
                </div>
            )}

            <header className="animate-auth-fade-up mb-8 text-center delay-100 lg:text-left">
                <div
                    className="animate-auth-shimmer-bar mx-auto h-0.5 w-20 rounded-full lg:mx-0"
                    aria-hidden
                />
                <h2 className="mt-5 text-lg font-semibold uppercase tracking-[0.15em] text-zinc-900 dark:text-white">
                    Inicio de Sesión
                </h2>
            </header>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="animate-auth-fade-up space-y-1.5 delay-[240ms]">
                    <label
                        htmlFor="login-rfc"
                        className="ml-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-900 dark:text-brand-gold/70"
                    >
                        RFC
                    </label>
                    <input
                        id="login-rfc"
                        type="text"
                        name="rfc"
                        value={data.rfc}
                        onChange={(e) => setData('rfc', e.target.value.toUpperCase())}
                        placeholder="ABCD123456XYZ"
                        className="auth-field w-full rounded-xl border border-brand-gold/20 bg-white px-4 py-3 text-[14px] uppercase tracking-wide text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-brand-gold/50 dark:focus:ring-brand-gold/20"
                        autoComplete="username"
                    />
                    {errors.rfc && (
                        <p className="text-xs font-medium text-red-600 dark:text-red-400">{errors.rfc}</p>
                    )}
                </div>
                <div className="animate-auth-fade-up space-y-1.5 delay-[360ms]">
                    <label
                        htmlFor="login-password"
                        className="ml-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-900 dark:text-brand-gold/70"
                    >
                        Contraseña
                    </label>
                    <PasswordInput
                        id="login-password"
                        name="password"
                        value={data.password}
                        onChange={(e) => setData('password', e.target.value)}
                        placeholder="••••••••"
                        error={errors.password}
                    />
                </div>
                <div className="animate-auth-fade-up delay-[480ms]">
                    <button
                        type="submit"
                        disabled={loading || processing}
                        className="relative w-full overflow-hidden rounded-xl border border-brand-gold/35 bg-brand-gold/15 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-900 transition-[background-color,border-color,color,opacity] duration-200 ease-out enabled:hover:border-brand-gold/50 enabled:hover:bg-brand-gold/22 enabled:active:bg-brand-gold/18 disabled:cursor-not-allowed disabled:opacity-50 dark:border-brand-gold-soft/30 dark:bg-brand-gold/10 dark:text-zinc-100 dark:enabled:hover:border-brand-gold-soft/45 dark:enabled:hover:bg-brand-gold/16"
                    >
                        Iniciar Sesión
                    </button>
                </div>
            </form>

            <footer className="animate-auth-fade-up mt-10 space-y-1 border-t border-brand-gold/10 pt-6 text-center delay-[600ms] dark:border-brand-gold/10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-600 dark:text-zinc-400">
                    Secretaría de Administración Oaxaca
                </p>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-700 dark:text-white">
                    Gobierno de Oaxaca
                </p>
            </footer>
        </AuthLayout>
    );
}
