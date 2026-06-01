/**
 * ESLint rules: Require Exported Component Props
 *
 * Require each `.tsx` file's exported main component (named after the file) to
 * be typed as `FC< <ComponentName>Props >` or
 * `forwardRef< Ref, <ComponentName>Props >`.
 *
 * Also requires the component's prop types to be exported. Because we
 * export some prop types, this rule makes it consistent so we can inspect
 * re-use/build on a component's prop types.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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

'use strict';

/**
 * External dependencies
 */
const path = require( 'path' );

// Whether a type node is a `TSTypeReference` to the given identifier name.
function isTypeReferenceNamed( typeNode, name ) {
	return (
		typeNode?.type === 'TSTypeReference' &&
		typeNode.typeName?.type === 'Identifier' &&
		typeNode.typeName.name === name
	);
}

/**
 * Checks if the given type node is an `FC` component.
 *
 * @since n.e.x.t
 *
 * @param {Object} typeNode The type node to check.
 * @return {boolean} Whether this node is a functional component.
 */
function isFunctionalComponent( typeNode ) {
	if ( typeNode?.type !== 'TSTypeReference' ) {
		return false;
	}
	const { typeName } = typeNode;
	if ( typeName?.type === 'Identifier' ) {
		return typeName.name === 'FC';
	}
	// `React.FC`
	return (
		typeName?.type === 'TSQualifiedName' && typeName.right?.name === 'FC'
	);
}

// Whether a type node is an imported identifier, — e.g. `FooProps` imported
// from another file. Such props are defined/exported in their source file, so
// they're exempt from the name-match/export rules.
function isImportedType( typeNode, importedNames ) {
	return (
		typeNode?.type === 'TSTypeReference' &&
		! typeNode.typeArguments &&
		typeNode.typeName?.type === 'Identifier' &&
		importedNames.has( typeNode.typeName.name )
	);
}

// Whether a node is a `forwardRef( … )` call (matched by callee name, since
// `forwardRef` is imported from both `react` and `@wordpress/element`).
function isForwardRefCall( node ) {
	return (
		node?.type === 'CallExpression' &&
		node.callee?.type === 'Identifier' &&
		node.callee.name === 'forwardRef'
	);
}

// Derives the component name from a `.tsx` file path (`index.tsx` → parent dir).
function getComponentName( filename ) {
	const base = path.basename( filename ).replace( /\.tsx$/, '' );
	return base === 'index' ? path.basename( path.dirname( filename ) ) : base;
}

function addDeclarationToParsedCode( node, parsedCode, exported ) {
	const {
		componentName,
		expectedProps,
		declarations,
		interfaces,
		exportedNames,
	} = parsedCode;

	if ( node.type === 'FunctionDeclaration' ) {
		if ( node.id?.name === componentName ) {
			declarations.set( componentName, { kind: 'function', node } );
		}
		if ( exported && node.id ) {
			exportedNames.add( node.id.name );
		}
		return;
	}

	if ( node.type === 'VariableDeclaration' ) {
		for ( const declarator of node.declarations ) {
			if ( declarator.id?.type !== 'Identifier' ) {
				continue;
			}
			if ( declarator.id.name === componentName ) {
				declarations.set( componentName, {
					kind: 'variable',
					node: declarator,
				} );
			}
			if ( exported ) {
				exportedNames.add( declarator.id.name );
			}
		}
		return;
	}

	if (
		node.type === 'TSInterfaceDeclaration' &&
		node.id?.name === expectedProps
	) {
		interfaces.set( expectedProps, { node, exported } );
	}
}

function addStatementToParsedCode( statement, parsedCode ) {
	if ( statement.type === 'ImportDeclaration' ) {
		for ( const specifier of statement.specifiers ) {
			if ( specifier.local?.name ) {
				parsedCode.importedNames.add( specifier.local.name );
			}
		}
		return;
	}

	if ( statement.type === 'ExportNamedDeclaration' ) {
		if ( statement.declaration ) {
			addDeclarationToParsedCode(
				statement.declaration,
				parsedCode,
				true
			);
		}
		for ( const specifier of statement.specifiers ) {
			parsedCode.exportedNames.add( specifier.local?.name );
		}
		return;
	}

	if ( statement.type === 'ExportDefaultDeclaration' ) {
		const decl = statement.declaration;
		if ( decl.type === 'Identifier' ) {
			parsedCode.exportedNames.add( decl.name );
		} else if ( decl.type === 'FunctionDeclaration' && decl.id ) {
			addDeclarationToParsedCode( decl, parsedCode, true );
		}
		return;
	}

	addDeclarationToParsedCode( statement, parsedCode, false );
}

