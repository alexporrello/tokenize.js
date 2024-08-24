import test, { describe } from 'node:test';
import { Tokenizer } from './tokenizer.js';
import { Token } from './types.js';

const json = `{ "name": "tokenize.js", "version": "1.0.0", "description": "An abstract tokenizer for JavaScript and TypeScript.", "main": "public-api.js", "scripts": { "test": "jest" }, "type": "module", "repository": { "type": "git", "url": "git+https://github.com/alexporrello/tokenize.js.git" }, "keywords": [ "tokenizer", "tokenize" ], "author": "Alexander Porrello", "license": "MIT", "bugs": { "url": "https://github.com/alexporrello/tokenize.js/issues" }, "homepage": "https://github.com/alexporrello/tokenize.js#readme", "devDependencies": { "@types/node": "^22.5.0", "jest": "^29.7.0", "prettier": "^3.3.3", "source-map-support": "^0.5.21", "ts-jest": "^29.2.4", "typescript": "^5.5.4" } }`;

interface JsonToken extends Token {
    type:
        | 'brackets'
        | 'braces'
        | 'string'
        | 'colon'
        | 'object'
        | 'comma'
        | 'array';
    children?: JsonToken[];
}

class JsonTokenizer extends Tokenizer<string, JsonToken> {
    public onNextToken(val: string): void {
        if (/\{|\}/.test(val)) {
            this.tokens.push({
                position: this.position,
                type: 'braces',
                value: val
            });
            return;
        }

        if (/\[|\]/.test(val)) {
            this.tokens.push({
                position: this.position,
                type: 'brackets',
                value: val
            });
            return;
        }

        if (/:/.test(val)) {
            this.tokens.push({
                position: this.position,
                type: 'colon',
                value: val
            });
        }

        if (/,/.test(val)) {
            this.tokens.push({
                position: this.position,
                type: 'comma',
                value: val
            });
        }

        if (/"/.test(val)) {
            const word = this.consume('"', 'CONSUME_ORPHAN').until((val) =>
                /"/.test(val)
            );
            this.tokens.push({
                position: this.position,
                type: 'string',
                value: word.join('')
            });
        }
    }
}

class JsonParser extends Tokenizer<JsonToken, JsonToken> {
    public onNextToken(val: JsonToken): any {
        if (val.value === '{') val.children = this.parseObject();
        if (val.value === '[') val.children = this.parseArray();
        this.tokens.push(val);
    }

    parseObject() {
        let objectVals: JsonToken[] = [];

        let val: JsonToken | undefined;
        while ((val = this.vals.shift())) {
            if (val.value === '{') {
                val.children = this.parseObject();
                val.type = 'object';
                objectVals.push(val);
                continue;
            }

            if (val.value === '[') {
                val.children = this.parseArray();
                val.type = 'array';
                objectVals.push(val);
                continue;
            }

            if (val.value === '}') return objectVals;

            objectVals.push(val);
        }

        throw 'Object not terminated';
    }

    parseArray() {
        let arrayVals: JsonToken[] = [];

        let val: JsonToken | undefined;
        while ((val = this.vals.shift())) {
            if (val.value === '{') {
                val.children = this.parseObject();
                val.type = 'object';
                arrayVals.push(val);
                continue;
            }

            if (val.value === '[') {
                val.children = this.parseArray();
                val.type = 'array';
                arrayVals.push(val);
                continue;
            }

            if (val.value === ']') return arrayVals;

            arrayVals.push(val);
        }

        throw 'Object not terminated';
    }

    parseWord(token: JsonToken) {
        const next = this.next();
        if (next.type === 'colon') {
            const value = this.next();
            if (value.type === 'string') {
                return [token, next, value];
            }
            throw 'Expected word, received ' + value.type;
        }
        this.tokens.unshift(next);
        return null;
    }
}

describe('Tokenizer', () => {
    const tokenizer = new JsonTokenizer([...json]);

    test('Can tokenize string', () => {
        const tokens = tokenizer.tokenize().tokens;
        const vals = new JsonParser(tokens).tokenize().tokens;
        console.log(JSON.stringify(vals, null, 4));
    });
});
