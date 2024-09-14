import { TokenizerBase } from './tokenizer-base.js';

export abstract class Tokenizer<T, R> extends TokenizerBase<T, R> {
    /**
     * Consumes a sequence of values from `vals`.
     *
     * @returns An object that allows for the consumption of values,
     * providing methods `until` and `while`. These methods determine
     * when to stop or continue the consumption of the sequence.
     *
     * @public
     */
    public consume(val?: T) {
        const vals: T[] = [];
        if (val) vals.push(val);

        return {
            until: (predicate: (val: T) => boolean) => {
                while (this.vals.length > 0) {
                    let next = this.shift();
                    if (predicate(next)) {
                        this.vals.unshift(next);
                        return vals;
                    }
                    vals.push(next);
                }

                return vals;
            },
            while: (predicate: (val: T) => boolean) => {
                while (this.vals.length > 0) {
                    let next = this.shift();
                    if (!predicate(next)) {
                        this.vals.unshift(next);
                        return vals;
                    }
                    vals.push(next);
                }

                return vals;
            }
        };
    }
}
