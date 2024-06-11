/**
 * ESLint rules: No Direct Date
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
const globToRegExp = require( 'glob-to-regexp' );

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description: 'Warn about usage of new Date() and Date.now()',
		},
	},
	create( context ) {
		function report( node ) {
			const filename = context.getFilename();
			const [ options ] = context.options || [];
			const { ignoreFiles } = options || {};

			// Ignore files defined in the `ignoreFiles` option.
			for ( const pattern of ignoreFiles || [] ) {
				if ( globToRegExp( pattern ).test( filename ) ) {
					return;
				}
			}

			context.report( {
				node,
				message: `Avoid using '${
					node.type === 'NewExpression' ? 'new Date()' : 'Date.now()'
				}'. Use select( CORE_USER ).getReferenceDate() where appropriate, or add a comment explaining why it is necessary.`,
			} );
		}

		return {
			NewExpression( node ) {
				if (
					node.callee.name === 'Date' &&
					node.arguments.length === 0
				) {
					report( node );
				}
			},
			CallExpression( node ) {
				if (
					node.callee.object &&
					node.callee.object.name === 'Date' &&
					node.callee.property.name === 'now'
				) {
					// Don't show an error if Date.now() is used within another Date expression.
					if (
						node.parent.parent.type === 'NewExpression' &&
						node.parent.parent.callee.name === 'Date'
					) {
						return;
					}
					report( node );
				}
			},
		};
	},
};
