/**
 * ESLint rules: Storybook No Label tests
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
import rule from './storybook-no-label';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'storybook-no-label', rule, {
	valid: [
		{
			code: `
                TestNonStoryObjeect.scenario = {
                    label: 'Invalid Label'
                };
            `,
			filename: 'test.js',
		},
		{
			code: `
                TestStory.scenario = {};
            `,
			filename: 'test.stories.js',
		},
		{
			code: `
                TestStory.scenario = {
                    delay: 250
                };
            `,
			filename: 'test.stories.js',
		},
		{
			code: `
                TestStory.args = {
                    label: 'Non Scenario Label'
                };
            `,
			filename: 'test.stories.js',
		},
	],
	invalid: [
		{
			code: `
                TestStory.scenario = {
                    label: 'Invalid Label'
                };
            `,
			filename: 'test.stories.js',
			errors: [
				{
					// eslint-disable-next-line sitekit/acronym-case
					messageId: 'noLabelProp',
				},
			],
		},
	],
} );
