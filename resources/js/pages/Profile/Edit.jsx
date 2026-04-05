import PasswordInput from '@/components/ui/PasswordInput';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';

function Field({ label, id, type = 'text', error, autoComplete, value, onChange, placeholder }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
                {label}
            </label>
            <input
                id={id}
                type={type}
                value={value}
                onChange={onChange}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-[14px] leading-normal text-zinc-900 shadow-sm outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus:ring-1 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
                    error
                        ? 'border-red-300/90 focus:border-red-400 focus:ring-red-400/25 dark:border-red-800 dark:focus:border-red-600'
                        : 'border-zinc-200/95 focus:border-zinc-400 focus:ring-zinc-400/20 dark:border-zinc-700/90 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/25'
                }`}
            />
            {error ? <p className="text-[12px] leading-snug text-red-600 dark:text-red-400/95">{error}</p> : null}
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <div className="mb-3 flex items-center gap-2">
            <h2 className="shrink-0 text-[12px] font-semibold tracking-wide text-zinc-900 dark:text-zinc-100">
                {children}
            </h2>
            <span className="h-px min-w-0 flex-1 bg-gradient-to-r from-zinc-300/70 to-transparent dark:from-zinc-600/45" aria-hidden />
        </div>
    );
}

export default function ProfileEdit({ profile }) {
    const { flash, auth } = usePage().props;
    const delegado = auth?.delegado ?? null;

    const { data, setData, patch, processing, errors, reset, recentlySuccessful } = useForm({
        name: profile.name ?? '',
        email: profile.email ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Mi cuenta" />
            <div className="mx-auto w-full max-w-xl">
                <article className="overflow-hidden rounded-xl border border-zinc-200/85 bg-white/90 shadow-sm dark:border-zinc-800/90 dark:bg-zinc-950/80">
                    <div className="border-b border-zinc-100 bg-zinc-50/80 px-4 py-4 dark:border-zinc-800/80 dark:from-zinc-900/40 dark:to-zinc-950/50 sm:px-5">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-gold/90 dark:text-brand-gold-soft/85">
                            Perfil de usuario
                        </p>
                        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                            Mi cuenta
                        </h1>
                        <p className="mt-2 max-w-lg text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">
                            Datos de acceso. Los identificadores institucionales solo los modifica administración.
                        </p>
                    </div>

                    <div className="px-4 py-5 sm:px-5 sm:py-6">
                        {(flash?.status || recentlySuccessful) && (
                            <output
                                className="mb-5 block border-l-2 border-brand-gold/60 bg-brand-gold/[0.06] py-2 pl-3 pr-3 text-[13px] leading-snug text-zinc-800 dark:border-brand-gold-soft/50 dark:bg-brand-gold-soft/[0.07] dark:text-zinc-200"
                                aria-live="polite"
                            >
                                {flash?.status || 'Los cambios se guardaron correctamente.'}
                            </output>
                        )}

                        {profile.must_change_password && (
                            <output className="mb-5 block border-l-2 border-amber-500/60 bg-amber-50/90 py-2 pl-3 pr-3 text-[13px] leading-snug text-amber-950 dark:border-amber-500/45 dark:bg-amber-950/35 dark:text-amber-100/95">
                                Establezca una contraseña nueva abajo para continuar.
                            </output>
                        )}

                        <div className="mb-6 space-y-2 border-b border-zinc-100 pb-5 dark:border-zinc-800/80">
                            <p className="text-base font-medium tracking-tight text-zinc-900 dark:text-zinc-50">
                                {profile.name}
                            </p>
                            <p className="break-all font-mono text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
                                {profile.email}
                            </p>
                            <ul className="flex flex-wrap gap-1.5 pt-0.5">
                                {profile.is_super_admin && (
                                    <li className="rounded border border-brand-gold/30 bg-brand-gold/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-gold dark:border-brand-gold-soft/25 dark:bg-brand-gold-soft/[0.09] dark:text-brand-gold-soft">
                                        Super admin
                                    </li>
                                )}
                                {(profile.roles ?? []).map((r) => (
                                    <li
                                        key={r}
                                        className="rounded border border-zinc-200/90 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400"
                                    >
                                        {r}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <form className="space-y-7" onSubmit={submit}>
                            <section aria-labelledby="section-datos">
                                <SectionTitle>
                                    <span id="section-datos">Datos generales</span>
                                </SectionTitle>
                                <div className="space-y-4">
                                    <Field
                                        label="Nombre completo"
                                        id="profile-name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        error={errors.name}
                                        autoComplete="name"
                                    />
                                    <Field
                                        label="Correo electrónico"
                                        id="profile-email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        error={errors.email}
                                        autoComplete="email"
                                    />
                                    {(profile.rfc || profile.nue) && (
                                        <div className="border border-zinc-200/85 bg-zinc-50/40 px-3 py-3 dark:border-zinc-800/90 dark:bg-zinc-900/25">
                                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                                                Identificadores
                                            </p>
                                            <dl className="grid gap-3 sm:grid-cols-2">
                                                {profile.rfc ? (
                                                    <div>
                                                        <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                                            RFC
                                                        </dt>
                                                        <dd className="mt-0.5 font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
                                                            {profile.rfc}
                                                        </dd>
                                                    </div>
                                                ) : null}
                                                {profile.nue ? (
                                                    <div>
                                                        <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                                                            NUE
                                                        </dt>
                                                        <dd className="mt-0.5 font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
                                                            {profile.nue}
                                                        </dd>
                                                    </div>
                                                ) : null}
                                            </dl>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {delegado && (
                                <section aria-labelledby="section-delegado">
                                    <SectionTitle>
                                        <span id="section-delegado">Vinculación institucional</span>
                                    </SectionTitle>
                                    <div className="border border-zinc-200/85 bg-white px-3 py-3 dark:border-zinc-800/90 dark:bg-zinc-950/40">
                                        <p className="text-[14px] font-medium leading-snug text-zinc-900 dark:text-zinc-100">
                                            {delegado.nombre_completo}
                                        </p>
                                        {delegado.delegaciones?.length > 0 && (
                                            <p className="mt-1.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-400">
                                                {delegado.delegaciones.join(' · ')}
                                            </p>
                                        )}
                                        {delegado.empleado?.nue ? (
                                            <p className="mt-2 text-[12px] text-zinc-500 dark:text-zinc-400">
                                                NUE:{' '}
                                                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                                                    {delegado.empleado.nue}
                                                </span>
                                            </p>
                                        ) : null}
                                    </div>
                                </section>
                            )}

                            <section aria-labelledby="section-clave">
                                <SectionTitle>
                                    <span id="section-clave">Contraseña</span>
                                </SectionTitle>
                                <p className="mb-3 text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
                                    Opcional. Mín. <span className="tabular-nums">8</span> caracteres si la cambia.
                                </p>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="profile-password"
                                            className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300"
                                        >
                                            Nueva contraseña
                                        </label>
                                        <PasswordInput
                                            id="profile-password"
                                            variant="panel"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            error={errors.password}
                                            autoComplete="new-password"
                                            placeholder="Opcional"
                                            className="bg-white text-[14px] shadow-sm dark:bg-zinc-950"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label
                                            htmlFor="profile-password-confirmation"
                                            className="block text-[12px] font-medium text-zinc-700 dark:text-zinc-300"
                                        >
                                            Confirmación
                                        </label>
                                        <PasswordInput
                                            id="profile-password-confirmation"
                                            variant="panel"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            error={errors.password_confirmation}
                                            autoComplete="new-password"
                                            placeholder="Repetir"
                                            className="bg-white text-[14px] shadow-sm dark:bg-zinc-950"
                                        />
                                    </div>
                                </div>
                            </section>

                            <footer className="flex flex-col gap-3 border-t border-zinc-200/90 pt-6 dark:border-zinc-800/90 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex min-h-10 min-w-[11rem] items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 px-6 text-[13px] font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-45 dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                    {processing ? 'Guardando…' : 'Guardar cambios'}
                                </button>
                                <Link
                                    href={route('logout')}
                                    method="post"
                                    as="button"
                                    className="text-left text-[12px] font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 hover:text-zinc-800 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200"
                                >
                                    Cerrar sesión
                                </Link>
                            </footer>
                        </form>
                    </div>
                </article>
            </div>
        </>
    );
}

ProfileEdit.layout = (page) => (
    <AuthenticatedLayout
        header={
            <span className="truncate text-sm font-medium tracking-wide text-zinc-800 dark:text-zinc-100 sm:text-[15px]">
                Mi cuenta
            </span>
        }
    >
        {page}
    </AuthenticatedLayout>
);
