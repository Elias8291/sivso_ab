<?php

declare(strict_types=1);

use App\Http\Controllers\AcuseReciboPublicController;
use App\Http\Controllers\Admin\PeriodoController;
use App\Http\Controllers\Admin\PermissionController;
use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\SolicitudMovimientoController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Delegado\MiDelegacionController;
use App\Http\Controllers\Estructura\DelegacionController;
use App\Http\Controllers\Estructura\IndependienteController;
use App\Http\Controllers\Estructura\DelegadoController;
use App\Http\Controllers\Estructura\DependenciaController;
use App\Http\Controllers\Estructura\EmpleadoController;
use App\Http\Controllers\NotificacionesController;
use App\Http\Controllers\Profile\ProfileController;
use App\Http\Controllers\Vestuario\PartidaController;
use App\Http\Controllers\Vestuario\ProductoController;
use App\Http\Controllers\Vestuario\ResumenVestuarioController;
use App\Support\SivsoPermissions;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function (): void {
    Route::get('/', [AuthenticatedSessionController::class, 'create'])->name('home');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('throttle:login')
        ->name('login');
});

Route::get('/acuse-vestuario/r/{token}', [AcuseReciboPublicController::class, 'show'])
    ->middleware(['signed', 'throttle:45,1'])
    ->name('acuse-vestuario.recibo');

Route::middleware(['auth', 'password.changed'])->group(function (): void {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
    Route::get('/cambiar-contrasena-inicial', [AuthenticatedSessionController::class, 'forcePasswordChange'])
        ->name('auth.password.change');
    Route::patch('/cambiar-contrasena-inicial', [AuthenticatedSessionController::class, 'updateInitialPassword'])
        ->name('auth.password.update');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');

    Route::get('/vestuario/resumen', [ResumenVestuarioController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_COTEJO_VESTUARIO)
        ->name('vestuario.resumen');

    Route::redirect('/delegado/panel', '/dashboard')->name('delegado.panel');

    Route::get('/mi-delegacion', [MiDelegacionController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_MI_DELEGACION)
        ->name('my-delegation.index');
    Route::patch('/mi-delegacion/asignacion/{asignacion}/talla', [MiDelegacionController::class, 'actualizarTalla'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_MI_DELEGACION)
        ->name('my-delegation.talla.update');
    Route::patch('/mi-delegacion/empleado/{empleado}/vestuario-lote', [MiDelegacionController::class, 'actualizarTallasLote'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_MI_DELEGACION)
        ->name('my-delegation.vestuario.lote');
    Route::post('/mi-delegacion/empleado/{empleado}/solicitud', [MiDelegacionController::class, 'solicitarMovimiento'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_MI_DELEGACION)
        ->name('my-delegation.solicitar');
    Route::delete('/mi-delegacion/solicitud/{solicitud}', [MiDelegacionController::class, 'cancelarSolicitud'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_MI_DELEGACION)
        ->name('my-delegation.solicitud.cancelar');
    Route::patch('/mi-delegacion/empleado/{empleado}/reactivar', [MiDelegacionController::class, 'reactivarEmpleado'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_MI_DELEGACION)
        ->name('my-delegation.empleado.reactivar');
    Route::get('/mi-delegacion/empleado/{empleado}/vestuario', [MiDelegacionController::class, 'vestuarioEmpleado'])
        ->middleware('permission:'.SivsoPermissions::VER_MI_DELEGACION)
        ->name('my-delegation.empleado.vestuario');
    Route::get('/mi-delegacion/empleado/{empleado}/productos', [MiDelegacionController::class, 'productosEmpleado'])
        ->middleware('permission:'.SivsoPermissions::VER_MI_DELEGACION)
        ->name('my-delegation.empleado.productos');
    Route::get('/mi-delegacion/empleado/{empleado}/acuse-recibo', [MiDelegacionController::class, 'acuseReciboPdf'])
        ->middleware('permission:'.SivsoPermissions::VER_MI_DELEGACION)
        ->name('my-delegation.empleado.acuse-pdf');

    Route::get('/solicitudes-movimiento', [SolicitudMovimientoController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_SOLICITUDES)
        ->name('solicitudes-movimiento.index');
    Route::get('/solicitudes-movimiento/{solicitud}/empleado-vestuario', [SolicitudMovimientoController::class, 'empleadoVestuario'])
        ->middleware('permission:'.SivsoPermissions::VER_SOLICITUDES)
        ->name('solicitudes-movimiento.empleado-vestuario');
    Route::patch('/solicitudes-movimiento/{solicitud}/resolver', [SolicitudMovimientoController::class, 'resolver'])
        ->middleware('permission:'.SivsoPermissions::RESOLVER_SOLICITUDES)
        ->name('solicitudes-movimiento.resolver');

    Route::get('/notificaciones', [NotificacionesController::class, 'index'])->name('notificaciones.index');
    Route::get('/notificaciones/stream', [NotificacionesController::class, 'stream'])->name('notificaciones.stream');
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

    Route::get('/productos', [ProductoController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_PRODUCTOS)
        ->name('productos.index');
    Route::patch('/productos/{tipo}/{id}', [ProductoController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_PRODUCTOS)
        ->name('productos.update');
    Route::get('/partidas', [PartidaController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_PARTIDAS)
        ->name('partidas.index');

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
    Route::post('/delegaciones/{delegacion}/alertar', [DelegacionController::class, 'alertar'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGACIONES)
        ->name('delegaciones.alertar');

    Route::get('/independientes', [IndependienteController::class, 'index'])
        ->middleware('permission:'.SivsoPermissions::VER_DELEGACIONES)
        ->name('independientes.index');
    Route::post('/independientes', [IndependienteController::class, 'store'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGACIONES)
        ->name('independientes.store');
    Route::patch('/independientes/{independiente}', [IndependienteController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGACIONES)
        ->name('independientes.update');
    Route::delete('/independientes/{independiente}', [IndependienteController::class, 'destroy'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_DELEGACIONES)
        ->name('independientes.destroy');

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
    Route::put('/periodos/{periodo}', [PeriodoController::class, 'update'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_PERIODOS)
        ->name('periodos.update');
    Route::delete('/periodos/{periodo}', [PeriodoController::class, 'destroy'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_PERIODOS)
        ->name('periodos.destroy');
    Route::post('/periodos/{periodo}/toggle', [PeriodoController::class, 'toggle'])
        ->middleware('permission:'.SivsoPermissions::GESTIONAR_PERIODOS)
        ->name('periodos.toggle');

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
