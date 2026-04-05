<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Delegacion extends Model
{
    public $timestamps = false;

    protected $table = 'delegacion';

    protected $primaryKey = 'codigo';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'codigo',
        'ur_referencia',
    ];

    /**
     * @return BelongsTo<Dependencia, $this>
     */
    public function dependenciaReferencia(): BelongsTo
    {
        return $this->belongsTo(Dependencia::class, 'ur_referencia', 'ur');
    }
}
