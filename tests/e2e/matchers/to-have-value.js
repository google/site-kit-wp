/**
 * Custom toHaveValue Jest matcher.
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

import { Page, ElementHandle } from 'puppeteer';

/**
 * Asserts the given page/element has the given value.
 *
 * @since 1.9.0
 *
 * @param {(Page|ElementHandle)} instance      Page or element handle instance.
 * @param {string}               selector      Selector for element with value.
 * @param {string}               expectedValue Value expected to match element's actual value.
 * @return {Object} Matcher result.
 */
export async function toHaveValue( instance, selector, expectedValue ) {
	let pass, message;

	const actualValue = await instance.$eval(
		selector,
		( { value } ) => value
	);

	if ( this.equals( expectedValue, actualValue ) ) {
		pass = true;
		message = `Expected value not to equal "${ expectedValue }".`;
	} else {
		pass = false;
		message = `Expected ${ actualValue } value to equal "${ expectedValue }".`;
	}

	return { pass, message };
}
