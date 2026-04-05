import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';

const headerClass =
    'truncate text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg';

/** Devuelve la función `layout` de Inertia para páginas de administración. */
export function createAdminPageLayout(title) {
    return (page) => (
        <AuthenticatedLayout header={<span className={headerClass}>{title}</span>}>{page}</AuthenticatedLayout>
    );
}
