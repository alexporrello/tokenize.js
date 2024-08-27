import { exit } from 'process';
import { isTokenizerError, TokenizerError } from '../error.js';
import { Tokenizer } from '../tokenizer.js';
import { Token } from '../types.js';

interface JsonToken extends Token {
    key?: string;
    type?: 'array' | 'object';
    value: string | number | boolean | JsonToken[];
}

export class JsonTokenizer extends Tokenizer<string, JsonToken> {
    /**
     * A base syntax error that we can `fork()` if we encounter
     * errors while tokenizing.
     */
    private _baseError: TokenizerError;

    constructor(vals: string[]) {
        super(vals);
        this._baseError = new TokenizerError('', vals.join(''), 0);
    }

    /**
     * Handles the root of the input JSON object.
     * @param val The next value shifted from `this.vals`
     *
     * @usageNotes This is a required method when implementing
     * the abstract `Tokenizer` class.
     */
    public onNextToken(val: string): any {
        let position = this.position;

        // We can safely ignore commas, newlines, and whitespace
        if (/\s|\n|,/.test(val)) return;

        if (/{/.test(val)) {
            this.tokens.push(this._consumeObject());
            return;
        }

        if (/\[/.test(val)) {
            this.tokens.push(this._consumeArray());
            return;
        }

        if (/\]/.test(val) || /}/.test(val)) {
            return;
        }

        throw this._baseError.fork(
            `Expected "[" or "{", received ${val}`,
            position
        );
    }

    /**
     * Consume an inner object
     */
    private _consumeObject(): JsonToken {
        return {
            position: this.position,
            value: this._consumeInner('}'),
            type: 'object'
        };
    }

    /**
     * Consume an inner array
     */
    private _consumeArray(): JsonToken {
        return {
            position: this.position,
            value: this._consumeInner(']'),
            type: 'array'
        };
    }

    /**
     * Consumes an inner array or object
     * @param endToken A val that marks the end of the inner array
     * or object
     * @returns An array or object token with its sub elements
     */
    private _consumeInner(endToken: ']' | '}') {
        const innerVals: JsonToken[] = [];
        const context: 'OBJ' | 'ARR' = endToken === '}' ? 'OBJ' : 'ARR';

        let val = '';
        while (val !== endToken) {
            val = this.next();

            // If we've reached the terminating character, we can return.
            if (
                (context === 'OBJ' && val === '}') ||
                (context === 'ARR' && val === ']')
            ) {
                return innerVals;
            }

            // Store the position for potential error throwing
            const position = this.position;

            // We can safely ignore commas, newlines, and whitespace
            if (/\s|\n|,/.test(val)) continue;

            if (val === '[') {
                innerVals.push(this._consumeArray());
                continue;
            }

            if (val === '{') {
                innerVals.push(this._consumeObject());
                continue;
            }

            if (val === '"') {
                const key = this._consumeWord();
                const next = this._consumeWhitespace(this.next());

                if (next === ':') {
                    innerVals.push(this._consumeKeyValue(key));
                    continue;
                }

                // In the context of an object, you cannot have a
                // key without a value
                if (context === 'OBJ') {
                    throw this._baseError.fork(
                        'Invalid key/value pair encountered.',
                        position
                    );
                }

                // If this is an array, then we can unshift the
                // shifted value and push the value
                this.vals.unshift(next);
                innerVals.push({
                    value: key,
                    position: this.position
                });
                continue;
            }

            // In the context of an object, we cannot have a
            // boolean or number as a key
            if (context === 'OBJ' && val !== '}') {
                throw this._baseError.fork(
                    `Expected a key/value pair. Received "${val}"`,
                    position
                );
            }

            // In the context of an array, a number or boolean is valid

            if (/\d/.test(val)) {
                innerVals.push({
                    value: this._consumeNumber(val),
                    position
                });
                continue;
            }

            if (/\w/.test(val)) {
                innerVals.push({
                    value: this._consumeBoolean(val),
                    position
                });
                continue;
            }

            // If we've reached this point, we've encountered an
            // invalid character
            throw this._baseError.fork(
                `Expected an array, string, number, or boolean; received ${val}`,
                position
            );
        }

        return innerVals;
    }

