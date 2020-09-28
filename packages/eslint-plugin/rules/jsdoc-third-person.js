/**
 * ESLint rules: capitalise sentences.
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

/**
 * Internal dependencies
 */
const { isDependencyBlock } = require( '../utils' );

module.exports = iterateJsdoc( ( {
	context,
	jsdoc,
	jsdocNode,
} ) => {
	if ( isDependencyBlock( jsdoc ) ) {
		return;
	}

	if ( jsdoc.line === 0 ) {
		return;
	}

	if ( jsdoc.description && ! jsdoc.description.match( /^\w+s\W.*/g ) ) {
		context.report( { node: jsdocNode, message: `The first word in a function's description should end in "s".`, data: { name: jsdocNode.name } } );
	}
}, {
	iterateAllJsdocs: true,
	meta: {
		docs: {
			description: `Requires that all functions' first word end with "s".`,
		},
		fixable: 'code',
		type: 'suggestion',
	},
} );
