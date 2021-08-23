/**
 * ESLint rules: tag order tests.
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
import rule from './jsdoc-tag-order';
import { NEXT_VERSION } from './constants';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'jsdoc-tag-order', rule, {
	valid: [
		{
			code: `
/**
 * A function that returns a string, to test out ESLint.
 *
 * @since 1.7.1
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
		{
			code: `
/**
 * A function that returns a string, to test out ESLint.
 *
 * @since ${ NEXT_VERSION }
 * @since 1.8.0 Added a feature.
 * @since 1.7.1 Originally introduced.
 * @private
 *
 * @param {?Object} props Component props.
 * @return {string} A test string.
 */
export function coolFunction( props ) {
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
 * @private
 * @since 1.7.1
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
					message: 'The @since tag should be before @private tag.',
				},
			],
		},
		{
			code: `
/**
 * A function that returns a string, to test out ESLint.
 *
 * @since 1.7.1
 *
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
						'The @since tag should not have a newline between it and the following @private tag.',
				},
			],
		},
	],
} );
