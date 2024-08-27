import { isNativeError } from 'util/types';

import { colors } from './colors.js';

/** Safely assert that `val` is a `PgSyntaxError` */
export function isTokenizerError(val: any): val is TokenizerError {
    return (
        val !== null &&
        val !== undefined &&
        isNativeError(val) &&
        'raw' in val &&
        'position' in val
    );
}

/**
 * Extension of SyntaxError that pretty prints error messages,
 * referencing the position in the input script.
 */
export class TokenizerError extends SyntaxError {
    constructor(
        message: string,
        public raw: string,
        public position: number,
        public path?: string
    ) {
        super(message);
    }

    public prettyPrint() {
        const { message, prettyPrinted } = this._formatError(
            this.message,
            this.raw,
            this.position,
            this.path
        );

        return message + (prettyPrinted ? '\n\n' + prettyPrinted : '');
    }

    private _formatError(
        message: string,
        raw: string,
        position: number,
        path?: string
    ) {
        try {
            let { column, row, prettyPrinted } = this._highlightErr(
                raw,
                position
            );

            let syntaxError = 'SyntaxError';
            let colon = ': ';

            if (colors) {
                if (path) path = colors.blue(path);
                row = colors.yellow(row);
                column = colors.yellow(column);
                syntaxError = colors.red(syntaxError);
                colon = colors.gray(colon);
                message = colors.white(message);
            }

            message = `${syntaxError}${colon}${message}`;

            if (!path) {
                return {
                    message,
                    prettyPrinted
                };
            }

            return {
                message: `${path}:${row}:${column} - ${message}`,
                prettyPrinted
            };
        } catch {
            return { message };
        }
    }

    private _highlightErr(raw: string, position: number) {
        // Slice the raw SQL into two sections--the section before the error
        // and after the error
        let before = raw.slice(0, position);
        let after = raw.slice(position);

        const beforeN = before.lastIndexOf('\n');
        const afterN = after.indexOf('\n');

        // Get the final line of the section before the error
        // and the first line of the section after the error
        let errLnStart = before.substring(beforeN + 1, before.length);
        let errLnEnd = after.substring(0, afterN);

        // Remove the last line from the section before the error
        // and the first line of the section after the error
        before = before.substring(0, beforeN);
        after = after.substring(afterN + 1);

        // Calculate the caret offset, taking tabs into account
        const caret =
            [...errLnStart]
                .map((char) => (/\s|\t/.test(char) ? char : ' '))
                .join('') + (colors ? colors.red('^') : '^');

        // Assemble the pretty printed string
        let prettyPrinted =
            before + '\n' + errLnStart + errLnEnd + '\n' + caret;

        // If the error occurs in the middle of the raw input,
        // append the rest of the error
        if (after.trim().length > 0) {
            prettyPrinted = prettyPrinted + '\n' + after;
        }

        const row = `${before.split(/\n/g).length}`;
        const column = `${errLnStart.length}`;

        return { column, row, prettyPrinted };
    }

    /**
     * Duplicates this TokenizerError.
     * @param message An error message
     * @param position The position of the error
     * @returns A new TokenizerError that shares `raw` and `path`
     * with this instance.
     */
    public fork(message: string, position?: number): TokenizerError {
        return new TokenizerError(
            message,
            this.raw,
            position ?? this.position,
            this.path
        );
    }
}
