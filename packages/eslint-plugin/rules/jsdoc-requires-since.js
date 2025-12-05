/**
 * ESLint rules: Require the @since tag in JSDoc.
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

/* eslint-disable consistent-return */

const {
	default: iterateJsdoc,
} = require( 'eslint-plugin-jsdoc/dist/iterateJsdoc' );
const semverCompare = require( 'semver-compare' );
const semverRegex = require( 'semver-regex' );
const { NEXT_VERSION } = require( './constants' );

const SINCE_VALIDATION_RULES = [
	( { tag } ) => {
		if ( ! tag.description?.length ) {
			return 'The @since tag cannot be empty.';
		}
	},
	( { versionString } ) => {
		if (
			versionString !== NEXT_VERSION &&
			! semverRegex().test( versionString )
		) {
			return `The @since tag requires a valid semVer value or the "${ NEXT_VERSION }" label.`;
		}
	},
	( { index, description } ) => {
		// The first since tag doesn't require a description.
		if ( index > 0 && ! description.trim() ) {
			return 'All @since tags after the first require a description.';
		}
	},
	( { description } ) => {
		// Ignore if the first character is a backtick; this is often used
		// when marking return values like `true` or `null`.
		// Also ignore parens and quotes.
		if ( description && ! /^[A-Z`("']/.test( description.trim() ) ) {
			return 'All @since tags should have a description starting with a capital letter.';
		}
	},
	( { description } ) => {
		if ( description && ! /[.]$/.test( description.trim() ) ) {
			return 'All @since tags should have a description that ends with a period/full-stop.';
		}
	},
	( { versionString, previousVersionString } ) => {
		if (
			previousVersionString !== null &&
			versionString !== NEXT_VERSION &&
			previousVersionString !== NEXT_VERSION &&
			semverRegex().test( versionString ) &&
			semverRegex().test( previousVersionString )
		) {
			if ( semverCompare( versionString, previousVersionString ) === 0 ) {
				return 'Each version should have only one @since tag.';
			}
			if ( semverCompare( versionString, previousVersionString ) !== 1 ) {
				return '@since tags should appear in order of version number.';
			}
		}
	},
];

/**
 * Gets the description from a tag's source string.
 *
 * @since n.e.x.t
 *
 * @param {Object} tag The tag object.
 * @return {string} The tag description.
 */
function getTagDescription( tag ) {
	return tag.source[ 0 ].source.replace( /^\s*\*\s*@since /, '' );
}

module.exports = iterateJsdoc(
	( { context, jsdoc, jsdocNode, utils } ) => {
		// If the `@ignore` tag is in this JSDoc block, ignore it and don't require a `@since` tag.
		if ( ! jsdoc.tags?.length || utils.hasTag( 'ignore' ) ) {
			return;
		}

		// Check that at least one @since tag exists, and make sure that all tags are formatted correctly if so.
		const sinceTags = utils.filterTags( ( { tag } ) => tag === 'since' );

		if ( ! sinceTags.length ) {
			context.report( {
				data: { name: jsdocNode.name },
				message: 'Missing @since tag in JSDoc.',
				node: jsdocNode,
			} );
			return;
		}

		sinceTags.forEach( ( tag, index ) => {
			const tagDescription = getTagDescription( tag );
			const versionString = tagDescription.split( ' ', 1 )[ 0 ];
			const description = tagDescription.slice( versionString.length );
			const previousTag = sinceTags[ index - 1 ];
			const previousVersionString = previousTag
				? getTagDescription( previousTag ).split( ' ', 1 )[ 0 ]
				: null;

			for ( const rule of SINCE_VALIDATION_RULES ) {
				const error = rule( {
					tag,
					versionString,
					description,
					index,
					previousVersionString,
				} );
				if ( error ) {
					context.report( {
						data: { name: jsdocNode.name },
						message: error,
						node: jsdocNode,
					} );
					break;
				}
			}
		} );
	},
	{
		iterateAllJsdocs: true,
		meta: {
			docs: {
				description: 'Requires that all functions have a `@since` tag.',
			},
			fixable: 'code',
			type: 'suggestion',
		},
	}
);
