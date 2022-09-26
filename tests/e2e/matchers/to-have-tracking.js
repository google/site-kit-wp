/**
 * Custom matcher for checking the presence of Site Kit event tracking.
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
import { Page, ElementHandle } from 'puppeteer';

/**
 * Asserts that the given instance has tracking loaded or not.
 *
 * @since 1.11.0
 *
 * @param {(Page|ElementHandle)} instance          Page or element handle instance.
 * @param {Object}               [options]         Matcher options.
 * @param {number}               [options.timeout] Maximum time to wait for selector in milliseconds.
 * @return {Object} Object with `pass` and `message` keys.
 */
export async function toHaveTracking(
	instance,
	{ timeout } = getDefaultOptions()
) {
	let pass, message;

	try {
		await expect( instance ).toMatchElement(
			'script[data-googlesitekit-gtag]',
			{ timeout }
		);
		pass = true;
		message = () => 'Expected tracking not to be loaded';
	} catch {
		pass = false;
		message = () => 'Expected tracking to be loaded';
	}

	return { pass, message };
}
