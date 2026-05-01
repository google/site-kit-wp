/**
 * ESLint rules: Sort import groups
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

/**
 * Wraps an AST node/comment with the `range` and `loc` fields ESLint always
 * provides at runtime (the ESTree base type marks them optional).
 */
type Located< T > = T & { range: AST.Range; loc: AST.SourceLocation };

/**
 * `@typescript-eslint/parser` augments `ImportDeclaration` with `importKind`
 * to flag type-only imports. Modeling it inline keeps the rule usable with
 * both the default ESLint parser and the TypeScript parser.
 */
type TSImportDeclaration = ESTree.ImportDeclaration & {
	importKind?: 'type' | 'value';
};

type ImportNode = Located< TSImportDeclaration | ESTree.VariableDeclaration >;
type AnyNode = Located< ESTree.Node >;
type LComment = Located< ESTree.Comment >;

type DependencyGroup =
	| 'WordPress dependencies'
	| 'External dependencies'
	| 'Internal dependencies';

type GroupedImports = Record< DependencyGroup, ImportNode[] >;

const WORDPRESS_DEPENDENCIES: DependencyGroup = 'WordPress dependencies';
const EXTERNAL_DEPENDENCIES: DependencyGroup = 'External dependencies';
const INTERNAL_DEPENDENCIES: DependencyGroup = 'Internal dependencies';

