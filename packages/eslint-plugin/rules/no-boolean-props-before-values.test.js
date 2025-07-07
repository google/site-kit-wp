/**
 * ESLint rules: No boolean props before values tests.
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
import rule from './no-boolean-props-before-values';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'no-boolean-props-before-values', rule, {
	valid: [
		// Basic valid cases.
		{
			code: '<Component prop="value" disabled />',
		},
		{
			code: '<Component prop="value" anotherProp={value} disabled />',
		},
		{
			code: '<Component disabled />',
		},

		// Props with explicit boolean values.
		{
			code: '<Component prop="value" disabled={true} />',
		},
		{
			code: '<Component prop="value" disabled={false} />',
		},
		{
			code: '<Component prop="value" disabled={isDisabled} />',
		},
		{
			code: '<Component prop="value" disabled={!!isDisabled} />',
		},
		{
			code: '<Component prop="value" disabled={Boolean(isDisabled)} />',
		},
		{
			code: '<Component prop="value" disabled={isDisabled && true} />',
		},
		{
			code: '<Component prop="value" disabled={isDisabled || false} />',
		},

		// With spread properties. The position of spread props does not affect the rule.
		{
			code: '<Component {...props} disabled />',
		},
		{
			code: '<Component prop="value" {...props} disabled />',
		},
		{
			code: '<Component {...props} prop="value" disabled />',
		},
		{
			code: '<Component prop="value" {...props} disabled required />',
		},
		{
			code: '<Component propA="a" {...props} propB="b" disabled />',
		},
		{
			code: '<Component prop="value" disabled {...props} required />',
		},
		{
			code: '<Component {...props} prop="value" {...moreProps} disabled />',
		},

		// Multiple boolean props.
		{
			code: '<Component prop="value" disabled required />',
		},
		{
			code: '<Component prop="value" disabled required checked />',
		},
		{
			code: '<Component prop="value" {...props} disabled required />',
		},
	],
	invalid: [
		// Basic invalid cases.
		{
			code: '<Component disabled prop="value" />',
			errors: [
				{
					message:
						'Boolean prop "disabled" should appear after props with values.',
				},
			],
			output: '<Component prop="value" disabled />',
		},
		{
			code: '<Component disabled prop="value" anotherProp={value} />',
			errors: [
				{
					message:
						'Boolean prop "disabled" should appear after props with values.',
				},
			],
			output: '<Component prop="value" anotherProp={value} disabled />',
		},

		// A boolean prop between two valued props is invalid.
		{
			code: '<Component propA="a" disabled propB="b" />',
			errors: [
				{
					message:
						'Boolean prop "disabled" should appear after props with values.',
				},
			],
			output: '<Component propA="a" propB="b" disabled />',
		},

		// Multiple boolean props.
		{
			code: '<Component disabled required prop="value" />',
			errors: [
				{
					message:
						'Boolean prop "disabled" should appear after props with values.',
				},
				{
					message:
						'Boolean prop "required" should appear after props with values.',
				},
			],
			output: '<Component prop="value" disabled required />',
		},

		// With spread properties. The position of spread props is preserved on fix.
		{
			code: '<Component disabled {...props} prop="value" />',
			errors: [
				{
					message:
						'Boolean prop "disabled" should appear after props with values.',
				},
			],
			output: '<Component {...props} prop="value" disabled />',
		},
		{
			code: '<Component disabled required {...props} prop="value" />',
			errors: [
				{
					message:
						'Boolean prop "disabled" should appear after props with values.',
				},
				{
					message:
						'Boolean prop "required" should appear after props with values.',
				},
			],
			output: '<Component {...props} prop="value" disabled required />',
		},

		// Complex cases with multiple props and spread.
		{
			code: '<Component disabled required {...props} prop="value" anotherProp={value} checked />',
			errors: [
				{
					message:
						'Boolean prop "disabled" should appear after props with values.',
				},
				{
					message:
						'Boolean prop "required" should appear after props with values.',
				},
			],
			output: '<Component {...props} prop="value" anotherProp={value} disabled required checked />',
		},
	],
} );
