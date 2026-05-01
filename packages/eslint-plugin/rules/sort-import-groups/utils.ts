/**
 * ESLint rule helpers: sort-import-groups utilities.
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
import type * as ESTree from 'estree';

/**
 * Internal dependencies
 */
import type {
	AnyNode,
	DependencyGroup,
	ESLintSourceCode,
	GroupedImports,
	ImportNode,
	LComment,
} from './types';

export const WORDPRESS_DEPENDENCIES: DependencyGroup = 'WordPress dependencies';
export const EXTERNAL_DEPENDENCIES: DependencyGroup = 'External dependencies';
export const INTERNAL_DEPENDENCIES: DependencyGroup = 'Internal dependencies';

/**
 * Checks whether a comment text matches one of the dependency group headings.
 *
 * @since n.e.x.t
 *
 * @param text Normalized comment text.
 * @return True if `text` is a valid dependency group heading.
 */
export function isValidGroupComment( text: string ): boolean {
	const validGroups = [
		WORDPRESS_DEPENDENCIES,
		EXTERNAL_DEPENDENCIES,
		INTERNAL_DEPENDENCIES,
	] as string[];

	return validGroups.includes( text );
}

/**
 * Returns ESLint's leading comments for a node.
 *
 * @since n.e.x.t
 *
 * @param sourceCode Source code facade from ESLint.
 * @param node       AST node.
 * @return Array of leading comment tokens.
 */
export function leadingComments(
	sourceCode: ESLintSourceCode,
	node: AnyNode
): LComment[] {
	return sourceCode.getCommentsBefore( node ) as LComment[];
}

/**
 * Returns the textual name of an `ImportSpecifier`'s imported binding.
 *
 * @since n.e.x.t
 *
 * @param specifier Import specifier.
 * @return Imported name.
 */
export function importedName( specifier: ESTree.ImportSpecifier ): string {
	return specifier.imported.type === 'Identifier'
		? specifier.imported.name
		: String( specifier.imported.value ?? '' );
}

/**
 * Gets the import group for a given import source.
 *
 * @since n.e.x.t
 *
 * @param source Import source.
 * @return Import group.
 */
export function getImportGroup( source: string ): DependencyGroup {
	if (
		source.startsWith( '@wordpress/' ) ||
		source.startsWith( '@wordpress-core/' )
	) {
		return WORDPRESS_DEPENDENCIES;
	}
	if (
		source.startsWith( 'googlesitekit-' ) ||
		source.startsWith( '@/' ) ||
		source.startsWith( '../' ) ||
		source.startsWith( './' ) ||
		source === '.'
	) {
		return INTERNAL_DEPENDENCIES;
	}
	return EXTERNAL_DEPENDENCIES;
}

/**
 * Gets the expected comment block for a group.
 *
 * @since n.e.x.t
 *
 * @param group Import group.
 * @return Comment block text.
 */
export function getExpectedCommentBlock( group: DependencyGroup ): string {
	return `/**\n * ${ group }\n */`;
}

/**
 * Gets the preceding comment block for a node.
 *
 * @since n.e.x.t
 *
 * @param sourceCode Source code facade from ESLint.
 * @param node       AST node.
 * @return Comment token or null.
 */
export function getPrecedingCommentBlock(
	sourceCode: ESLintSourceCode,
	node: AnyNode
): LComment | null {
	const comments = leadingComments( sourceCode, node );
	if ( comments.length === 0 ) {
		return null;
	}

	const lastComment = comments[ comments.length - 1 ];

	if ( lastComment.type !== 'Block' ) {
		return null;
	}

	const linesBetween = node.loc.start.line - lastComment.loc.end.line;
	if ( linesBetween > 1 ) {
		return null;
	}

	return lastComment;
}

/**
 * Normalizes a comment block text.
 *
 * @since n.e.x.t
 *
 * @param text Comment text.
 * @return Normalized text.
 */
export function normalizeCommentText( text: string ): string {
	return text
		.split( '\n' )
		.map( ( line ) => line.trim().replace( /^\*\s*/, '' ) )
		.join( ' ' )
		.trim();
}

/**
 * Checks if an import is a side-effect import.
 *
 * @since n.e.x.t
 *
 * @param node Import/require node.
 * @return True if side-effect import.
 */
export function isSideEffectImport( node: ImportNode ): boolean {
	if ( node.type === 'ImportDeclaration' ) {
		return node.specifiers.length === 0;
	}
	return false;
}

/**
 * Normalizes an import source for sorting.
 *
 * @since n.e.x.t
 *
 * @param source Import source.
 * @return Normalized source.
 */
