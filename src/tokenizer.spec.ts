import test, { describe } from 'node:test';
import { Tokenizer } from './tokenizer.js';
import { Token } from './types.js';
import assert from 'node:assert';

const json = {
    name: 'my-lib',
    version: '1.0.0',
    description: 'This is a description.',
    main: 'public-api.ts',
    repository: {
        type: 'git',
        url: 'git+https://github.com/johndoe/repository.git'
    },
    keywords: ['keyword', 'keyword2'],
    author: 'John Doe',
    license: 'MIT'
};

const jsonStr = JSON.stringify(json);

interface JsonToken extends Token {
    key?: string;
    type?: 'array' | 'object';
    value: string | number | JsonToken[];
}

class JsonTokenizer extends Tokenizer<string, JsonToken> {
    public onNextToken(val: string): any {
        if (/{/.test(val)) {
            return this.tokens.push(this.consumeObject());
        }

        if (/\[/.test(val)) {
            return this.tokens.push(this.consumeArray());
        }
    }

    /**
     * Consume an object's children
     */
    public consumeObject(): JsonToken {
        return {
            position: this.position,
            value: this._consumeInner('}'),
            type: 'object'
        };
    }

    /**
     * Consume an array's elements
     */
    public consumeArray(): JsonToken {
        return {
            position: this.position,
            value: this._consumeInner(']'),
            type: 'array'
        };
    }

    /**
     * Consumes vals until a non-whitespace val is encountered
     * @param value A value from `vals`
     * @returns The next value unshifted from `vals` that is not a
     * whitespace character
     */
    private _consumeWhitespace(value: string) {
        while (/\s/.test(value)) value = this.next();
        return value;
    }

    /**
     * Consumes chars until `endRegExp` matches the char.
     * @param startToken (default: `"`) The char that starts the word
     * @param endRegExp (default: `/"/`) A regular expression that marks the end
     * of the "word"
     */
    public consumeWord(startToken = '"', endRegExp = /"/) {
        return this.consume(startToken, 'CONSUME_ORPHAN')
            .until((val) => endRegExp.test(val))
            .join('');
    }

    /**
     * Consumes a number, given the number char that was unshifted
     * @param startNumber The number character that starts the number
     * @returns The consumed number
     */
    public consumeNumber(startNumber: string) {
        return Number(
            this.consume(startNumber, 'CONSUME_ORPHAN')
                .while((val) => /\d/.test(val))
                .join('')
        );
    }

    /**
     * Consumes an inner array or object
     * @param endToken The token that marks the end of the inner array
     * or object
     * @returns An array or object token with its sub elements
     */
    private _consumeInner(endToken: ']' | '}') {
        const arrVals: JsonToken[] = [];

        let val = '$';
        while (val !== endToken) {
            val = this.next();

            if (val === ',') continue;

            if (val === '[') {
                arrVals.push(this.consumeArray());
                continue;
            }

            if (val === '{') {
                arrVals.push(this.consumeObject());
                continue;
            }

            if (val === '"') {
                const key = this.consumeWord();
                const next = this._consumeWhitespace(this.next());

                if (next !== ':') {
                    this.vals.unshift(next);
                    arrVals.push({
                        value: key,
                        position: this.position
                    });
                    continue;
                }

                arrVals.push(this.consumeKeyValue(key));
                continue;
            }

            if (/\d/.test(val)) {
                arrVals.push({
                    value: this.consumeNumber(val),
                    position: this.position
                });
                continue;
            }
        }

        return arrVals;
    }

    /**
     * Consumes the value of a key/value pair
     * @param key The key in a key/value pair
     * @returns A token whose value is a string, number,
     * object, or array
     */
    public consumeKeyValue(key: string): JsonToken {
        let value = this._consumeWhitespace(this.next());

        if (value === '{') {
            return {
                key,
                value: this.consumeObject().value,
                position: this.position,
                type: 'object'
            };
        }

        if (value === '[') {
            return {
                key,
                value: this.consumeArray().value,
                position: this.position,
                type: 'array'
            };
        }

        if (value === '"') {
            return {
                key,
                value: this.consumeWord(),
                position: this.position
            };
        }

        if (/\d/.test(value)) {
            return {
                key,
                value: this.consumeNumber(value),
                position: this.position
            };
        }

        throw 'Unexpected char encountered "' + value + '"';
    }
}

namespace MyJSON {
    /**
     * Parses the final JSON object from its tokens.
     */
    export function parse<T>(jsonString: string) {
        const tokens = new JsonTokenizer([...jsonString]).tokenize().tokens;

        const root = tokens.shift();

        if (!root) throw new SyntaxError('JSON object must have a root token.');

        const { type, value } = root;

        if (!Array.isArray(value)) {
            throw new SyntaxError('JSON object root token must have values.');
        }

        if (type === 'array') return <T>parseArray(value);
        if (type === 'object') return <T>parseObject(value);

        throw new Error('Cannot parse JSON object');
    }

    function parseObject(objChildren: JsonToken[]) {
        const obj: any = {};

        for (let { value, key, type } of objChildren) {
            key = key?.replace(/"/g, '');

            if (Array.isArray(value) && key) {
                if (type === 'array') {
                    obj[key] = parseArray(value);
                    continue;
                }

                if (type === 'object') {
                    obj[key] = parseObject(value);
                    continue;
                }
            }

            if (key) {
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
                    continue;
                }

                if (type === 'object') {
                    arr.push(parseObject(value));
                    continue;
                }
            }

            if (typeof value === 'string') value = value.replace(/"/g, '');
            arr.push(value);
        }

        return arr;
    }
}

describe('Tokenizer', () => {
    const tokenizer = new JsonTokenizer([...jsonStr]);

    test('Can tokenize string', () => {
        const tokens = MyJSON.parse(jsonStr);
        assert.equal(JSON.stringify(tokens), jsonStr);
    });
});
