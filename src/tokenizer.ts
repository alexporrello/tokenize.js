import { type OrphanBehavior, type Token, isOrphanBehavior } from './types.js';
import { Emitter } from './token-event.js';

declare type Consume<T> = {
    until: (until: (val: T) => boolean) => T[];
    while: (whle: (elm: T) => boolean) => T[];
};

export declare type TokenEvent = {
    next: Token;
};

export abstract class Tokenizer<T, R extends Token> {
    public onNextToken$ = new Emitter<{
        next: T;
    }>();

    public tokens: R[] = [];
    public length: number;

    private _val: T | undefined;

    constructor(public vals: T[]) {
        this.length = vals.length;
    }

    public get position(): number {
        return this.length - this.tokens.length;
    }

    /**
     * Call to kick off tokenization.
     */
    public tokenize() {
        while ((this._val = this.vals.shift())) {
            this.onNextToken(this._val);
            this.onNextToken$.emit('next', this._val);
        }
        return this;
    }

    /**
     * Executed on each val in `vals`
     * @param val The next token unshifted from `vals`
     */
    public abstract onNextToken(val: T): void;

    /**
     * Consumes tokens while/until a condition is met
     * @param orphanBehavior The action to be executed on the token
     * that's orphaned when the `while` loop exits
     */
    public consume(orphanBehavior?: OrphanBehavior): Consume<T>;

    /**
     * Consumes tokens while/until a condition is met
     * @param last The last val to be unshifted
     * @param orphanBehavior The action to be executed on the token
     * that's orphaned when the `while` loop exits
     */
    public consume(last: T, orphanBehavior?: OrphanBehavior): Consume<T>;

    public consume(...args: (OrphanBehavior | T | undefined)[]): Consume<T> {
        let orphanBehavior: OrphanBehavior = 'UNSHIFT_ORPHAN';
        let lastToken: T | undefined;

        args.forEach((arg) => {
            if (isOrphanBehavior(arg)) {
                orphanBehavior = arg;
            } else {
                lastToken = arg;
            }
        });

        let val: T | undefined;
        val ??= this.next();

        const elms: T[] = lastToken ? [lastToken] : [];

        return {
            until: (until: (val: T) => boolean): T[] => {
                while (val && !until(val)) {
                    elms.push(val);
                    val = this.vals.shift();
                }
                return this._handleOrphan(elms, val, orphanBehavior);
            },
            while: (whle: (elm: T) => boolean): T[] => {
                while (val && whle(val)) {
                    elms.push(val);
                    val = this.vals.shift();
                }
                return this._handleOrphan(elms, val, orphanBehavior);
            }
        };
    }

    private _handleOrphan(
        elms: T[],
        elm: T | undefined,
        orphanBehavior: OrphanBehavior
    ) {
        if (elm) {
            switch (orphanBehavior) {
                case 'CONSUME_ORPHAN':
                    elms.push(elm);
                    return elms;
                case 'DISCARD_ORPHAN':
                    return elms;
                case 'UNSHIFT_ORPHAN':
                    this.vals.unshift(elm);
            }
        }

        return elms;
    }

    /**
     * Unshifts the next val.
     * @param errMsg An error to throw if unexpected end of input
     * is encountered.
     */
    public next(errMsg?: string): T;

    /**
     * Unshifts the next val.
     * @param count The number of elements to unshift
     * @param errMsg An error to throw if unexpected end of input
     * is encountered.
     */
    public next(count: number, errMsg?: string): T;

    public next(countOrErrMsg?: number | string, errMsgOrNull?: string): T {
        let { count, errMsg } = (() => {
            if (typeof countOrErrMsg === 'number') {
                return { errMsg: errMsgOrNull, count: countOrErrMsg ?? 1 };
            }
            return { count: 1, errMsg: countOrErrMsg };
        })();

        while (true) {
            count -= 1;
            const next = this.vals.shift();
            if (!next) throw errMsg ?? 'Unexpected end of input.';
            if (count === 0) return next;
        }
    }
}
