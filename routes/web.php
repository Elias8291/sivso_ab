<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\PeriodoController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SolicitudMovimientoController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Delegado\MiDelegacionController;
use App\Http\Controllers\Estructura\DelegacionController;
use App\Http\Controllers\Estructura\DelegadoController;
use App\Http\Controllers\Estructura\DependenciaController;
use App\Http\Controllers\Estructura\EmpleadoController;
use App\Http\Controllers\NotificacionesController;
use App\Http\Controllers\Profile\ProfileController;
use App\Support\SivsoPermissions;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('guest')->group(function (): void {
    Route::get('/', [AuthenticatedSessionController::class, 'create'])->name('home');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login');
});

Route::middleware('auth')->group(function (): void {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard'))->name('dashboard');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    $sidebarPlaceholder = static fn () => Inertia::render('Dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('/mi-delegacion', [MiDelegacionController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_MI_DELEGACION)
        ->name('my-delegation.index');
    Route::patch('/mi-delegacion/asignacion/{asignacion}/talla', [MiDelegacionController::class, 'actualizarTalla'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_MI_DELEGACION)
        ->name('my-delegation.talla.update');
    Route::post('/mi-delegacion/empleado/{empleado}/solicitud', [MiDelegacionController::class, 'solicitarMovimiento'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_MI_DELEGACION)
        ->name('my-delegation.solicitar');
    Route::delete('/mi-delegacion/solicitud/{solicitud}', [MiDelegacionController::class, 'cancelarSolicitud'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_MI_DELEGACION)
        ->name('my-delegation.solicitud.cancelar');
    Route::patch('/mi-delegacion/empleado/{empleado}/reactivar', [MiDelegacionController::class, 'reactivarEmpleado'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_MI_DELEGACION)
        ->name('my-delegation.empleado.reactivar');

    Route::get('/solicitudes-movimiento', [SolicitudMovimientoController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_SOLICITUDES)
        ->name('solicitudes-movimiento.index');
    Route::patch('/solicitudes-movimiento/{solicitud}/resolver', [SolicitudMovimientoController::class, 'resolver'])
        ->middleware('permission:'.SivsoPermissions::RESOLVER_SOLICITUDES)
        ->name('solicitudes-movimiento.resolver');

    Route::get('/notificaciones', [NotificacionesController::class, 'index'])->name('notificaciones.index');
    Route::get('/notificaciones/poll/no-leidas', [NotificacionesController::class, 'unreadPoll'])->name('notificaciones.unread-poll');
    Route::post('/notificaciones/{id}/leer', [NotificacionesController::class, 'leer'])->name('notificaciones.leer');
    Route::post('/notificaciones/leer-todas', [NotificacionesController::class, 'leerTodas'])->name('notificaciones.leer-todas');

    Route::get('/empleados', [EmpleadoController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_EMPLEADOS)
        ->name('empleados.index');
    Route::post('/empleados', [EmpleadoController::class, 'store'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_EMPLEADOS)
        ->name('empleados.store');
    Route::patch('/empleados/{empleado}', [EmpleadoController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_EMPLEADOS)
        ->name('empleados.update');
    Route::delete('/empleados/{empleado}', [EmpleadoController::class, 'destroy'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_EMPLEADOS)
        ->name('empleados.destroy');

    Route::get('/productos', $sidebarPlaceholder)
        ->middleware('permission:'.SivsoPermissions::VER_PRODUCTOS)
        ->name('productos.index');
    Route::get('/partidas', $sidebarPlaceholder)
        ->middleware('permission:'.SivsoPermissions::VER_PARTIDAS)
        ->name('partidas.index');
    Route::get('/partidas-especificas', $sidebarPlaceholder)
        ->middleware('permission:'.SivsoPermissions::VER_LINEAS_PRESUPUESTALES)
        ->name('partidas-especificas.index');

    Route::get('/dependencias', [DependenciaController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_DEPENDENCIAS)
        ->name('dependencias.index');
    Route::post('/dependencias', [DependenciaController::class, 'store'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DEPENDENCIAS)
        ->name('dependencias.store');
    Route::patch('/dependencias/{dependencia}', [DependenciaController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DEPENDENCIAS)
        ->name('dependencias.update');
    Route::delete('/dependencias/{dependencia}', [DependenciaController::class, 'destroy'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DEPENDENCIAS)
        ->name('dependencias.destroy');

    Route::get('/delegaciones', [DelegacionController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_DELEGACIONES)
        ->name('delegaciones.index');
    Route::post('/delegaciones', [DelegacionController::class, 'store'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGACIONES)
        ->name('delegaciones.store');
    Route::patch('/delegaciones/{delegacion}', [DelegacionController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGACIONES)
        ->name('delegaciones.update');
    Route::delete('/delegaciones/{delegacion}', [DelegacionController::class, 'destroy'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGACIONES)
        ->name('delegaciones.destroy');

    Route::get('/delegados', [DelegadoController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_DELEGADOS)
        ->name('delegados.index');
    Route::get('/delegados/buscar-empleados', [DelegadoController::class, 'buscarEmpleados'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGADOS)
        ->name('delegados.buscar-empleados');
    Route::post('/delegados', [DelegadoController::class, 'store'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGADOS)
        ->name('delegados.store');
    Route::patch('/delegados/{delegado}', [DelegadoController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGADOS)
        ->name('delegados.update');
    Route::delete('/delegados/{delegado}', [DelegadoController::class, 'destroy'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGADOS)
        ->name('delegados.destroy');

    Route::get('/periodos', [PeriodoController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_PERIODOS)
        ->name('periodos.index');
    Route::post('/periodos', [PeriodoController::class, 'store'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_PERIODOS)
        ->name('periodos.store');

    Route::get('/users', [UserController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_USUARIOS)
        ->name('users.index');
    Route::post('/users', [UserController::class, 'store'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_USUARIOS)
        ->name('users.store');
    Route::patch('/users/{user}', [UserController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_USUARIOS)
        ->name('users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_USUARIOS)
        ->name('users.destroy');

    Route::get('/roles', [RoleController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_ROLES)
        ->name('roles.index');
    Route::post('/roles', [RoleController::class, 'store'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_ROLES)
        ->name('roles.store');
    Route::patch('/roles/{role}', [RoleController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_ROLES)
        ->name('roles.update');
    Route::delete('/roles/{role}', [RoleController::class, 'destroy'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_ROLES)
        ->name('roles.destroy');

    Route::get('/permissions', [PermissionController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_PERMISOS)
        ->name('permissions.index');
    Route::post('/permissions', [PermissionController::class, 'store'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_PERMISOS)
        ->name('permissions.store');
    Route::patch('/permissions/{permission}', [PermissionController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_PERMISOS)
        ->name('permissions.update');
    Route::delete('/permissions/{permission}', [PermissionController::class, 'destroy'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_PERMISOS)
        ->name('permissions.destroy');
});