    /**
     * Consumes the value of a key/value pair
     * @param key The key in a key/value pair
     * @returns A token whose value is a string, number,
     * object, or array
     */
    private _consumeKeyValue(key: string): JsonToken {
        let value = this._consumeWhitespace(this.next());

        const position = this.position;

        if (value === '{') {
            return {
                key,
                value: this._consumeObject().value,
                position: this.position,
                type: 'object'
            };
        }

        if (value === '[') {
            return {
                key,
                value: this._consumeArray().value,
                position: this.position,
                type: 'array'
            };
        }

        if (value === '"') {
            return {
                key,
                value: this._consumeWord(),
                position: this.position
            };
        }

        if (/\d/.test(value)) {
            return {
                key,
                value: this._consumeNumber(value),
                position: this.position
            };
        }

        if (/\w/.test(value)) {
            return {
                key,
                value: this._consumeBoolean(value),
                position: this.position
            };
        }

        throw this._baseError.fork(
            'Unexpected char encountered "' + value + '"',
            position
        );
    }

    /**
     * Consumes vals until a non-whitespace val is encountered
     * @param char A value from `vals`
     * @returns The next value unshifted from `vals` that is not a
     * whitespace character
     */
    private _consumeWhitespace(char: string) {
        while (/\s|\n/.test(char)) char = this.next();
        return char;
    }

    /**
     * Consumes chars until `endRegExp` matches the char.
     * @param startChar (default: `"`) The char that starts the word
     * @param endRegExp (default: `/"/`) A regular expression that marks the end
     * of the "word"
     */
    private _consumeWord(startChar = '"', endRegExp = /"/) {
        return this.consume(startChar, 'CONSUME_ORPHAN')
            .until((val) => endRegExp.test(val))
            .join('');
    }

    /**
     * Consumes a number, given the number char that was unshifted
     * @param startNumber The number character that starts the number
     * @returns The consumed number
     */
    private _consumeNumber(startNumber: string) {
        return Number(
            this.consume(startNumber, 'CONSUME_ORPHAN')
                .while((val) => /\d/.test(val))
                .join('')
        );
    }

    /**
     * Consumes a boolean, given the char that was unshifted
     * @param startChar The boolean character that starts the boolean
     * @returns The consumed boolean
     */
    private _consumeBoolean(startChar: string) {
        const position = this.position;
        const booleanOrOther = this.consume(startChar, 'UNSHIFT_ORPHAN')
            .while((val) => /\w/.test(val))
            .join('');

        if (/true|false/.test(booleanOrOther)) {
            return booleanOrOther === 'true';
        }

        throw this._baseError.fork(
            `Expected a boolean, received ${booleanOrOther}`,
            position
        );
    }
}

/**
 * A simple implementation of `JSON.parse()`.
 */
export namespace MyJSON {
    /**
     * Parse a JSON object from a string.
     */
    export function parse<T>(jsonString: string) {
        try {
            // Convert the JSON string into tokens
            const tokens = new JsonTokenizer([...jsonString]).tokenize().tokens;

            // Shift the first token, which will be the root element
            const root = tokens.shift();

            if (!root)
                throw new SyntaxError('JSON object must have a root token.');

            const { type, value } = root;

            if (!Array.isArray(value)) {
                throw new SyntaxError(
                    'JSON object root token must have values.'
                );
            }

            if (type === 'array') return <T>parseArray(value);
            if (type === 'object') return <T>parseObject(value);

            throw new Error('Cannot parse JSON object');
        } catch (e) {
            if (isTokenizerError(e)) {
                console.log(e.prettyPrint());
            }
            exit();
        }
    }

    function parseObject(objChildren: JsonToken[]) {
        const obj: any = {};

        for (let { value, key, type } of objChildren) {
            key = key?.replace(/"/g, '');
            if (Array.isArray(value) && key) {
                if (type === 'array') {
                    obj[key] = parseArray(value);
                } else if (type === 'object') {
                    obj[key] = parseObject(value);
                }
            } else if (key) {
                if (typeof value === 'string') value = value.replace(/"/g, '');
                obj[key] = value;
            }
        }

        return obj;
    }

    function parseArray(arrChildren: JsonToken[]) {
        const arr: any[] = [];

        for (let { value, type } of arrChildren) {
            if (Array.isArray(value)) {
                if (type === 'array') {
                    arr.push(parseArray(value));
                } else if (type === 'object') {
                    arr.push(parseObject(value));
                }
            } else if (typeof value === 'string')
                value = value.replace(/"/g, '');

            arr.push(value);
        }

        return arr;
    }
}
