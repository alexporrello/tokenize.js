import { Tokenizer } from './tokenizer.js';

export abstract class StringTokenizer<R> extends Tokenizer<string, R> {
    private _whitespaceRegEx = /\s|\n|\t/;
    private _wordRegEx = /[a-z]/i;
    private _numberRegEx = /\d/i;

    constructor(
        public raw: string,
        public path: string
    ) {
        super([...raw]);
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
     * Change the default whitespace RegEx (`/\s|\n|\t/`).
     */
    public registerWhitespaceRegex(whitespaceRegEx: RegExp) {
        this._whitespaceRegEx = whitespaceRegEx;
    }

    /**
     * Consumes chars until a non-word-character is encountered.
     * If your use-case requires words to have non-alphabetical
     * characters, you can register a new word regex with
     * `registerWordRegex`.
     */
    public consumeWord(firstChar: string) {
        return this.consume(firstChar).while((char) =>
            this._wordRegEx.test(char)
        );
    }

    /**
     * Change the default word RegEx (`/[a-z]/i`)
     */
    public registerWordRegex(wordRegEx: RegExp) {
        this._wordRegEx = wordRegEx;
    }

    /**
     * Consumes chars until a non-numeric-character is encountered.
     * If your use-case requires numbers to have non-numeric
     * characters, you can register a new number regex with
     * `registerNumberRegex`.
     */
    public consumeNumber(firstChar: string) {
        return this.consume(firstChar)
            .while((char) => this._numberRegEx.test(char))
            .join('');
    }

    /**
     * Change the default number RegEx (`/\d/i`)
     */
    public registerNumberRegex(numberRegEx: RegExp) {
        this._wordRegEx = numberRegEx;
    }

    /**
     * @returns the zero-based position of the token
     * at the top of `vals`.
     */
    override get position(): number {
        // Subtract 1 to account for `length`, which returns
        // the `1-based` index.
        return this.raw.length - this.vals.length - 1;
    }
}
