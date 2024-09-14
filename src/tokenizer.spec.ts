import test, { describe } from 'node:test';
import assert from 'node:assert';

import { MyJSON } from './example/json-tokenizer.js';

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
    license: 'MIT',
    public: true
};

const jsonStr = JSON.stringify(json, null, 4);

describe('Tokenizer', () => {
    test('Can tokenize string', () => {
        const tokens = MyJSON.parse(jsonStr);
        console.log(tokens);
        assert.equal(JSON.stringify(tokens, null, 4), jsonStr);
    });
});
