# @fsnjs/tokenize

`@fsnjs/tokenize` is a zero-dependency library that facilitates tokenization
for applications such as parsers or interpreters where incoming data
needs to be broken down into tokens for further processing.

The library's primary export is the abstract `Tokenizer` class
that is designed to take in a sequence of values
(e.g., characters, objects, etc.) and convert them into structured tokens
that can later be processed by another part of the application.

An additional export added in v2.0.0 is `StringTokenizer` that provides
various functions that are useful when parsing string inputs.

You can view [detailed documentation here](https://alexporrello.github.io/tokenize.js/).

## Usage Notes

To see `Tokenizer` in action, check out [examples here](https://github.com/alexporrello/tokenize.js/tree/main/src/example).

### `Tokenizer Error`

The `Tokenizer Error` class is an extension of `SyntaxError` that
provides a `format` function. This format function provides you with an
error string in the following format:

```bash
/path/to/my_script.ts:2:4 - error: This is a dumb function, isn't it.

1  function my_function() {
2      throw new Error(`This is a dumb function, isn't it.`);
       ^
3  }
```

The `format` function accepts an object that has the parameters:

| Parameter       | Type                   | Default | Description                                               |
| --------------- | ---------------------- | ------- | --------------------------------------------------------- |
| trimLength      | `number`, `undefined`  | `null`  | The number of lines to precede and follow the error line. |
| lineNumbers     | `boolean`, `undefined` | `true`  | Whether line numbers should be prepended to each line.    |
| showOnlyErrorLn | `boolean`, `undefined` | `null`  | Whether only the error line and caret should be shown.    |

#### `registerColorFunctions`

If you would like your error messages to be automatically colorized,
you can register color functions from a library like `Chalk` with this method.

#### `registerSyntaxHighlighter`

If you would like the code in your error messages to be colorized,
you can register a function that colorizes the output code with this method.

## Changelog

### v2.1.0

-   `TokenizerBase` now extends Array, removing the need to `vals`.
    `TokenizerBase` overrides `shift` and `pop` methods, both of which
    throw an error if `undefined` is returned.

### v2.0.0

-   Introduces `StringTokenizer`, an extension of `Tokenizer` that provides
    useful string utilities.
-   The abstract `R` type in `Tokenizer<T, R>` no longer extends `Token` to
    provide more type flexibility in situations where a `position` is not necessary.
-   A `peek` method was added that returns the value from the top of
    `vals` without unshifting it from `vals`.
-   An `options` parameter was added to `prettyPrint` in `TokenizerError` that
    provides you with the ability to...

    -   Return a chunk of the source with the caret pointer
    -   Add line numbers to the left of each line

#### Breaking Changes

-   `orphan_behavior` was removed from the `consume` function. Orphaned
    tokens are unshifted onto `vals`.
-   `next` was renamed to `shift`, and the `lookahead` parameter was removed.