export function normalizeImportSource( source: string ): string {
	if ( source.startsWith( 'googlesitekit-' ) ) {
		return '~0~' + source;
	}
	if ( source.startsWith( '@/' ) ) {
		return '~1~' + source;
	}
	if ( source.startsWith( '../' ) ) {
		return '~2~' + source;
	}
	if ( source.startsWith( './' ) ) {
		return '~3~' + source;
	}
	if ( source === '.' ) {
		return '~3~.';
	}
	return source;
}

/**
 * Compares two import nodes for sorting.
 *
 * @since n.e.x.t
 *
 * @param nodeA       First node.
 * @param nodeB       Second node.
 * @param sortedNodes Optional array of nodes in their original order (for preserving side-effect import order).
 * @return Sort order.
 */
export function compareImports(
	nodeA: ImportNode,
	nodeB: ImportNode,
	sortedNodes: ImportNode[] | null = null
): number {
	const isSideEffectA = isSideEffectImport( nodeA );
	const isSideEffectB = isSideEffectImport( nodeB );

	if ( isSideEffectA && ! isSideEffectB ) {
		return -1;
	}
	if ( ! isSideEffectA && isSideEffectB ) {
		return 1;
	}

	if ( isSideEffectA && isSideEffectB && sortedNodes ) {
		const indexA = sortedNodes.indexOf( nodeA );
		const indexB = sortedNodes.indexOf( nodeB );
		if ( indexA !== -1 && indexB !== -1 ) {
			return indexA - indexB;
		}
	}

	const sourceA = getImportSource( nodeA );
	const sourceB = getImportSource( nodeB );

	const normalizedA = normalizeImportSource( sourceA );
	const normalizedB = normalizeImportSource( sourceB );

	return normalizedA.localeCompare( normalizedB );
}

/**
 * Gets the import source from a node.
 *
 * @since n.e.x.t
 *
 * @param node Import/require node.
 * @return Import source.
 */
export function getImportSource( node: ImportNode ): string {
	if ( node.type === 'ImportDeclaration' ) {
		return String( node.source.value ?? '' );
	}

	if ( node.declarations.length > 0 ) {
		const declaration = node.declarations[ 0 ];
		if (
			declaration.init &&
			declaration.init.type === 'CallExpression' &&
			declaration.init.callee.type === 'Identifier' &&
			declaration.init.callee.name === 'require' &&
			declaration.init.arguments.length > 0 &&
			declaration.init.arguments[ 0 ].type === 'Literal'
		) {
			return String( declaration.init.arguments[ 0 ].value ?? '' );
		}
	}
	return '';
}

/**
 * Checks if a node is an import or require statement.
 *
 * @since n.e.x.t
 *
 * @param node AST node.
 * @return True if import/require.
 */
export function isImportOrRequire( node: AnyNode ): node is ImportNode {
	if ( node.type === 'ImportDeclaration' ) {
		return true;
	}
	if ( node.type === 'VariableDeclaration' ) {
		return node.declarations.some(
			( declaration ) =>
				declaration.init?.type === 'CallExpression' &&
				declaration.init.callee.type === 'Identifier' &&
				declaration.init.callee.name === 'require'
		);
	}
	return false;
}

/**
 * Groups consecutive imports together.
 *
 * @since n.e.x.t
 *
 * @param nodes All nodes.
 * @return Groups of import nodes.
 */
export function groupImports( nodes: AnyNode[] ): ImportNode[][] {
	const groups: ImportNode[][] = [];
	let currentGroup: ImportNode[] = [];

	for ( const node of nodes ) {
		if ( isImportOrRequire( node ) ) {
			currentGroup.push( node );
		} else if ( currentGroup.length > 0 ) {
			groups.push( currentGroup );
			currentGroup = [];
		}
	}

	if ( currentGroup.length > 0 ) {
		groups.push( currentGroup );
	}

	return groups;
}

/**
 * Groups imports by their dependency type.
 *
 * @since n.e.x.t
 *
 * @param importNodes Import nodes.
 * @return Grouped imports.
 */
export function groupImportsByType(
	importNodes: ImportNode[]
): GroupedImports {
	const groupedImports: GroupedImports = {
		'External dependencies': [],
		'WordPress dependencies': [],
		'Internal dependencies': [],
	};

	for ( const node of importNodes ) {
		const source = getImportSource( node );
		const group = getImportGroup( source );
		groupedImports[ group ].push( node );
	}

	return groupedImports;
}

/**
 * Checks if imports need reorganization.
 *
 * @since n.e.x.t
 *
 * @param importNodes Import nodes.
 * @return True if reorganization is needed.
 */
