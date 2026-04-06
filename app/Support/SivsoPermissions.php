<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Catálogo único de permisos (nombre en español, corto).
 * Las claves son los textos que ven usuario y código (Spatie, React, rutas).
 */
final class SivsoPermissions
{
    public const VER_MI_DELEGACION = 'Ver mi delegación';

    public const VER_COTEJO_VESTUARIO = 'Ver cotejo vestuario';

    public const GESTIONAR_MI_DELEGACION = 'Gestionar mi delegación';

    public const VER_EMPLEADOS = 'Ver empleados';

    public const GESTIONAR_EMPLEADOS = 'Gestionar empleados';

    public const VER_PRODUCTOS = 'Ver productos';

    public const GESTIONAR_PRODUCTOS = 'Gestionar productos';

    public const VER_PARTIDAS = 'Ver partidas';

    public const GESTIONAR_PARTIDAS = 'Gestionar partidas';

    public const VER_DEPENDENCIAS = 'Ver dependencias';

    public const GESTIONAR_DEPENDENCIAS = 'Gestionar dependencias';

    public const VER_DELEGACIONES = 'Ver delegaciones';

    public const GESTIONAR_DELEGACIONES = 'Gestionar delegaciones';

    public const VER_DELEGADOS = 'Ver delegados';

    public const GESTIONAR_DELEGADOS = 'Gestionar delegados';

    public const VER_PERIODOS = 'Ver periodos';

    public const GESTIONAR_PERIODOS = 'Gestionar periodos';

    public const VER_USUARIOS = 'Ver usuarios';

    public const GESTIONAR_USUARIOS = 'Gestionar usuarios';

    public const VER_ROLES = 'Ver roles';

    public const GESTIONAR_ROLES = 'Gestionar roles';

    public const VER_PERMISOS = 'Ver permisos';

    public const GESTIONAR_PERMISOS = 'Gestionar permisos';

    public const VER_SOLICITUDES = 'Ver solicitudes';

    public const RESOLVER_SOLICITUDES = 'Resolver solicitudes';

    public const ROLE_ADMIN_SIVSO = 'Administrador SIVSO';

    public const ROLE_DELEGADO = 'Delegado';

    /**
     * @return list<array{name: string, descripcion: string}>
     */
    public static function catalog(): array
    {
        return [
            ['name' => self::VER_MI_DELEGACION, 'descripcion' => 'Ver Mi delegación y asignaciones.'],
            ['name' => self::VER_COTEJO_VESTUARIO, 'descripcion' => 'Ver resumen y cotejo general de vestuario por UR/delegación.'],
            ['name' => self::GESTIONAR_MI_DELEGACION, 'descripcion' => 'Cambiar tallas y gestionar solicitudes propias.'],
            ['name' => self::VER_EMPLEADOS, 'descripcion' => 'Listar y consultar empleados.'],
            ['name' => self::GESTIONAR_EMPLEADOS, 'descripcion' => 'Alta, edición y baja de empleados.'],
            ['name' => self::VER_PRODUCTOS, 'descripcion' => 'Consultar catálogo de productos.'],
            ['name' => self::GESTIONAR_PRODUCTOS, 'descripcion' => 'Administrar productos de vestuario.'],
            ['name' => self::VER_PARTIDAS, 'descripcion' => 'Consultar partidas.'],
            ['name' => self::GESTIONAR_PARTIDAS, 'descripcion' => 'Administrar partidas.'],
            ['name' => self::VER_DEPENDENCIAS, 'descripcion' => 'Listar dependencias.'],
            ['name' => self::GESTIONAR_DEPENDENCIAS, 'descripcion' => 'Alta, edición y baja de dependencias.'],
            ['name' => self::VER_DELEGACIONES, 'descripcion' => 'Listar delegaciones.'],
            ['name' => self::GESTIONAR_DELEGACIONES, 'descripcion' => 'Alta, edición y baja de delegaciones.'],
            ['name' => self::VER_DELEGADOS, 'descripcion' => 'Listar delegados.'],
            ['name' => self::GESTIONAR_DELEGADOS, 'descripcion' => 'Alta, edición, vínculos y baja de delegados.'],
            ['name' => self::VER_PERIODOS, 'descripcion' => 'Consultar periodos de ejercicio.'],
            ['name' => self::GESTIONAR_PERIODOS, 'descripcion' => 'Administrar periodos.'],
            ['name' => self::VER_USUARIOS, 'descripcion' => 'Listar usuarios del sistema.'],
            ['name' => self::GESTIONAR_USUARIOS, 'descripcion' => 'Alta, edición y baja de usuarios.'],
            ['name' => self::VER_ROLES, 'descripcion' => 'Consultar roles.'],
            ['name' => self::GESTIONAR_ROLES, 'descripcion' => 'Administrar roles y permisos.'],
            ['name' => self::VER_PERMISOS, 'descripcion' => 'Listar permisos.'],
            ['name' => self::GESTIONAR_PERMISOS, 'descripcion' => 'Crear permisos adicionales.'],
            ['name' => self::VER_SOLICITUDES, 'descripcion' => 'Ver solicitudes de movimiento.'],
            ['name' => self::RESOLVER_SOLICITUDES, 'descripcion' => 'Aprobar o rechazar solicitudes.'],
        ];
    }

    /**
     * @return list<string>
     */
    public static function names(): array
    {
        return array_values(array_column(self::catalog(), 'name'));
    }
}
