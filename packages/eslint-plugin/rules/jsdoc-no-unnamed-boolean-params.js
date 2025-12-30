/**
 * ESLint rules: No unnamed boolean parameters in JSDoc (including nullable/non-nullable variants).
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

			const type = tag.type || '';
			const lowercasedType = type.toLowerCase();

			// Check for any form of boolean type (plain, nullable, non-nullable)
			const isBooleanType = /^\??!?boolean$/.test( lowercasedType );

			if ( isBooleanType && tag.name && ! tag.name.includes( '.' ) ) {
				context.report( {
					node: jsdocNode,
					// eslint-disable-next-line sitekit/acronym-case
					messageId: 'unexpectedBooleanParam',
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
					'Disallow JSDoc `@param` tags with any form of `boolean` type (including `?boolean` and `!boolean`), unless for named parameters (e.g., `options.someFlag`).',
				category: 'Best Practices',
				recommended: false,
				url: 'https://example.com/no-boolean-param-rule',
			},
			schema: [],
			messages: {
				unexpectedBooleanParam:
					'Avoid using `boolean` type (including `?boolean` and `!boolean`) directly in JSDoc `@param` tags. Use named parameters (e.g., `options.someFlag`) or refactor to separate functions.',
			},
		},
	}
);
