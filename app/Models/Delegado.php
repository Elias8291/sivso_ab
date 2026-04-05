<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Delegado extends Model
{
    public $timestamps = false;

    protected $table = 'delegado';

    protected $fillable = [
        'nombre_completo',
        'nue',
        'user_id',
        'empleado_id',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * @return BelongsTo<Empleado, $this>
     */
    public function empleado(): BelongsTo
    {
        return $this->belongsTo(Empleado::class, 'empleado_id');
    }

    /**
     * @return BelongsToMany<Delegacion, $this>
     */
    public function delegaciones(): BelongsToMany
    {
        return $this->belongsToMany(
            Delegacion::class,
            'delegado_delegacion',
            'delegado_id',
            'delegacion_codigo',
            'id',
            'codigo',
        );
    }
}
