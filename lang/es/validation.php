<?php

declare(strict_types=1);

return [
    'accepted' => 'El campo :attribute debe ser aceptado.',
    'array' => 'El campo :attribute debe ser un arreglo.',
    'boolean' => 'El campo :attribute debe ser verdadero o falso.',
    'confirmed' => 'La confirmacion de :attribute no coincide.',
    'date' => 'El campo :attribute no es una fecha valida.',
    'email' => 'El campo :attribute debe ser una direccion de correo valida.',
    'exists' => 'El :attribute seleccionado no es valido.',
    'in' => 'El :attribute seleccionado no es valido.',
    'integer' => 'El campo :attribute debe ser un numero entero.',
    'max' => [
        'numeric' => 'El campo :attribute no debe ser mayor que :max.',
        'string' => 'El campo :attribute no debe ser mayor de :max caracteres.',
        'array' => 'El campo :attribute no debe tener mas de :max elementos.',
        'file' => 'El archivo :attribute no debe ser mayor a :max kilobytes.',
    ],
    'min' => [
        'numeric' => 'El campo :attribute debe ser al menos :min.',
        'string' => 'El campo :attribute debe tener al menos :min caracteres.',
        'array' => 'El campo :attribute debe tener al menos :min elementos.',
        'file' => 'El archivo :attribute debe ser de al menos :min kilobytes.',
    ],
    'numeric' => 'El campo :attribute debe ser un numero.',
    'required' => 'El campo :attribute es obligatorio.',
    'required_if' => 'El campo :attribute es obligatorio cuando :other es :value.',
    'same' => 'El campo :attribute y :other deben coincidir.',
    'string' => 'El campo :attribute debe ser una cadena de texto.',
    'unique' => 'El :attribute ya esta en uso.',

    'attributes' => [
        'name' => 'nombre',
        'email' => 'correo electronico',
        'password' => 'contrasena',
        'password_confirmation' => 'confirmacion de contrasena',
        'rfc' => 'RFC',
        'remember' => 'recordarme',
    ],
];
