import { type OrphanBehavior, type Token, isOrphanBehavior } from './types.js';

declare type Consume<T> = {
    until: (until: (val: T) => boolean) => T[];
    while: (whle: (elm: T) => boolean) => T[];
};

export abstract class Tokenizer<T, R extends Token> {
    /**
     * An array of tokens productd by `tokenize()`.
     *
     * @usageNotes Tokens are not pushed automatically into `tokens`
     * within the body of `tokenize()`. You must do that manually.
     *
     * @public
     */
    public tokens: R[] = [];

    /**
     * Set to the length of the input values (`vals`) upon instantiation.
     * @public
     */
    public length: number;

    /**
     * Holds the current value as it is processed during tokenization.
     * @private
     */
    private _val: T | undefined;

    /**
     * Constructor for the `Tokenizer` class.
     * @param vals The input values to be tokenized. This array is iterated over to generate tokens.
     */
    constructor(public vals: T[]) {
        this.length = vals.length;
    }

    /**
     * Calculates the current token's position as the difference between
     * the initial length of the input values and the number of tokens
     * that have already been produced.
     * @public
     */
    public get position(): number {
        return this.length - this.tokens.length;
    }

    /**
     * Tokenizes the input values by processing them one at a time.
     *
     * Each value in `vals` is processed by calling the abstract method
     * `onNextToken`, which must be implemented by any subclass of `Tokenizer`.
     * @public
     */
    public tokenize() {
        while ((this._val = this.vals.shift())) {
            this.onNextToken(this._val);
        }
        return this;
    }

    /**
     * Abstract method to process the next token.
     *
     * This method must be implemented by subclasses of `Tokenizer`.
     * It defines how each value in `vals` should be converted into a token.
     *
     * @param val The next value to process into a token.
     *
     * @public
     */
    public abstract onNextToken(val: T): void;

    /**
     * Consumes a sequence of values according to a specified orphan behavior.
     *
     * This method begins consuming values from the input sequence, applying the `until` or `while` methods
     * of the returned `Consume` object to determine when to stop or continue the consumption.
     *
     * The optional `orphanBehavior` parameter dictates how orphaned values (i.e., unmatched or unprocessed values)
     * should be handled during the consumption process.
     *
     * @param orphanBehavior Specifies how to handle orphaned values. The default behavior is
     * `"UNSHIFT_ORPHAN"`, which pushes the orphaned value back to the sequence for future processing.
     *
     * @returns An object that allows for the consumption of values, providing methods `until` and `while`.
     * These methods determine when to stop or continue the consumption of the sequence.
     *
     * @public
     */
    public consume(orphanBehavior?: OrphanBehavior): Consume<T>;

    /**
     * Consumes a sequence of values, starting with a specified last
     * token and following a specific orphan behavior.
     *
     * This method begins by consuming the provided `last` value,
     * then continues to consume additional values from the input sequence
     * according to the rules of the `until` or `while` methods
     * of the returned `Consume` object.
     *
     * The optional `orphanBehavior` parameter dictates how orphaned values
     * (i.e., unmatched or unprocessed values) should be handled
     * during the consumption process.
     *
     * @param last The last value to be consumed first before continuing with the sequence.
     * @param orphanBehavior Specifies how to handle orphaned values.
     * The default behavior is `"UNSHIFT_ORPHAN"`, which pushes the orphaned
     * value back to the sequence for future processing.
     *
     * @returns An object that allows for the consumption of values,
     * providing methods `until` and `while`. These methods determine
     * when to stop or continue the consumption of the sequence.
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

    /**
     * Handles orphan values when consuming a sequence of elements.
     *
     * This method processes the elements collected during consumption
     * based on the given `orphanBehavior`. The purpose is to decide
     * what to do with a set of elements that may not be fully consumed or matched.
     *
     *
     * @param elements The elements collected during the consumption process.
     * @param nextValue The next value in the sequence that may or may not be processed.
     * @param orphanBehavior The behavior to adopt when handling orphaned elements.
     * Possible values include "UNSHIFT_ORPHAN" (to push the orphaned value back to the sequence) or
     * other behaviors as defined by the application.
     *
     * @returns The processed elements, depending on the orphan handling logic.
     *
     * @private
     */
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
     * Retrieves the next value from the input sequence.
     *
     * This method returns the next value in the sequence to be processed.
     * If no more values are available, it may throw an error if an
     * `errMsg` is provided.
     *
     * @param errMsg An optional error message. If no next value is available
     * in the sequence and this parameter is provided,
     * an error is thrown with the provided message.
     *
     * @returns The next value from the input sequence.
     *
     * @throws If the sequence is empty and an `errMsg` is provided,
     * the method will throw an error with the given message.
     */
    public next(errMsg?: string): T;

    /**
     * Retrieves the next value from the input sequence
     * after skipping a specified number of values.
     *
     * This method skips a given number of values in the input sequence
     * and then returns the next available value. If the sequence does not
     * contain enough values to skip, it may throw an error if an `errMsg` is provided.
     *
     * @param count The number of values to skip in the input sequence before retrieving the next value.
     * @param errMsg An optional error message. If not enough values
     * are available in the sequence and this parameter is provided,
     * an error is thrown with the provided message.
     *
     * @returns The next value from the input sequence
     * after skipping the specified number of values.
     *
     * @throws Throws an error if there are not enough values in the sequence
     * to skip the specified `count` and retrieve the next value.
     * If an `errMsg` is provided, the method will throw an error with the given message.
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
