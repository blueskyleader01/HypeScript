import type {
  ArrayExpression,
  BooleanLiteral,
  NumericLiteral,
  ObjectExpression,
  StringLiteral,
  ObjectProperty,
  VariableDeclaration,
  VariableDeclarator,
  FunctionDeclaration,
  Identifier,
  NullLiteral,
  ExpressionStatement,
  CallExpression,
  MemberExpression,
  IfStatement,
  ReturnStatement,
  BlockStatement,
  TypeAnnotation,
  GenericTypeAnnotation,
  StringTypeAnnotation,
  BooleanTypeAnnotation,
  NullLiteralTypeAnnotation,
  NumberTypeAnnotation,
  AnyTypeAnnotation,
} from './ast';
import type {
  BracketToken,
  ColonToken,
  CommaToken,
  CurlyToken,
  DotToken,
  NumberToken,
  ParenToken,
  StringToken,
  SymbolToken,
  Token,
} from './tokens';
import type { Reverse, Tail, Unshift } from './utils/arrayUtils';
import type { Cast } from './utils/generalUtils';

type Wrap<T extends [any, Array<Token<any>>]> = T[1][0] extends DotToken
  ? T[1][1] extends SymbolToken<infer V>
    ? Wrap<[MemberExpression<T[0], Identifier<V>>, Tail<Tail<T[1]>>]>
    : T
  : T[1][0] extends ParenToken<'('>
  ? ParseFunctionArguments<Tail<T[1]>> extends infer G
    ? Wrap<
        [CallExpression<T[0], Cast<G, Array<any>>[0]>, Cast<G, Array<any>>[1]]
      >
    : never
  : T;

type DoParseExpression<
  T extends Array<Token<any>>,
  F = T[0],
> = F extends SymbolToken<'true'>
  ? [BooleanLiteral<true>, Tail<T>]
  : F extends SymbolToken<'false'>
  ? [BooleanLiteral<false>, Tail<T>]
  : F extends SymbolToken<'null'>
  ? [NullLiteral, Tail<T>]
  : F extends NumberToken<infer V>
  ? [NumericLiteral<V>, Tail<T>]
  : F extends StringToken<infer V>
  ? [StringLiteral<V>, Tail<T>]
  : F extends BracketToken<'['>
  ? ParseArray<Tail<T>>
  : F extends CurlyToken<'{'>
  ? ParseObject<Tail<T>>
  : F extends SymbolToken<infer V>
  ? [Identifier<V>, Tail<T>]
  : [never, []];

type ParseExpression<T extends Array<Token<any>>> =
  DoParseExpression<T> extends infer G
    ? Wrap<Cast<G, [any, Array<any>]>>
    : never;

type ParseStatement<
  T extends Array<Token<any>>,
  F = T[0],
> = F extends SymbolToken<'const'>
  ? ParseVariableDeclaration<Tail<T>>
  : F extends SymbolToken<'function'>
  ? ParseFunctionDeclaration<Tail<T>>
  : F extends SymbolToken<'if'>
  ? ParseIfStatement<Tail<T>>
  : ParseExpression<T> extends infer G
  ? [ExpressionStatement<Cast<G, Array<any>>[0]>, Cast<G, Array<any>>[1]]
  : never;

type ParseFunctionStatement<T extends Array<Token<any>>> =
  T[0] extends SymbolToken<'return'>
    ? ParseExpression<Tail<T>> extends infer G
      ? [ReturnStatement<Cast<G, Array<any>>[0]>, Cast<G, Array<any>>[1]]
      : never
    : ParseStatement<T>;

type ParseIfStatement<T extends Array<Token<any>>> =
  T[0] extends ParenToken<'('>
    ? ParseExpression<Tail<T>> extends infer G
      ? Cast<G, Array<any>>[1] extends infer J
        ? Cast<J, Array<any>>[0] extends ParenToken<')'>
          ? Cast<J, Array<any>>[1] extends CurlyToken<'{'>
            ? ParseBlockStatement<
                Tail<Tail<Cast<J, Array<any>>>>
              > extends infer B
              ? [
                  IfStatement<Cast<G, Array<any>>[0], Cast<B, Array<any>>[0]>,
                  Cast<B, Array<any>>[1],
                ]
              : never
            : never
          : never
        : never
      : never
    : never;

type ParseFunctionArguments<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
  N extends boolean = false,
> = T[0] extends ParenToken<')'>
  ? [Reverse<R>, Tail<T>]
  : T extends []
  ? never
  : N extends true
  ? T[0] extends CommaToken
    ? ParseFunctionArgumentsItem<Tail<T>, R>
    : never
  : ParseFunctionArgumentsItem<T, R>;

type ParseFunctionArgumentsItem<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
> = ParseExpression<T> extends infer G
  ? ParseFunctionArguments<
      Cast<G, Array<any>>[1],
      Unshift<R, Cast<G, Array<any>>[0]>,
      true
    >
  : never;

type ParseFunctionDeclaration<T extends Array<Token<any>>> =
  T[0] extends SymbolToken<infer I>
    ? T[1] extends ParenToken<'('>
      ? ParseFunctionParams<Tail<Tail<T>>> extends infer G
        ? ParseBlockStatement<Cast<G, Array<any>>[1]> extends infer H
          ? [
              FunctionDeclaration<
                Identifier<I>,
                Cast<G, Array<any>>[0],
                Cast<H, Array<any>>[0]
              >,
              Cast<H, Array<any>>[1],
            ]
          : never
        : never
      : never
    : never;

