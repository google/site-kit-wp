/**
 * ESLint rules: function-declaration-consistency tests.
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

/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './function-declaration-consistency';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
} );

ruleTester.run( 'function-declaration-consistency', rule, {
	valid: [
		// Named functions must be function declarations.
		'function foo() {}',
		'export function foo() {}',
		'export function* foo() { yield 1; }',

		// Callbacks should be arrows (these are valid).
		'const xs = [ 1, 2, 3 ]; xs.map( ( x ) => x );',
		'new Promise( ( resolve ) => resolve() );',
		'setTimeout( () => {}, 0 );',

		// Non-named arrows are fine (not assigned to an identifier).
		'( () => {} )();',
		'const obj = { onClick: () => {} };', // object property value (not a named function binding)
	],
	invalid: [
		// Named arrow to function declaration (fixable).
		{
			code: 'const foo = () => {};',
			output: 'function foo() {}',
			errors: [
				{
					message:
						'Use function declaration for named functions instead of arrow function',
				},
			],
		},

		// Exported named arrow to function declaration (fixable).
		{
			code: 'export const foo = () => {};',
			output: 'export function foo() {}',
			errors: [
				{
					message:
						'Use function declaration for named functions instead of arrow function',
				},
			],
		},

		// Async concise arrow to async function declaration with implicit return wrapped (fixable).
		{
			code: 'const foo = async () => 1;',
			output: 'async function foo() { return 1; }',
			errors: [
				{
					message:
						'Use function declaration for named functions instead of arrow function',
				},
			],
		},

		// Function expression assigned to identifier to function declaration (fixable).
		{
			code: 'const foo = function() {};',
			output: 'function foo() {}',
			errors: [
				{
					message:
						'Use function declaration for named functions instead of function expression',
				},
			],
		},

		// Generator function expression assigned to identifier to function* declaration (fixable).
		{
			code: 'const foo = function*() { yield 1; };',
			output: 'function* foo() { yield 1; }',
			errors: [
				{
					message:
						'Use function declaration for named functions instead of function expression',
				},
			],
		},

		// Callback function expression to arrow (fixable).
		{
			code: 'const xs = [ 1 ]; xs.map( function ( x ) { return x; } );',
			output: 'const xs = [ 1 ]; xs.map( ( x ) => { return x; } );',
			errors: [
				{
					message:
						'Use arrow function for callbacks passed as arguments.',
				},
			],
		},

		// NewExpression callback function expression to arrow (fixable).
		{
			code: 'new Promise( function ( resolve ) { resolve(); } );',
			output: 'new Promise( ( resolve ) => { resolve(); } );',
			errors: [
				{
					message:
						'Use arrow function for callbacks passed as arguments.',
				},
			],
		},

		// No-fix: arrow uses `this`.
		{
			code: 'const foo = () => { this.x = 1; };',
			output: null,
			errors: [
				{
					message:
						'Use function declaration for named functions instead of arrow function',
				},
			],
		},

		// No-fix: arrow uses `arguments`.
		{
			code: 'const foo = () => arguments[ 0 ];',
			output: null,
			errors: [
				{
					message:
						'Use function declaration for named functions instead of arrow function',
				},
			],
		},

		// No-fix: multi-declarator variable declaration.
		{
			code: 'const foo = () => {}, bar = 1;',
			output: null,
			errors: [
				{
					message:
						'Use function declaration for named functions instead of arrow function',
				},
			],
		},

		// No-fix: generator callback cannot be converted to arrow.
		{
			code: 'arr.map( function* () { yield 1; } );',
			output: null,
			errors: [
				{
					message:
						'Use arrow function for callbacks passed as arguments.',
				},
			],
		},
	],
} );
