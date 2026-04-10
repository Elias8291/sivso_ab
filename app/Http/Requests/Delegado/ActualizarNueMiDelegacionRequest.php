<?php

declare(strict_types=1);

namespace App\Http\Requests\Delegado;

use Illuminate\Foundation\Http\FormRequest;

class ActualizarNueMiDelegacionRequest extends FormRequest
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
            'nue' => ['required', 'string', 'max:15'],
        ];
    }
}
