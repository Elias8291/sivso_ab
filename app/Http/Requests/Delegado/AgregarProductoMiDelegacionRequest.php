<?php

declare(strict_types=1);

namespace App\Http\Requests\Delegado;

use Illuminate\Foundation\Http\FormRequest;

class AgregarProductoMiDelegacionRequest extends FormRequest
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
            'producto_cotizado_id' => ['required', 'integer', 'exists:producto_cotizado,id'],
        ];
    }
}
