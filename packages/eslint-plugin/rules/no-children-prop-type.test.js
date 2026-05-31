/**
 * ESLint rules: no-children-prop-type tests.
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
import rule from './no-children-prop-type';

const ruleTester = new RuleTester( {
	parser: require.resolve( '@typescript-eslint/parser' ),
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
} );

ruleTester.run( 'no-children-prop-type', rule, {
	valid: [
		// Props without `children` shouldn't error.
		'interface Props { label: string; }',
		'type Props = { label: string };',
		// Using `PropsWithChildren` is fine because we aren't explicitly typing
		// `children`. (Though: don't use this in actual code; use `FC` instead!)
		'function C( { children }: PropsWithChildren ) { return children; }',
		'interface Props extends PropsWithChildren { label: string; }',
		// A `children` key in code is okay, just not in an Interface/Type
		// definition.
		'const node = { children: [] };',
	],
	invalid: [
		{
			code: 'interface ButtonProps { children: ReactNode; }',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to confirm to our acronym rules.
			errors: [ { messageId: 'noChildrenPropType' } ],
		},
		{
			code: 'type CardProps = { children: React.ReactNode };',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to confirm to our acronym rules.
			errors: [ { messageId: 'noChildrenPropType' } ],
		},
		{
			code: 'interface X { children?: ReactNode; }',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to confirm to our acronym rules.
			errors: [ { messageId: 'noChildrenPropType' } ],
		},
		{
			code: 'type Y = { children: JSX.Element | string };',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to confirm to our acronym rules.
			errors: [ { messageId: 'noChildrenPropType' } ],
		},
	],
} );
