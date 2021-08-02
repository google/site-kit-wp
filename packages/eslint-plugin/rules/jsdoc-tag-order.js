/**
 * ESLint rules: specify JSDoc tag ordering rules.
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

module.exports = iterateJsdoc(
	( { context, jsdoc, jsdocNode, utils } ) => {
		const expectedTagOrder = [
			'since',
			'see',
			'deprecated',
			'private',
			'param',
			'type',
			'return',
		];

		const tags = utils
			.filterTags( ( { tag } ) => {
				return expectedTagOrder.includes( tag );
			} )
			.sort( ( tagA, tagB ) => {
				return tagA.line > tagB.line ? 1 : -1;
			} )
			.map( ( tag ) => {
				return tag.tag;
			} );

		const checkTagOrder = ( { previousTag, tag, tagOrder } ) => {
			// Only check for the tag order for a grouping of tags.
			if (
				! tagOrder.includes( tag ) ||
				! tagOrder.includes( previousTag )
			) {
				return;
			}

			if (
				previousTag &&
				jsdoc.source.match(
					new RegExp( `@${ previousTag }.*\\n\\n@${ tag }`, 'gm' )
				)
			) {
				context.report( {
					data: { name: jsdocNode.name },
					message: `The @${ previousTag } tag should not have a newline between it and the following @${ tag } tag.`,
					node: jsdocNode,
				} );

				return;
			}

			const previousPositionInTagOrder = tagOrder.indexOf( previousTag );
			const currentPositionInTagOrder = tagOrder.indexOf( tag );

			if ( previousPositionInTagOrder > currentPositionInTagOrder ) {
				context.report( {
					data: { name: jsdocNode.name },
					message: `The @${ tag } tag should be before @${ previousTag } tag.`,
					node: jsdocNode,
				} );
			}
		};

		utils
			.filterTags( ( { tag } ) => {
				return [ 'since', 'see', 'deprecated', 'private' ].includes(
					tag
				);
			} )
			.sort( ( tagA, tagB ) => {
				return tagA.line > tagB.line ? 1 : -1;
			} )
			.map( ( tag ) => {
				return tag.tag;
			} )
			.forEach( ( tag, index ) => {
				checkTagOrder( {
					previousTag: tags[ index - 1 ],
					tag,
					tagOrder: [ 'since', 'see', 'deprecated', 'private' ],
				} );
			} );

		utils
			.filterTags( ( { tag } ) => {
				return [ 'param', 'type', 'return' ].includes( tag );
			} )
			.sort( ( tagA, tagB ) => {
				return tagA.line > tagB.line ? 1 : -1;
			} )
			.map( ( tag ) => {
				return tag.tag;
			} )
			.forEach( ( tag, index ) => {
				checkTagOrder( {
					previousTag: tags[ index - 1 ] || 'param',
					tag,
					tagOrder: [ 'param', 'type', 'return' ],
				} );
			} );
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
