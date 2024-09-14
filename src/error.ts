import { isNativeError } from 'util/types';

import { colors } from './colors.js';

/** Safely assert that `val` is a `TokenizerError` */
export function isTokenizerError(val: any): val is TokenizerError {
    return (
        val !== null &&
        val !== undefined &&
        isNativeError(val) &&
        'raw' in val &&
        'position' in val
    );
}

export declare interface FormatOptions {
    trimLength?: number;
    lineNumbers?: boolean;
    showOnlyErrorLn?: boolean;
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

    /**
     * Formats the error message for printing.
     * @param opts Define formatting options
     * @returns `raw` with a caret pointing to the error under
     * the error position.
     * @deprecated Use `format` instead. `prettyPrint` will be removed
     * in a future version.
     */
    public prettyPrint(opts: FormatOptions = {}) {
        const { message, prettyPrinted } = this._formatError(
            this.message,
            this.raw,
            this.position,
            this.path,
            opts.lineNumbers,
            opts.trimLength
        );

        return message + (prettyPrinted ? '\n\n' + prettyPrinted : '');
    }

    /**
     * Formats the error message for printing.
     * @param opts Define formatting options
     * @returns `raw` with a caret pointing to the error under
     * the error position.
     */
    public format(opts: FormatOptions = {}) {
        const { message, prettyPrinted } = this._formatError(
            this.message,
            this.raw,
            this.position,
            this.path,
            opts.lineNumbers,
            opts.trimLength,
            opts.showOnlyErrorLn
        );

        return message + (prettyPrinted ? '\n\n' + prettyPrinted : '');
    }

    private _formatError(
        message: string,
        raw: string,
        position: number,
        path?: string,
        lineNumbers?: boolean,
        trimLength?: number,
        showOnlyErrorLn?: boolean
    ) {
        try {
            let { column, row, prettyPrinted } = this._highlightErr(
                raw,
                position
            );

            prettyPrinted = this._applyOpts(
                prettyPrinted,
                lineNumbers,
                trimLength,
                showOnlyErrorLn
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

    private _applyOpts(
        formattedError: string,
        lineNumbers: boolean = true,
        trimLength?: number,
        showOnlyErrorLn?: boolean
    ) {
        let { lnIndex, numbered } = this._addLnNumbers(
            formattedError,
            lineNumbers
        );

        if (showOnlyErrorLn) {
            return [numbered[lnIndex - 1], numbered[lnIndex]].join('\n');
        }

        if (trimLength === undefined) return numbered.join('\n');

        let start: number;
        let end: number | undefined;

        if (lnIndex < trimLength) {
            start = 0;
            end = trimLength;
        } else if (lnIndex > numbered.length - trimLength) {
            start = numbered.length - trimLength;
        } else {
            start = lnIndex - trimLength;
            end = lnIndex + trimLength;
        }

        return numbered.slice(start, end).join('\n');
    }

    private _addLnNumbers(formattedError: string, lineNumbers: boolean) {
        let lnIndex = -1;
        let index = 0;

        let numbered = formattedError.split(/\n/g);

        if (lineNumbers) {
            numbered = numbered.map((ln) => {
                if (ln.includes('^')) {
                    lnIndex = index;
                    return '  ' + ln;
                }
                index += 1;

                let lnNum = index < 10 ? '0' + index : index;
                if (!colors) return `${lnNum} ${ln}`;
                return `${colors.bgGray(index < 10 ? '0' + index : index)} ${ln}`;
            });
        }

        return {
            lnIndex,
            numbered
        };
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
