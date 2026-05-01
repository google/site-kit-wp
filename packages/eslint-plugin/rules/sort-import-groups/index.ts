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
import type { Rule } from 'eslint';
import type * as ESTree from 'estree';

/**
 * Internal dependencies
 */
import type {
	AnyNode,
	DependencyGroup,
	GroupedImports,
	ImportNode,
	LComment,
} from './types';
import {
	EXTERNAL_DEPENDENCIES,
	INTERNAL_DEPENDENCIES,
	WORDPRESS_DEPENDENCIES,
	compareImports,
	determineReplaceStart,
	getExpectedCommentBlock,
	getImportGroup,
	getImportSource,
	getNonDependencyComments,
	getPrecedingCommentBlock,
	groupImports,
	groupImportsByType,
	importedName,
	isValidGroupComment,
	leadingComments,
	needsImportReorganization,
	normalizeCommentText,
} from './utils';

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

		function reportReorganizationErrors(
			importNodes: ImportNode[],
			groupedImports: GroupedImports
		) {
			const expectedOrder: DependencyGroup[] = [
				EXTERNAL_DEPENDENCIES,
				WORDPRESS_DEPENDENCIES,
				INTERNAL_DEPENDENCIES,
			];

			for ( let index = 1; index < importNodes.length; index++ ) {
				const previousGroup = getImportGroup(
					getImportSource( importNodes[ index - 1 ] )
				);
				const currentGroup = getImportGroup(
					getImportSource( importNodes[ index ] )
				);

				let seenBefore = false;
				for ( let index_ = 0; index_ < index - 1; index_++ ) {
					if (
						getImportGroup(
							getImportSource( importNodes[ index_ ] )
						) === currentGroup
					) {
						seenBefore = true;
						break;
					}
				}

				const prevExpectedIndex =
					expectedOrder.indexOf( previousGroup );
				const currExpectedIndex = expectedOrder.indexOf( currentGroup );
				const wrongOrder = currExpectedIndex < prevExpectedIndex;

				if (
					( seenBefore && previousGroup !== currentGroup ) ||
					wrongOrder
				) {
					const source = getImportSource( importNodes[ index ] );
					const message = seenBefore
						? `Import from '${ source }' should be grouped with other ${ currentGroup } imports.`
						: `Import from '${ source }' should come before ${ previousGroup } imports.`;

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
					break;
				}
			}
		}

		function checkCommentBlock(
			node: ImportNode,
			source: string,
			group: DependencyGroup,
			options: {
				needsReorganization: boolean;
				previousNode: ImportNode | null;
			}
		) {
			const precedingComment = getPrecedingCommentBlock(
				sourceCode,
				node
			);
			const expectedComment = getExpectedCommentBlock( group );

			const needsBlankLineBefore =
				options.previousNode !== null &&
				node.range[ 0 ] >= 2 &&
				sourceCode.text[ node.range[ 0 ] - 2 ] !== '\n';

			if ( ! precedingComment ) {
				if ( ! options.needsReorganization ) {
					context.report( {
						node,
						message: `Import from '${ source }' should be preceded by a "${ group }" comment block.`,
						fix( fixer ) {
							const nodeText = sourceCode.getText( node );
							const prefix = needsBlankLineBefore ? '\n' : '';
							return fixer.replaceText(
								node,
								`${ prefix }${ expectedComment }\n${ nodeText }`
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
							if ( isValidGroupComment( commentText ) ) {
								return fixer.replaceTextRange(
									precedingComment.range,
									expectedComment
								);
							}
							return fixer.insertTextBefore(
								node,
								`\n${ expectedComment }\n`
							);
						},
					} );
				}
			}
		}

		function checkDuplicateCommentBlock( node: ImportNode ) {
			const precedingComment = getPrecedingCommentBlock(
				sourceCode,
				node
			);
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

		function generateSortFixes(
			fixer: Rule.RuleFixer,
			importNodes: ImportNode[],
			group: DependencyGroup
		) {
			const importsInGroup = importNodes.filter(
				( node ) => getImportGroup( getImportSource( node ) ) === group
			);

			const sorted = [ ...importsInGroup ].sort( ( nodeA, nodeB ) =>
				compareImports( nodeA, nodeB, importsInGroup )
			);

			const newImports: string[] = [];
			for ( const node of sorted ) {
				const nonDepComments = getNonDependencyComments(
					sourceCode,
					node
				);

				for ( const comment of nonDepComments ) {
					if ( comment.type === 'Line' ) {
						newImports.push( `//${ comment.value }` );
					} else {
						newImports.push( `/*${ comment.value }*/` );
					}
				}

				newImports.push( sourceCode.getText( node ) );
			}

			const firstImport = importsInGroup[ 0 ];
			const lastImport = importsInGroup[ importsInGroup.length - 1 ];
			const startPosition = firstImport.range[ 0 ];
			const endPosition = lastImport.range[ 1 ];

			return [
				fixer.replaceTextRange(
					[ startPosition, endPosition ],
					newImports.join( '\n' )
				),
			];
		}

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

			const nonDependencyComments = getNonDependencyComments(
				sourceCode,
				node
			);

			let effectiveStartLine = node.loc.start.line;
			if ( nonDependencyComments.length > 0 ) {
				effectiveStartLine = nonDependencyComments[ 0 ].loc.start.line;
			}

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

		function checkAlphabeticalOrder(
			node: ImportNode,
			lastNode: ImportNode | null,
			source: string,
			lastSource: string | null,
			group: DependencyGroup,
			importNodes: ImportNode[],
			options: { needsReorganization: boolean }
		) {
			const importsInGroup = importNodes.filter(
				( importNode ) =>
					getImportGroup( getImportSource( importNode ) ) === group
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

		function createOrphanedCommentFix( comment: LComment ) {
			return ( fixer: Rule.RuleFixer ) => {
				const commentEnd = comment.range[ 1 ];
				const sourceAfter = sourceCode.text.slice( commentEnd );
				const newlineMatch = sourceAfter.match( /^\n/ );
				const endPos = newlineMatch ? commentEnd + 1 : commentEnd;

				const sourceBefore = sourceCode.text.slice(
					0,
					comment.range[ 0 ]
				);
				const prevCharIsNewline =
					sourceBefore.length >= 1 &&
					sourceBefore[ sourceBefore.length - 1 ] === '\n';
				const prevPrevIsNotNewline =
					sourceBefore.length >= 2 &&
					sourceBefore[ sourceBefore.length - 2 ] !== '\n';
				const textAfterRemoval = sourceCode.text.slice( endPos );
				const nextIsComment = /^\s*\/\*\*/.test( textAfterRemoval );

				if (
					prevCharIsNewline &&
					prevPrevIsNotNewline &&
					nextIsComment
				) {
					return fixer.replaceTextRange(
						[ comment.range[ 0 ], endPos ],
						'\n'
					);
				}

				return fixer.removeRange( [ comment.range[ 0 ], endPos ] );
			};
		}

		function checkOrphanedCommentsBeforeFirstImport(
			importNodes: ImportNode[]
		) {
			const firstImport = importNodes[ 0 ];
			const commentsBefore = leadingComments( sourceCode, firstImport );

			for ( const comment of commentsBefore ) {
				if ( comment.type !== 'Block' ) {
					continue;
				}

				const commentText = normalizeCommentText( comment.value );
				if ( ! isValidGroupComment( commentText ) ) {
					continue;
				}

				const precedingComment = getPrecedingCommentBlock(
					sourceCode,
					firstImport
				);
				if ( precedingComment === comment ) {
					continue;
				}

				context.report( {
					node: firstImport,
					message:
						'Orphaned dependency comment block should be removed.',
					fix: createOrphanedCommentFix( comment ),
				} );
			}
		}

		function checkOrphanedCommentsBetweenImports(
			importNodes: ImportNode[]
		) {
			for ( let index = 1; index < importNodes.length; index++ ) {
				const currentImport = importNodes[ index ];
				const prevImport = importNodes[ index - 1 ];
				const commentsBetween = leadingComments(
					sourceCode,
					currentImport
				);

				for ( const comment of commentsBetween ) {
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

					const precedingComment = getPrecedingCommentBlock(
						sourceCode,
						currentImport
					);
					if ( precedingComment === comment ) {
						continue;
					}

					context.report( {
						node: currentImport,
						message:
							'Orphaned dependency comment block should be removed.',
						fix: createOrphanedCommentFix( comment ),
					} );
				}
			}
		}

		function checkMemberSortOrder( node: ImportNode ) {
			if ( node.type !== 'ImportDeclaration' ) {
				return;
			}

			const importSpecifiers = node.specifiers.filter(
				( specifier ): specifier is ESTree.ImportSpecifier =>
					specifier.type === 'ImportSpecifier'
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

							const allSpecifiers = node.specifiers;
							const defaultSpecifier = allSpecifiers.find(
								( specifier ) =>
									specifier.type === 'ImportDefaultSpecifier'
							);
							const namespaceSpecifier = allSpecifiers.find(
								( specifier ) =>
									specifier.type ===
									'ImportNamespaceSpecifier'
							);

							const parts: string[] = [];

							if ( defaultSpecifier ) {
								parts.push(
									sourceCode.getText( defaultSpecifier )
								);
							}

							if ( namespaceSpecifier ) {
								parts.push(
									sourceCode.getText( namespaceSpecifier )
								);
							}

							if ( sorted.length > 0 ) {
								const sortedText = sorted
									.map( ( specifier ) => {
										const name = importedName( specifier );
										if ( name === specifier.local.name ) {
											return name;
										}
										return `${ name } as ${ specifier.local.name }`;
									} )
									.join( ', ' );
								parts.push( `{ ${ sortedText } }` );
							}

							const newSpecifiers = parts.join( ', ' );
							const source = sourceCode.getText( node.source );

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

		function checkImportGroup( importNodes: ImportNode[] ) {
			if ( importNodes.length === 0 ) {
				return;
			}

			const groupedImports = groupImportsByType( importNodes );
			const needsReorganizationFlag =
				needsImportReorganization( importNodes );

			if ( needsReorganizationFlag ) {
				reportReorganizationErrors( importNodes, groupedImports );
				return;
			}

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
						needsReorganization: needsReorganizationFlag,
						previousNode: lastNode,
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
						{ needsReorganization: needsReorganizationFlag }
					);
				}

				checkAlphabeticalOrder(
					node,
					lastNode,
					source,
					lastSource,
					group,
					importNodes,
					{ needsReorganization: needsReorganizationFlag }
				);

				checkMemberSortOrder( node );

				lastNode = node;
				lastSource = source;
			}
		}

		function processFirstImport(
			fixer: Rule.RuleFixer,
			node: ImportNode,
			replaceStart: number,
			newImports: string[]
		) {
			const fixes: Rule.Fix[] = [];

			const precedingComment = getPrecedingCommentBlock(
				sourceCode,
				node
			);
			if (
				precedingComment &&
				precedingComment.range[ 0 ] >= replaceStart &&
				isValidGroupComment(
					normalizeCommentText( precedingComment.value )
				)
			) {
				// Comment already in replace range.
			} else if (
				precedingComment &&
				isValidGroupComment(
					normalizeCommentText( precedingComment.value )
				)
			) {
				fixes.push( fixer.removeRange( precedingComment.range ) );
			}

			const nonDependencyComments = getNonDependencyComments(
				sourceCode,
				node
			);
			for ( const comment of nonDependencyComments ) {
				if ( comment.range[ 0 ] >= replaceStart ) {
					continue;
				}
				fixes.push( fixer.removeRange( comment.range ) );
			}

			fixes.push(
				fixer.replaceTextRange(
					[ replaceStart, node.range[ 1 ] ],
					newImports.join( '\n' )
				)
			);

			return fixes;
		}

		function processOtherImport( fixer: Rule.RuleFixer, node: ImportNode ) {
			const fixes: Rule.Fix[] = [];

			const precedingComment = getPrecedingCommentBlock(
				sourceCode,
				node
			);
			if (
				precedingComment &&
				isValidGroupComment(
					normalizeCommentText( precedingComment.value )
				)
			) {
				fixes.push( fixer.removeRange( precedingComment.range ) );
			}

			const nonDepComments = getNonDependencyComments( sourceCode, node );
			for ( const comment of nonDepComments ) {
				fixes.push( fixer.removeRange( comment.range ) );
			}

			fixes.push( fixer.remove( node ) );

			return fixes;
		}

		function fixImportOrganization(
			fixer: Rule.RuleFixer,
			importNodes: ImportNode[],
			groupedImports: GroupedImports
		) {
			const fixes: Rule.Fix[] = [];

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

			const newImports: string[] = [];
			let firstGroup = true;

			for ( const group of orderedGroups ) {
				if ( sortedGroups[ group ].length === 0 ) {
					continue;
				}

				if ( ! firstGroup ) {
					newImports.push( '' );
				}
				firstGroup = false;

				newImports.push( getExpectedCommentBlock( group ) );

				for ( const node of sortedGroups[ group ] ) {
					const nonDepComments = getNonDependencyComments(
						sourceCode,
						node
					);

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

			const replaceStart = determineReplaceStart(
				sourceCode,
				importNodes
			);

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

				if ( importGroups.length > 0 ) {
					checkImportGroup( importGroups[ 0 ] );
				}

				for ( let index = 1; index < importGroups.length; index++ ) {
					const orphanedGroup = importGroups[ index ];
					for ( const importNode of orphanedGroup ) {
						const source = getImportSource( importNode );

						context.report( {
							node: importNode,
							message: `Import from '${ source }' is separated from other imports. All imports should be grouped together at the top of the file.`,
							fix( fixer ) {
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
						break;
					}
				}
			},
		};
	},
};

export default rule;
