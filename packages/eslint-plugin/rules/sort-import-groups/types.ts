/**
 * External dependencies
 */
import type { AST, Rule } from 'eslint';
import type * as ESTree from 'estree';

export type ESLintSourceCode = ReturnType<
	Rule.RuleContext[ 'getSourceCode' ]
>;

/**
 * Wraps an AST node/comment with the `range` and `loc` fields ESLint always
 * provides at runtime (the ESTree base type marks them optional).
 */
export type Located< T > = T & { range: AST.Range; loc: AST.SourceLocation };

/**
 * `@typescript-eslint/parser` augments `ImportDeclaration` with `importKind`
 * to flag type-only imports. Modeling it inline keeps the rule usable with
 * both the default ESLint parser and the TypeScript parser.
 */
type TSImportDeclaration = ESTree.ImportDeclaration & {
	importKind?: 'type' | 'value';
};

export type ImportNode = Located<
	TSImportDeclaration | ESTree.VariableDeclaration
>;
export type AnyNode = Located< ESTree.Node >;
export type LComment = Located< ESTree.Comment >;

export type DependencyGroup =
	| 'WordPress dependencies'
	| 'External dependencies'
	| 'Internal dependencies';

export type GroupedImports = Record< DependencyGroup, ImportNode[] >;
