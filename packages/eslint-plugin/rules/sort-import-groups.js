/**
 * ESLint rules: Sort Import Groups
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

module.exports = {
	meta: {
		type: 'layout',
		docs: {
			description:
				'Enforce sorted import groups with proper comment blocks',
			category: 'Stylistic Issues',
			recommended: true,
		},
		fixable: 'code',
		schema: [
			{
				type: 'object',
				properties: {
					memberSyntaxSortOrder: {
						type: 'array',
						items: {
							enum: [ 'none', 'all', 'multiple', 'single' ],
						},
						uniqueItems: true,
						minItems: 4,
						maxItems: 4,
					},
				},
				additionalProperties: false,
			},
		],
	},

	create( context ) {
		const configuration = context.options[ 0 ] || {};
		const {
			memberSyntaxSortOrder = [ 'none', 'all', 'multiple', 'single' ],
		} = configuration;

		const sourceCode = context.getSourceCode();

		// Define import groups
		const WORDPRESS_DEPS = 'WordPress dependencies';
		const EXTERNAL_DEPS = 'External dependencies';
		const INTERNAL_DEPS = 'Internal dependencies';

		/**
		 * Gets the import group for a given import source.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string} source Import source.
		 * @return {string} Import group.
		 */
		function getImportGroup( source ) {
			if (
				source.startsWith( '@wordpress/' ) ||
				source.startsWith( '@wordpress-core/' )
			) {
				return WORDPRESS_DEPS;
			}
			if (
				source.startsWith( 'googlesitekit-' ) ||
				source.startsWith( '@/' ) ||
				source.startsWith( '../' ) ||
				source.startsWith( './' )
			) {
				return INTERNAL_DEPS;
			}
			return EXTERNAL_DEPS;
		}

		/**
		 * Gets the expected comment block for a group.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string} group Import group.
		 * @return {string} Comment block text.
		 */
		function getExpectedCommentBlock( group ) {
			return `/**\n * ${ group }\n */`;
		}

		/**
		 * Gets the preceding comment block for a node.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} node AST node.
		 * @return {Object|null} Comment token or null.
		 */
		function getPrecedingCommentBlock( node ) {
			const comments = sourceCode.getCommentsBefore( node );
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
		 * @param {string} text Comment text.
		 * @return {string} Normalized text.
		 */
		function normalizeCommentText( text ) {
			return text
				.split( '\n' )
				.map( ( line ) => line.trim().replace( /^\*\s*/, '' ) )
				.join( ' ' )
				.trim();
		}

		/**
		 * Gets the member syntax order value for a node.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} node Import/require node.
		 * @return {string} Member syntax type.
		 */
		function getMemberSyntax( node ) {
			if ( node.type === 'ImportDeclaration' ) {
				if ( node.specifiers.length === 0 ) {
					return 'none';
				}
				if (
					node.specifiers.some(
						( spec ) => spec.type === 'ImportNamespaceSpecifier'
					)
				) {
					return 'all';
				}
				if (
					node.specifiers.some(
						( spec ) => spec.type === 'ImportDefaultSpecifier'
					) &&
					node.specifiers.some(
						( spec ) => spec.type === 'ImportSpecifier'
					)
				) {
					return 'multiple';
				}
				if (
					node.specifiers.some(
						( spec ) => spec.type === 'ImportDefaultSpecifier'
					) ||
					( node.specifiers.length === 1 &&
						node.specifiers[ 0 ].type === 'ImportSpecifier' )
				) {
					return 'single';
				}
				return 'multiple';
			}
			return 'none';
		}

		/**
		 * Compares two import nodes for sorting.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} nodeA First node.
		 * @param {Object} nodeB Second node.
		 * @return {number} Sort order.
		 */
		function compareImports( nodeA, nodeB ) {
			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const sourceA = getImportSource( nodeA );
			// eslint-disable-next-line @wordpress/no-unused-vars-before-return
			const sourceB = getImportSource( nodeB );

			// Check if imports are side-effect imports (no specifiers)
			const syntaxA = getMemberSyntax( nodeA );
			const syntaxB = getMemberSyntax( nodeB );
			const isSideEffectA = syntaxA === 'none';
			const isSideEffectB = syntaxB === 'none';

			// Side-effect imports should always come first within their group
			if ( isSideEffectA && ! isSideEffectB ) {
				return -1;
			}
			if ( ! isSideEffectA && isSideEffectB ) {
				return 1;
			}

			// If both are side-effect imports, sort alphabetically by source
			// If neither are side-effect imports, sort alphabetically by source
			// But normalize the paths for internal dependencies
			// Priority: googlesitekit-* < @/* < ../* < ./*
			// Use prefixes that sort correctly: 0 < 1 < 2 < 3
			let normalizedA = sourceA;
			let normalizedB = sourceB;

			if ( sourceA.startsWith( 'googlesitekit-' ) ) {
				normalizedA = '~0~' + sourceA;
			} else if ( sourceA.startsWith( '@/' ) ) {
				normalizedA = '~1~' + sourceA;
			} else if ( sourceA.startsWith( '../' ) ) {
				normalizedA = '~2~' + sourceA;
			} else if ( sourceA.startsWith( './' ) ) {
				normalizedA = '~3~' + sourceA;
			}

			if ( sourceB.startsWith( 'googlesitekit-' ) ) {
				normalizedB = '~0~' + sourceB;
			} else if ( sourceB.startsWith( '@/' ) ) {
				normalizedB = '~1~' + sourceB;
			} else if ( sourceB.startsWith( '../' ) ) {
				normalizedB = '~2~' + sourceB;
			} else if ( sourceB.startsWith( './' ) ) {
				normalizedB = '~3~' + sourceB;
			}

			const sourceComparison = normalizedA.localeCompare( normalizedB );

			// If sources are different, sort by source
			if ( sourceComparison !== 0 ) {
				return sourceComparison;
			}

			// If sources are the same, sort by member syntax order
			const orderA = memberSyntaxSortOrder.indexOf( syntaxA );
			const orderB = memberSyntaxSortOrder.indexOf( syntaxB );

			return orderA - orderB;
		}

		/**
		 * Gets the import source from a node.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} node Import/require node.
		 * @return {string} Import source.
		 */
		function getImportSource( node ) {
			if ( node.type === 'ImportDeclaration' ) {
				return node.source.value;
			}
			// Handle require statements
			if (
				node.type === 'VariableDeclaration' &&
				node.declarations.length > 0
			) {
				const decl = node.declarations[ 0 ];
				if (
					decl.init &&
					decl.init.type === 'CallExpression' &&
					decl.init.callee.name === 'require' &&
					decl.init.arguments.length > 0 &&
					decl.init.arguments[ 0 ].type === 'Literal'
				) {
					return decl.init.arguments[ 0 ].value;
				}
			}
			return '';
		}

		/**
		 * Checks if a node is an import or require statement.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} node AST node.
		 * @return {boolean} True if import/require.
		 */
		function isImportOrRequire( node ) {
			if ( node.type === 'ImportDeclaration' ) {
				return true;
			}
			if ( node.type === 'VariableDeclaration' ) {
				return node.declarations.some(
					( decl ) =>
						decl.init &&
						decl.init.type === 'CallExpression' &&
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
		 */
		function checkMemberSortOrder( node ) {
			if ( node.type !== 'ImportDeclaration' ) {
				return;
			}

			const importSpecifiers = node.specifiers.filter(
				( spec ) => spec.type === 'ImportSpecifier'
			);

			if ( importSpecifiers.length <= 1 ) {
				return;
			}

			for ( let i = 1; i < importSpecifiers.length; i++ ) {
				const prevSpec = importSpecifiers[ i - 1 ];
				const currSpec = importSpecifiers[ i ];

				const prevName = prevSpec.imported.name;
				const currName = currSpec.imported.name;

				if ( prevName > currName ) {
					context.report( {
						node: currSpec,
						message: `Member '${ currName }' of the import declaration should be sorted alphabetically.`,
						fix( fixer ) {
							// Sort only the ImportSpecifier nodes
							const sorted = [ ...importSpecifiers ].sort(
								( a, b ) => {
									const nameA = a.imported.name;
									const nameB = b.imported.name;

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
								( s ) => s.type === 'ImportDefaultSpecifier'
							);
							const namespaceSpec = allSpecifiers.find(
								( s ) => s.type === 'ImportNamespaceSpecifier'
							);

							const parts = [];

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
										if (
											spec.imported.name ===
											spec.local.name
										) {
											return spec.imported.name;
										}
										return `${ spec.imported.name } as ${ spec.local.name }`;
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
		 * @param {Array} nodes All nodes.
		 * @return {Array} Groups of import nodes.
		 */
		function groupImports( nodes ) {
			const groups = [];
			let currentGroup = [];

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
		 * @param {Array} importNodes Import nodes.
		 * @return {Object} Grouped imports.
		 */
		function groupImportsByType( importNodes ) {
			const groupedImports = {
				[ EXTERNAL_DEPS ]: [],
				[ WORDPRESS_DEPS ]: [],
				[ INTERNAL_DEPS ]: [],
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
		 * @param {Array} importNodes Import nodes.
		 * @return {boolean} True if reorganization is needed.
		 */
		/**
		 * Checks if imports need reorganization.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Array} importNodes Import nodes.
		 * @return {boolean} True if reorganization is needed.
		 */
		function needsImportReorganization( importNodes ) {
			// Expected order: EXTERNAL_DEPS, WORDPRESS_DEPS, INTERNAL_DEPS
			const expectedOrder = [
				EXTERNAL_DEPS,
				WORDPRESS_DEPS,
				INTERNAL_DEPS,
			];

			let currentGroup = null;
			const groupChanges = [];

			for ( const node of importNodes ) {
				const source = getImportSource( node );
				const group = getImportGroup( source );
				if ( group !== currentGroup ) {
					groupChanges.push( { node, group } );
					currentGroup = group;
				}
			}

			const groupCounts = {};
			for ( const change of groupChanges ) {
				groupCounts[ change.group ] =
					( groupCounts[ change.group ] || 0 ) + 1;
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
		 */
		function reportReorganizationErrors( importNodes, groupedImports ) {
			// Expected order
			const expectedOrder = [
				EXTERNAL_DEPS,
				WORDPRESS_DEPS,
				INTERNAL_DEPS,
			];

			for ( let i = 1; i < importNodes.length; i++ ) {
				const prevGroup = getImportGroup(
					getImportSource( importNodes[ i - 1 ] )
				);
				const currGroup = getImportGroup(
					getImportSource( importNodes[ i ] )
				);

				// Check if we've seen this group before
				let seenBefore = false;
				for ( let j = 0; j < i - 1; j++ ) {
					if (
						getImportGroup(
							getImportSource( importNodes[ j ] )
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
					const source = getImportSource( importNodes[ i ] );
					const message = seenBefore
						? `Import from '${ source }' should be grouped with other ${ currGroup } imports.`
						: `Import from '${ source }' should come before ${ prevGroup } imports.`;

					context.report( {
						node: importNodes[ i ],
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
		 */
		function checkCommentBlock( node, source, group, options ) {
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
							return fixer.replaceText(
								precedingComment,
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
		 */
		function checkDuplicateCommentBlock( node ) {
			const precedingComment = getPrecedingCommentBlock( node );
			if ( ! precedingComment ) {
				return;
			}

			const commentText = normalizeCommentText( precedingComment.value );
			const validGroups = [
				WORDPRESS_DEPS,
				EXTERNAL_DEPS,
				INTERNAL_DEPS,
			];

			if ( validGroups.includes( commentText ) ) {
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
		 * @param {Object} fixer       ESLint fixer.
		 * @param {Array}  importNodes All import nodes.
		 * @param {string} group       Current group.
		 * @return {Array} Array of fixes.
		 */
		function generateSortFixes( fixer, importNodes, group ) {
			const importsInGroup = importNodes.filter(
				( n ) => getImportGroup( getImportSource( n ) ) === group
			);

			const sorted = [ ...importsInGroup ].sort( compareImports );
			const validGroups = [
				WORDPRESS_DEPS,
				EXTERNAL_DEPS,
				INTERNAL_DEPS,
			];

			// Build the new sorted imports as a single string with no blank lines
			const newImports = [];
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
				validGroups.includes(
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
		 */
		function checkBlankLinesBetweenImports(
			node,
			lastNode,
			source,
			group,
			importNodes,
			options
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
		 */
		function checkAlphabeticalOrder(
			node,
			lastNode,
			source,
			lastSource,
			group,
			importNodes,
			options
		) {
			if ( ! lastNode || compareImports( lastNode, node ) <= 0 ) {
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
		 * @param {Object} comment Comment token to remove.
		 * @return {Function} Fixer function.
		 */
		function createOrphanedCommentFix( comment ) {
			return function ( fixer ) {
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
		 * @param {Array} validGroups Valid dependency group names.
		 */
		function checkOrphanedCommentsBeforeFirstImport(
			importNodes,
			validGroups
		) {
			const firstImport = importNodes[ 0 ];
			const commentsBefore = sourceCode.getCommentsBefore( firstImport );

			for ( const comment of commentsBefore ) {
				if ( comment.type !== 'Block' ) {
					continue;
				}

				const commentText = normalizeCommentText( comment.value );
				if ( ! validGroups.includes( commentText ) ) {
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
		 * @param {Array} validGroups Valid dependency group names.
		 */
		function checkOrphanedCommentsBetweenImports(
			importNodes,
			validGroups
		) {
			for ( let i = 1; i < importNodes.length; i++ ) {
				const currentImport = importNodes[ i ];
				const prevImport = importNodes[ i - 1 ];
				const commentsBetween =
					sourceCode.getCommentsBefore( currentImport );

				for ( const comment of commentsBetween ) {
					// Only check comments that are after the previous import
					if ( comment.range[ 0 ] <= prevImport.range[ 1 ] ) {
						continue;
					}

					if ( comment.type !== 'Block' ) {
						continue;
					}

					const commentText = normalizeCommentText( comment.value );
					if ( ! validGroups.includes( commentText ) ) {
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
		 */
		function checkImportGroup( importNodes ) {
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

			const validGroups = [
				WORDPRESS_DEPS,
				EXTERNAL_DEPS,
				INTERNAL_DEPS,
			];

			// Check for orphaned dependency comments
			checkOrphanedCommentsBeforeFirstImport( importNodes, validGroups );
			checkOrphanedCommentsBetweenImports( importNodes, validGroups );

			let currentGroup = null;
			let lastNode = null;
			let lastSource = null;

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
		 * @param {Object} node Import node.
		 * @return {Array} Array of comment tokens.
		 */
		function getNonDependencyComments( node ) {
			const validGroups = [
				WORDPRESS_DEPS,
				EXTERNAL_DEPS,
				INTERNAL_DEPS,
			];

			const comments = sourceCode.getCommentsBefore( node );
			const nonDepComments = [];

			// First pass: identify which comments are non-dependency and close to the import
			const candidates = [];
			for ( const comment of comments ) {
				// Check if it's a dependency comment
				if ( comment.type === 'Block' ) {
					const commentText = normalizeCommentText( comment.value );
					if ( validGroups.includes( commentText ) ) {
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
				for ( let i = comments.length - 1; i >= 0; i-- ) {
					const comment = comments[ i ];

					// Skip dependency comments
					if ( comment.type === 'Block' ) {
						const commentText = normalizeCommentText(
							comment.value
						);
						if ( validGroups.includes( commentText ) ) {
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
		 * @param {Array} importNodes Import nodes.
		 * @param {Array} validGroups Valid dependency group names.
		 * @return {number} Start position for replacement.
		 */
		function determineReplaceStart( importNodes, validGroups ) {
			const firstImport = importNodes[ 0 ];
			let replaceStart = firstImport.range[ 0 ];

			// Check all comments before the first import
			const commentsBefore = sourceCode.getCommentsBefore( firstImport );

			// Find all consecutive dependency comments before the first import
			// Working backwards from the import
			let foundConsecutiveChain = false;
			for ( let i = commentsBefore.length - 1; i >= 0; i-- ) {
				const comment = commentsBefore[ i ];

				// Only consider block comments
				if ( comment.type !== 'Block' ) {
					// Non-block comment breaks the chain
					if ( foundConsecutiveChain ) {
						break;
					}
					continue;
				}

				const commentText = normalizeCommentText( comment.value );
				if ( ! validGroups.includes( commentText ) ) {
					// Non-dependency comment breaks the chain
					if ( foundConsecutiveChain ) {
						break;
					}
					continue;
				}

				// This is a dependency comment - check how far it is from what follows
				const nextItem =
					i < commentsBefore.length - 1
						? commentsBefore[ i + 1 ]
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
		 * @param {Object} fixer        ESLint fixer.
		 * @param {Object} node         Import node.
		 * @param {number} replaceStart Start position for replacement.
		 * @param {Array}  validGroups  Valid dependency group names.
		 * @param {Array}  newImports   New organized import lines.
		 * @return {Array} Array of fixes.
		 */
		function processFirstImport(
			fixer,
			node,
			replaceStart,
			validGroups,
			newImports
		) {
			const fixes = [];

			// Check for preceding comment
			const precedingComment = getPrecedingCommentBlock( node );
			if (
				precedingComment &&
				precedingComment.range[ 0 ] >= replaceStart &&
				validGroups.includes(
					normalizeCommentText( precedingComment.value )
				)
			) {
				// This comment is already in the replace range, skip it
			} else if (
				precedingComment &&
				validGroups.includes(
					normalizeCommentText( precedingComment.value )
				)
			) {
				// This comment is before the replace range, remove it
				fixes.push( fixer.remove( precedingComment ) );
			}

			// Remove any non-dependency comments that are not in the replace range
			const nonDepComments = getNonDependencyComments( node );
			for ( const comment of nonDepComments ) {
				if ( comment.range[ 0 ] >= replaceStart ) {
					// Already in replace range
					continue;
				}
				fixes.push( fixer.remove( comment ) );
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
		 * @param {Object} fixer       ESLint fixer.
		 * @param {Object} node        Import node.
		 * @param {Array}  validGroups Valid dependency group names.
		 * @return {Array} Array of fixes.
		 */
		function processOtherImport( fixer, node, validGroups ) {
			const fixes = [];

			// Check for preceding comment
			const precedingComment = getPrecedingCommentBlock( node );
			if (
				precedingComment &&
				validGroups.includes(
					normalizeCommentText( precedingComment.value )
				)
			) {
				// Remove the comment
				fixes.push( fixer.remove( precedingComment ) );
			}

			// Remove any non-dependency comments
			const nonDepComments = getNonDependencyComments( node );
			for ( const comment of nonDepComments ) {
				fixes.push( fixer.remove( comment ) );
			}

			fixes.push( fixer.remove( node ) );

			return fixes;
		}

		/**
		 * Fixes import organization by grouping all imports properly.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} fixer          ESLint fixer.
		 * @param {Array}  importNodes    All import nodes.
		 * @param {Object} groupedImports Imports grouped by type.
		 * @return {Array} Array of fixes.
		 */
		function fixImportOrganization( fixer, importNodes, groupedImports ) {
			const fixes = [];
			const validGroups = [
				WORDPRESS_DEPS,
				EXTERNAL_DEPS,
				INTERNAL_DEPS,
			];

			// Sort imports within each group
			const sortedGroups = {};
			for ( const group of [
				EXTERNAL_DEPS,
				WORDPRESS_DEPS,
				INTERNAL_DEPS,
			] ) {
				sortedGroups[ group ] = [ ...groupedImports[ group ] ].sort(
					compareImports
				);
			}

			// Build the new import section
			const newImports = [];
			let firstGroup = true;

			for ( const group of [
				EXTERNAL_DEPS,
				WORDPRESS_DEPS,
				INTERNAL_DEPS,
			] ) {
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
			const replaceStart = determineReplaceStart(
				importNodes,
				validGroups
			);

			// Remove all existing imports and their comments
			for ( let i = 0; i < importNodes.length; i++ ) {
				const node = importNodes[ i ];

				if ( i === 0 ) {
					fixes.push(
						...processFirstImport(
							fixer,
							node,
							replaceStart,
							validGroups,
							newImports
						)
					);
				} else {
					fixes.push(
						...processOtherImport( fixer, node, validGroups )
					);
				}
			}

			return fixes;
		}

		return {
			Program( node ) {
				const importGroups = groupImports( node.body );

				// Check the first import group normally
				if ( importGroups.length > 0 ) {
					checkImportGroup( importGroups[ 0 ] );
				}

				// For any subsequent import groups (orphaned imports), report an error
				for ( let i = 1; i < importGroups.length; i++ ) {
					const orphanedGroup = importGroups[ i ];
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
