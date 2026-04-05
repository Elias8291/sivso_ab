import { Link } from '@inertiajs/react';

/**
 * Paginación Laravel (LengthAwarePaginator) serializada por Inertia.
 *
 * @param {{ pagination: { links?: { url: string|null, label: string, active: boolean }[], last_page?: number, total?: number } }} props
 */
export default function TablePagination({ pagination }) {
    const lastPage = pagination?.last_page ?? 1;
    const total = pagination?.total ?? 0;

    if (total === 0 || lastPage <= 1 || !pagination?.links?.length) {
        return null;
    }

    return (
        <nav className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1" aria-label="Paginación">
            <span className="text-[11px] tabular-nums text-zinc-400 dark:text-zinc-600">
                {total} registro{total !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-x-0.5">
                {pagination.links.map((link, index) =>
                    link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            preserveScroll
                            className={`inline-flex min-w-7 items-center justify-center rounded-md px-2 py-1 text-xs transition-all duration-150 ${
                                link.active
                                    ? 'bg-zinc-900 font-medium text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900'
                                    : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
                            }`}
                        >
                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                        </Link>
                    ) : (
                        <span
                            key={index}
                            className="inline-flex min-w-7 items-center justify-center px-2 py-1 text-xs text-zinc-300 dark:text-zinc-700"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ),
                )}
            </div>
        </nav>
    );
}
