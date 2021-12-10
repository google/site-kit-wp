/**
 * ESLint rules: specify JSDoc consecutive newline rules.
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
 * External dependencies
 */
const {
	default: iterateJsdoc,
} = require( 'eslint-plugin-jsdoc/dist/iterateJsdoc' );

/**
 * Internal dependencies
 */
const { checkForEmptyLinesInGroup, findTagInGroup } = require( '../utils' );

module.exports = iterateJsdoc(
	( { context, jsdoc, jsdocNode, utils } ) => {
		if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
			return;
		}

		const lastTagInFirstGroup = findTagInGroup(
			[ 'private', 'deprecated', 'see', 'since' ],
			utils
		);
		// This is a rule violation, but of a different rule. For now, just skip the check.
		if ( ! lastTagInFirstGroup ) {
			return;
		}

		const firstGroup = utils.filterTags( ( { tag } ) => {
			return [ 'private', 'deprecated', 'see', 'since' ].includes( tag );
		} );

		const secondGroup = utils.filterTags( ( { tag } ) => {
			return ! [ 'private', 'deprecated', 'see', 'since' ].includes(
				tag
			);
		} );

		checkForEmptyLinesInGroup( firstGroup, { context, jsdoc, jsdocNode } );
		checkForEmptyLinesInGroup( secondGroup, { context, jsdoc, jsdocNode } );

		if ( jsdoc.source.match( '\n\n\n', 'gm' ) ) {
			context.report( {
				data: { name: jsdocNode.name },
				message:
					'There should not be more than one consecutive newline in a JSDoc block.',
				node: jsdocNode,
			} );
		}
	},
	{
		iterateAllJsdocs: true,
		meta: {
			docs: {
				description:
					'Requires that all functions have doc annoatations with a maximum of one consecutive newline in a row.',
			},
			fixable: 'code',
			type: 'suggestion',
		},
	}
);
