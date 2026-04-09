import { Head } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function AuthLayout({
    children,
    title = 'Inicio de Sesion',
    imageSrc = null,
}) {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <>
            <Head title={title} />

            <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden overflow-y-auto overscroll-none bg-gradient-to-br from-[#faf8f3] via-[#f5f1e8] to-[#ede7dd] transition-colors duration-500 dark:bg-gradient-to-br dark:from-black dark:via-zinc-950 dark:to-zinc-900 lg:p-8">
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
                    <div className="animate-auth-orb-1 absolute -top-40 -right-40 h-[700px] w-[700px] rounded-full bg-gradient-to-br from-brand-gold/[0.15] to-brand-gold/[0.05] blur-[140px] dark:from-brand-gold/[0.12] dark:to-brand-gold/[0.04]" />
                    <div className="animate-auth-orb-2 absolute -bottom-40 -left-40 h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-brand-gold/[0.10] to-brand-gold/[0.02] blur-[140px] dark:from-brand-gold/[0.08] dark:to-brand-gold/[0.01]" />
                    <div className="animate-auth-orb-3 absolute top-1/3 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-brand-gold/[0.04] blur-[100px] dark:bg-brand-gold/[0.02]" />
                </div>

                <div
                    className="animate-auth-vertical-sivso pointer-events-none absolute inset-y-0 right-6 z-[1] hidden select-none items-center lg:flex xl:right-12"
                    aria-hidden
                >
                    <span
                        className="font-extralight tracking-[0.42em] text-brand-gold/[0.14] transition-all duration-500 [font-size:clamp(4rem,10vh,7.5rem)] [writing-mode:vertical-rl] [-webkit-text-stroke:0.5px_rgb(212_175_55_/_0.45)] dark:text-brand-gold/[0.07]"
                    >
                        SIVSO
                    </span>
                </div>

                <main className="animate-auth-card-in relative z-10 flex w-full max-w-[900px] flex-col overflow-hidden bg-gradient-to-br from-white to-[#faf8f3] shadow-[0_32px_64px_-28px_rgba(212,175,55,0.18),0_0_0_1px_rgba(212,175,55,0.1)] transition-[box-shadow,transform] duration-700 ease-out dark:from-zinc-950 dark:to-black dark:shadow-[0_32px_64px_-28px_rgba(0,0,0,0.5),0_0_0_1px_rgba(63,63,70,0.8)] lg:h-[620px] lg:flex-row lg:rounded-3xl lg:hover:shadow-[0_40px_72px_-28px_rgba(212,175,55,0.22),0_0_0_1px_rgba(212,175,55,0.14)] dark:lg:hover:shadow-[0_40px_72px_-28px_rgba(0,0,0,0.62),0_0_0_1px_rgba(82,82,91,0.9)]">
                    <section className="relative min-h-[280px] w-full shrink-0 overflow-hidden sm:min-h-[320px] lg:h-full lg:min-h-0 lg:w-[45%]">
                        <div className="absolute inset-0 bg-[#0c0c0e]" />

                        {imageSrc ? (
                            <div className="absolute inset-0 overflow-hidden">
                                <img
                                    src={imageSrc}
                                    alt=""
                                    aria-hidden
                                    className="animate-auth-hero-ken absolute inset-0 h-full min-h-[102%] w-full object-cover object-[center_22%] sm:object-center lg:object-[center_32%]"
                                />
                            </div>
                        ) : null}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

                        <div
                            className="absolute inset-0 z-[5] bg-black/20 backdrop-blur-sm lg:hidden"
                            aria-hidden
                        />

                        <div className="relative z-10 flex h-full min-h-[280px] flex-col items-center justify-end px-4 pb-12 sm:min-h-[320px] sm:px-6 lg:min-h-0 lg:items-start lg:justify-end lg:px-8 lg:pb-8">
                            <div className="w-full max-w-[340px] border-0 bg-transparent px-5 py-6 text-center shadow-none sm:max-w-[360px] sm:px-6 sm:py-7 lg:max-w-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:text-left lg:shadow-none">
                                <div className="flex flex-col items-center gap-4 lg:items-start lg:gap-5">
                                    <div className="animate-auth-brand-float flex flex-col items-center gap-3 lg:items-start lg:gap-4">
                                        <h1 className="animate-auth-brand-title max-w-[min(100%,20rem)] text-[clamp(1.5rem,5vw+0.55rem,2.25rem)] font-extralight uppercase leading-none tracking-[0.14em] text-white antialiased drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)] sm:max-w-none sm:text-[2.2rem] sm:tracking-[0.18em] lg:max-w-none lg:text-[clamp(1.95rem,2.6vw+1.15rem,3.15rem)] lg:font-light lg:leading-[1.05] lg:tracking-[0.22em] lg:text-brand-gold lg:drop-shadow-[0_4px_28px_rgba(0,0,0,0.55),0_0_40px_rgba(212,175,55,0.28)]">
                                            SIVSO
                                        </h1>
                                        <span
                                            className="animate-auth-brand-line block h-px w-10 rounded-full bg-gradient-to-r from-transparent via-brand-gold to-transparent sm:w-12 lg:h-0.5 lg:w-16 lg:from-brand-gold/20 lg:via-brand-gold lg:to-brand-gold-soft/80 xl:w-20"
                                            aria-hidden
                                        />
                                    </div>

                                    <p className="animate-auth-brand-tagline max-w-[17.5rem] text-[10px] font-light leading-relaxed tracking-[0.06em] text-white/55 sm:max-w-none sm:text-[11px] lg:max-w-[min(100%,19rem)] lg:text-[13px] lg:font-medium lg:leading-snug lg:tracking-[0.12em] lg:text-white/92 lg:drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] xl:max-w-[21rem] xl:text-sm xl:tracking-[0.11em]">
                                        Sistema Integral de Vestuario Sindicato
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="pointer-events-none absolute bottom-[-1px] left-0 z-20 w-full lg:hidden">
                            <svg viewBox="0 0 1440 60" className="block h-auto w-full" preserveAspectRatio="none">
                                <path
                                    d="M0 60H1440V24C1200 6 960 0 720 0C480 0 240 6 0 24V60Z"
                                    className="fill-white dark:fill-[#09090b]"
                                />
                            </svg>
                        </div>
                    </section>

                    <section className="relative flex w-full flex-col justify-center bg-gradient-to-br from-white to-[#faf8f3] px-6 py-12 dark:from-zinc-950 dark:to-black sm:px-8 sm:py-14 lg:w-[55%] lg:px-14 lg:py-0">
                        <div className="absolute left-0 top-1/2 hidden h-48 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-brand-gold/40 to-transparent opacity-80 lg:block dark:via-brand-gold/35" />

                        <div className="mx-auto w-full max-w-sm">
                            <div className="mb-5 flex justify-end sm:mb-6">
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleTheme();
                                    }}
                                    className="group inline-flex min-h-[44px] min-w-[44px] touch-manipulation items-center justify-center rounded-full border-2 border-brand-gold/40 bg-gradient-to-br from-white/95 to-[#faf8f3]/95 p-3 shadow-[0_8px_24px_rgba(212,175,55,0.2)] ring-1 ring-brand-gold/20 transition-all duration-300 ease-out hover:scale-105 hover:border-brand-gold/60 hover:shadow-[0_12px_32px_rgba(212,175,55,0.35)] hover:ring-brand-gold/40 active:scale-95 dark:border-zinc-700/80 dark:bg-gradient-to-br dark:from-black/95 dark:to-zinc-900/95 dark:ring-zinc-700/60 dark:hover:border-zinc-500 dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.55)]"
                                    aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
                                >
                                    {isDarkMode ? (
                                        <Sun className="h-5 w-5 text-brand-gold/70 transition-transform duration-500 group-hover:rotate-12" aria-hidden />
                                    ) : (
                                        <Moon className="h-5 w-5 text-brand-gold/60 transition-transform duration-500 group-hover:-rotate-12" aria-hidden />
                                    )}
                                </button>
                            </div>
                            {children}
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}
