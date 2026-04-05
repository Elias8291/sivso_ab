import { createPortal } from 'react-dom';
import { Head } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function AuthLayout({
    children,
    title = 'Inicio de Sesion',
    imageSrc = null,
}) {
    const { isDarkMode, toggleTheme } = useTheme();

    const themeButton = (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleTheme();
            }}
            className="group pointer-events-auto fixed top-[max(1rem,env(safe-area-inset-top,0px))] right-[max(1rem,env(safe-area-inset-right,0px))] z-[100] min-h-[44px] min-w-[44px] touch-manipulation rounded-full border-2 border-brand-gold/40 bg-gradient-to-br from-white/95 to-[#faf8f3]/95 p-3 shadow-[0_8px_24px_rgba(212,175,55,0.2)] ring-1 ring-brand-gold/20 transition-all duration-300 ease-out hover:scale-110 hover:border-brand-gold/60 hover:shadow-[0_12px_32px_rgba(212,175,55,0.35)] hover:ring-brand-gold/40 active:scale-95 dark:border-brand-gold/30 dark:bg-gradient-to-br dark:from-[#1a1410]/95 dark:to-[#0f0c08]/95 dark:ring-brand-gold/20 dark:hover:border-brand-gold/50 dark:hover:shadow-[0_12px_32px_rgba(212,175,55,0.25)]"
            aria-label={isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'}
        >
            {isDarkMode ? (
                <Sun className="h-5 w-5 text-brand-gold/70 transition-transform duration-500 group-hover:rotate-12" aria-hidden />
            ) : (
                <Moon className="h-5 w-5 text-brand-gold/60 transition-transform duration-500 group-hover:-rotate-12" aria-hidden />
            )}
        </button>
    );

    return (
        <>
            <Head title={title} />

            <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-x-hidden overflow-y-auto overscroll-none bg-gradient-to-br from-[#faf8f3] via-[#f5f1e8] to-[#ede7dd] transition-colors duration-500 dark:bg-gradient-to-br dark:from-[#0a0805] dark:via-[#0f0c08] dark:to-[#1a1410] lg:p-8">
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
                        className="font-extralight tracking-[0.45em] text-brand-gold/[0.18] transition-all duration-500 [font-size:clamp(4.5rem,11vh,8rem)] [writing-mode:vertical-rl] [-webkit-text-stroke:1px_rgb(212_175_55_/_0.7)] dark:text-brand-gold/[0.08]"
                    >
                        SIVSO
                    </span>
                </div>

                <main className="animate-auth-card-in relative z-10 flex w-full max-w-[900px] flex-col overflow-hidden bg-gradient-to-br from-white to-[#faf8f3] shadow-[0_32px_64px_-28px_rgba(212,175,55,0.18),0_0_0_1px_rgba(212,175,55,0.1)] transition-[box-shadow,transform] duration-700 ease-out dark:from-[#1a1410] dark:to-[#0f0c08] dark:shadow-[0_32px_64px_-28px_rgba(212,175,55,0.12),0_0_0_1px_rgba(212,175,55,0.14)] lg:h-[620px] lg:flex-row lg:rounded-3xl lg:hover:shadow-[0_40px_72px_-28px_rgba(212,175,55,0.22),0_0_0_1px_rgba(212,175,55,0.14)] dark:lg:hover:shadow-[0_40px_72px_-28px_rgba(212,175,55,0.16),0_0_0_1px_rgba(212,175,55,0.18)]">
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
                            <div className="animate-auth-fade-up w-full max-w-[340px] border-0 bg-transparent px-5 py-6 text-center shadow-none delay-[240ms] sm:max-w-[360px] sm:px-6 sm:py-7 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:text-left lg:shadow-none">
                                <div className="space-y-2 lg:space-y-1">
                                    <div className="mb-2 lg:mb-0">
                                        <h1 className="text-[2.4rem] font-light uppercase tracking-[0.6em] text-brand-gold [text-shadow:0_2px_8px_rgba(212,175,55,0.2)] sm:text-[2.6rem] lg:text-[1.5rem] lg:font-light lg:tracking-[0.35em] lg:text-brand-gold/85 lg:[text-shadow:none]">
                                            SIVSO
                                        </h1>
                                    </div>

                                    <p className="text-[10px] font-light uppercase tracking-[0.15em] text-white/70 sm:text-[11px] lg:text-[10px] lg:leading-tight lg:font-light lg:tracking-[0.12em] lg:text-brand-gold/75">
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

                    <section className="relative flex w-full flex-col justify-center bg-gradient-to-br from-white to-[#faf8f3] px-6 py-12 dark:from-[#1a1410] dark:to-[#0f0c08] sm:px-8 sm:py-14 lg:w-[55%] lg:px-14 lg:py-0">
                        <div className="absolute left-0 top-1/2 hidden h-48 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-brand-gold/40 to-transparent opacity-80 lg:block dark:via-brand-gold/35" />

                        <div className="mx-auto w-full max-w-sm">{children}</div>
                    </section>
                </main>

                {typeof document !== 'undefined' ? createPortal(themeButton, document.body) : null}
            </div>
        </>
    );
}
