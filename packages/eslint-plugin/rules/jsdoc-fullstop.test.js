/**
 * ESLint rules: fullstop tests.
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
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './jsdoc-fullstop';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'jsdoc-fullstop', rule, {
	valid: [
		{
			code: `
/**
 * A function that returns a string, to test out ESLint.
 *
 * @since 1.7.1
 * @deprecated Use another function instead.
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function exampleTestFunction( props ) {
	return 'test';
}
      `,
		},
	],
	invalid: [
		{
			code: `
/**
 * A function that returns a string, to test out ESLint.
 *
 * @since 1.7.1
 * @deprecated Use another function instead
 * @private
 *
 * @param {?Object}   props          Component props.
 * @return {string} A test string.
 */
export function exampleTestFunction( props ) {
	return 'test';
}
      `,
			errors: [
				{
					message:
						'The description for `@deprecated Use another function instead` should end with a period/full-stop.',
				},
			],
		},
	],
} );
