/**
 * ESLint rules: sort-import-groups types.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
