import FormField from '@/components/admin/FormField';
import AdminPageShell from '@/components/admin/AdminPageShell';
import PasswordInput from '@/components/ui/PasswordInput';
import { createAdminPageLayout } from '@/layouts/adminPageLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { KeyRound, LogOut, Save, ShieldCheck, User } from 'lucide-react';
import { route } from 'ziggy-js';

function SectionLabel({ icon: Icon, children }) {
    return (
        <div className="flex items-center gap-2.5">
            <span
                className="h-3 w-px shrink-0 rounded-full bg-gradient-to-b from-brand-gold/70 to-brand-gold/25 dark:from-brand-gold-soft/65 dark:to-brand-gold-soft/20"
                aria-hidden
            />
            {Icon && <Icon className="size-3.5 text-brand-gold/50 dark:text-brand-gold-soft/45" strokeWidth={1.75} aria-hidden />}
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">{children}</p>
        </div>
    );
}

function InfoBox({ children }) {
    return (
        <div className="rounded-xl border border-zinc-200/75 border-l-2 border-l-brand-gold/40 bg-zinc-50/40 px-4 py-3.5 dark:border-zinc-800 dark:border-l-brand-gold-soft/35 dark:bg-zinc-900/25">
            {children}
        </div>
    );
}

export default function ProfileEdit({ profile }) {
    const { flash, auth } = usePage().props;
    const delegado = auth?.delegado ?? null;
    const mustChangePassword = !Boolean(profile.must_change_password);

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
            <AdminPageShell
                title={mustChangePassword ? 'Cambiar contraseña' : 'Mi cuenta'}
                description={
                    mustChangePassword
                        ? 'Por seguridad, primero actualiza tu contraseña para continuar.'
                        : 'Datos de acceso. Los identificadores institucionales solo los modifica administración.'
                }
            >
                <div className="mx-auto w-full max-w-2xl">
                    <div className="space-y-7 rounded-3xl border border-zinc-200/80 bg-white px-4 py-6 shadow-sm shadow-zinc-200/50 sm:px-6 sm:py-8 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-none">

                        {(flash?.status || recentlySuccessful) && (
                            <output
                                className="block rounded-xl border-l-2 border-l-brand-gold/60 bg-brand-gold/[0.06] py-2.5 pl-3.5 pr-3.5 text-[13px] leading-snug text-zinc-800 dark:border-l-brand-gold-soft/50 dark:bg-brand-gold-soft/[0.07] dark:text-zinc-200"
                                aria-live="polite"
                            >
                                {flash?.status || 'Los cambios se guardaron correctamente.'}
                            </output>
                        )}

                        {mustChangePassword && (
                            <output className="block rounded-xl border-l-2 border-l-amber-500/60 bg-amber-50/90 py-2.5 pl-3.5 pr-3.5 text-[13px] leading-snug text-amber-950 dark:border-l-amber-500/45 dark:bg-amber-950/35 dark:text-amber-100/95">
                                Establezca una contraseña nueva abajo para continuar.
                            </output>
                        )}

                        {!mustChangePassword && (
                            <>
                                <header className="space-y-4">
                                    <div className="flex items-start gap-3.5">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800/70">
                                            <User className="size-5 text-zinc-500 dark:text-zinc-400" strokeWidth={1.6} />
                                        </div>
                                        <div className="min-w-0 flex-1 space-y-1">
                                            <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                                                {profile.name}
                                            </p>
                                            <p className="break-all font-mono text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
                                                {profile.email}
                                            </p>
                                            {(profile.is_super_admin || (profile.roles ?? []).length > 0) && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                    {profile.is_super_admin && (
                                                        <span className="inline-flex items-center gap-1 rounded-md border border-brand-gold/30 bg-brand-gold/[0.07] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-gold dark:border-brand-gold-soft/25 dark:bg-brand-gold-soft/[0.09] dark:text-brand-gold-soft">
                                                            <ShieldCheck className="size-2.5" strokeWidth={2} /> Super admin
                                                        </span>
                                                    )}
                                                    {(profile.roles ?? []).map((r) => (
                                                        <span
                                                            key={r}
                                                            className="rounded-md border border-zinc-200/90 bg-zinc-50 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-400"
                                                        >
                                                            {r}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/90 to-transparent dark:via-zinc-700/70" aria-hidden />
                                </header>
                            </>
                        )}

                        <form className="space-y-7" onSubmit={submit}>
                            {!mustChangePassword && (
                                <section className="space-y-3" aria-labelledby="section-datos">
                                    <SectionLabel icon={User}>
                                        <span id="section-datos">Datos generales</span>
                                    </SectionLabel>
                                    <div className="space-y-4">
                                        <FormField
                                            label="Nombre completo"
                                            id="profile-name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            error={errors.name}
                                            autoComplete="name"
                                        />
                                        <FormField
                                            label="Correo electrónico"
                                            id="profile-email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            error={errors.email}
                                            autoComplete="email"
                                        />
                                        {(profile.rfc || profile.nue) && (
                                            <InfoBox>
                                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
                                                    Identificadores
                                                </p>
                                                <dl className="grid gap-3 sm:grid-cols-2">
                                                    {profile.rfc ? (
                                                        <div>
                                                            <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">RFC</dt>
                                                            <dd className="mt-0.5 font-mono text-[13px] text-zinc-900 dark:text-zinc-100">{profile.rfc}</dd>
                                                        </div>
                                                    ) : null}
                                                    {profile.nue ? (
                                                        <div>
                                                            <dt className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">NUE</dt>
                                                            <dd className="mt-0.5 font-mono text-[13px] text-zinc-900 dark:text-zinc-100">{profile.nue}</dd>
                                                        </div>
                                                    ) : null}
                                                </dl>
                                            </InfoBox>
                                        )}
                                    </div>
                                </section>
                            )}

                            {!mustChangePassword && delegado && (
                                <section className="space-y-3" aria-labelledby="section-delegado">
                                    <SectionLabel icon={ShieldCheck}>
                                        <span id="section-delegado">Vinculación institucional</span>
                                    </SectionLabel>
                                    <InfoBox>
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
                                    </InfoBox>
                                </section>
                            )}

                            <section className="space-y-3" aria-labelledby="section-clave">
                                <SectionLabel icon={KeyRound}>
                                    <span id="section-clave">Contraseña</span>
                                </SectionLabel>
                                <p className="text-[12px] leading-snug text-zinc-500 dark:text-zinc-400">
                                    {mustChangePassword
                                        ? 'Requerida. Debe tener mínimo 8 caracteres.'
                                        : (
                                            <>
                                                Opcional. Mín. <span className="tabular-nums">8</span> caracteres si la cambia.
                                            </>
                                        )}
                                </p>
                                <div className="space-y-4">
                                    <FormField label="Nueva contraseña" id="profile-password" error={errors.password}>
                                        <PasswordInput
                                            id="profile-password"
                                            variant="panel"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            error={errors.password}
                                            autoComplete="new-password"
                                            placeholder={mustChangePassword ? 'Nueva contraseña' : 'Opcional'}
                                            className="block w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 dark:border-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20"
                                        />
                                    </FormField>
                                    <FormField label="Confirmación" id="profile-password-confirmation" error={errors.password_confirmation}>
                                        <PasswordInput
                                            id="profile-password-confirmation"
                                            variant="panel"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            error={errors.password_confirmation}
                                            autoComplete="new-password"
                                            placeholder="Repetir"
                                            className="block w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-[13px] text-zinc-800 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20 dark:border-zinc-700 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20"
                                        />
                                    </FormField>
                                </div>
                            </section>

                            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-200/90 to-transparent dark:via-zinc-700/70" aria-hidden />

                            <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-brand-gold/35 bg-brand-gold/15 px-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-900 transition-[background-color,border-color,opacity] duration-200 ease-out enabled:hover:border-brand-gold/50 enabled:hover:bg-brand-gold/22 disabled:cursor-not-allowed disabled:opacity-45 dark:border-brand-gold-soft/30 dark:bg-brand-gold/10 dark:text-zinc-100 dark:enabled:hover:border-brand-gold-soft/45 dark:enabled:hover:bg-brand-gold/16"
                                >
                                    <Save className="size-3.5" strokeWidth={2} />
                                    {processing ? 'Guardando…' : mustChangePassword ? 'Actualizar contraseña' : 'Guardar cambios'}
                                </button>
                                {!mustChangePassword && (
                                    <Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                        className="inline-flex items-center gap-1.5 text-left text-[12px] font-medium text-zinc-500 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:decoration-zinc-600 dark:hover:text-zinc-200"
                                    >
                                        <LogOut className="size-3" strokeWidth={2} />
                                        Cerrar sesión
                                    </Link>
                                )}
                            </footer>
                        </form>
                    </div>
                </div>
            </AdminPageShell>
        </>
    );
}

ProfileEdit.layout = createAdminPageLayout('Mi cuenta');
