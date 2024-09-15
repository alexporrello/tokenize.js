export abstract class TokenizerBase<T, R> extends Array<T> {
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
     * Set to the length of the input values (`this`) upon instantiation.
     * @public
     */
    public len: number;

    /**
     * Holds the current value as it is processed during tokenization.
     * @private
     */
    private _val: T | undefined;

    /**
     * Constructor for the `Tokenizer` class.
     * @param items The input values to be tokenized. This array
     * is iterated over in `onNextToken` to generate tokens.
     */
    constructor(items: T[]) {
        super(...items);
        this.len = this.length;
    }

    /**
     * Calculates the current token's position as the difference between
     * the initial length of the input values and the number of tokens
     * that have already been produced.
     * @public
     */
    public get position(): number {
        return this.len - this.tokens.length;
    }

    /**
     * Tokenizes the input values by processing them one at a time.
     *
     * Each value in `this` is processed by calling the abstract method
     * `onNextToken`, which must be implemented by any subclass of `Tokenizer`.
     * @public
     */
    public tokenize() {
        while ((this._val = this.shift())) {
            this.onNextToken(this._val);
        }
        return this;
    }

    /**
     * Abstract method to process the next token.
     *
     * This method must be implemented by subclasses of `Tokenizer`.
     * It defines how each value in `this` should be converted into a token.
     *
     * @param val The next value to process into a token.
     *
     * @public
     */
    public abstract onNextToken(val: T): any;

    /**
     * Consumes a sequence of values from `this`.
     *
     * @returns An object that allows for the consumption of values,
     * providing methods `until` and `while`. These methods determine
     * when to stop or continue the consumption of the sequence.
     *
     * @public
     */
    public abstract consume(val?: T): {
        while: (predicate: (val: T) => boolean) => any;
        until: (predicate: (val: T) => boolean) => any;
    };

    /**
     * This method unshifts and returns the next value from `this`
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
    override shift(errMsg?: string): T {
        const next = super.shift();
        if (!next) throw errMsg ?? 'Unexpected end of input.';
        return next;
    }

    /**
     * This method pops and returns the last value from `this`
     * If no more values are available, will throw an error.
     *
     * @param errMsg An optional error message
     *
     * @returns The last value from the input sequence
     *
     * @throws If the sequence is empty and an `errMsg` is provided,
     * the method will throw an error with the given message; otherwise,
     * t will throw `Unexpected end of input`.
     */
    override pop(errMsg?: string): T {
        const last = super.pop();
        if (!last) throw errMsg ?? 'Unexpected end of input';
        return last;
    }

    public peek(lookahead = 0): T | undefined {
        return this[lookahead];
    }
}
