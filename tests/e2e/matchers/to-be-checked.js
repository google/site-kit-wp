/**
 * Custom matcher for testing if a checkbox is checked or not.
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
import { getDefaultOptions } from 'expect-puppeteer';

/**
 * Asserts the given selector is checked.
 *
 * @since 1.11.0
 *
 * @param {string} selector          Selector for element with value.
 * @param {Object} [options]         Matcher options.
 * @param {number} [options.timeout] Maximum time to wait for selector in milliseconds.
 * @return {Object} Object with `pass` and `message` keys.
 */
export async function toBeChecked(
	selector,
	{ timeout } = getDefaultOptions()
) {
	let pass, message;

	await page.waitForSelector( selector, { timeout } );
	const actualValue = await page.$eval(
		selector,
		( { checked } ) => checked
	);

	if ( this.equals( true, actualValue ) ) {
		pass = true;
		message = `Expected "${ selector }" to be checked.`;
	} else {
		pass = false;
		message = `Expected ${ selector } not to be checked.`;
	}

	return { pass, message };
}
