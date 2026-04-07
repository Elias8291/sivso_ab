import DashboardHeader from '@/components/layout/DashboardHeader';
import Sidebar from '@/components/layout/Sidebar';
import LoadingOverlay from '@/components/ui/LoadingOverlay';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className="flex min-h-screen min-h-[100dvh] w-full font-sans text-zinc-900 dark:text-zinc-100">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            />
            <main
                className={`relative flex min-h-screen min-h-[100dvh] min-w-0 flex-1 flex-col bg-gradient-to-b from-zinc-50 via-white to-zinc-100/55 transition-[margin] duration-300 ease-in-out dark:from-zinc-950 dark:via-zinc-950 dark:to-black lg:bg-gradient-to-br lg:from-zinc-50 lg:via-white lg:to-zinc-100/50 lg:dark:from-zinc-950 lg:dark:via-black lg:dark:to-zinc-950 ${
                    sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'
                }`}
            >
                {/* Atmósfera: halos muy suaves (móvil y escritorio, intensidad responsive) */}
                <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
                    <div className="absolute -right-24 top-[10%] size-[min(22rem,70vw)] rounded-full bg-brand-gold/[0.065] blur-[72px] dark:bg-brand-gold-soft/[0.055] lg:-right-[14%] lg:top-[4%] lg:size-[34rem] lg:blur-[110px]" />
                    <div className="absolute -left-20 bottom-[14%] size-[min(20rem,65vw)] rounded-full bg-zinc-200/22 blur-[68px] dark:bg-zinc-500/[0.085] lg:-left-[12%] lg:bottom-[8%] lg:size-[30rem] lg:blur-[100px]" />
                    <div className="absolute left-1/2 top-[42%] size-[min(28rem,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-[88px] dark:bg-white/[0.028] lg:top-[38%] lg:size-[38rem] lg:blur-[128px]" />
                </div>
                <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
                    <DashboardHeader onMenuClick={() => setSidebarOpen(true)} header={header} />
                    <div className="w-full max-w-full flex-1 min-h-0 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9 xl:px-14 xl:py-10">
                        {children}
                    </div>
                </div>
            </main>
            <LoadingOverlay />
        </div>
    );
}
