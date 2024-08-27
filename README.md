**@fsnjs/tokenize** • [**Docs**](./docs/globals.md)

---

# @fsnjs/tokenize

`@fsnjs/tokenize` is a zero-dependency library that exports the abstract
`Tokenizer` class.

`Tokenizer` is an abstract class designed to take in a sequence of values
(e.g., characters, objects, etc.) and convert them into structured tokens
that can later be processed by another part of the application.

This class is useful for applications such as parsers or interpreters,
where incoming data needs to be broken down into tokens for further processing.

## Tutorial: Building the `JsonTokenizer` Class

In this tutorial, we will walk through the process of building a custom
`JsonTokenizer` class in TypeScript. This class processes a stringified
JSON input and tokenizes it into a structured format. By following this
guide, you will learn how to create a tokenizer that can handle JSON
objects and arrays, among other elements.

### Define the `JsonToken` Interface

We start by defining a custom token interface tailored to JSON
structures. This token will not only store a value and a position (as in
the base `Token` interface) but also include additional information
about the type of the JSON data.

```ts
declare interface JsonToken extends Token {
    // Stores the key for JSON objects.
    key?: string;
    // Indicates whether the token represents an array or an object.
    type?: 'array' | 'object';
    // Can either be a string, number, or an array of JsonTokens
    // (to handle complex structures like nested arrays or objects).
    value: string | number | JsonToken[];
}
```

### Create the `JsonTokenizer` Class

The `JsonTokenizer` class will extend a base `Tokenizer` class that
processes characters from a JSON string, turning them into `JsonToken`s.

#### Implement `onNextToken()`

`Tokenizer`'s abstract method onNextToken identifies the start of
JSON objects (`{`) and arrays (`[`). When it encounters these characters,
it calls the appropriate method to consume the structure's children
and create the token:

```ts
class JsonTokenizer extends Tokenizer<string, JsonToken> {
    onNextToken(val: string): any {
        if (/{/.test(val)) {
            return this.tokens.push(this.consumeObject());
        }

        if (/\[/.test(val)) {
            return this.tokens.push(this.consumeArray());
        }
    }
}
```

### Handle Whitespace

Whitespace characters should be ignored while tokenizing. The
`_consumeWhitespace()` method skips over whitespace to ensure only
meaningful tokens are processed:

```ts
private _consumeWhitespace(value: string) {
    // Shift values until a non-whitespace character is encountered
    while (/\s/.test(value)) value = this.vals.shift()!;
    return value;
}
```

### Handle JSON objects and arrays

To handle JSON objects and arrays, we can create methods that
recursively tokenize the inner elements of the objects and arrays,
as well as methods that consume words and numbers:

```ts
// Consume chars until the '}' character is encountered
public consumeObject(): JsonToken {
    return {
        position: this.position,
        value: this._consumeInner('}'),
        type: 'object'
    };
}

// Consume chars until the ']' character is encountered
public consumeArray(): JsonToken {
    return {
        position: this.position,
        value: this._consumeInner(']'),
        type: 'array'
    };
}

// Consume chars UNTIL a second '"' character is encountered
public consumeWord(startToken = '"', endRegExp = /"/) {
    return this.consume(startToken, 'CONSUME_ORPHAN')
        .until((val) => endRegExp.test(val))
        .join('');
}

// Consume chars WHILE numbers are encountered
public consumeNumber(startNumber: string) {
    return Number(
        this.consume(startNumber, 'CONSUME_ORPHAN')
            .while((val) => /\d/.test(val))
            .join('')
    );
}
```

### Consume Objects and Arrays

We can abstract the logic that consumes arrays and objects into
a single method `_consumeInner()` that recursively processes
all elements inside the JSON structure until the closing character
(`}` for objects or `]` for arrays) is encountered:

```ts
private _consumeInner(endToken: ']' | '}'): JsonToken[] {
    const arrVals: JsonToken[] = [];

    let val = '$';
    while (val !== endToken) {
        val = this.next();

        // We can safely ignore commas
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
```

### Consume Key/Value Pairs

```ts
private _consumeKeyValue(key: string): JsonToken {
    let value = this._consumeWhitespace(this.next());

    // '{' indicates that the value is the start
    // of an inner object.
    if (value === '{') {
        return {
            key,
            value: this.consumeObject().value,
            position: this.position,
            type: 'object'
        };
    }

    // '[' indicates that the value is the start
    // of an inner array
    if (value === '[') {
        return {
            key,
            value: this.consumeArray().value,
            position: this.position,
            type: 'array'
        };
    }

    // '"' indicates that the value is the start of a string value
    if (value === '"') {
        return {
            key,
            value: this.consumeWord(),
            position: this.position
        };
    }

    // regexp that indicates the start of a digit
    if (/\d/.test(value)) {
        return {
            key,
            value: this.consumeNumber(value),
            position: this.position
        };
    }

    throw 'Unexpected char encountered "' + value + '"';
}
```

### Putting It All Together

```ts
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
```

To see the `JsonTokenizer` in action, let's use a JSON string and
tokenize it using the methods we've built.

```ts
const jsonString = '{"name": "John", "age": 30, "children": ["Jane", "Jack"]}';
const tokenizer = new JsonTokenizer(jsonString.split(''));
tokenizer.tokenize();

console.log(tokenizer.tokens);
```

In this example, we:

1.  Split the JSON string into an array of characters.
2.  Initialize the `JsonTokenizer` with the array of characters.
3.  Call `tokenize()` to process the entire input.

The tokenizer will break the JSON string down into tokens for objects,
arrays, keys, and values.

### Output Example

The result of tokenization will be a structured array of `JsonToken`
objects. Here's a rough idea of what the output might look like:

```ts
[
    { type: "object", value: [...] },
    { key: "name", value: "John", position: 2 },
    { key: "age", value: 30, position: 15 },
    { key: "children", value: [{...}, {...}], position: 25 }
]
```

This structured output provides a clean and hierarchical view of the
JSON data, which can be used in further processing, such as parsing or
interpreting the JSON.

### Conclusion

By following this tutorial, you have built a robust `JsonTokenizer` that
can parse and tokenize JSON objects and arrays. This class can be
extended to handle more complex JSON structures and additional data
types. Here\'s a recap of the steps involved:

1.  **Define the `JsonToken` interface** to structure tokens with object
    or array types.
2.  **Implement `onNextToken()`** to identify and delegate token
    processing based on the type of JSON element.
3.  **Create methods to handle JSON objects and arrays**, using
    recursive logic to process nested structures.
4.  **Handle whitespace and other insignificant characters** to ensure
    clean tokenization.

This tokenizer can serve as a foundation for building more complex
parsers and interpreters for JSON-like data formats.

### Further Processing

Using the `JsonTokenizer` we just created, we can create a namespace
`MyJson` that has a `parse` method that iterates over the tokens
and create an object or array from them:

```ts
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
```
