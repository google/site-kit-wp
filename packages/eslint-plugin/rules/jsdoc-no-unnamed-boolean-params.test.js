/**
 * ESLint rules: No unnamed boolean parameters in JSDoc tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
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
import rule from './jsdoc-no-unnamed-boolean-params';

// Initialize RuleTester with parser options.
const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

// Run the tests for the 'no-boolean-param' rule.
ruleTester.run( 'no-boolean-param', rule, {
	valid: [
		{
			code: `
/**
 * A function without JSDoc.
 */
function doSomething() {
  return true;
}
      `,
		},
		{
			code: `
/**
 * A function with JSDoc but no param tags.
 * @returns {string} A simple string.
 */
function greet() {
  return 'hello';
}
      `,
		},
		{
			code: `
/**
 * A function with non-boolean param tags.
 * @param {string} name The user's name.
 * @param {number} age The user's age.
 * @returns {string} A personalized greeting.
 */
function introduce(name, age) {
  return \`Hello, \${name}! You are \${age} years old.\`;
}
      `,
		},
		{
			code: `
/**
 * A function using named parameters with a boolean flag.
 * This should be allowed.
 * @param {Object} options Configuration options.
 * @param {boolean} options.isEnabled Whether the feature is enabled.
 * @param {string} options.mode The operating mode.
 */
function configure(options) {
  console.log(options.isEnabled, options.mode);
}
      `,
		},
		{
			code: `
/**
 * A function with a complex type that might contain 'boolean' but isn't a direct boolean param.
 * This should now pass as valid.
 * @param {Array<boolean>} flags A list of flags.
 */
function processFlags(flags) {
  return flags.length > 0;
}
      `,
		},
		{
			code: `
/**
 * Function with a valid JSDoc comment that does not contain 'boolean' as a direct param type.
 * @param {string} input - Some input string.
 * @returns {boolean} Whether the input is valid.
 */
function isValid( input ) {
  return input.length > 0;
}
      `,
		},
	],
	invalid: [
		{
			code: `
/**
 * A function with a direct boolean parameter.
 * @param {boolean} isEnabled Whether the feature is enabled.
 */
function activateFeature(isEnabled) {
  if (isEnabled) {
    // ...
  }
}
      `,
			errors: [
				{
					// eslint-disable-next-line sitekit/acronym-case
					messageId: 'unexpectedBooleanParam',
				},
			],
		},
		{
			code: `
/**
 * Another function with a direct boolean parameter, case-insensitive check.
 * @param {Boolean} showDetails Whether to show details.
 */
function displayItem(showDetails) {
  if (showDetails) {
    // ...
  }
}
      `,
			errors: [
				{
					// eslint-disable-next-line sitekit/acronym-case
					messageId: 'unexpectedBooleanParam',
				},
			],
		},
		{
			code: `
/**
 * Function with multiple direct boolean parameters.
 * @param {boolean} force - Force the action.
 * @param {boolean} dryRun - Perform a dry run.
 * @param {string} message - A message.
 */
function performAction(force, dryRun, message) {
  // ...
}
      `,
			errors: [
				// eslint-disable-next-line sitekit/acronym-case
				{ messageId: 'unexpectedBooleanParam' },
				// eslint-disable-next-line sitekit/acronym-case
				{ messageId: 'unexpectedBooleanParam' },
			],
		},
		{
			code: `
/**
 * Function with mixed parameters, one of which is a direct boolean.
 * @param {string} id - The item ID.
 * @param {boolean} isActive - Whether the item is active.
 * @param {Object} config - Configuration object.
 * @param {boolean} config.debug - Debug mode. (This one should NOT error)
 */
function processItem(id, isActive, config) {
  // ...
}
      `,
			// eslint-disable-next-line sitekit/acronym-case
			errors: [ { messageId: 'unexpectedBooleanParam' } ],
		},
		{
			code: `
/**
 * A setter-like function with a single boolean argument.
 * This case IS caught by the rule and should be manually disabled.
 * @param {boolean} value Sets the value.
 */
function setValue(value) {
  this._value = value;
}
      `,
			// eslint-disable-next-line sitekit/acronym-case
			errors: [ { messageId: 'unexpectedBooleanParam' } ],
		},
		{
			code: `
	  /**
	   * A function with an optional boolean parameter (now invalid).
	   * @param {?boolean} isOptional Whether it is optional.
	   */
	  function handleOptional(isOptional) {
		// ...
	  }
			`,
			// eslint-disable-next-line sitekit/acronym-case
			errors: [ { messageId: 'unexpectedBooleanParam' } ],
		},
		{
			code: `
	  /**
	   * A function with a non-nullable boolean parameter (now invalid).
	   * @param {!boolean} isNotNull Whether it is not null.
	   */
	  function handleNotNull(isNotNull) {
		// ...
	  }
			`,
			// eslint-disable-next-line sitekit/acronym-case
			errors: [ { messageId: 'unexpectedBooleanParam' } ],
		},
	],
} );
