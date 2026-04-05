import DashboardHeader from '@/components/layout/DashboardHeader';
import Sidebar from '@/components/layout/Sidebar';
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
                className={`relative flex min-h-screen min-h-[100dvh] min-w-0 flex-1 flex-col bg-zinc-50 transition-[margin] duration-300 ease-in-out dark:bg-black ${
                    sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-56'
                }`}
            >
                <span
                    className="pointer-events-none absolute inset-0 z-0 flex select-none items-center justify-center overflow-hidden"
                    aria-hidden="true"
                >
                    <span className="text-[7.5rem] font-black italic leading-none tracking-[0.2em] text-brand-gold/10 dark:text-brand-gold/20 sm:text-[16rem] lg:text-[20rem]">
                        SIVSO
                    </span>
                </span>
                <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
                    <DashboardHeader onMenuClick={() => setSidebarOpen(true)} header={header} />
                    <div className="w-full max-w-full flex-1 min-h-0 overflow-x-hidden px-4 py-5 sm:px-6 sm:py-7 lg:px-10 lg:py-9 xl:px-14 xl:py-10">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
