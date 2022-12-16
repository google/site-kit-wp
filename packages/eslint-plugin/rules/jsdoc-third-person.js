/**
 * ESLint rules: verb form.
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
const { isDependencyBlock, isFunction } = require( '../utils' );

module.exports = iterateJsdoc(
	( { context, jsdoc, jsdocNode, node } ) => {
		if ( isDependencyBlock( jsdoc ) ) {
			return;
		}

		if (
			jsdoc.description &&
			jsdoc.description.match( /Site Kit by Google, Copyright/gm )
		) {
			return;
		}

		// Only apply this rule to code that documents a function; constants don't need third-party
		// rules and would in fact be made awkward by this rule.
		// See: https://github.com/google/site-kit-wp/pull/2047#discussion_r498509940.
		if ( ! isFunction( node ) ) {
			return;
		}

		// Verbs can include dashes or in some cases also parentheses.
		if (
			jsdoc.description &&
			! jsdoc.description.match( new RegExp( '^[\\w()-]+s\\W.*', 'g' ) )
		) {
			context.report( {
				data: { name: jsdocNode.name },
				message:
					'The first word in a function’s description should be a third-person verb (eg "runs" not "run").',
				node: jsdocNode,
			} );
		}
	},
	{
		iterateAllJsdocs: true,
		meta: {
			docs: {
				description:
					'Requires that all functions’ first word end with "s" (assuming that it is a third-person verb).',
			},
			fixable: 'code',
			type: 'suggestion',
		},
	}
);
