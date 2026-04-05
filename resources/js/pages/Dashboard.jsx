import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

function DashboardPage({ auth }) {
    return (
        <>
            <Head title="Panel" />
            <div className="mx-auto max-w-5xl">
                <p className="text-zinc-700 dark:text-zinc-400">
                    Sesión iniciada como{' '}
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {auth?.user?.rfc ?? auth?.user?.email}
                    </span>
                    . Aquí irá el panel de la aplicación.
                </p>
            </div>
        </>
    );
}

DashboardPage.layout = (page) => (
    <AuthenticatedLayout
        header={
            <span className="truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg">
                Panel principal
            </span>
        }
    >
        {page}
    </AuthenticatedLayout>
);

export default DashboardPage;