type ParseBlockStatement<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
> = T[0] extends CurlyToken<'}'>
  ? [BlockStatement<Reverse<R>>, Tail<T>]
  : ParseFunctionStatement<T> extends infer F
  ? ParseBlockStatement<
      Cast<F, Array<any>>[1],
      Unshift<R, Cast<F, Array<any>>[0]>
    >
  : never;

type ParseFunctionParams<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
  N extends boolean = false,
> = T[0] extends ParenToken<')'>
  ? T[1] extends CurlyToken<'{'>
    ? [Reverse<R>, Tail<Tail<T>>]
    : never
  : T extends []
  ? never
  : N extends true
  ? T[0] extends CommaToken
    ? ParseFunctionParamsItem<Tail<T>, R>
    : never
  : ParseFunctionParamsItem<T, R>;

type ParseTypeAnnotation<T extends Array<Token<any>>> =
  T[0] extends SymbolToken<'string'>
    ? [TypeAnnotation<StringTypeAnnotation>, Tail<T>]
    : T[0] extends SymbolToken<'boolean'>
    ? [TypeAnnotation<BooleanTypeAnnotation>, Tail<T>]
    : T[0] extends SymbolToken<'null'>
    ? [TypeAnnotation<NullLiteralTypeAnnotation>, Tail<T>]
    : T[0] extends SymbolToken<'number'>
    ? [TypeAnnotation<NumberTypeAnnotation>, Tail<T>]
    : T[0] extends SymbolToken<'any'>
    ? [TypeAnnotation<AnyTypeAnnotation>, Tail<T>]
    : T[0] extends SymbolToken<infer E>
    ? [TypeAnnotation<GenericTypeAnnotation<E>>, Tail<T>]
    : never;

type ParseFunctionParamsItem<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
> = T[0] extends SymbolToken<infer V>
  ? T[1] extends ColonToken
    ? ParseTypeAnnotation<Tail<Tail<T>>> extends infer G
      ? ParseFunctionParams<
          Cast<G, Array<any>>[1],
          Unshift<R, Identifier<V, Cast<G, Array<any>>[0]>>,
          true
        >
      : never
    : ParseFunctionParams<Tail<T>, Unshift<R, Identifier<V>>, true>
  : never;

type ParseVariableDeclarationHelper<
  T extends Array<Token<any>>,
  K,
  Q = null,
> = ParseExpression<T> extends infer G
  ? [
      VariableDeclaration<
        [VariableDeclarator<Identifier<K, Q>, Cast<G, Array<any>>[0]>],
        'const'
      >,
      Cast<G, Array<any>>[1],
    ]
  : never;

type ParseVariableDeclaration<T extends Array<Token<any>>> =
  T[0] extends SymbolToken<infer K>
    ? T[1] extends ColonToken
      ? ParseTypeAnnotation<Tail<Tail<T>>> extends infer G
        ? Cast<G, Array<any>>[1][0] extends SymbolToken<'='>
          ? Cast<G, Array<any>>[1] extends infer J
            ? ParseVariableDeclarationHelper<
                Tail<Cast<J, Array<any>>>,
                K,
                Cast<G, Array<any>>[0]
              >
            : never
          : never
        : never
      : T[1] extends SymbolToken<'='>
      ? ParseVariableDeclarationHelper<Tail<Tail<T>>, K>
      : never
    : never;

type ParseObject<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
  N extends boolean = false,
  F extends Token<any> = T[0],
> = F extends CurlyToken<'}'>
  ? [ObjectExpression<Reverse<R>>, Tail<T>]
  : T extends []
  ? never
  : N extends true
  ? F extends CommaToken
    ? ParseObjectItem<Tail<T>, R>
    : never
  : ParseObjectItem<T, R>;

type ParseObjectItem<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
> = T[0] extends SymbolToken<infer K>
  ? T[1] extends ColonToken
    ? ParseExpression<Tail<Tail<T>>> extends infer G
      ? ParseObject<
          Cast<G, Array<any>>[1],
          Unshift<R, ObjectProperty<Identifier<K>, Cast<G, Array<any>>[0]>>,
          true
        >
      : never
    : never
  : never;

type ParseArray<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
  N extends boolean = false,
  F extends Token<any> = T[0],
> = F extends BracketToken<']'>
  ? [ArrayExpression<Reverse<R>>, Tail<T>]
  : T extends []
  ? never
  : N extends true
  ? F extends CommaToken
    ? ParseArrayItem<Tail<T>, R>
    : never
  : ParseArrayItem<T, R>;

type ParseArrayItem<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
> = ParseExpression<T> extends infer G
  ? ParseArray<Cast<G, Array<any>>[1], Unshift<R, Cast<G, Array<any>>[0]>, true>
  : never;

type ParseSequence<
  T extends Array<Token<any>>,
  R extends Array<any> = [],
> = T extends []
  ? R
  : ParseStatement<T> extends infer P
  ? ParseSequence<Cast<P, Array<any>>[1], Unshift<R, Cast<P, Array<any>>[0]>>
  : never;

export type Parse<T extends Array<Token<any>>> =
  ParseSequence<T> extends infer P ? Reverse<Cast<P, Array<any>>> : never;