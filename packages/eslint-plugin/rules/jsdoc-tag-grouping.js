/**
 * ESLint rules: specify JSDoc tag grouping rules.
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
const { findTagInGroup } = require( '../utils' );

module.exports = iterateJsdoc(
	( { context, jsdoc, jsdocNode, utils } ) => {
		if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
			return;
		}

		// If the `@ignore` tag is in this JSDoc block, ignore it and don't require any ordering.
		if ( utils.hasTag( 'ignore' ) ) {
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

		const hasSecondGroup = !! utils.filterTags( ( { tag } ) => {
			return ! [ 'private', 'deprecated', 'see', 'since' ].includes(
				tag
			);
		} ).length;

		// If there's no second group, don't check tag grouping.
		if ( ! hasSecondGroup ) {
			if (
				jsdocNode.value.match(
					new RegExp(
						`@${ lastTagInFirstGroup }.*\\n\\s*\\*\\s*\\n`,
						'gm'
					)
				)
			) {
				context.report( {
					data: { name: jsdocNode.name },
					message: `The @${ lastTagInFirstGroup } tag should not be followed by an empty line when it is the last tag.`,
					node: jsdocNode,
				} );

				return;
			}

			return;
		}

		const firstTagInSecondGroup = findTagInGroup(
			[ 'param', 'typedef', 'type', 'return' ],
			utils
		);

		if ( firstTagInSecondGroup === null ) {
			context.report( {
				data: { name: jsdocNode.name },
				message: `Unrecognized tag @${
					jsdoc.tags[ jsdoc.tags.length - 1 ].tag
				} in last group of the JSDoc block. You may need to add this to the sitekit/jsdoc-tag-grouping rules.`,
				node: jsdocNode,
			} );
			return;
		}

		if (
			! jsdoc.source.match(
				new RegExp(
					`@${ lastTagInFirstGroup }.*\\n\\n@${ firstTagInSecondGroup }`,
					'gm'
				)
			)
		) {
			context.report( {
				data: { name: jsdocNode.name },
				message: `The @${ lastTagInFirstGroup } tag should be followed by an empty line, and then by the @${ firstTagInSecondGroup } tag.`,
				node: jsdocNode,
			} );
		}
	},
	{
		iterateAllJsdocs: true,
		meta: {
			docs: {
				description:
					'Requires that all functions have properly sorted doc annotations.',
			},
			fixable: 'code',
			type: 'suggestion',
		},
	}
);
