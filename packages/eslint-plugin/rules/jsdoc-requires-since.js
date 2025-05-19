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

/* eslint complexity: [ "error", 18 ] */

/**
 * External dependencies
 */
const {
	default: iterateJsdoc,
} = require( 'eslint-plugin-jsdoc/dist/iterateJsdoc' );
const semverCompare = require( 'semver-compare' );
const semverRegex = require( 'semver-regex' );

/**
 * Internal dependencies
 */
const { NEXT_VERSION } = require( './constants' );

module.exports = iterateJsdoc(
	( { context, jsdoc, jsdocNode, utils } ) => {
		if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
			return;
		}

		// If the `@ignore` tag is in this JSDoc block, ignore it and don't require a `@since` tag.
		if ( utils.hasTag( 'ignore' ) ) {
			return;
		}

		if ( ! utils.hasTag( 'since' ) ) {
			context.report( {
				data: { name: jsdocNode.name },
				message: 'Missing @since tag in JSDoc.',
				node: jsdocNode,
			} );

			return;
		}

		// Get all @since tags and make sure the format is correct.
		const sinceTags = utils.filterTags( ( { tag } ) => {
			return tag === 'since';
		} );

		sinceTags.forEach( ( tag, index ) => {
			const previousTag = sinceTags[ index - 1 ] || null;

			if ( ! tag.description || ! tag.description.length ) {
				context.report( {
					data: { name: jsdocNode.name },
					message: 'The @since tag cannot be empty.',
					node: jsdocNode,
				} );

				return;
			}

			const [ versionString ] = tag.description.split( ' ', 1 );

			if (
				versionString !== NEXT_VERSION &&
				! semverRegex().test( versionString )
			) {
				context.report( {
					data: { name: jsdocNode.name },
					message: `The @since tag requires a valid semVer value or the "${ NEXT_VERSION }" label.`,
					node: jsdocNode,
				} );

				return;
			}

			const description = tag.description.slice( versionString.length );

			if ( ! description || ! description.length ) {
				// The first since tag doesn't require a description.
				if ( index === 0 ) {
					return;
				}

				context.report( {
					data: { name: jsdocNode.name },
					message:
						'All @since tags after the first require a description.',
					node: jsdocNode,
				} );

				return;
			}

			if (
				// Ignore if the first character is a backtick; this is often used
				// when marking return values like `true` or `null`.
				// Also ignore parens and quotes.
				! description.trim().match( /^[A-Z`("].*/gm )
			) {
				context.report( {
					data: { name: jsdocNode.name },
					message:
						'All @since tags should have a description starting with a capital letter.',
					node: jsdocNode,
				} );

				return;
			}

			if ( ! description.match( /\.$/gm ) ) {
				context.report( {
					data: { name: jsdocNode.name },
					message:
						'All @since tags should have a description that ends with a period/full-stop.',
					node: jsdocNode,
				} );

				return;
			}

			if ( previousTag ) {
				const [ previousVersionString ] = previousTag.description.split(
					' ',
					1
				);

				if (
					semverRegex().test( versionString ) &&
					semverRegex().test( previousVersionString ) &&
					semverCompare( versionString, previousVersionString ) === 0
				) {
					context.report( {
						data: { name: jsdocNode.name },
						message:
							'Each version should have only one @since tag.',
						node: jsdocNode,
					} );

					return;
				}

				if (
					semverRegex().test( versionString ) &&
					semverRegex().test( previousVersionString ) &&
					semverCompare( versionString, previousVersionString ) !== 1
				) {
					context.report( {
						data: { name: jsdocNode.name },
						message:
							'@since tags should appear in order of version number.',
						node: jsdocNode,
					} );
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
