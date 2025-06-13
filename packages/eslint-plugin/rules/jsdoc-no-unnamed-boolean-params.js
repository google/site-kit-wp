/**
 * ESLint rules: No unnamed boolean parameters in JSDoc.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
const {
	default: iterateJsdoc,
} = require( 'eslint-plugin-jsdoc/dist/iterateJsdoc' );

module.exports = iterateJsdoc(
	( { context, jsdoc, jsdocNode } ) => {
		if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
			return;
		}

		jsdoc.tags.forEach( ( tag ) => {
			if ( tag.tag !== 'param' ) {
				return;
			}

			// Check if the parameter's type string contains 'boolean' (case-insensitive)
			// and if its name does NOT contain a period '.', indicating it's not a named parameter.
			// `tag.type` holds the raw type string from the JSDoc (e.g., "boolean", "{boolean}").
			// `tag.name` holds the parameter name (e.g., "isEnabled", "options.someFlag").
			if (
				tag.type &&
				tag.type.toLowerCase().includes( 'boolean' ) &&
				tag.name &&
				! tag.name.includes( '.' )
			) {
				// If both conditions are true, report a violation.
				// `jsdocNode` refers to the AST node (e.g., function declaration)
				// that the JSDoc comment is attached to.
				context.report( {
					node: jsdocNode,
					// eslint-disable-next-line sitekit/acronym-case
					messageId: 'unexpectedBooleanParam', // Use the defined message ID.
				} );
			}
		} );
	},
	{
		iterateAllJsdocs: true,
		meta: {
			type: 'suggestion',
			docs: {
				description:
					'Disallow JSDoc `@param` tags with `boolean` type, unless for named parameters (e.g., `options.someFlag`).',
				category: 'Best Practices',
				recommended: false,
				url: 'https://example.com/no-boolean-param-rule',
			},
			schema: [],
			messages: {
				unexpectedBooleanParam:
					'Avoid using `boolean` type directly in JSDoc `@param` tags. Consider using named parameters (e.g., `options.someFlag`) or refactoring to separate functions for clarity.',
			},
		},
	}
);
