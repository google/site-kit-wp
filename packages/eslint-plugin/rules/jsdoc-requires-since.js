/**
 * ESLint rules: Require the @since tag in JSDoc.
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

module.exports = iterateJsdoc( ( {
	context,
	jsdoc,
	jsdocNode,
	utils,
} ) => {
	if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
		return;
	}

	const hasSinceTag = !! utils.filterTags( ( { tag } ) => {
		return [ 'since' ].includes( tag );
	} ).length;

	if ( hasSinceTag ) {
		return;
	}

	// If the `@ignore` tag is in this JSDoc block, ignore it and don't require a `@since` tag.
	if ( utils.hasTag( 'ignore' ) ) {
		return;
	}

	context.report( {
		data: { name: jsdocNode.name },
		message: `Missing @since tag in JSDoc.`,
		node: jsdocNode,
	} );
}, {
	iterateAllJsdocs: true,
	meta: {
		docs: {
			description: 'Requires that all functions have a `@since` tag.',
		},
		fixable: 'code',
		type: 'suggestion',
	},
} );
