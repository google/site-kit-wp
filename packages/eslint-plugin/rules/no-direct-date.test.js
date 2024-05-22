/**
 * ESLint rules: no-direct-date tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import rule from './no-direct-date';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-direct-date', rule, {
	valid: [
		'const date = select( CORE_USER ).getReferenceDate();',
		'const createTime = new Date( Date.now() - DAY_IN_SECONDS * 1.5 * 1000 ).toISOString();',
	],
	invalid: [
		{
			code: 'const date = new Date();',
			errors: [
				{
					message:
						"Avoid using 'new Date()'. Use select( CORE_USER ).getReferenceDate() where appropriate, or add a comment explaining why it is necessary.",
				},
			],
		},
		{
			code: 'const timestamp = Date.now();',
			errors: [
				{
					message:
						"Avoid using 'Date.now()'. Use select( CORE_USER ).getReferenceDate() where appropriate, or add a comment explaining why it is necessary.",
				},
			],
		},
	],
} );
