/**
 * ESLint rules: capitalize sentences.
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
} ) => {
	if (
		jsdoc.description &&
		! jsdoc.description.match( /^[A-Z`("].*/g )
	) {
		context.report( {
			data: { name: jsdocNode.name },
			message: `JSDoc blocks should start with a capital letter.`,
			node: jsdocNode,
		} );
		return;
	}

	// Move on to checking tags for this JSDoc block.
	if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
		return;
	}

	jsdoc.tags.forEach( ( tag ) => {
		// Only check these tags for capitalization.
		if ( ! [ 'param', 'return', 'returns' ].includes( tag.tag ) ) {
			return;
		}

		if (
			tag.description &&
			tag.description.length &&
			// Ignore if the first character is a backtick; this is often used
			// when marking return values like `true` or `null`.
			// Also ignore parens and quotes.
			! tag.description.trim().match( /^[A-Z`("].*/gm )
		) {
			context.report( {
				data: { name: jsdocNode.name },
				message: `The description for \`${ tag.source }\` should start with a capital letter.`,
				node: jsdocNode,
			} );
		}
	} );
}, {
	iterateAllJsdocs: true,
	meta: {
		docs: {
			description: 'Requires that descriptions start with capital letters.',
		},
		fixable: 'code',
		type: 'suggestion',
	},
} );