export function needsImportReorganization(
	importNodes: ImportNode[]
): boolean {
	const expectedOrder: DependencyGroup[] = [
		EXTERNAL_DEPENDENCIES,
		WORDPRESS_DEPENDENCIES,
		INTERNAL_DEPENDENCIES,
	];

	let currentGroup: DependencyGroup | null = null;
	const groupChanges: Array< {
		node: ImportNode;
		group: DependencyGroup;
	} > = [];

	for ( const node of importNodes ) {
		const source = getImportSource( node );
		const group = getImportGroup( source );
		if ( group !== currentGroup ) {
			groupChanges.push( { node, group } );
			currentGroup = group;
		}
	}

	const groupCounts: Partial< Record< DependencyGroup, number > > = {};
	for ( const change of groupChanges ) {
		groupCounts[ change.group ] = ( groupCounts[ change.group ] ?? 0 ) + 1;
	}

	if ( Object.values( groupCounts ).some( ( count ) => count > 1 ) ) {
		return true;
	}

	const actualOrder = groupChanges.map( ( change ) => change.group );
	let lastExpectedIndex = -1;

	for ( const group of actualOrder ) {
		const expectedIndex = expectedOrder.indexOf( group );
		if ( expectedIndex < lastExpectedIndex ) {
			return true;
		}
		lastExpectedIndex = expectedIndex;
	}

	return false;
}

/**
 * Gets any non-dependency comments that precede an import.
 *
 * @since n.e.x.t
 *
 * @param sourceCode Source code facade from ESLint.
 * @param node       Import node.
 * @return Array of comment tokens.
 */
export function getNonDependencyComments(
	sourceCode: ESLintSourceCode,
	node: ImportNode
): LComment[] {
	const comments = leadingComments( sourceCode, node );
	const nonDependencyComments: LComment[] = [];

	const candidates: LComment[] = [];
	for ( const comment of comments ) {
		if ( comment.type === 'Block' ) {
			const commentText = normalizeCommentText( comment.value );
			if ( isValidGroupComment( commentText ) ) {
				continue;
			}
		}

		const linesBetween = node.loc.start.line - comment.loc.end.line;
		if ( linesBetween <= 1 ) {
			candidates.push( comment );
		}
	}

	if ( candidates.length > 0 ) {
		const firstCandidate = candidates[ 0 ];

		for ( let index = comments.length - 1; index >= 0; index-- ) {
			const comment = comments[ index ];

			if ( comment.type === 'Block' ) {
				const commentText = normalizeCommentText( comment.value );
				if ( isValidGroupComment( commentText ) ) {
					continue;
				}
			}

			if ( comment.range[ 1 ] <= firstCandidate.range[ 0 ] ) {
				if ( nonDependencyComments.length === 0 ) {
					const linesBetween =
						firstCandidate.loc.start.line - comment.loc.end.line;
					if ( linesBetween <= 1 ) {
						nonDependencyComments.unshift( comment );
					}
				} else {
					const linesBetween =
						nonDependencyComments[ 0 ].loc.start.line -
						comment.loc.end.line;
					if ( linesBetween <= 1 ) {
						nonDependencyComments.unshift( comment );
					} else {
						break;
					}
				}
			}
		}

		for ( const candidate of candidates ) {
			if ( ! nonDependencyComments.includes( candidate ) ) {
				nonDependencyComments.push( candidate );
			}
		}
	}

	return nonDependencyComments;
}

/**
 * Determines the start position for import replacement including orphaned comments.
 *
 * @since n.e.x.t
 *
 * @param sourceCode  Source code facade from ESLint.
 * @param importNodes Import nodes.
 * @return Start position for replacement.
 */
export function determineReplaceStart(
	sourceCode: ESLintSourceCode,
	importNodes: ImportNode[]
): number {
	const firstImport = importNodes[ 0 ];
	let replaceStart = firstImport.range[ 0 ];

	const commentsBefore = leadingComments( sourceCode, firstImport );

	let foundConsecutiveChain = false;
	for ( let index = commentsBefore.length - 1; index >= 0; index-- ) {
		const comment = commentsBefore[ index ];

		if ( comment.type !== 'Block' ) {
			if ( foundConsecutiveChain ) {
				break;
			}
			continue;
		}

		const commentText = normalizeCommentText( comment.value );
		if ( ! isValidGroupComment( commentText ) ) {
			if ( foundConsecutiveChain ) {
				break;
			}
			continue;
		}

		const nextItem: LComment | ImportNode =
			index < commentsBefore.length - 1
				? commentsBefore[ index + 1 ]
				: firstImport;
		const linesBetween = nextItem.loc.start.line - comment.loc.end.line;

		if ( linesBetween <= 4 ) {
			replaceStart = comment.range[ 0 ];
			foundConsecutiveChain = true;
		} else if ( foundConsecutiveChain ) {
			break;
		}
	}

	return replaceStart;
}
