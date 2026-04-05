<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Dependencia extends Model
{
    public $timestamps = false;

    protected $table = 'dependencia';

    protected $primaryKey = 'ur';

    public $incrementing = false;

    protected $keyType = 'int';

    protected $fillable = [
        'ur',
        'nombre',
        'nombre_corto',
    ];

    /**
     * @return HasMany<Delegacion, $this>
     */
    public function delegaciones(): HasMany
    {
        return $this->hasMany(Delegacion::class, 'ur_referencia', 'ur');
    }
}