const rule: Rule.RuleModule = {
	meta: {
		type: 'layout',
		docs: {
			description:
				'Enforce sorted import groups with proper comment blocks',
			category: 'Stylistic Issues',
			recommended: true,
		},
		fixable: 'code',
		schema: [],
	},

	create( context ) {
		const sourceCode = context.getSourceCode();

		/**
		 * Checks whether a comment text matches one of the dependency group
		 * headings.
		 *
		 * @since n.e.x.t
		 *
		 * @param text Normalized comment text.
		 * @return True if `text` is a valid dependency group heading.
		 */
		function isValidGroupComment( text: string ) {
			const validGroups = [
				WORDPRESS_DEPENDENCIES,
				EXTERNAL_DEPENDENCIES,
				INTERNAL_DEPENDENCIES,
			] as string[];

			return validGroups.includes( text );
		}

		/**
		 * Returns ESLint's leading comments for a node, narrowed to the
		 * `Located` form (range and loc are guaranteed by ESLint).
		 *
		 * @since n.e.x.t
		 *
		 * @param node AST node.
		 * @return Array of leading comment tokens.
		 */
		function leadingComments( node: AnyNode ) {
			return sourceCode.getCommentsBefore( node ) as LComment[];
		}

		/**
		 * Returns the textual name of an `ImportSpecifier`'s imported binding.
		 * In modern ESTree, `imported` may be an `Identifier` or a `Literal`
		 * (to support `import { 'a-b' as c } from ...`).
		 *
		 * @since n.e.x.t
		 *
		 * @param spec Import specifier.
		 * @return Imported name.
		 */
		function importedName( spec: ESTree.ImportSpecifier ) {
			return spec.imported.type === 'Identifier'
				? spec.imported.name
				: String( spec.imported.value ?? '' );
		}

		/**
		 * Gets the import group for a given import source.
		 *
		 * @since n.e.x.t
		 *
		 * @param source Import source.
		 * @return Import group.
		 */
		function getImportGroup( source: string ) {
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
		function getExpectedCommentBlock( group: DependencyGroup ) {
			return `/**\n * ${ group }\n */`;
		}

		/**
		 * Gets the preceding comment block for a node.
		 *
		 * @since n.e.x.t
		 *
		 * @param node AST node.
		 * @return Comment token or null.
		 */
		function getPrecedingCommentBlock( node: AnyNode ) {
			const comments = leadingComments( node );
			if ( comments.length === 0 ) {
				return null;
			}

			// Get the last comment before this node
			const lastComment = comments[ comments.length - 1 ];

			// Only consider block comments
			if ( lastComment.type !== 'Block' ) {
				return null;
			}

			// Check if it's directly adjacent (no blank lines)
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
		function normalizeCommentText( text: string ) {
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
		function isSideEffectImport( node: ImportNode ) {
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
		function normalizeImportSource( source: string ) {
			// Normalize the paths for internal dependencies
			// Priority: googlesitekit-* < @/* < ../* < ./* < .
			// Use prefixes that sort correctly: 0 < 1 < 2 < 3
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
		function compareImports(
			nodeA: ImportNode,
			nodeB: ImportNode,
			sortedNodes: ImportNode[] | null = null
		) {
			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const sourceA = getImportSource( nodeA );
			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const sourceB = getImportSource( nodeB );

			// Check if imports are side-effect imports (no specifiers)
			const isSideEffectA = isSideEffectImport( nodeA );
			const isSideEffectB = isSideEffectImport( nodeB );

			// Side-effect imports should always come first within their group
			if ( isSideEffectA && ! isSideEffectB ) {
				return -1;
			}
			if ( ! isSideEffectA && isSideEffectB ) {
				return 1;
			}

			// If both are side-effect imports, preserve their original order
			if ( isSideEffectA && isSideEffectB && sortedNodes ) {
				const indexA = sortedNodes.indexOf( nodeA );
				const indexB = sortedNodes.indexOf( nodeB );
				if ( indexA !== -1 && indexB !== -1 ) {
					return indexA - indexB;
				}
			}

			// Sort alphabetically by source
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
		function getImportSource( node: ImportNode ) {
			if ( node.type === 'ImportDeclaration' ) {
				return String( node.source.value ?? '' );
			}
			// Handle require statements
			if ( node.declarations.length > 0 ) {
				const decl = node.declarations[ 0 ];
				if (
					decl.init &&
					decl.init.type === 'CallExpression' &&
					decl.init.callee.type === 'Identifier' &&
					decl.init.callee.name === 'require' &&
					decl.init.arguments.length > 0 &&
					decl.init.arguments[ 0 ].type === 'Literal'
				) {
					return String( decl.init.arguments[ 0 ].value ?? '' );
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
		function isImportOrRequire( node: AnyNode ): node is ImportNode {
			if ( node.type === 'ImportDeclaration' ) {
				return true;
			}
			if ( node.type === 'VariableDeclaration' ) {
				return node.declarations.some(
					( decl ) =>
						decl.init?.type === 'CallExpression' &&
						decl.init.callee.type === 'Identifier' &&
						decl.init.callee.name === 'require'
				);
			}
			return false;
		}

		/**
		 * Checks the member sort order for an import node.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} node Import declaration node.
		 * @return {void}
		 */
		function checkMemberSortOrder( node: ImportNode ) {
			if ( node.type !== 'ImportDeclaration' ) {
				return;
			}

			const importSpecifiers = node.specifiers.filter(
				( spec ): spec is ESTree.ImportSpecifier =>
					spec.type === 'ImportSpecifier'
			);

			if ( importSpecifiers.length <= 1 ) {
				return;
			}

			for ( let index = 1; index < importSpecifiers.length; index++ ) {
				const prevSpec = importSpecifiers[ index - 1 ];
				const currSpec = importSpecifiers[ index ];

				const prevName = importedName( prevSpec );
				const currName = importedName( currSpec );

				if ( prevName > currName ) {
					context.report( {
						node: currSpec,
						message: `Member '${ currName }' of the import declaration should be sorted alphabetically.`,
						fix( fixer ) {
							// Sort only the ImportSpecifier nodes
							const sorted = [ ...importSpecifiers ].sort(
								( a, b ) => {
									const nameA = importedName( a );
									const nameB = importedName( b );

									if ( nameA < nameB ) {
										return -1;
									}
									if ( nameA > nameB ) {
										return 1;
									}
									return 0;
								}
							);

							// Build the complete import statement with all specifiers
							const allSpecifiers = node.specifiers;
							const defaultSpec = allSpecifiers.find(
								( s ): s is ESTree.ImportDefaultSpecifier =>
									s.type === 'ImportDefaultSpecifier'
							);
							const namespaceSpec = allSpecifiers.find(
								( s ): s is ESTree.ImportNamespaceSpecifier =>
									s.type === 'ImportNamespaceSpecifier'
							);

							const parts: string[] = [];

							if ( defaultSpec ) {
								parts.push( sourceCode.getText( defaultSpec ) );
							}

							if ( namespaceSpec ) {
								parts.push(
									sourceCode.getText( namespaceSpec )
								);
							}

							if ( sorted.length > 0 ) {
								const sortedText = sorted
									.map( ( spec ) => {
										const name = importedName( spec );
										if ( name === spec.local.name ) {
											return name;
										}
										return `${ name } as ${ spec.local.name }`;
									} )
									.join( ', ' );
								parts.push( `{ ${ sortedText } }` );
							}

							const newSpecifiers = parts.join( ', ' );
							const source = sourceCode.getText( node.source );

							// Preserve the 'type' modifier for TypeScript type-only imports
							const typeModifier =
								node.importKind === 'type' ? 'type ' : '';
							const result = `import ${ typeModifier }${ newSpecifiers } from ${ source };`;

							return fixer.replaceText( node, result );
						},
					} );
					return;
				}
			}
		}

		/**
		 * Groups consecutive imports together.
		 *
		 * @since n.e.x.t
		 *
		 * @param nodes All nodes.
		 * @return Groups of import nodes.
		 */
		function groupImports( nodes: AnyNode[] ) {
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
		function groupImportsByType( importNodes: ImportNode[] ) {
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
		function needsImportReorganization( importNodes: ImportNode[] ) {
			// Expected order: EXTERNAL_DEPS, WORDPRESS_DEPS, INTERNAL_DEPS
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

			const groupCounts: Partial< Record< DependencyGroup, number > > =
				{};
			for ( const change of groupChanges ) {
				groupCounts[ change.group ] =
					( groupCounts[ change.group ] ?? 0 ) + 1;
			}

			// Check if any group appears multiple times (interleaved)
			if ( Object.values( groupCounts ).some( ( count ) => count > 1 ) ) {
				return true;
			}

			// Check if groups are in the wrong order
			// Get the expected index for each group in the actual order
			const actualOrder = groupChanges.map( ( change ) => change.group );
			let lastExpectedIndex = -1;

			for ( const group of actualOrder ) {
				const expectedIndex = expectedOrder.indexOf( group );
				if ( expectedIndex < lastExpectedIndex ) {
					// Found a group that should come before a previous group
					return true;
				}
				lastExpectedIndex = expectedIndex;
			}

			return false;
		}

		/**
		 * Reports import reorganization errors.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Array}  importNodes    Import nodes.
		 * @param {Object} groupedImports Grouped imports.
		 * @return {void}
		 */
		function reportReorganizationErrors(
			importNodes: ImportNode[],
			groupedImports: GroupedImports
		) {
			// Expected order
			const expectedOrder: DependencyGroup[] = [
				EXTERNAL_DEPENDENCIES,
				WORDPRESS_DEPENDENCIES,
				INTERNAL_DEPENDENCIES,
			];

			for ( let index = 1; index < importNodes.length; index++ ) {
				const prevGroup = getImportGroup(
					getImportSource( importNodes[ index - 1 ] )
				);
				const currGroup = getImportGroup(
					getImportSource( importNodes[ index ] )
				);

				// Check if we've seen this group before
				let seenBefore = false;
				for ( let index_ = 0; index_ < index - 1; index_++ ) {
					if (
						getImportGroup(
							getImportSource( importNodes[ index_ ] )
						) === currGroup
					) {
						seenBefore = true;
						break;
					}
				}

				// Report error if:
				// 1. Group is interleaved (seen before AND different from previous), OR
				// 2. Current group comes before previous group in the expected order
				const prevExpectedIndex = expectedOrder.indexOf( prevGroup );
				const currExpectedIndex = expectedOrder.indexOf( currGroup );
				const wrongOrder = currExpectedIndex < prevExpectedIndex;

				if ( ( seenBefore && prevGroup !== currGroup ) || wrongOrder ) {
					const source = getImportSource( importNodes[ index ] );
					const message = seenBefore
						? `Import from '${ source }' should be grouped with other ${ currGroup } imports.`
						: `Import from '${ source }' should come before ${ prevGroup } imports.`;

					context.report( {
						node: importNodes[ index ],
						message,
						fix( fixer ) {
							return fixImportOrganization(
								fixer,
								importNodes,
								groupedImports
							);
						},
					} );
					break; // Only report once per group
				}
			}
		}

		/**
		 * Checks and reports missing or incorrect comment blocks.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object}  node                        Import node.
		 * @param {string}  source                      Import source.
		 * @param {string}  group                       Import group.
		 * @param {Object}  options                     Options object.
		 * @param {boolean} options.needsReorganization Whether reorganization is needed.
		 * @return {void}
		 */
		function checkCommentBlock(
			node: ImportNode,
			source: string,
			group: DependencyGroup,
			options: { needsReorganization: boolean }
		) {
			const precedingComment = getPrecedingCommentBlock( node );
			const expectedComment = getExpectedCommentBlock( group );

			if ( ! precedingComment ) {
				if ( ! options.needsReorganization ) {
					context.report( {
						node,
						message: `Import from '${ source }' should be preceded by a "${ group }" comment block.`,
						fix( fixer ) {
							const nodeText = sourceCode.getText( node );
							return fixer.replaceText(
								node,
								`${ expectedComment }\n${ nodeText }`
							);
						},
					} );
				}
			} else {
				const commentText = normalizeCommentText(
					precedingComment.value
				);
				if ( commentText !== group ) {
					context.report( {
						node,
						message: `Import from '${ source }' should be preceded by a "${ group }" comment block, found "${ commentText }".`,
						fix( fixer ) {
							return fixer.replaceTextRange(
								precedingComment.range,
								expectedComment
							);
						},
					} );
				}
			}
		}

		/**
		 * Checks for duplicate comment blocks within a group.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} node Import node.
		 * @return {void}
		 */
		function checkDuplicateCommentBlock( node: ImportNode ) {
			const precedingComment = getPrecedingCommentBlock( node );
			if ( ! precedingComment ) {
				return;
			}

			const commentText = normalizeCommentText( precedingComment.value );

			if ( isValidGroupComment( commentText ) ) {
				context.report( {
					node,
					message:
						'Duplicate or misplaced dependency comment block should be removed.',
					fix( fixer ) {
						const commentEnd = precedingComment.range[ 1 ];
						const sourceAfter = sourceCode.text.slice( commentEnd );
						const newlineMatch = sourceAfter.match( /^\n/ );
						const endPos = newlineMatch
							? commentEnd + 1
							: commentEnd;

						return fixer.removeRange( [
							precedingComment.range[ 0 ],
							endPos,
						] );
					},
				} );
			}
		}

		/**
		 * Generates fixes for sorting imports within a group.
		 *
		 * @since n.e.x.t
		 *
		 * @param fixer       ESLint fixer.
		 * @param importNodes All import nodes.
		 * @param group       Current group.
		 * @return Array of fixes.
		 */
		function generateSortFixes(
			fixer: Rule.RuleFixer,
			importNodes: ImportNode[],
			group: DependencyGroup
		) {
			const importsInGroup = importNodes.filter(
				( n ) => getImportGroup( getImportSource( n ) ) === group
			);

			const sorted = [ ...importsInGroup ].sort( ( a, b ) =>
				compareImports( a, b, importsInGroup )
			);

			// Build the new sorted imports as a single string with no blank lines
			const newImports: string[] = [];
			for ( const node of sorted ) {
				const nonDepComments = getNonDependencyComments( node );

				// Add any non-dependency comments before the import
				for ( const comment of nonDepComments ) {
					if ( comment.type === 'Line' ) {
						newImports.push( `//${ comment.value }` );
					} else {
						newImports.push( `/*${ comment.value }*/` );
					}
				}

				newImports.push( sourceCode.getText( node ) );
			}

			// Determine the range to replace: from the first import to the last import in the group
			const firstImport = importsInGroup[ 0 ];
			const lastImport = importsInGroup[ importsInGroup.length - 1 ];

			// Find the start position (after any preceding dependency comment of the first import)
			const startPos = firstImport.range[ 0 ];
			const firstPrecedingComment =
				getPrecedingCommentBlock( firstImport );
			if (
				firstPrecedingComment &&
				isValidGroupComment(
					normalizeCommentText( firstPrecedingComment.value )
				)
			) {
				// Don't include the dependency comment, start after it
			}

			// Find the end position of the last import
			const endPos = lastImport.range[ 1 ];

			// Replace the entire range with the sorted imports
			return [
				fixer.replaceTextRange(
					[ startPos, endPos ],
					newImports.join( '\n' )
				),
			];
		}

		/**
		 * Checks for blank lines between imports in the same group.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object}  node                        Import node.
		 * @param {Object}  lastNode                    Previous node in the same group.
		 * @param {string}  source                      Import source.
		 * @param {string}  group                       Import group.
		 * @param {Array}   importNodes                 All import nodes.
		 * @param {Object}  options                     Options object.
		 * @param {boolean} options.needsReorganization Whether reorganization is needed.
		 * @return {void}
		 */
		function checkBlankLinesBetweenImports(
			node: ImportNode,
			lastNode: ImportNode | null,
			source: string,
			group: DependencyGroup,
			importNodes: ImportNode[],
			options: { needsReorganization: boolean }
		) {
			if ( ! lastNode || options.needsReorganization ) {
				return;
			}

			// Get any non-dependency comments that precede this import
			const nonDepComments = getNonDependencyComments( node );

			// Determine the effective start line of this import
			// (including any non-dependency comments)
			let effectiveStartLine = node.loc.start.line;
			if ( nonDepComments.length > 0 ) {
				effectiveStartLine = nonDepComments[ 0 ].loc.start.line;
			}

			// Check if there's more than one line between the imports
			const linesBetween = effectiveStartLine - lastNode.loc.end.line;

			if ( linesBetween > 1 ) {
				context.report( {
					node,
					message: `Import from '${ source }' should not have blank lines before it within the same group.`,
					fix( fixer ) {
						return generateSortFixes( fixer, importNodes, group );
					},
				} );
			}
		}

		/**
		 * Checks alphabetical sorting within a group.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object}  node                        Import node.
		 * @param {Object}  lastNode                    Previous node.
		 * @param {string}  source                      Import source.
		 * @param {string}  lastSource                  Previous source.
		 * @param {string}  group                       Import group.
		 * @param {Array}   importNodes                 All import nodes.
		 * @param {Object}  options                     Options object.
		 * @param {boolean} options.needsReorganization Whether reorganization is needed.
		 * @return {void}
		 */
		function checkAlphabeticalOrder(
			node: ImportNode,
			lastNode: ImportNode | null,
			source: string,
			lastSource: string | null,
			group: DependencyGroup,
			importNodes: ImportNode[],
			options: { needsReorganization: boolean }
		) {
			// Get imports in the current group for comparison
			const importsInGroup = importNodes.filter(
				( n ) => getImportGroup( getImportSource( n ) ) === group
			);

			if (
				! lastNode ||
				compareImports( lastNode, node, importsInGroup ) <= 0
			) {
				return;
			}

			if ( options.needsReorganization ) {
				return;
			}

			context.report( {
				node,
				message: `Import from '${ source }' should be sorted alphabetically (before '${ lastSource }').`,
				fix( fixer ) {
					return generateSortFixes( fixer, importNodes, group );
				},
			} );
		}

		/**
		 * Creates a fix function to remove an orphaned comment.
		 *
		 * @since n.e.x.t
		 *
		 * @param comment Comment token to remove.
		 * @return Fixer function.
		 */
		function createOrphanedCommentFix( comment: LComment ) {
			return ( fixer: Rule.RuleFixer ) => {
				// Remove the comment and any trailing newline
				const commentEnd = comment.range[ 1 ];
				const sourceAfter = sourceCode.text.slice( commentEnd );
				const newlineMatch = sourceAfter.match( /^\n/ );
				const endPos = newlineMatch ? commentEnd + 1 : commentEnd;

				return fixer.removeRange( [ comment.range[ 0 ], endPos ] );
			};
		}

		/**
		 * Checks for orphaned dependency comments before the first import.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Array} importNodes Import nodes.
		 * @return {void}
		 */
		function checkOrphanedCommentsBeforeFirstImport(
			importNodes: ImportNode[]
		) {
			const firstImport = importNodes[ 0 ];
			const commentsBefore = leadingComments( firstImport );

			for ( const comment of commentsBefore ) {
				if ( comment.type !== 'Block' ) {
					continue;
				}

				const commentText = normalizeCommentText( comment.value );
				if ( ! isValidGroupComment( commentText ) ) {
					continue;
				}

				// Check if this comment directly precedes the first import
				const precedingComment =
					getPrecedingCommentBlock( firstImport );
				if ( precedingComment === comment ) {
					// This is the legitimate comment for the first import, skip it
					continue;
				}

				// This is an orphaned dependency comment
				context.report( {
					node: firstImport,
					message:
						'Orphaned dependency comment block should be removed.',
					fix: createOrphanedCommentFix( comment ),
				} );
			}
		}

		/**
		 * Checks for orphaned dependency comments between imports.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Array} importNodes Import nodes.
		 * @return {void}
		 */
		function checkOrphanedCommentsBetweenImports(
			importNodes: ImportNode[]
		) {
			for ( let index = 1; index < importNodes.length; index++ ) {
				const currentImport = importNodes[ index ];
				const prevImport = importNodes[ index - 1 ];
				const commentsBetween = leadingComments( currentImport );

				for ( const comment of commentsBetween ) {
					// Only check comments that are after the previous import
					if ( comment.range[ 0 ] <= prevImport.range[ 1 ] ) {
						continue;
					}

					if ( comment.type !== 'Block' ) {
						continue;
					}

					const commentText = normalizeCommentText( comment.value );
					if ( ! isValidGroupComment( commentText ) ) {
						continue;
					}

					// Check if this comment directly precedes the current import
					const precedingComment =
						getPrecedingCommentBlock( currentImport );
					if ( precedingComment === comment ) {
						// This is the legitimate comment for the current import, skip it
						continue;
					}

					// This is an orphaned dependency comment
					context.report( {
						node: currentImport,
						message:
							'Orphaned dependency comment block should be removed.',
						fix: createOrphanedCommentFix( comment ),
					} );
				}
			}
		}

		/**
		 * Checks a group of imports for proper sorting and comments.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Array} importNodes Import nodes.
		 * @return {void}
		 */
		function checkImportGroup( importNodes: ImportNode[] ) {
			if ( importNodes.length === 0 ) {
				return;
			}

			const groupedImports = groupImportsByType( importNodes );
			const needsReorganization =
				needsImportReorganization( importNodes );

			if ( needsReorganization ) {
				reportReorganizationErrors( importNodes, groupedImports );
				// Don't check for orphaned comments when reorganization is needed
				// The reorganization fix will handle everything
				return;
			}

			// Check for orphaned dependency comments
			checkOrphanedCommentsBeforeFirstImport( importNodes );
			checkOrphanedCommentsBetweenImports( importNodes );

			let currentGroup: DependencyGroup | null = null;
			let lastNode: ImportNode | null = null;
			let lastSource: string | null = null;

			for ( const node of importNodes ) {
				const source = getImportSource( node );
				const group = getImportGroup( source );

				if ( group !== currentGroup ) {
					checkCommentBlock( node, source, group, {
						needsReorganization,
					} );
					currentGroup = group;
					lastNode = null;
					lastSource = null;
				} else if ( currentGroup ) {
					checkDuplicateCommentBlock( node );
					checkBlankLinesBetweenImports(
						node,
						lastNode,
						source,
						group,
						importNodes,
						{ needsReorganization }
					);
				}

				checkAlphabeticalOrder(
					node,
					lastNode,
					source,
					lastSource,
					group,
					importNodes,
					{ needsReorganization }
				);

				checkMemberSortOrder( node );

				lastNode = node;
				lastSource = source;
			}
		}

		/**
		 * Gets any non-dependency comments that precede an import.
		 *
		 * @since n.e.x.t
		 *
		 * @param node Import node.
		 * @return Array of comment tokens.
		 */
		function getNonDependencyComments( node: ImportNode ) {
			const comments = leadingComments( node );
			const nonDepComments: LComment[] = [];

			// First pass: identify which comments are non-dependency and close to the import
			const candidates: LComment[] = [];
			for ( const comment of comments ) {
				// Check if it's a dependency comment
				if ( comment.type === 'Block' ) {
					const commentText = normalizeCommentText( comment.value );
					if ( isValidGroupComment( commentText ) ) {
						continue; // Skip dependency comments
					}
				}

				// Include this comment if it's close to the import (within 1 line)
				const linesBetween = node.loc.start.line - comment.loc.end.line;
				if ( linesBetween <= 1 ) {
					candidates.push( comment );
				}
			}

			// Second pass: if we found comments close to the import,
			// include any consecutive comments that lead up to them
			if ( candidates.length > 0 ) {
				const firstCandidate = candidates[ 0 ];

				// Work backwards from the first candidate to find all consecutive comments
				for ( let index = comments.length - 1; index >= 0; index-- ) {
					const comment = comments[ index ];

					// Skip dependency comments
					if ( comment.type === 'Block' ) {
						const commentText = normalizeCommentText(
							comment.value
						);
						if ( isValidGroupComment( commentText ) ) {
							continue;
						}
					}

					// If this comment is at or before the first candidate
					if ( comment.range[ 1 ] <= firstCandidate.range[ 0 ] ) {
						// Check if it's consecutive with what we have
						if ( nonDepComments.length === 0 ) {
							// First comment we're adding, check if consecutive with first candidate
							const linesBetween =
								firstCandidate.loc.start.line -
								comment.loc.end.line;
							if ( linesBetween <= 1 ) {
								nonDepComments.unshift( comment );
							}
						} else {
							// Check if consecutive with the first comment in our list
							const linesBetween =
								nonDepComments[ 0 ].loc.start.line -
								comment.loc.end.line;
							if ( linesBetween <= 1 ) {
								nonDepComments.unshift( comment );
							} else {
								// Gap found, stop looking
								break;
							}
						}
					}
				}

				// Add the candidates
				for ( const candidate of candidates ) {
					if ( ! nonDepComments.includes( candidate ) ) {
						nonDepComments.push( candidate );
					}
				}
			}

			return nonDepComments;
		}

		/**
		 * Determines the start position for import replacement including orphaned comments.
		 *
		 * @since n.e.x.t
		 *
		 * @param importNodes Import nodes.
		 * @return Start position for replacement.
		 */
		function determineReplaceStart( importNodes: ImportNode[] ) {
			const firstImport = importNodes[ 0 ];
			let replaceStart = firstImport.range[ 0 ];

			// Check all comments before the first import
			const commentsBefore = leadingComments( firstImport );

			// Find all consecutive dependency comments before the first import
			// Working backwards from the import
			let foundConsecutiveChain = false;
			for ( let index = commentsBefore.length - 1; index >= 0; index-- ) {
				const comment = commentsBefore[ index ];

				// Only consider block comments
				if ( comment.type !== 'Block' ) {
					// Non-block comment breaks the chain
					if ( foundConsecutiveChain ) {
						break;
					}
					continue;
				}

				const commentText = normalizeCommentText( comment.value );
				if ( ! isValidGroupComment( commentText ) ) {
					// Non-dependency comment breaks the chain
					if ( foundConsecutiveChain ) {
						break;
					}
					continue;
				}

				// This is a dependency comment - check how far it is from what follows
				const nextItem: LComment | ImportNode =
					index < commentsBefore.length - 1
						? commentsBefore[ index + 1 ]
						: firstImport;
				const linesBetween =
					nextItem.loc.start.line - comment.loc.end.line;

				// If it's reasonably close (within 3 lines), include it
				if ( linesBetween <= 3 ) {
					replaceStart = comment.range[ 0 ];
					foundConsecutiveChain = true;
				} else if ( foundConsecutiveChain ) {
					// Gap too large, stop looking
					break;
				}
			}

			return replaceStart;
		}

		/**
		 * Processes the first import node for reorganization.
		 *
		 * @since n.e.x.t
		 *
		 * @param fixer        ESLint fixer.
		 * @param node         Import node.
		 * @param replaceStart Start position for replacement.
		 * @param newImports   New organized import lines.
		 * @return Array of fixes.
		 */
		function processFirstImport(
			fixer: Rule.RuleFixer,
			node: ImportNode,
			replaceStart: number,
			newImports: string[]
		) {
			const fixes: Rule.Fix[] = [];

			// Check for preceding comment
			const precedingComment = getPrecedingCommentBlock( node );
			if (
				precedingComment &&
				precedingComment.range[ 0 ] >= replaceStart &&
				isValidGroupComment(
					normalizeCommentText( precedingComment.value )
				)
			) {
				// This comment is already in the replace range, skip it
			} else if (
				precedingComment &&
				isValidGroupComment(
					normalizeCommentText( precedingComment.value )
				)
			) {
				// This comment is before the replace range, remove it
				fixes.push( fixer.removeRange( precedingComment.range ) );
			}

			// Remove any non-dependency comments that are not in the replace range
			const nonDepComments = getNonDependencyComments( node );
			for ( const comment of nonDepComments ) {
				if ( comment.range[ 0 ] >= replaceStart ) {
					// Already in replace range
					continue;
				}
				fixes.push( fixer.removeRange( comment.range ) );
			}

			// Replace first import (and preceding standalone comments) with all organized imports
			fixes.push(
				fixer.replaceTextRange(
					[ replaceStart, node.range[ 1 ] ],
					newImports.join( '\n' )
				)
			);

			return fixes;
		}

		/**
		 * Processes a non-first import node for reorganization.
		 *
		 * @since n.e.x.t
		 *
		 * @param fixer ESLint fixer.
		 * @param node  Import node.
		 * @return Array of fixes.
		 */
		function processOtherImport( fixer: Rule.RuleFixer, node: ImportNode ) {
			const fixes: Rule.Fix[] = [];

			// Check for preceding comment
			const precedingComment = getPrecedingCommentBlock( node );
			if (
				precedingComment &&
				isValidGroupComment(
					normalizeCommentText( precedingComment.value )
				)
			) {
				// Remove the comment
				fixes.push( fixer.removeRange( precedingComment.range ) );
			}

			// Remove any non-dependency comments
			const nonDepComments = getNonDependencyComments( node );
			for ( const comment of nonDepComments ) {
				fixes.push( fixer.removeRange( comment.range ) );
			}

			fixes.push( fixer.remove( node ) );

			return fixes;
		}

		/**
		 * Fixes import organization by grouping all imports properly.
		 *
		 * @since n.e.x.t
		 *
		 * @param fixer          ESLint fixer.
		 * @param importNodes    All import nodes.
		 * @param groupedImports Imports grouped by type.
		 * @return Array of fixes.
		 */
		function fixImportOrganization(
			fixer: Rule.RuleFixer,
			importNodes: ImportNode[],
			groupedImports: GroupedImports
		) {
			const fixes: Rule.Fix[] = [];

			// Sort imports within each group
			const orderedGroups: DependencyGroup[] = [
				EXTERNAL_DEPENDENCIES,
				WORDPRESS_DEPENDENCIES,
				INTERNAL_DEPENDENCIES,
			];
			const sortedGroups: GroupedImports = {
				'External dependencies': [],
				'WordPress dependencies': [],
				'Internal dependencies': [],
			};
			for ( const group of orderedGroups ) {
				const importsInGroup = groupedImports[ group ];
				sortedGroups[ group ] = [ ...importsInGroup ].sort(
					( importA, importB ) =>
						compareImports( importA, importB, importsInGroup )
				);
			}

			// Build the new import section
			const newImports: string[] = [];
			let firstGroup = true;

			for ( const group of orderedGroups ) {
				if ( sortedGroups[ group ].length === 0 ) {
					continue;
				}

				// Add blank line before group (except first)
				if ( ! firstGroup ) {
					newImports.push( '' );
				}
				firstGroup = false;

				// Add comment block
				newImports.push( getExpectedCommentBlock( group ) );

				// Add imports with their non-dependency comments
				for ( const node of sortedGroups[ group ] ) {
					const nonDepComments = getNonDependencyComments( node );

					// Add any non-dependency comments before the import
					for ( const comment of nonDepComments ) {
						if ( comment.type === 'Line' ) {
							newImports.push( `//${ comment.value }` );
						} else {
							newImports.push( `/*${ comment.value }*/` );
						}
					}

					newImports.push( sourceCode.getText( node ) );
				}
			}

			// Determine the start position for replacement
			const replaceStart = determineReplaceStart( importNodes );

			// Remove all existing imports and their comments
			for ( let index = 0; index < importNodes.length; index++ ) {
				const node = importNodes[ index ];

				if ( index === 0 ) {
					fixes.push(
						...processFirstImport(
							fixer,
							node,
							replaceStart,
							newImports
						)
					);
				} else {
					fixes.push( ...processOtherImport( fixer, node ) );
				}
			}

			return fixes;
		}

		return {
			Program( node ) {
				const importGroups = groupImports( node.body as AnyNode[] );

				// Check the first import group normally
				if ( importGroups.length > 0 ) {
					checkImportGroup( importGroups[ 0 ] );
				}

				// For any subsequent import groups (orphaned imports), report an error
				for ( let index = 1; index < importGroups.length; index++ ) {
					const orphanedGroup = importGroups[ index ];
					for ( const importNode of orphanedGroup ) {
						const source = getImportSource( importNode );

						context.report( {
							node: importNode,
							message: `Import from '${ source }' is separated from other imports. All imports should be grouped together at the top of the file.`,
							fix( fixer ) {
								// Merge all import groups and reorganize them
								const allImports = importGroups.flat();
								const groupedImports =
									groupImportsByType( allImports );
								return fixImportOrganization(
									fixer,
									allImports,
									groupedImports
								);
							},
						} );
						// Only report once per orphaned group
						break;
					}
				}
			},
		};
	},
};

module.exports = rule;
