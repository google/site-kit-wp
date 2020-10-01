/**
 * ESLint plugin: utils used in multiple rules.
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

function findTagInGroup( tagsInGroup, utils, index = 0 ) {
	const foundTag = !! utils.filterTags( ( { tag } ) => {
		return [ tagsInGroup[ index ] ].includes( tag );
	} ).length;

	if ( foundTag ) {
		return tagsInGroup[ index ];
	}

	if ( ! tagsInGroup[ index + 1 ] ) {
		return null;
	}

	return findTagInGroup( tagsInGroup, utils, index + 1 );
}

function isDependencyBlock( jsdoc ) {
	return !! (
		jsdoc &&
		jsdoc.description &&
		/^(Node|External|WordPress|Internal) dependencies$/.test( jsdoc.description.trim() )
	);
}

module.exports = {
	findTagInGroup,
	isDependencyBlock,
};
