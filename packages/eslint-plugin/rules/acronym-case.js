/**
 * ESLint rules: Camelcase acronyms.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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

/* eslint complexity: [ "error", 17 ] */

/**
 * Internal dependencies
 */
const { isImported, isFunction } = require( '../utils' );

module.exports = {
	create( context ) {
		const options = context.options[ 0 ] || {};
		let properties = options.properties || '';
		const importedNames = [];

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
			'CTA',
			'GA',
			'GTM',
			'HTML',
			'ID',
			'JSON',
			'URL',
		];

		/**
		 * Reports an AST node as a rule violation.
		 *
		 * @since 1.18.0
		 * @private
		 *
		 * @param {Object} node The node to report.
		 * @return {void}
		 */
		function report( node ) {
			if ( ! reported.includes( node ) ) {
				reported.push( node );
				context.report( {
					data: { name: node.name },
					message: `\`${ node.name }\` violates naming rules.`,
					node,
				} );
			}
		}

		return {
			Identifier( node ) {
				const name = node.name;

				// Ignore imports, because they may not respect our rules.
				if ( isImported( node ) ) {
					importedNames.push( node.name );
					return;
				}

				// Ignore identifiers that are a function call or argument, we can assume the identifier will be validated at the point of declaration,
				// but want to allow those which are exceptions to the rule to be invoked or passed into functions without raising a linting error.
				if ( node.parent?.type === 'CallExpression' ) {
					return;
				}

				// Ignore known, JS globals like `document` and `window`.
				// `document.getElementById` should not set off this rule.
				if (
					node.parent &&
					node.parent.object &&
					( node.parent.object.name === 'document' ||
						node.parent.object.name === 'global' ||
						node.parent.object.name === 'window' ||
						( node.parent.object.object &&
							( node.parent.object.object.name === 'document' ||
								node.parent.object.object.name === 'global' ||
								node.parent.object.object.name ===
									'window' ) ) )
				) {
					return;
				}

				acronyms.forEach( ( acronym ) => {
					const acronymMatches = name.match(
						new RegExp( acronym, 'i' )
					);

					// We found this acronym in the variable, but so far it was a
					// case-insensitive match.
					if ( acronymMatches ) {
						const acronymMatch = acronymMatches[ 0 ];

						// The acronym was found in the variable with the correct capitalization
						if ( acronymMatch === acronym ) {
							// Catch instances of URL() and JSON() that weren't identified as
							// globals above
							if ( acronymMatch.length === name.length ) {
								return;
							}
							// If the acronym is not at the start that's fine, e.g. fooBarID
							if ( ! name.startsWith( acronym ) ) {
								return;
							}
							// or if the acronym IS at the start but it is a function, see #2195
							if ( isFunction( node ) ) {
								return;
							}
							// Constants in all-caps are fine
							if (
								node.type === 'Identifier' &&
								name === name.toUpperCase()
							) {
								return;
							}
						}

						// If the acronym was found entirely lowercased, skip this check.
						// Things like `componentDidMount` will set off `ID` otherwise.
						if ( acronymMatch === acronym.toLowerCase() ) {
							return;
						}

						// Only make the check if the first character is uppercase.
						const startsWithUppercase =
							acronymMatch.match( /^[A-Z]/ );
						if (
							! startsWithUppercase ||
							! startsWithUppercase.length
						) {
							return;
						}

						// If the name of this variable is the same length as the acronym,
						// it should be lowercase or uppercase.
						if (
							name.length === acronym.length &&
							( acronymMatch === acronym.toLowerCase() ||
								acronymMatch === acronym.toUpperCase() )
						) {
							return;
						}

						// If the character after the matched acronym is lowercase, this isn't
						// likely to be the acronym, but instead a word like `Idle` matching `Id`.
						// Best to ignore it so we don't get false positives we need to ignore.
						if (
							acronymMatches.input[
								acronymMatches.index + acronym.length
							] &&
							acronymMatches.input[
								acronymMatches.index + acronym.length
							].match( /[a-z]/ )
						) {
							return;
						}

						// Ignore known imported names.
						if ( importedNames.includes( name ) ) {
							return;
						}

						report( node );
					}
				} );
			},
		};
	},
};
