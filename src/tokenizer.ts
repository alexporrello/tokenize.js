export abstract class Tokenizer<T, R> {
    /**
     * An array of tokens productd by `tokenize()`.
     *
     * @usageNotes Tokens are not pushed automatically into `tokens`
     * within the body of `tokenize()`. You must do that manually.
     *
     * @public
     */
    public tokens = new Array<R>();

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
     * @param vals The input values to be tokenized. This array
     * is iterated over in `onNextToken` to generate tokens.
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
    public abstract onNextToken(val: T): any;

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

    /**
     * This method unshifts and returns the next value from `vals`
     * If no more values are available, will throw an error.
     *
     * @param errMsg An optional error message
     *
     * @returns The next value from the input sequence
     *
     * @throws If the sequence is empty and an `errMsg` is provided,
     * the method will throw an error with the given message; otherwise,
     * t will throw `Unexpected end of input`.
     */
    public shift(errMsg?: string): T {
        const next = this.vals.shift();
        if (!next) throw errMsg ?? 'Unexpected end of input.';
        return next;
    }

    /**
     * This method returns the next value in the sequence to be processed.
     * If no more values are available, will throw an error.
     *
     * @param errMsg An optional error message
     *
     * @returns The next value from the input sequence
     *
     * @throws If the sequence is empty and an `errMsg` is provided,
     * the method will throw an error with the given message; otherwise,
     * t will throw `Unexpected end of input`.
     */
    public peek(lookahead = 0): T | undefined {
        return this.vals[lookahead];
    }
}
