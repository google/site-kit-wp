/**
 * ESLint rules: function-declaration-consistency.
 *
 * Enforce:
 *  - Use `function` keyword for all named functions (no named arrows or named function expressions).
 *  - Use arrow functions for callbacks passed as arguments to CallExpression or NewExpression.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

module.exports = {
	meta: {
		type: 'suggestion',
		docs: {
			description:
				'Disallow named arrow/function-expressions; require function declarations for named functions, and arrow functions for callbacks.',
		},
		fixable: 'code',
		schema: [],
		messages: {
			useFunctionDeclaration:
				'Use function declaration for named functions instead of {{kind}}.',
			useArrowCallback:
				'Use arrow function for callbacks passed as arguments.',
		},
	},

	create( context ) {
		const sourceCode = context.getSourceCode();

		function nodeContains( node, predicate ) {
			let found = false;
			const visited = new Set();

			function visit( n ) {
				if ( found || ! n || typeof n.type !== 'string' ) {
					return;
				}
				if ( visited.has( n ) ) {
					return;
				}
				visited.add( n );

				if ( predicate( n ) ) {
					found = true;
					return;
				}

				for ( const key of Object.keys( n ) ) {
					// Avoid recursing into parent to prevent cycles.
					if ( key === 'parent' ) {
						continue;
					}
					const val = n[ key ];
					if ( ! val ) {
						continue;
					}
					if ( Array.isArray( val ) ) {
						for ( const el of val ) {
							if ( el && typeof el.type === 'string' ) {
								visit( el );
							}
						}
					} else if ( val && typeof val.type === 'string' ) {
						visit( val );
					}
				}
			}

			visit( node );
			return found;
		}

		function hasThisOrArguments( fnNode ) {
			const target = fnNode.body || fnNode;
			return nodeContains( target, ( n ) => {
				if ( n.type === 'ThisExpression' ) {
					return true;
				}
				// NOTE: a bare Identifier named "arguments" could be an outer binding; converting an arrow to function would change semantics.
				return n.type === 'Identifier' && n.name === 'arguments';
			} );
		}

		function joinParams( params ) {
			return params.map( ( p ) => sourceCode.getText( p ) ).join( ', ' );
		}

		function buildFunctionDeclarationFromArrow( name, arrow ) {
			const asyncPrefix = arrow.async ? 'async ' : '';
			const paramsText = joinParams( arrow.params );
			const paramsWrapped = paramsText ? `(${ paramsText })` : '()';
			let bodyText;

			if ( arrow.body && arrow.body.type === 'BlockStatement' ) {
				bodyText = sourceCode.getText( arrow.body );
			} else {
				const expr = sourceCode.getText( arrow.body );
				bodyText = `{ return ${ expr }; }`;
			}

			return `${ asyncPrefix }function ${ name }${ paramsWrapped } ${ bodyText }`;
		}

		function buildFunctionDeclarationFromFunctionExpression( name, fn ) {
			const asyncPrefix = fn.async ? 'async ' : '';
			const star = fn.generator ? '*' : '';
			const paramsText = joinParams( fn.params );
			const paramsWrapped = paramsText ? `(${ paramsText })` : '()';
			const bodyText = sourceCode.getText( fn.body );
			return `${ asyncPrefix }function${ star } ${ name }${ paramsWrapped } ${ bodyText }`;
		}

		function buildArrowFromFunctionExpression( fn ) {
			// Always use parentheses for parameters for simplicity/safety.
			const asyncPrefix = fn.async ? 'async ' : '';
			const paramsText = joinParams( fn.params );
			const paramsWrapped = paramsText ? `( ${ paramsText } )` : '()';
			const bodyText = sourceCode.getText( fn.body );
			return `${ asyncPrefix }${ paramsWrapped } => ${ bodyText }`;
		}

		function isCallbackArgument( node ) {
			const parent = node?.parent;
			if ( ! parent ) {
				return false;
			}
			const isCallOrNew =
				parent.type === 'CallExpression' ||
				parent.type === 'NewExpression';
			return (
				isCallOrNew &&
				Array.isArray( parent.arguments ) &&
				parent.arguments.includes( node )
			);
		}

		// Helper: whether a VariableDeclarator defines a named function (arrow or function expression).
		function isNamedFnDeclarator( n ) {
			return (
				n &&
				n.type === 'VariableDeclarator' &&
				n.id &&
				n.id.type === 'Identifier' &&
				n.init &&
				( n.init.type === 'ArrowFunctionExpression' ||
					n.init.type === 'FunctionExpression' )
			);
		}

		// Helper: checks if the node has an FC or React.FC type annotation.
		function isReactFunctionalComponent( node ) {
			const typeAnnotation = node.id.typeAnnotation?.typeAnnotation;
			if ( ! typeAnnotation ) {
				return false;
			}

			// Check for: const Name: FC = ...
			if (
				typeAnnotation.type === 'TSTypeReference' &&
				typeAnnotation.typeName.type === 'Identifier' &&
				typeAnnotation.typeName.name === 'FC'
			) {
				return true;
			}

			return false;
		}

		// Helper: get ExportNamedDeclaration node if present for variable declaration.
		function getExportNode( varDecl ) {
			const p = varDecl?.parent;
			return p && p.type === 'ExportNamedDeclaration' ? p : null;
		}

		// Helper: conservative guard to decide if we should auto-fix a named function variable.
		function canAutoFixVarDeclarator( declarator ) {
			const varDecl = declarator?.parent;
			if ( ! varDecl || varDecl.type !== 'VariableDeclaration' ) {
				return false;
			}
			const isArrow = declarator.init.type === 'ArrowFunctionExpression';

			// Skip multi-declarators and arrows which use `this`/`arguments`.
			const hasMultiple =
				Array.isArray( varDecl.declarations ) &&
				varDecl.declarations.length !== 1;
			if ( hasMultiple ) {
				return false;
			}
			if ( isArrow && hasThisOrArguments( declarator.init ) ) {
				return false;
			}
			return true;
		}

		return {
			// Convert named arrows and named function-expressions to function declarations.
			VariableDeclarator( node ) {
				if ( ! isNamedFnDeclarator( node ) ) {
					return;
				}

				// Exception: Allow React functional components typed as `FC`.
				if ( isReactFunctionalComponent( node ) ) {
					return;
				}

				const varDecl = node.parent;
				if ( varDecl.type !== 'VariableDeclaration' ) {
					return;
				}

				const isArrow = node.init.type === 'ArrowFunctionExpression';
				const kind = isArrow ? 'arrow function' : 'function expression';
				const name = node.id.name;
				const message = `Use function declaration for named functions instead of ${ kind }`;

				// Report only (no fix) when unsafe to transform.
				if ( ! canAutoFixVarDeclarator( node ) ) {
					context.report( {
						node: node.init,
						message,
					} );
					return;
				}

				const exportNode = getExportNode( varDecl );
				const replacement =
					( exportNode ? 'export ' : '' ) +
					( isArrow
						? buildFunctionDeclarationFromArrow( name, node.init )
						: buildFunctionDeclarationFromFunctionExpression(
								name,
								node.init
						  ) );

				const targetNode = exportNode || varDecl;

				context.report( {
					node: node.init,
					message,
					fix( fixer ) {
						return fixer.replaceText( targetNode, replacement );
					},
				} );
			},

			// Enforce arrow functions for callbacks passed as arguments to Call/New.
			FunctionExpression( node ) {
				if ( ! isCallbackArgument( node ) ) {
					return;
				}

				// Do not report or fix if using generator, or if `this`/`arguments` is used inside
				// to avoid changing semantics.
				const unsafe = node.generator || hasThisOrArguments( node );

				if ( unsafe ) {
					return;
				}

				const replacement = buildArrowFromFunctionExpression( node );

				context.report( {
					node,
					message:
						'Use arrow function for callbacks passed as arguments.',
					fix( fixer ) {
						return fixer.replaceText( node, replacement );
					},
				} );
			},
		};
	},
};
