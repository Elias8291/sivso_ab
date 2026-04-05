<?php

declare(strict_types=1);

namespace App\Http\Requests\Estructura;

use App\Models\Delegado;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DelegadoUpdateVinculosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'crear_usuario' => $this->boolean('crear_usuario'),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Delegado $delegado */
        $delegado = $this->route('delegado');
        $delegadoId = $delegado->id;

        return [
            'crear_usuario' => ['sometimes', 'boolean'],

            'user_id' => [
                'nullable',
                'integer',
                Rule::exists('users', 'id'),
                Rule::unique('delegado', 'user_id')->ignore($delegadoId),
            ],

            'empleado_id' => [
                'nullable',
                'integer',
                Rule::exists('empleado', 'id'),
                Rule::unique('delegado', 'empleado_id')->ignore($delegadoId),
            ],

            'nuevo_usuario' => ['required_if:crear_usuario,true', 'array'],
            'nuevo_usuario.name' => ['required_if:crear_usuario,true', 'string', 'max:255'],
            'nuevo_usuario.email' => ['required_if:crear_usuario,true', 'email', 'max:255', 'unique:users,email'],
            'nuevo_usuario.rfc' => ['nullable', 'string', 'max:13'],
            'nuevo_usuario.nue' => ['nullable', 'string', 'max:20'],
            'nuevo_usuario.password' => ['required_if:crear_usuario,true', 'string', 'min:8', 'confirmed'],
            'nuevo_usuario.roles' => ['nullable', 'array'],
            'nuevo_usuario.roles.*' => ['string', Rule::exists('roles', 'name')->where('guard_name', 'web')],
        ];
    }
}
