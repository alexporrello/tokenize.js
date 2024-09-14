export declare type ColorFunction = (...text: unknown[]) => string;

export declare interface ErrorColors {
    blue: ColorFunction;
    yellow: ColorFunction;
    red: ColorFunction;
    gray: ColorFunction;
    white: ColorFunction;
    bgGray: ColorFunction;
}

/**
 * Call this function to register your cmd colorizer,
 * such as `chalk`.
 */
export function registerColorFunctions(_colors: ErrorColors) {
    colors = _colors;
}

/** Optional colors to colorize pretty-printed errors. */
export let colors: ErrorColors | undefined;

/**
 * Call this function to register a syntax highlighter
 * for pretty printed errors.
 */
export function registerSyntaxHighlighter(
    _highlighter: (...args: any[]) => string
) {
    highlight = _highlighter;
}

/** Optional syntax highlighter for pretty-printed errors. */
export let highlight: (...args: any[]) => string = (arg: string) => {
    return arg;
};
