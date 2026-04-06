import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AuthLayout from '@/components/layout/AuthLayout';
import PasswordInput from '@/components/ui/PasswordInput';

export default function ForcePasswordChange() {
    const { data, setData, patch, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('auth.password.update'), {
            onSuccess: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Cambiar contraseña" />
            <AuthLayout title="Cambiar contraseña inicial" imageSrc="/images/login-hero.png">
                <header className="mb-8 text-center lg:text-left">
                    <h2 className="text-lg font-semibold uppercase tracking-[0.15em] text-zinc-900 dark:text-white">
                        Cambiar contraseña
                    </h2>
                    <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
                        Por seguridad, antes de entrar al sistema debes establecer una contraseña nueva.
                    </p>
                </header>

                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-1.5">
                        <label
                            htmlFor="initial-password"
                            className="ml-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-900 dark:text-zinc-300"
                        >
                            Nueva contraseña
                        </label>
                        <PasswordInput
                            id="initial-password"
                            name="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            error={errors.password}
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label
                            htmlFor="initial-password-confirmation"
                            className="ml-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-900 dark:text-zinc-300"
                        >
                            Confirmar contraseña
                        </label>
                        <input
                            id="initial-password-confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            placeholder="Repite la contraseña"
                            autoComplete="new-password"
                            className="auth-field w-full rounded-xl border border-brand-gold/20 bg-white px-4 py-3 text-[14px] text-zinc-900 outline-none transition-all placeholder:text-zinc-500 focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 dark:border-zinc-700 dark:bg-zinc-900/50 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-brand-gold/50 dark:focus:ring-brand-gold/20"
                        />
                        {errors.password_confirmation && (
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-xl bg-zinc-900 py-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-900"
                    >
                        {processing ? 'Guardando...' : 'Actualizar contraseña'}
                    </button>
                </form>

                <footer className="mt-8 border-t border-zinc-200/70 pt-4 dark:border-zinc-700/70">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-[12px] font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-800 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200"
                    >
                        Cerrar sesión
                    </Link>
                </footer>
            </AuthLayout>
        </>
    );
}
