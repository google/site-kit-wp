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

/**
 * Internal dependencies
 */
const { isImported, isFunction } = require( '../utils' );

/**
 * Checks if the identifier should be ignored based on the acronym rules.
 *
 * @since 1.153.0
 *
 * @param {Object}        node          The AST node to check.
 * @param {string}        name          The name of the identifier.
 * @param {string}        acronymMatch  The matched acronym.
 * @param {string}        acronym       The acronym to check against.
 * @param {Array<string>} importedNames The list of imported names.
 * @return {boolean} True if the identifier should be ignored, false otherwise.
 */
function shouldIgnore( node, name, acronymMatch, acronym, importedNames ) {
	// The acronym was found in the variable with the correct capitalization
	if ( acronymMatch === acronym ) {
		// Catch instances of URL() and JSON() that weren't identified as globals above
		if ( acronym.length === name.length ) {
			return true;
		}
		// If the acronym is not at the start that's fine, e.g. fooBarID
		if ( ! name.startsWith( acronym ) ) {
			return true;
		}
		// or if the acronym IS at the start but it is a function, see #2195
		if ( isFunction( node ) ) {
			return true;
		}
		// Constants in all-caps are fine
		if ( name === name.toUpperCase() ) {
			return true;
		}
		// cover propTypes declarations
		if ( node.parent?.type === 'MemberExpression' ) {
			return true;
		}
	}

	// If the acronym was found entirely lowercased, skip this check.
	// Things like `componentDidMount` will set off `ID` otherwise.
	if ( acronymMatch === acronym.toLowerCase() ) {
		return true;
	}

	// Only make the check if the first character is uppercase.
	const startsWithUppercase = /^[A-Z]/.test( acronymMatch );
	if ( ! startsWithUppercase ) {
		return true;
	}

	// If the name of this variable is the same length as the acronym,
	// it should be lowercase or uppercase.
	if (
		name.length === acronym.length &&
		( acronymMatch === acronym.toLowerCase() ||
			acronymMatch === acronym.toUpperCase() )
	) {
		return true;
	}

	// If the character after the matched acronym is lowercase, this isn't
	// likely to be the acronym, but instead a word like `Idle` matching `Id`.
	// Best to ignore it so we don't get false positives we need to ignore.
	const index = name.indexOf( acronymMatch );
	const nextChar = name[ index + acronym.length ];
	if ( nextChar && /[a-z]/.test( nextChar ) ) {
		return true;
	}

	// Ignore known imported names.
	return importedNames.includes( name );
}

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
			'SDK',
			'EMM',
			'REST',
			'GKE',
			'URI',
			'UX',
			'OS',
			'GCP',
			'DNS',
			'FCM',
			'IAM',
			'IP',
			'ISO',
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
					importedNames.push( name );
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
							[ 'document', 'global', 'window' ].includes(
								node.parent.object.object.name
							) ) )
				) {
					return;
				}

				for ( const acronym of acronyms ) {
					const acronymMatches = name.match(
						new RegExp( acronym, 'i' )
					);
					if ( ! acronymMatches ) {
						continue;
					}

					const acronymMatch = acronymMatches[ 0 ];

					if (
						shouldIgnore(
							node,
							name,
							acronymMatch,
							acronym,
							importedNames
						)
					) {
						continue;
					}

					report( node );
				}
			},
		};
	},
};
