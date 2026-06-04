/**
 * ESLint rules: Prefer Interface Props
 *
 * Require a component's own props type to be declared as an `interface` rather
 * than a `type` alias. The restriction applies only to the type named
 * `<ComponentName>Props`.
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

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				"Require a component's props type to be declared as an `interface`, not a `type` alias.",
		},
		fixable: 'code',
		schema: [],
		messages: {
			useInterface:
				"A component's props type ( `{{name}}` ) must be declared as an `interface`, not a `type` alias.",
		},
	},

	create( context ) {
		const filename = context.getFilename();
		const sourceCode = context.getSourceCode();

		// The component name should match the file name due to our other rules
		// (which enforce this behaviour).
		let componentName = path
			.basename( filename )
			.replace( /\.d\.ts$/, '' )
			.replace( /\.[jt]sx?$/, '' );

		// For `index.*` files, use the parentdirectory name.
		if ( componentName === 'index' ) {
			componentName = path.basename( path.dirname( filename ) );
		}

		const expectedName = `${ componentName }Props`;

		return {
			TSTypeAliasDeclaration( node ) {
				const name = node.id?.name;

				// Only enforce the convention on the component's own props.
				if ( ! name || name !== expectedName ) {
					return;
				}

				// Auto-fix only when the type is a plain object literal. Anything
				// more complex we'll leave for the developer to fix manually, or
				// to ignore if they have a good reason for using something other
				// than an interface.
				const isObjectLiteral =
					node.typeAnnotation?.type === 'TSTypeLiteral';

				context.report( {
					node: node.id,
					// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to confirm to our acronym rules.
					messageId: 'useInterface',
					data: { name },
					fix: isObjectLiteral
						? ( fixer ) => {
								const typeParams = node.typeParameters
									? sourceCode.getText( node.typeParameters )
									: '';
								const body = sourceCode.getText(
									node.typeAnnotation
								);
								const replacement = `interface ${ name }${ typeParams } ${ body }`;

								// Check for a semicolon immediately after the type
								// declaration and remove it (`interface` declarations
								// don't use a trailing semicolon).
								const tokenAfterTypeDeclaration =
									sourceCode.getTokenAfter(
										node.typeAnnotation
									);
								const end =
									tokenAfterTypeDeclaration &&
									tokenAfterTypeDeclaration.value === ';'
										? tokenAfterTypeDeclaration.range[ 1 ]
										: node.range[ 1 ];

								return fixer.replaceTextRange(
									[ node.range[ 0 ], end ],
									replacement
								);
						  }
						: undefined,
				} );
			},
		};
	},
};
