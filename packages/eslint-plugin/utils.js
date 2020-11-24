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

function isImported( node ) {
	if ( ! node || ! node.type ) {
		return false;
	}

	const importTypes = [
		'ImportDefaultSpecifier',
		'ImportSpecifier',
		'ExportDefaultDeclaration',
		'ExportDeclaration',
		'ImportDeclaration',
	];

	if ( importTypes.includes( node.type ) || importTypes.includes( node?.parent?.type ) ) {
		return true;
	}

	for ( const attribute in [ 'parent', 'init', 'imported' ] ) {
		if ( node[ attribute ] ) {
			return isImported( node[ attribute ] );
		}
	}

	if (
		node.declarations &&
		node.declarations.length
	) {
		const hasImportedDeclarations = node.specifiers.some( ( importedNode ) => {
			return isImported( importedNode );
		} );

		if ( hasImportedDeclarations ) {
			return true;
		}
	}

	if (
		node.declaration
	) {
		return isImported( node.declaration );
	}

	return false;
}

function isFunction( node ) {
	if ( ! node ) {
		return false;
	}

	const isFunctionDeclaration = node.type && (
		[ 'ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression' ].includes( node.type )
	);

	if ( isFunctionDeclaration ) {
		return true;
	}

	if ( node.type === 'Property' && node.value ) {
		return isFunction( node.value );
	}

	if (
		( node.type === 'ExportNamedDeclaration' || node.type === 'VariableDeclaration' ) &&
		node.declarations &&
		node.declarations.length
	) {
		const hasFunctionDeclaration = node.declarations.some( ( declaration ) => {
			return isFunction( declaration.init );
		} );

		if ( hasFunctionDeclaration ) {
			return true;
		}
	}

	if (
		( node.type === 'ExportNamedDeclaration' || node.type === 'VariableDeclaration' ) &&
		node.declaration
	) {
		return isFunction( node.declaration );
	}

	return false;
}

module.exports = {
	findTagInGroup,
	isDependencyBlock,
	isFunction,
	isImported,
};
