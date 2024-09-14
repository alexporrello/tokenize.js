import { TokenizerBase } from './tokenizer-base.js';

export abstract class StringTokenizer<R> extends TokenizerBase<string, R> {
    private _whitespaceRegEx = /\s|\n|\t/;
    private _wordRegEx = /[a-z]/i;
    private _numberRegEx = /\d/i;

    constructor(
        public raw: string,
        public path: string,
        options: {
            numberRegex?: RegExp;
            wordRegex?: RegExp;
            whitespaceRegex?: RegExp;
        } = {}
    ) {
        super([...raw]);

        const { numberRegex, wordRegex, whitespaceRegex } = options;
        if (numberRegex) this._numberRegEx = numberRegex;
        if (wordRegex) this._wordRegEx = wordRegex;
        if (whitespaceRegex) this._whitespaceRegEx = whitespaceRegex;
    }

    /**
     * Consumes vars until a non-whitespace token is shifted
     * from `vals`, returning the unshifted non-whitespace
     * char.
     */
    public consumeWhitespace() {
        let next = this.shift();
        while (this._whitespaceRegEx.test(next)) {
            next = this.shift();
        }
        return next;
    }

    /**
     * Consumes chars until a non-word-character is encountered.
     * If your use-case requires words to have non-alphabetical
     * characters, you can register a new word regex with
     * `registerWordRegex`.
     */
    public consumeWord(firstChar?: string) {
        return this.consume(firstChar).while((char) =>
            this._wordRegEx.test(char)
        );
    }

    /**
     * Consumes chars until a non-numeric-character is encountered.
     * If your use-case requires numbers to have non-numeric
     * characters, you can register a new number regex with
     * `registerNumberRegex`.
     */
    public consumeNumber(firstChar?: string) {
        return this.consume(firstChar).while((char) =>
            this._numberRegEx.test(char)
        );
    }

    /**
     * @returns the zero-based position of the token
     * at the top of `vals`.
     */
    override get position(): number {
        // Subtract 1 to account for `length`, which returns the `1-based` index.
        return this.raw.length - this.vals.length - 1;
    }

    /**
     * Consumes a sequence of values from `vals`.
     *
     * @returns An object that allows for the consumption of values,
     * providing methods `until` and `while`. These methods determine
     * when to stop or continue the consumption of the sequence.
     *
     * @public
     */
    public consume(val?: string) {
        let vals: string = val ?? '';

        return {
            until: (predicate: (val: string) => boolean) => {
                while (this.vals.length > 0) {
                    let next = this.shift();
                    if (predicate(next)) {
                        this.vals.unshift(next);
                        return vals;
                    }
                    vals += next;
                }

                return vals;
            },
            while: (predicate: (val: string) => boolean) => {
                while (this.vals.length > 0) {
                    let next = this.shift();
                    if (!predicate(next)) {
                        this.vals.unshift(next);
                        return vals;
                    }
                    vals += next;
                }

                return vals;
            }
        };
    }
}
