<?php

declare(strict_types=1);

namespace App\Http\Requests\Delegado;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarTallasLoteMiDelegacionRequest extends FormRequest
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
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.talla' => ['nullable', 'string', 'max:20'],
            'items.*.medida' => ['nullable', 'string', 'max:20'],
        ];
    }
}