// Reports a missing `export` on the props interface, with an auto-fix.
function enforceInterfaceExport( context, parsedCode ) {
	const iface = parsedCode.interfaces.get( parsedCode.expectedProps );
	// Not declared in this file (imported elsewhere) or already exported.
	if ( ! iface || iface.exported ) {
		return;
	}
	context.report( {
		node: iface.node,
		// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
		messageId: 'propsInterfaceNotExported',
		data: { props: parsedCode.expectedProps },
		fix: ( fixer ) => fixer.insertTextBefore( iface.node, 'export ' ),
	} );
}

// Reports props that don't match the expected props name, eg.
// `ComponentNameProps`.
function reportNameMismatch( context, parsedCode, node ) {
	context.report( {
		node,
		// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
		messageId: 'propsComponentNameMistmatch',
		data: {
			name: parsedCode.componentName,
			props: parsedCode.expectedProps,
		},
	} );
}

// Get the component type (eg. `FC`, `forwardRef`, or something else), then
// check for any errors and report.
function checkTarget( context, parsedCode ) {
	const { target, expectedProps } = parsedCode;
	const init = target.kind === 'variable' ? target.node.init : null;

	// forwardRef, eg: `forwardRef< Ref, Props >( [...] )`.
	if ( isForwardRefCall( init ) ) {
		const propsArg = init.typeArguments?.params?.[ 1 ];

		if ( isTypeReferenceNamed( propsArg, expectedProps ) ) {
			enforceInterfaceExport( context, parsedCode );
		} else if ( ! init.arguments?.params?.length && ! propsArg ) {
			// No props supplied (bare `forwardRef`), which is allowed, even if
			// it's unlikely in practice.
			return;
		} else if ( ! isImportedType( propsArg, parsedCode.importedNames ) ) {
			reportNameMismatch( context, parsedCode, propsArg || init );
		}
		return;
	}

	// `const Foo: FC< Props > = ( { ...props } ) => {}`.
	if ( target.kind === 'variable' ) {
		const annotation = target.node.id?.typeAnnotation?.typeAnnotation;
		if ( isFunctionalComponent( annotation ) ) {
			const propsArg = annotation.typeArguments?.params?.[ 0 ];
			// `FC<>` (without props, this is allowed).
			if ( ! propsArg ) {
				return;
			}

			if ( isTypeReferenceNamed( propsArg, expectedProps ) ) {
				enforceInterfaceExport( context, parsedCode );
			} else if (
				! isImportedType( propsArg, parsedCode.importedNames )
			) {
				reportNameMismatch( context, parsedCode, propsArg );
			}
			return;
		}
	}

	// Anything else: a plain function/arrow component not typed via
	// `FC`/`forwardRef`.
	context.report( {
		node: target.node.id || target.node,
		// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
		messageId: 'componentNotTyped',
		data: { name: parsedCode.componentName, props: expectedProps },
	} );
}

module.exports = {
	meta: {
		type: 'problem',
		docs: {
			description:
				'All exported components should export their props as `<ComponentName>Props`. Components should be typed as `FC< <ComponentName>Props >` or `forwardRef< Ref, <ComponentName>Props >`.',
		},
		fixable: 'code',
		schema: [],
		messages: {
			propsInterfaceNotExported:
				'The component’s props interface `{{props}}` must be exported.',
			propsComponentNameMistmatch:
				'`{{name}}` props must be an exported `{{props}}` interface supplied to `FC`/`forwardRef` (no inline prop types).',
			componentNotTyped:
				'`{{name}}` must be typed as `FC` (or `FC<{{props}}>` / `forwardRef<Ref, {{props}}>`).',
		},
	},

	create( context ) {
		const filename = context.getFilename();

		// Only applies to non-test/story `.tsx` files.
		if (
			! /\.tsx$/.test( filename ) ||
			/\.(test|stories)\.tsx$/.test( filename )
		) {
			return {};
		}

		const componentName = getComponentName( filename );
		const expectedProps = `${ componentName }Props`;

		return {
			Program( program ) {
				const parsedCode = {
					componentName,
					expectedProps,
					declarations: new Map(),
					interfaces: new Map(),
					exportedNames: new Set(),
					importedNames: new Set(),
				};

				for ( const statement of program.body ) {
					addStatementToParsedCode( statement, parsedCode );
				}

				const target = parsedCode.declarations.get( componentName );

				// Skip when there's no exported component matching the file name.
				if (
					! target ||
					! parsedCode.exportedNames.has( componentName )
				) {
					return;
				}

				parsedCode.target = target;
				checkTarget( context, parsedCode );
			},
		};
	},
};
