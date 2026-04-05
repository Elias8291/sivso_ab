import { usePage } from '@inertiajs/react';
import { useCallback } from 'react';

/**
 * Comprueba permiso compartiendo la misma lógica que el Sidebar (super admin, rol SIVSO, o permiso explícito).
 */
export function useAuthCan() {
    const { auth } = usePage().props;
    const isSuperAdmin = Boolean(auth?.is_super_admin);
    const isSivsoAdministrator = Boolean(auth?.is_sivso_administrator);
    const permissions = Array.isArray(auth?.permissions) ? auth.permissions : [];

    return useCallback(
        (name) => isSuperAdmin || isSivsoAdministrator || permissions.includes(name),
        [isSuperAdmin, isSivsoAdministrator, permissions],
    );
}
