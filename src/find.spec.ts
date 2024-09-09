import test, { describe } from 'node:test';
import { find } from './slice.js';
import assert from 'node:assert';

describe('String find', () => {
    test('can find single result', () => {
        const searchStr = `SELECT * FROM my_table AS elephant`;
        const result = find(searchStr, /as\s\w{1,}/i);
        assert.equal(result, 'AS elephant');
    });

    test('can find multiple results', () => {
        const searchStr = `COALESCE(amount."3", 0)  - COALESCE(totals."3", 0) as "3"`;
        const results = find(
            searchStr,
            /\w{1,}\.("{0,})(\w|\d){1,}("){0,}/g,
            true
        );
        assert.equal(results.length > 1, true);
    });
});
