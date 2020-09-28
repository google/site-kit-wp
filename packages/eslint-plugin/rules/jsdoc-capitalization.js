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

module.exports = iterateJsdoc( ( {
	context,
	jsdoc,
	jsdocNode,
} ) => {
	// Skip the first doc block, as these are frequently marked by things like "core/forms".
	// It's silly to allow-list all those files, and creating exceptions for them seems
	// silly at this point as well. For now we'll check doc blocks _after_ the first one.
	if ( jsdoc.line === 0 ) {
		return;
	}

	if ( jsdoc.description && ! jsdoc.description.match( /^[A-Z].*/g ) ) {
		context.report( { node: jsdocNode, message: `JSDoc blocks should start with a capital letter.`, data: { name: jsdocNode.name } } );
	}

	// Move on to checking tags for this JSDoc block.
	if ( ! jsdoc.tags || ! jsdoc.tags.length ) {
		return;
	}

	jsdoc.tags.forEach( ( tag ) => {
		// Only check these tags for capitalization.
		if ( ! [ 'param', 'returns' ].includes( tag.tag ) ) {
			return;
		}

		if ( tag.description && tag.description.length && ! tag.description.trim().match( /^[A-Z].*/gm ) ) {
			context.report( { node: jsdocNode, message: `The description for \`${ tag.source }\` should start with a capital letter.`, data: { name: jsdocNode.name } } );
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

