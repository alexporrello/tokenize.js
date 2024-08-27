[**@fsnjs/tokenize**](../../README.md) • **Docs**

---

[@fsnjs/tokenize](../globals.md) / Tokenizer

# Class: `abstract` Tokenizer\<T, R\>

## Type Parameters

• **T**

• **R** _extends_ [`Token`](../interfaces/Token.md)

## Constructors

### new Tokenizer()

> **new Tokenizer**\<`T`, `R`\>(`vals`): [`Tokenizer`](Tokenizer.md)\<`T`, `R`\>

#### Parameters

• **vals**: `T`[]

#### Returns

[`Tokenizer`](Tokenizer.md)\<`T`, `R`\>

#### Defined in

[tokenizer.ts:14](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L14)

## Properties

### length

> **length**: `number`

#### Defined in

[tokenizer.ts:10](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L10)

---

### tokens

> **tokens**: `R`[] = `[]`

#### Defined in

[tokenizer.ts:9](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L9)

---

### vals

> **vals**: `T`[]

#### Defined in

[tokenizer.ts:14](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L14)

## Accessors

### position

> `get` **position**(): `number`

#### Returns

`number`

#### Defined in

[tokenizer.ts:18](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L18)

## Methods

### consume()

#### consume(orphanBehavior)

> **consume**(`orphanBehavior`?): `Consume`\<`T`\>

Consumes tokens while/until a condition is met

##### Parameters

• **orphanBehavior?**: [`OrphanBehavior`](../type-aliases/OrphanBehavior.md)

The action to be executed on the token
that's orphaned when the `while` loop exits

##### Returns

`Consume`\<`T`\>

##### Defined in

[tokenizer.ts:43](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L43)

#### consume(last, orphanBehavior)

> **consume**(`last`, `orphanBehavior`?): `Consume`\<`T`\>

Consumes tokens while/until a condition is met

##### Parameters

• **last**: `T`

The last val to be unshifted

• **orphanBehavior?**: [`OrphanBehavior`](../type-aliases/OrphanBehavior.md)

The action to be executed on the token
that's orphaned when the `while` loop exits

##### Returns

`Consume`\<`T`\>

##### Defined in

[tokenizer.ts:51](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L51)

---

### next()

#### next(errMsg)

> **next**(`errMsg`?): `T`

Unshifts the next val.

##### Parameters

• **errMsg?**: `string`

An error to throw if unexpected end of input
is encountered.

##### Returns

`T`

##### Defined in

[tokenizer.ts:113](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L113)

#### next(count, errMsg)

> **next**(`count`, `errMsg`?): `T`

Unshifts the next val.

##### Parameters

• **count**: `number`

The number of elements to unshift

• **errMsg?**: `string`

An error to throw if unexpected end of input
is encountered.

##### Returns

`T`

##### Defined in

[tokenizer.ts:121](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L121)

---

### onNextToken()

> `abstract` **onNextToken**(`val`): `void`

Executed on each val in `vals`

#### Parameters

• **val**: `T`

The next token unshifted from `vals`

#### Returns

`void`

#### Defined in

[tokenizer.ts:36](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L36)

---

### tokenize()

> **tokenize**(): [`Tokenizer`](Tokenizer.md)\<`T`, `R`\>

Call to kick off tokenization.

#### Returns

[`Tokenizer`](Tokenizer.md)\<`T`, `R`\>

#### Defined in

[tokenizer.ts:25](https://github.com/alexporrello/tokenize.js/blob/b68ae992a6acb9c933ad1edad3111392bcd48185/src/tokenizer.ts#L25)
