/* eslint-disable @wordpress/no-unused-vars-before-return */
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
				 * @param {ASTNode} node The node to report.
				 * @return {void}
				 * @private
				 */
				function report( node ) {
					if ( ! reported.includes( node ) ) {
						reported.push( node );
						context.report( { node, message: `\`${ node.name }\` violates naming rules.`, data: { name: node.name } } );
					}
				}

				return {
					Identifier( node ) {
						const name = node.name;

						// Ignore imports, because they may not respect our rules.
						if ( node.parent.type === 'ImportSpecifier' ) {
							return;
						}

						acronyms.forEach( ( acronym ) => {
							const acronymMatches = name.match( new RegExp( acronym, 'ig' ) );

							// We found this acronym in the variable, but so far it was a
							// case-insensitive match.
							if ( acronymMatches && acronymMatches.length ) {
								acronymMatches.forEach( ( acronymMatch ) => {
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
									const startsWithUppercase = acronymMatch[ 0 ].match( /[A-Z]/ );
									if ( ! startsWithUppercase || ! startsWithUppercase.length ) {
										return;
									}

									// If the name of this variable is the same length as the acronym,
									// it should be lowercase or uppercase.
									if ( name.length === acronym.length && ( acronymMatch === acronym.toLowerCase() || acronymMatch !== acronym ) ) {
										return;
									}

									report( node );
								} );
							}
						} );
					},
				};
			},
		},
	},
};
