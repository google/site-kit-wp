/**
 * ESLint rules.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
const { default: iterateJsdoc } = require( 'eslint-plugin-jsdoc/dist/iterateJsdoc' );

const isDependencyBlock = ( jsdoc ) => {
	if ( jsdoc && jsdoc.description && (
		jsdoc.description.trim() === 'Node dependencies' ||
		jsdoc.description.trim() === 'External dependencies' ||
		jsdoc.description.trim() === 'WordPress dependencies' ||
		jsdoc.description.trim() === 'Internal dependencies'
	) ) {
		return true;
	}
};

module.exports = {
	rules: {
		'camelcase-acronyms': {
			create( context ) {
				const options = context.options[ 0 ] || {};
				let properties = options.properties || '';

				if ( properties !== 'always' && properties !== 'never' ) {
					properties = 'always';
				}

				//--------------------------------------------------------------------------
				// Helpers
				//--------------------------------------------------------------------------

				// contains reported nodes to avoid reporting twice on destructuring with shorthand notation
				const reported = [];
				const acronyms = [
					'AMP',
					'HTML',
					'ID',
					'JSON',
					'URL',
				];

				/**
				 * Reports an AST node as a rule violation.
				 *
				 * @since n.e.x.t
				 * @private
				 *
				 * @param {Object} node The node to report.
				 * @return {void}
				 */
				const report = ( node ) => {
					if ( ! reported.includes( node ) ) {
						reported.push( node );
						context.report( { node, message: `\`${ node.name }\` violates naming rules.`, data: { name: node.name } } );
					}
				};

				return {
					Identifier( node ) {
						const name = node.name;

						// Ignore imports, because they may not respect our rules.
						if ( node.parent && (
							node.parent.type === 'ImportDefaultSpecifier' ||
							node.parent.type === 'ImportSpecifier' ||
							( node.parent.parent && (
								node.parent.parent.type === 'ExportDefaultDeclaration' ||
								node.parent.parent.type === 'ExportDeclaration'
							) )
						) ) {
							return;
						}

						// Ignore known, JS globals like `document` and `window`.
						// `document.getElementById` should not set off this rule.
						if (
							node.parent && node.parent.object &&
							(
								(
									node.parent.object.name === 'document' ||
									node.parent.object.name === 'global' ||
									node.parent.object.name === 'window'
								) || (
									node.parent.object.object && (
										node.parent.object.object.name === 'document' ||
										node.parent.object.object.name === 'global' ||
										node.parent.object.object.name === 'window'
									)
								)
							)
						) {
							return;
						}

						acronyms.forEach( ( acronym ) => {
							const acronymMatches = name.match( new RegExp( acronym, 'i' ) );

							// We found this acronym in the variable, but so far it was a
							// case-insensitive match.
							if ( acronymMatches ) {
								const acronymMatch = acronymMatches[ 0 ];
								// The acronym was found in the variable with the correct capitalization, so
								// this variable is good.
								if ( acronymMatch === acronym ) {
									return;
								}

								// If the acronym was found entirely lowercased, skip this check.
								// Things like `componentDidMount` will set off `ID` otherwise.
								if ( acronymMatch === acronym.toLowerCase() ) {
									return;
								}

								// Only make the check if the first character is uppercase.
								const startsWithUppercase = acronymMatch.match( /^[A-Z]/ );
								if ( ! startsWithUppercase || ! startsWithUppercase.length ) {
									return;
								}

								// If the name of this variable is the same length as the acronym,
								// it should be lowercase or uppercase.
								if ( name.length === acronym.length && ( acronymMatch === acronym.toLowerCase() || acronymMatch !== acronym ) ) {
									return;
								}

								// If the character after the matched acronym is lowercase, this isn't
								// likely to be the acronym, but instead a word like `Idle` matching `Id`.
								// Best to ignore it so we don't get false positives we need to ignore.
								if (
									acronymMatches.input[ acronymMatches.index + acronym.length ] &&
									acronymMatches.input[ acronymMatches.index + acronym.length ].match( /[a-z]/ )
								) {
									return;
								}

								report( node );
							}
						} );
					},
				};
			},
		},
		'jsdoc-third-person': iterateJsdoc( ( {
			context,
			jsdoc,
			jsdocNode,
		} ) => {
			if ( isDependencyBlock( jsdoc ) ) {
				return;
			}

			if ( jsdoc.line === 0 ) {
				return;
			}

			if ( jsdoc.description && ! jsdoc.description.match( /^\w+s\W.*/g ) ) {
				context.report( { node: jsdocNode, message: `The first word in a function's description should end in "s".`, data: { name: jsdocNode.name } } );
			}
		}, {
			iterateAllJsdocs: true,
			meta: {
				docs: {
					description: `Requires that all functions' first word end with "s".`,
				},
				fixable: 'code',
				type: 'suggestion',
			},
		} ),
		'jsdoc-requires-since': iterateJsdoc( ( {
			context,
			jsdoc,
			jsdocNode,
			utils,
		} ) => {
			if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
				return;
			}

			const hasSinceTag = utils.filterTags( ( { tag } ) => {
				return [ 'since' ].includes( tag );
			} );

			if ( hasSinceTag.length ) {
				return;
			}

			context.report( { node: jsdocNode, message: `Missing @since tag in JSDoc.`, data: { name: jsdocNode.name } } );
		}, {
			iterateAllJsdocs: true,
			meta: {
				docs: {
					description: 'Requires that all functions have a `@since` tag.',
				},
				fixable: 'code',
				type: 'suggestion',
			},
		} ),
		'jsdoc-capitalization': iterateJsdoc( ( {
			context,
			jsdoc,
			jsdocNode,
		} ) => {
			// Skip the first doc block, as these are frequently marked by things like "core/forms".
			// It's silly to allow-list all those files, and creating exceptions for them seems
			// silly at this point as well. For now we'll check doc blocks _after_ the first one.
			if ( jsdoc.line === 0 ) {
				return;
			}

			if ( jsdoc.description && ! jsdoc.description.match( /^[A-Z].*/g ) ) {
				context.report( { node: jsdocNode, message: `JSDoc blocks should start with a capital letter.`, data: { name: jsdocNode.name } } );
			}

			// Move on to checking tags for this JSDoc block.
			if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
				return;
			}

			jsdoc.tags.forEach( ( tag ) => {
				// Only check these tags for capitalization.
				if ( ! [ 'param', 'returns' ].includes( tag.tag ) ) {
					return;
				}

				if ( tag.description && tag.description.length && ! tag.description.trim().match( /^[A-Z].*/gm ) ) {
					context.report( { node: jsdocNode, message: `The description for \`${ tag.source }\` should start with a capital letter.`, data: { name: jsdocNode.name } } );
				}
			} );
		}, {
			iterateAllJsdocs: true,
			meta: {
				docs: {
					description: 'Requires that descriptions start with capital letters.',
				},
				fixable: 'code',
				type: 'suggestion',
			},
		} ),
		'jsdoc-fullstop': iterateJsdoc( ( {
			context,
			jsdoc,
			jsdocNode,
		} ) => {
			if ( isDependencyBlock( jsdoc ) ) {
				return;
			}

			// Don't match code block examples that end in "```".
			if ( jsdoc.description && ! jsdoc.description.match( /\.$/g ) && ! jsdoc.description.match( /```$/g ) ) {
				context.report( { node: jsdocNode, message: `JSDoc block text should end with a period/full-stop.`, data: { name: jsdocNode.name } } );
				return;
			}

			// Move on to checking tags for this JSDoc block.
			if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
				return;
			}

			jsdoc.tags.forEach( ( tag ) => {
				// Only check these tags for fullstops.
				if ( ! [ 'param', 'returns' ].includes( tag.tag ) ) {
					return;
				}

				if ( tag.description && tag.description.length && ! tag.description.match( /\.$/gm ) ) {
					context.report( { node: jsdocNode, message: `The description for \`${ tag.source }\` should end with a period/full-stop.`, data: { name: jsdocNode.name } } );
				}
			} );
		}, {
			iterateAllJsdocs: true,
			meta: {
				docs: {
					description: 'Requires that descriptions start with capital letters.',
				},
				fixable: 'code',
				type: 'suggestion',
			},
		} ),
		'jsdoc-tag-grouping': iterateJsdoc( ( {
			context,
			jsdoc,
			jsdocNode,
			utils,
		} ) => {
			if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
				return;
			}

			// eslint-disable-next-line no-nested-ternary
			const lastTagInFirstGroup = !! utils.filterTags( ( { tag } ) => {
				return [ 'private' ].includes( tag );
			} ).length ? 'private' : ( !! utils.filterTags( ( { tag } ) => {
					return [ 'deprecated' ].includes( tag );
				} ).length ? 'deprecated' : 'since' );

			const firstTagInSecondGroup = !! utils.filterTags( ( { tag } ) => {
				return [ 'param' ].includes( tag );
			} ).length ? 'param' : 'return';

			if ( ! jsdoc.source.match( new RegExp( `@${ lastTagInFirstGroup }.*\\n\\n@${ firstTagInSecondGroup }`, 'gm' ) ) ) {
				context.report( { node: jsdocNode, message: `The @${ lastTagInFirstGroup } tag should be followed by an empty line, and then by the @${ firstTagInSecondGroup } tag.`, data: { name: jsdocNode.name } } );
			}
		}, {
			iterateAllJsdocs: true,
			meta: {
				docs: {
					description: 'Requires that all functions have properly sorted doc annotations.',
				},
				fixable: 'code',
				type: 'suggestion',
			},
		} ),
		'jsdoc-tag-order': iterateJsdoc( ( {
			context,
			jsdocNode,
			utils,
		} ) => {
			const expectedTagOrder = [ 'since', 'deprecated', 'private', 'param', 'return' ];

			const tags = utils.filterTags( ( { tag } ) => {
				return expectedTagOrder.includes( tag );
			} ).sort( ( tagA, tagB ) => {
				return tagA.line > tagB.line ? 1 : -1;
			} ).map( ( tag ) => {
				return tag.tag;
			} );

			const checkTagOrder = ( { previousTag, tag, tagOrder } ) => {
				const previousPositionInTagOrder = tagOrder.indexOf( previousTag );
				const currentPositionInTagOrder = tagOrder.indexOf( tag );

				if ( previousPositionInTagOrder > currentPositionInTagOrder ) {
					context.report( { node: jsdocNode, message: `The @${ tag } tag should be before @${ previousTag } tag.`, data: { name: jsdocNode.name } } );
				}
			};

			tags.forEach( ( tag, index ) => {
				checkTagOrder( {
					previousTag: tags[ index - 1 ] || 'since',
					tag,
					tagOrder: expectedTagOrder,
				} );
			} );
		}, {
			iterateAllJsdocs: true,
			meta: {
				docs: {
					description: 'Requires that all functions have properly sorted doc annotations.',
				},
				fixable: 'code',
				type: 'suggestion',
			},
		} ),
	},
};
