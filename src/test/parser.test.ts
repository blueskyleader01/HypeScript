import type { Tokenize } from '../tokenize';
import type { Parse } from '../parse';
import type { Cast } from '../utils/generalUtils';

const expectType = <T>(value: T) => {};

type ParseAst<T extends string> = Tokenize<T> extends infer G
  ? Parse<Cast<G, Array<any>>>
  : never;

expectType<ParseAst<`hello`>>([{ type: 'Identifier', name: 'hello' }]);

expectType<ParseAst<`hello.world`>>([
  {
    type: 'MemberExpression',
    object: { type: 'Identifier', name: 'hello' },
    property: { type: 'Identifier', name: 'world' },
  },
]);

expectType<ParseAst<`hello()`>>([
  {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'hello',
    },
    arguments: [],
  },
]);

expectType<ParseAst<`hello(1, true)`>>([
  {
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'hello',
    },
    arguments: [
      { type: 'NumericLiteral', value: '1' },
      { type: 'BooleanLiteral', value: true },
    ],
  },
]);

expectType<ParseAst<`hello.world(1, true)`>>([
  {
    type: 'CallExpression',
    callee: {
      type: 'MemberExpression',
      object: {
        type: 'Identifier',
        name: 'hello',
      },
      property: {
        type: 'Identifier',
        name: 'world',
      },
    },
    arguments: [
      { type: 'NumericLiteral', value: '1' },
      { type: 'BooleanLiteral', value: true },
    ],
  },
]);

expectType<ParseAst<`function foo() {}`>>([
  {
    type: 'FunctionDeclaration',
    id: {
      type: 'Identifier',
      name: 'foo',
    },
    params: [],
    body: [],
  },
]);

expectType<ParseAst<`function foo(first, last) {}`>>([
  {
    type: 'FunctionDeclaration',
    id: {
      type: 'Identifier',
      name: 'foo',
    },
    params: [
      { type: 'Identifier', name: 'first' },
      { type: 'Identifier', name: 'last' },
    ],
    body: [],
  },
]);

expectType<ParseAst<`const hello = "world"`>>([
  {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        init: { type: 'StringLiteral', value: 'world' },
        id: { type: 'Identifier', name: 'hello' },
      },
    ],
  },
]);

expectType<ParseAst<`const hello = 123`>>([
  {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        init: { type: 'NumericLiteral', value: '123' },
        id: { type: 'Identifier', name: 'hello' },
      },
    ],
  },
]);

expectType<ParseAst<`const hello = [1, 2, 3]`>>([
  {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        init: {
          type: 'ArrayExpression',
          elements: [
            { type: 'NumericLiteral', value: '1' },
            { type: 'NumericLiteral', value: '2' },
            { type: 'NumericLiteral', value: '3' },
          ],
        },
        id: { type: 'Identifier', name: 'hello' },
      },
    ],
  },
]);

expectType<ParseAst<`const hello = { hey: "ho" }`>>([
  {
    type: 'VariableDeclaration',
    kind: 'const',
    declarations: [
      {
        type: 'VariableDeclarator',
        init: {
          type: 'ObjectExpression',
          properties: [
            {
              type: 'ObjectProperty',
              key: { type: 'Identifier', name: 'hey' },
              value: { type: 'StringLiteral', value: 'ho' },
            },
          ],
        },
        id: { type: 'Identifier', name: 'hello' },
      },
    ],
  },
]);
