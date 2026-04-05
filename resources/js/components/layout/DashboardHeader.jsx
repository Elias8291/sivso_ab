import NotificationBell from '@/components/layout/NotificationBell';
import { useTheme } from '@/contexts/ThemeContext';
import { Menu, Moon, Sun } from 'lucide-react';

export default function DashboardHeader({ onMenuClick, header }) {
    const { isDarkMode, toggleTheme } = useTheme();

    return (
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-zinc-200/60 bg-zinc-50/95 px-4 backdrop-blur-md dark:border-zinc-800/60 dark:bg-black/95 dark:backdrop-blur-none sm:px-8 lg:px-16 xl:px-20">
            <div className="flex min-w-0 flex-1 items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200/90 text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900 lg:hidden"
                    aria-label="Abrir menú"
                >
                    <Menu className="size-5" aria-hidden />
                </button>
                <div className="min-w-0 text-zinc-900 dark:text-zinc-50">{header}</div>
            </div>

            <div className="flex items-center gap-2">
                <NotificationBell />
                <button
                    type="button"
                    onClick={toggleTheme}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-zinc-200/90 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
                    aria-label={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
                >
                    {isDarkMode ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </button>
            </div>
        </header>
    );
}
