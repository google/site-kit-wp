/**
 * ESLint rules: capitalization tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import rule from './no-yield-dispatch';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-yield-dispatch', rule, {
	valid: [
		// Add code snippets that should NOT trigger the rule
		'function* myGenerator() { yield {data: "value"}; }',
		'function* anotherGenerator() { const result = yield; }',
		'function functionWithRegistryDispatch() { registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] ); }',
		'function functionWithDispatch() { return dispatch( CORE_MODULES ).activateModule( slug ); }',
	],

	invalid: [
		// Add code snippets that should trigger the rule
		{
			code: 'function* myGeneratorWithRegistryDispatch() { yield registry.dispatch(); }',
			errors: [
				{ message: "Using 'yield registry.dispatch' is disallowed." },
			],
		},
		{
			code: 'function* anotherGeneratorWithRegistryDispatch() { const result = yield registry.dispatch(); }',
			errors: [
				{ message: "Using 'yield registry.dispatch' is disallowed." },
			],
		},
		{
			code: 'function* generatorWithDispatch() { yield dispatch(); }',
			errors: [ { message: "Using 'yield dispatch' is disallowed." } ],
		},
		{
			code: 'function* anotherGeneratorWithDispatch() { const result = yield dispatch(); }',
			errors: [ { message: "Using 'yield dispatch' is disallowed." } ],
		},
	],
} );
