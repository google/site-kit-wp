/**
 * ESLint rules: Sort Imports
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
				'Enforce sorted imports with proper grouping and comment blocks',
			category: 'Stylistic Issues',
			recommended: true,
		},
		fixable: 'code',
		schema: [
			{
				type: 'object',
				properties: {
					ignoreCase: {
						type: 'boolean',
						default: false,
					},
					ignoreDeclarationSort: {
						type: 'boolean',
						default: false,
					},
					ignoreMemberSort: {
						type: 'boolean',
						default: false,
					},
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
			ignoreCase = false,
			ignoreDeclarationSort = false,
			ignoreMemberSort = false,
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
			if ( source.startsWith( '@wordpress/' ) ) {
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

			// First, sort alphabetically by source
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

			const compareA = ignoreCase
				? normalizedA.toLowerCase()
				: normalizedA;
			const compareB = ignoreCase
				? normalizedB.toLowerCase()
				: normalizedB;

			const sourceComparison = compareA.localeCompare( compareB );

			// If sources are different, sort by source
			if ( sourceComparison !== 0 ) {
				return sourceComparison;
			}

			// If sources are the same, sort by member syntax order
			const syntaxA = getMemberSyntax( nodeA );
			const syntaxB = getMemberSyntax( nodeB );
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
			if ( ignoreMemberSort || node.type !== 'ImportDeclaration' ) {
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

				const compareA = ignoreCase ? prevName.toLowerCase() : prevName;
				const compareB = ignoreCase ? currName.toLowerCase() : currName;

				if ( compareA > compareB ) {
					context.report( {
						node: currSpec,
						message: `Member '${ currName }' of the import declaration should be sorted alphabetically.`,
						fix( fixer ) {
							// Sort all import specifiers
							const sorted = [ ...importSpecifiers ].sort(
								( a, b ) => {
									const nameA = ignoreCase
										? a.imported.name.toLowerCase()
										: a.imported.name;
									const nameB = ignoreCase
										? b.imported.name.toLowerCase()
										: b.imported.name;
									return nameA.localeCompare( nameB );
								}
							);

							// Generate the sorted specifiers text
							const sortedText = sorted
								.map( ( spec ) => {
									if (
										spec.imported.name === spec.local.name
									) {
										return spec.imported.name;
									}
									return `${ spec.imported.name } as ${ spec.local.name }`;
								} )
								.join( ', ' );

							// Find the range of the specifiers
							const firstSpec = importSpecifiers[ 0 ];
							const lastSpec =
								importSpecifiers[ importSpecifiers.length - 1 ];

							return fixer.replaceTextRange(
								[ firstSpec.range[ 0 ], lastSpec.range[ 1 ] ],
								sortedText
							);
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

			let currentGroup = null;
			let lastNode = null;
			let lastSource = null;

			for ( const node of importNodes ) {
				const source = getImportSource( node );
				const group = getImportGroup( source );

				// Check if group changed
				if ( group !== currentGroup ) {
					const precedingComment = getPrecedingCommentBlock( node );
					const expectedComment = getExpectedCommentBlock( group );

					// Check if the correct comment block exists
					if ( ! precedingComment ) {
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

					currentGroup = group;
					lastNode = null; // Reset when group changes
					lastSource = null;
				}

				// Check alphabetical order within the same group
				if ( lastNode && ! ignoreDeclarationSort ) {
					if ( compareImports( lastNode, node ) > 0 ) {
						context.report( {
							node,
							message: `Import from '${ source }' should be sorted alphabetically (before '${ lastSource }').`,
							fix( fixer ) {
								// Find all imports in this group and sort them
								const importsInGroup = importNodes.filter(
									( n ) =>
										getImportGroup(
											getImportSource( n )
										) === group
								);

								const sorted = [ ...importsInGroup ].sort(
									compareImports
								);

								// Generate fixes for reordering
								const fixes = [];
								for (
									let i = 0;
									i < importsInGroup.length;
									i++
								) {
									fixes.push(
										fixer.replaceText(
											importsInGroup[ i ],
											sourceCode.getText( sorted[ i ] )
										)
									);
								}

								return fixes;
							},
						} );
					}
				}

				// Check member sort order
				checkMemberSortOrder( node );

				lastNode = node;
				lastSource = source;
			}
		}

		return {
			Program( node ) {
				const importGroups = groupImports( node.body );
				for ( const group of importGroups ) {
					checkImportGroup( group );
				}
			},
		};
	},
};
