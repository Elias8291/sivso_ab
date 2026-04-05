<?php

declare(strict_types=1);

namespace App\Http\Controllers\Estructura;

use App\Http\Controllers\Controller;
use App\Http\Requests\Estructura\DelegadoUpdateVinculosRequest;
use App\Models\Delegado;
use App\Models\Empleado;
use App\Models\User;
use App\Services\Delegado\CrearUsuarioDelegadoService;
use App\Services\Delegado\VinculoDelegadoService;
use App\Support\AssignableWebRoles;
use App\Support\EmpleadoBusqueda;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class DelegadoController extends Controller
{
    public function __construct(
        private readonly VinculoDelegadoService $vinculoDelegadoService,
        private readonly CrearUsuarioDelegadoService $crearUsuarioDelegadoService,
    ) {}

    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $delegados = Delegado::query()
            ->with([
                'delegaciones:codigo',
                'user:id,name,email,rfc,nue',
                'empleado:id,nue,nombre,apellido_paterno,apellido_materno,delegacion_codigo',
            ])
            ->when($search, function ($query, $search) {
                $query->where('nombre_completo', 'like', "%{$search}%")
                      ->orWhere('nue', 'like', "%{$search}%")
                      ->orWhereHas('delegaciones', function ($q) use ($search) {
                          $q->where('codigo', 'like', "%{$search}%");
                      })
                      ->orWhereHas('empleado', function ($q) use ($search) {
                          $q->where('nue', 'like', "%{$search}%")
                              ->orWhere('nombre', 'like', "%{$search}%")
                              ->orWhere('apellido_paterno', 'like', "%{$search}%");
                      });
            })
            ->orderBy('nombre_completo')
            ->paginate(15)
            ->withQueryString()
            ->through(static fn (Delegado $row) => [
                'id'              => $row->id,
                'nombre_completo' => $row->nombre_completo,
                'nue'             => $row->nue,
                'user_id'         => $row->user_id,
                'usuario'         => $row->user
                    ? [
                        'id'    => $row->user->id,
                        'name'  => $row->user->name,
                        'email' => $row->user->email,
                        'rfc'   => $row->user->rfc,
                        'nue'   => $row->user->nue,
                    ]
                    : null,
                'empleado_id' => $row->empleado_id,
                'empleado'    => $row->empleado
                    ? [
                        'id'                => $row->empleado->id,
                        'nue'               => $row->empleado->nue,
                        'nombre_completo'   => strtoupper(trim("{$row->empleado->apellido_paterno} {$row->empleado->apellido_materno} {$row->empleado->nombre}")),
                        'delegacion_codigo' => $row->empleado->delegacion_codigo,
                    ]
                    : null,
                'delegaciones'      => $row->delegaciones->pluck('codigo')->implode(', '),
                'delegaciones_codigos' => $row->delegaciones->pluck('codigo')->values()->all(),
            ]);

        $usuariosParaVincular = User::query()
            ->where('activo', true)
            ->orderBy('name')
            ->get(['id', 'name', 'rfc', 'nue'])
            ->map(static fn (User $u) => [
                'id'    => $u->id,
                'label' => trim($u->name . ($u->rfc ? ' · ' . $u->rfc : '') . ($u->nue ? ' · NUE ' . $u->nue : '')),
            ])
            ->values()
            ->all();

        return Inertia::render('Estructura/Delegados/Index', [
            'delegados'            => $delegados,
            'usuariosParaVincular' => $usuariosParaVincular,
            'rolesDisponibles'     => AssignableWebRoles::options(),
            'filters'              => $request->only(['search']),
        ]);
    }

    /**
     * Búsqueda rápida de empleados para vincular a un delegado (filtrado por sus delegaciones si se envía delegado_id).
     */
    public function buscarEmpleados(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q'           => ['required', 'string', 'min:2', 'max:80'],
            'delegado_id' => ['nullable', 'integer', 'exists:delegado,id'],
        ]);

        $q = trim($validated['q']);

        $delegacionCodigos = null;
        $sinDelegaciones   = false;

        if (! empty($validated['delegado_id'])) {
            $delegadoRef = Delegado::query()
                ->with('delegaciones:codigo')
                ->find((int) $validated['delegado_id']);

            if ($delegadoRef === null) {
                return response()->json([
                    'data'    => [],
                    'message' => '',
                    'errors'  => null,
                    'meta'    => ['sin_delegaciones_asignadas' => true, 'delegaciones' => []],
                ]);
            }

            $delegacionCodigos = $delegadoRef->delegaciones->pluck('codigo')->values()->all();
            if ($delegacionCodigos === []) {
                $sinDelegaciones = true;
            }
        }

        if ($sinDelegaciones) {
            return response()->json([
                'data'    => [],
                'message' => 'Este delegado no tiene delegaciones asignadas; no se puede filtrar el personal. Asigne delegaciones primero o use la búsqueda global al crear un delegado nuevo.',
                'errors'  => null,
                'meta'    => [
                    'sin_delegaciones_asignadas' => true,
                    'delegaciones'               => [],
                ],
            ]);
        }

        $query = Empleado::query()
            ->select(['id', 'nue', 'nombre', 'apellido_paterno', 'apellido_materno', 'delegacion_codigo']);

        EmpleadoBusqueda::aplicarTerminos($query, $q);

        if ($delegacionCodigos !== null) {
            $query->whereIn('delegacion_codigo', $delegacionCodigos);
        }

        $items = $query
            ->orderBy('apellido_paterno')
            ->orderBy('apellido_materno')
            ->orderBy('nombre')
            ->limit(30)
            ->get()
            ->map(static function (Empleado $e): array {
                $nombreCompleto = strtoupper(trim("{$e->apellido_paterno} {$e->apellido_materno} {$e->nombre}"));

                return [
                    'id'                => $e->id,
                    'nombre_completo'   => $nombreCompleto,
                    'nue'               => $e->nue,
                    'delegacion_codigo' => $e->delegacion_codigo,
                    'label'             => $nombreCompleto
                        . ' · NUE ' . ($e->nue ?? '—')
                        . ' · ' . $e->delegacion_codigo,
                ];
            })
            ->values()
            ->all();

        return response()->json([
            'data'    => $items,
            'message' => '',
            'errors'  => null,
            'meta'    => [
                'sin_delegaciones_asignadas' => false,
                'delegaciones'               => $delegacionCodigos ?? [],
                'filtrado_por_delegacion'    => $delegacionCodigos !== null,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nombre_completo' => ['required_without:empleado_id', 'nullable', 'string', 'max:240'],
            'nue'             => ['required_without:empleado_id', 'nullable', 'string', 'max:15'],
            'empleado_id'     => [
                'nullable',
                'integer',
                Rule::exists('empleado', 'id'),
                Rule::unique('delegado', 'empleado_id'),
            ],
        ]);

        $empleado = null;
        if (! empty($validated['empleado_id'])) {
            $empleado = Empleado::query()->findOrFail((int) $validated['empleado_id']);
            $validated['nombre_completo'] = strtoupper(trim(
                "{$empleado->apellido_paterno} {$empleado->apellido_materno} {$empleado->nombre}",
            ));
            $validated['nue'] = $empleado->nue ?? '';
        }

        $vinculo = $this->vinculoDelegadoService;
        DB::transaction(function () use ($validated, $empleado, $vinculo): void {
            $delegado = Delegado::query()->create([
                'nombre_completo' => $validated['nombre_completo'],
                'nue'             => $validated['nue'] ?? null,
                'empleado_id'     => $validated['empleado_id'] ?? null,
            ]);
            $delegado->load('delegaciones');
            $vinculo->validarCoherencia(null, $empleado, $delegado);
        });

        return redirect()->route('delegados.index');
    }

    public function update(DelegadoUpdateVinculosRequest $request, Delegado $delegado): RedirectResponse
    {
        $validated = $request->validated();
        $crear     = $request->boolean('crear_usuario');

        $delegado->load('delegaciones');

        $empleado = isset($validated['empleado_id']) && $validated['empleado_id'] !== null
            ? Empleado::query()->find($validated['empleado_id'])
            : null;

        $nueParaUsuarioNuevo = null;
        if ($crear) {
            $nu                  = $validated['nuevo_usuario'];
            $nueParaUsuarioNuevo = $nu['nue'] ?? null;
            if (($nueParaUsuarioNuevo === null || trim((string) $nueParaUsuarioNuevo) === '') && $empleado?->nue) {
                $nueParaUsuarioNuevo = $empleado->nue;
            }
            $userProbe = new User;
            $userProbe->nue = $nueParaUsuarioNuevo;
            $userForValidation = $userProbe;
        } else {
            $userForValidation = isset($validated['user_id']) && $validated['user_id'] !== null
                ? User::query()->find($validated['user_id'])
                : null;
        }

        $probe = clone $delegado;
        $probe->user_id     = $crear ? null : ($validated['user_id'] ?? null);
        $probe->empleado_id = $validated['empleado_id'] ?? null;
        $probe->setRelation('delegaciones', $delegado->delegaciones);

        $this->vinculoDelegadoService->validarCoherencia($userForValidation, $empleado, $probe);

        $crearSvc = $this->crearUsuarioDelegadoService;

        DB::transaction(function () use ($delegado, $validated, $crear, $crearSvc, $nueParaUsuarioNuevo): void {
            $userId = $validated['user_id'] ?? null;

            if ($crear) {
                $nu = $validated['nuevo_usuario'];
                $n  = $nueParaUsuarioNuevo;
                $user = $crearSvc->crear(
                    $nu['name'],
                    $nu['email'],
                    $nu['password'],
                    $nu['rfc'] ?? null,
                    $n !== null && trim((string) $n) !== '' ? trim((string) $n) : null,
                );
                $user->syncRoles($nu['roles'] ?? []);
                $userId = $user->id;
            }

            if ($userId !== null) {
                Delegado::query()
                    ->where('user_id', $userId)
                    ->where('id', '!=', $delegado->id)
                    ->update(['user_id' => null]);
            }

            if (($validated['empleado_id'] ?? null) !== null) {
                Delegado::query()
                    ->where('empleado_id', $validated['empleado_id'])
                    ->where('id', '!=', $delegado->id)
                    ->update(['empleado_id' => null]);
            }

            $payload = [
                'user_id'     => $userId,
                'empleado_id' => $validated['empleado_id'] ?? null,
            ];

            if ($payload['empleado_id'] !== null) {
                $emp = Empleado::query()->findOrFail((int) $payload['empleado_id']);
                $payload['nombre_completo'] = strtoupper(trim(
                    "{$emp->apellido_paterno} {$emp->apellido_materno} {$emp->nombre}",
                ));
                $payload['nue'] = $emp->nue ?? $delegado->nue;
            }

            $delegado->update($payload);
        });

        return redirect()->route('delegados.index');
    }

    public function destroy(Delegado $delegado): RedirectResponse
    {
        $delegado->delete();

        return redirect()->route('delegados.index');
    }
}
