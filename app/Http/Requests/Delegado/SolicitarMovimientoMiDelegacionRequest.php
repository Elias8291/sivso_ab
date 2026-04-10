<?php

declare(strict_types=1);

namespace App\Http\Requests\Delegado;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SolicitarMovimientoMiDelegacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $esBajaConSustituto = fn (): bool => $this->input('tipo') === 'baja'
            && ($this->input('baja_modo') ?? 'definitiva') === 'sustitucion';

        return [
            'tipo' => ['required', 'string', 'in:baja,cambio'],
            'observacion' => ['nullable', 'string', 'max:500'],
            'nueva_delegacion' => ['required_if:tipo,cambio', 'nullable', 'string', 'exists:delegacion,codigo'],
            'baja_modo' => ['nullable', 'string', 'in:definitiva,sustitucion'],
            'sustituto' => [Rule::requiredIf($esBajaConSustituto), 'nullable', 'array'],
            'sustituto.nombre' => [Rule::requiredIf($esBajaConSustituto), 'nullable', 'string', 'max:80'],
            'sustituto.apellido_paterno' => [Rule::requiredIf($esBajaConSustituto), 'nullable', 'string', 'max:80'],
            'sustituto.apellido_materno' => ['nullable', 'string', 'max:80'],
            'sustituto.nue' => ['nullable', 'string', 'max:15'],
            'sustituto.sexo' => [Rule::requiredIf($esBajaConSustituto), 'nullable', 'string', 'in:M,F'],
        ];
    }
}
