import Modal from '@/components/admin/Modal';

/**
 * @param {{ open: boolean, onClose: () => void, onConfirm: () => void, title?: string, message: string, processing?: boolean }} props
 */
export default function ConfirmDeleteModal({
    open,
    onClose,
    onConfirm,
    title = 'Confirmar eliminación',
    message,
    processing = false,
}) {
    return (
        <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
            <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">{message}</p>
            <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800/60">
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-[13px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    disabled={processing}
                    onClick={onConfirm}
                    className="rounded-lg bg-red-600 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                    {processing ? 'Eliminando…' : 'Eliminar'}
                </button>
            </div>
        </Modal>
    );
}
