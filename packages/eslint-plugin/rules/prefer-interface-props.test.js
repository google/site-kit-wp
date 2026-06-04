/**
 * ESLint rules: prefer-interface-props tests.
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

/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from './prefer-interface-props';

const ruleTester = new RuleTester( {
	parser: require.resolve( '@typescript-eslint/parser' ),
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
} );

ruleTester.run( 'prefer-interface-props', rule, {
	valid: [
		// The component's own props type. Since it's an interface,
		// it shouldn't error.
		{
			code: 'interface BannerProps { a: string; }',
			filename: 'Banner.tsx',
		},
		// Other types that don't match `<ComponentName>Props` are ignored.
		{ code: 'type Banner = { a: string };', filename: 'Banner.tsx' },
		{ code: 'type Bar = string;', filename: 'Foo.tsx' },
		// `TestProps` doesn't match the component name (`Checkbox`), so it's
		// ignored.
		{
			code: 'type TestProps = { a: string };',
			filename: 'Checkbox.tsx',
		},
		// Internal helper alias that isn't the component's props.
		{
			code: 'type WidgetComponentProps = ReturnType< typeof someOtherFunction >;',
			filename: 'MyFunkyWidget.tsx',
		},
	],
	invalid: [
		// Component props declared as a `type` alias instead of an `interface`.
		// Should error (but will be auto-fixed to an `interface`).
		{
			code: 'type BannerProps = { a: string };',
			filename: 'Banner.tsx',
			output: 'interface BannerProps { a: string }',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'useInterface' } ],
		},
		// Exported object literal keeps the `export` keyword when auto-fixed.
		{
			code: 'export type CheckboxProps = { a: string; b: number };',
			filename: 'Checkbox.tsx',
			output: 'export interface CheckboxProps { a: string; b: number }',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'useInterface' } ],
		},
		// Multiline props should be auto-fixed.
		{
			code: 'type NotificationProps = {\n\ta: string;\n\tb: number;\n};',
			filename: 'Notification.tsx',
			output: 'interface NotificationProps {\n\ta: string;\n\tb: number;\n}',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'useInterface' } ],
		},
		// Generic type with type parameters should be auto-fixed, and includ the
		// type parameters when changed to an interface).
		{
			code: 'type InputProps< T > = { value: T };',
			filename: 'Input.tsx',
			output: 'interface InputProps< T > { value: T }',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'useInterface' } ],
		},
		// `index.*` file resolves to the parent directory name.
		{
			code: 'type BannerModalProps = { a: string };',
			filename: 'assets/js/components/BannerModal/index.tsx',
			output: 'interface BannerModalProps { a: string }',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'useInterface' } ],
		},
		// `.d.ts` declaration files should be auto-fixed too.
		{
			code: 'type OldFileProps = { a: string };',
			filename: 'OldFile.d.ts',
			output: 'interface OldFileProps { a: string }',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'useInterface' } ],
		},
		// Don't try to auto-fix complex types.
		{
			code: 'type MyComplexComponentProps = ReturnType< typeof myFunction >;',
			filename: 'MyComplexComponent.tsx',
			output: null,
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'useInterface' } ],
		},
		{
			code: 'type UnionProps = A | B;',
			filename: 'Union.tsx',
			output: null,
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'useInterface' } ],
		},
	],
} );
