import { Tokenizer } from '../tokenizer.js';
import { Token } from '../types.js';

class CsvTokenizer extends Tokenizer<string, Token> {
    /**
     * In this instance, using the built-in `tokens` object
     * is unnecessary, as the data structure of a CSV file
     * is simple enough to do a lot of the parsing within the
     * actual tokenizer.
     */
    public lines: string[][] = [[]];

    /** The index of the line being parsed. **/
    public ln_index = 0;
    /** The index of the column being parsed. */
    public col_index = 0;

    onNextToken(val: string): void {
        // If we encountered a comma or a tab, we know we've reached a new column.
        if (/,|\t/.test(val)) {
            this._pushValIfEmpty();
            this.col_index++;
            return;
        }

        // If we encounter a newline character, we know we've reached a new row.
        if (/\n/.test(val)) {
            this._pushValIfEmpty();
            this.ln_index++;
            this.col_index = 0;
            this.lines[this.ln_index] = [];
            return;
        }

        // If we encounter a `"`, we know that the value in this cell
        // might have a delimiter, so we handle it as a special case.
        if (/"/.test(val)) {
            const consumed = this.consumeQuotedVal();
            this.lines[this.ln_index].push(consumed);
            return;
        }

        // Otherwise, we consume the cell value
        const consumed = this.consumeVal(val);
        this.lines[this.ln_index].push(consumed);
    }

    /**
     * If a cell in the input CSV is empty, we push an empty
     * string to avoid null errors when parsing.
     */
    private _pushValIfEmpty() {
        if (!this.lines[this.ln_index][this.col_index]) {
            this.lines[this.ln_index][this.col_index] = '';
        }
    }

    /**
     * Consumes characters until a newline or comma is reached.
     * @param val The value that was shifted from `vals`.
     * @returns A cell value.
     */
    consumeVal(val: string) {
        return this.consume(val, 'UNSHIFT_ORPHAN')
            .until((val) => /\n|,/.test(val))
            .join('');
    }

    /**
     * Consumes characters until a newline or quotation mark
     * is reached, discarding the final consumed character.
     * @returns A quoted cell value
     */
    consumeQuotedVal() {
        const v = this.consume('DISCARD_ORPHAN')
            .until((val) => /\n|"/.test(val))
            .join('');
        this.next();
        return v;
    }
}

namespace CSV {
    export function parse<T>(csv: string, headers: boolean = true): T[] {
        const lines = new CsvTokenizer([...csv]).tokenize().lines;

        let headerRow = lines.shift();
        if (!headerRow) return <T[]>[];
        if (!headers) {
            lines.unshift([...headerRow]);
            // @ts-ignore
            headerRow = headerRow.map((v, i) => `${i}`);
        }

        return lines.map((ln) => {
            const toReturn: T = <T>{};
            headerRow.forEach((key, index) => {
                toReturn[key] = ln[index];
            });
            return toReturn;
        });
    }
}

export default CSV;
