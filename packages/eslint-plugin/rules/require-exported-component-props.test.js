/**
 * ESLint rules: require-exported-component-props tests.
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
import rule from './require-exported-component-props';

const ruleTester = new RuleTester( {
	parser: require.resolve( '@typescript-eslint/parser' ),
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
} );

ruleTester.run( 'require-exported-component-props', rule, {
	valid: [
		{
			code: 'export interface FooProps { a: string; }\nconst Foo: FC< FooProps > = () => null;\nexport default Foo;',
			filename: 'Foo.tsx',
		},
		// `FC` type without any extra props doesn't require props to be exported
		// since there are no prop types.
		{
			code: 'const Foo: FC = () => null;\nexport default Foo;',
			filename: 'Foo.tsx',
		},
		{
			code: 'export interface FooProps { a: string; }\nconst Foo = forwardRef< HTMLDivElement, FooProps >( () => null );\nexport default Foo;',
			filename: 'Foo.tsx',
		},
		// forwardRef without props are allowed if they don't take props.
		{
			code: 'const BareForwardComponent = forwardRef( () => null );\nexport default BareForwardComponent;',
			filename: 'BareForwardComponent.tsx',
			output: null,
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'propsComponentNameMistmatch' } ],
		},
		// Any exported component needs its props exported, even when it isn't
		// the default export.
		{
			code: 'export interface FooProps { a: string; }\nexport const Foo: FC< FooProps > = () => null;',
			filename: 'Foo.tsx',
		},
		// Non-exported components can use inline props/don't require exported
		// props.
		{
			code: 'const Foo: FC< { a: string } > = () => null;',
			filename: 'Foo.tsx',
		},
		// Exported function that isn't a component doesn't require props.
		{
			code: 'export const foo = () => null;',
			filename: 'Foo.tsx',
		},
		// `index.tsx` resolves to the parent directory name.
		{
			code: 'export interface BannerModalProps { a: string; }\nconst BannerModal: FC< BannerModalProps > = () => null;\nexport default BannerModal;',
			filename: 'components/BannerModal/index.tsx',
		},
		// Non-`.tsx` files are ignored, because in TypeScript components _should_
		// be defined with a `.tsx` extension.
		{
			code: 'const Foo = () => null;\nexport default Foo;',
			filename: 'Foo.ts',
		},
		// Props imported from another file are exempt from the name-match/export
		// rules — they're defined/exported in their source file.
		//
		// These types of props are usually shared between different components,
		// so they can't be named after every component/exported everywhere.
		{
			code: "import { SharedProps } from './shared';\nconst Foo: FC< SharedProps > = () => null;\nexport default Foo;",
			filename: 'Foo.tsx',
		},
		{
			code: "import { SharedProps } from './shared';\nconst Foo = forwardRef< HTMLDivElement, SharedProps >( () => null );\nexport default Foo;",
			filename: 'Foo.tsx',
		},
		{
			code: "import SharedProps from './shared';\nconst Foo: FC< SharedProps > = () => null;\nexport default Foo;",
			filename: 'Foo.tsx',
		},
	],
	invalid: [
		// FC with props, but they aren't exported. Gets auto-fixed by adding
		// `export` to the props.
		{
			code: 'interface FooProps { a: string; }\nconst Foo: FC< FooProps > = () => null;\nexport default Foo;',
			filename: 'Foo.tsx',
			output: 'export interface FooProps { a: string; }\nconst Foo: FC< FooProps > = () => null;\nexport default Foo;',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'propsInterfaceNotExported' } ],
		},
		// `forwardRef` with non-exported props-also gets auto-fixed.
		{
			code: 'interface FooProps { a: string; }\nconst Foo = forwardRef< HTMLDivElement, FooProps >( () => null );\nexport default Foo;',
			filename: 'Foo.tsx',
			output: 'export interface FooProps { a: string; }\nconst Foo = forwardRef< HTMLDivElement, FooProps >( () => null );\nexport default Foo;',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'propsInterfaceNotExported' } ],
		},
		// Exported FC with inline props. We don't auto-fix for now.
		{
			code: 'const Foo: FC< { a: string } > = () => null;\nexport default Foo;',
			filename: 'Foo.tsx',
			output: null,
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'propsComponentNameMistmatch' } ],
		},
		// Exported FC with a props name that doesn't match the component name.
		// This will get confusing since we force all props to be exported along
		// with the component, so report it as an error and force the names to
		// match up.
		{
			code: 'export interface CheckboxProps { a: string; }\nconst RadioButton: FC< CheckboxProps > = () => null;\nexport default RadioButton;',
			filename: 'RadioButton.tsx',
			output: null,
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'propsComponentNameMistmatch' } ],
		},
		// Non-`FC`/`forwardRef` components aren't allowed.
		{
			code: 'export default function Foo() { return null; }',
			filename: 'Foo.tsx',
			output: null,
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'componentNotTyped' } ],
		},
		{
			code: 'const Foo = () => null;\nexport default Foo;',
			filename: 'Foo.tsx',
			output: null,
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'componentNotTyped' } ],
		},
		{
			code: 'interface BarProps { a: string; }\nconst Foo = forwardRef< HTMLDivElement, BarProps >( () => null );\nexport default Foo;',
			filename: 'Foo.tsx',
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'propsComponentNameMistmatch' } ],
		},
		// An imported props type that is modified is not exempt.
		//
		// These should be made into their own exported type in the file that
		// imported it, since it's technically a new type.
		{
			code: "import { SharedProps } from './shared';\nconst Foo: FC< SharedProps & { extra: string } > = () => null;\nexport default Foo;",
			filename: 'Foo.tsx',
			output: null,
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'propsComponentNameMistmatch' } ],
		},
		// An imported type parameterized with its own type arguments is "modified",
		// so it is not exempt either.
		{
			code: "import { Shared } from './shared';\nconst Foo: FC< Shared< string > > = () => null;\nexport default Foo;",
			filename: 'Foo.tsx',
			output: null,
			// eslint-disable-next-line sitekit/acronym-case -- This is an ESLint property and not one we can change to conform to our acronym rules.
			errors: [ { messageId: 'propsComponentNameMistmatch' } ],
		},
	],
} );
