/**
 * ESLint plugin: utils used in multiple rules.
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

const FUNCTION_TYPES = [
	'ArrowFunctionExpression',
	'FunctionDeclaration',
	'FunctionExpression',
];

function checkForEmptyLinesInGroup(
	groupOfTags,
	{ context, jsdoc, jsdocNode } = {}
) {
	groupOfTags.forEach( ( tag, index ) => {
		if ( index === 0 ) {
			return;
		}

		const previousTag = groupOfTags[ index - 1 ];

		if (
			jsdoc.source.match(
				new RegExp( `@${ previousTag.tag }.*\\n\\n@${ tag.tag }`, 'gm' )
			)
		) {
			context.report( {
				data: { name: jsdocNode.name },
				message: `There should not be an empty line between @${ previousTag.tag } and @${ tag.tag }.`,
				node: jsdocNode,
			} );
		}
	} );
}

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
		/^(Node|External|WordPress|Internal) dependencies$/.test(
			jsdoc.description.trim()
		)
	);
}

function isImported( node ) {
	if ( ! node?.type ) {
		return false;
	}

	const importTypes = [
		'ImportDefaultSpecifier',
		'ImportSpecifier',
		'ExportDefaultDeclaration',
		'ExportDeclaration',
		'ExportSpecifier',
		'ImportDeclaration',
	];

	if (
		importTypes.includes( node.type ) ||
		importTypes.includes( node.parent?.type )
	) {
		return true;
	}

	for ( const attribute in [ 'parent', 'init', 'imported' ] ) {
		if ( node[ attribute ] ) {
			return isImported( node[ attribute ] );
		}
	}

	if ( node.declarations?.length ) {
		const hasImportedDeclarations = node.specifiers.some(
			( importedNode ) => {
				return isImported( importedNode );
			}
		);

		if ( hasImportedDeclarations ) {
			return true;
		}
	}

	if ( node.declaration ) {
		return isImported( node.declaration );
	}

	return false;
}

const isTypeFunction = ( type ) => {
	return FUNCTION_TYPES.includes( type );
};

function isFunctionDeclaration( node ) {
	return node?.type && FUNCTION_TYPES.includes( node.type );
}

function isFunctionProperty( node ) {
	return node.type === 'Property' && node.value && isFunction( node.value );
}

function hasFunctionInDeclarations( declarations ) {
	return declarations?.some( ( declaration ) =>
		isFunction( declaration.init )
	);
}

function isFunctionIdentifier( node ) {
	if ( node?.type !== 'Identifier' ) {
		return false;
	}

	return (
		isTypeFunction( node?.parent?.type ) ||
		isTypeFunction( node?.parent?.init?.type )
	);
}

function isFunctionExportOrVariable( node ) {
	if (
		! [ 'ExportNamedDeclaration', 'VariableDeclaration' ].includes(
			node.type
		)
	) {
		return false;
	}

	if ( node.declarations ) {
		return hasFunctionInDeclarations( node.declarations );
	}
	if ( node.declaration ) {
		return isFunction( node.declaration );
	}

	return false;
}

function isFunction( node ) {
	if ( ! node ) {
		return false;
	}

	return (
		isFunctionIdentifier( node ) ||
		isFunctionDeclaration( node ) ||
		isFunctionProperty( node ) ||
		isFunctionExportOrVariable( node )
	);
}

module.exports = {
	checkForEmptyLinesInGroup,
	findTagInGroup,
	isDependencyBlock,
	isFunction,
	isImported,
};
