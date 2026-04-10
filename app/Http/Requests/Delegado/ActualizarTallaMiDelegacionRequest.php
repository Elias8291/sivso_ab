<?php

declare(strict_types=1);

namespace App\Http\Requests\Delegado;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarTallaMiDelegacionRequest extends FormRequest
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
        return [
            'talla' => ['nullable', 'string', 'max:20'],
            'medida' => ['nullable', 'string', 'max:20'],
            'estado' => ['required', 'string', 'in:pendiente,confirmado,cambio,baja'],
            'observacion' => ['nullable', 'string', 'max:255'],
        ];
    }
}
