export declare type OrphanBehavior =
    | 'CONSUME_ORPHAN'
    | 'DISCARD_ORPHAN'
    | 'UNSHIFT_ORPHAN';

export function isOrphanBehavior(val: any): val is OrphanBehavior {
    return (
        val &&
        typeof val === 'string' &&
        (val === 'CONSUME_ORPHAN' ||
            val === 'DISCARD_ORPHAN' ||
            val === 'UNSHIFT_ORPHAN')
    );
}

export declare interface Token {
    value: any;
    position: number;
}
