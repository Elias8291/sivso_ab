<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Cache;

class Delegacion extends Model
{
    public const CACHE_DELEGACIONES_OPCIONES_KEY = 'mi-delegacion:delegaciones-opciones:v1';

    public $timestamps = false;

    protected static function booted(): void
    {
        static::saved(static function (): void {
            Cache::forget(self::CACHE_DELEGACIONES_OPCIONES_KEY);
        });

        static::deleted(static function (): void {
            Cache::forget(self::CACHE_DELEGACIONES_OPCIONES_KEY);
        });
    }

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
