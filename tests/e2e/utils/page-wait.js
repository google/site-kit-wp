/**
 * Utility to have the page wait for a given length.
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

export const E2E_PAGE_WAIT = 250;

/**
 * Sets the page to wait for the passed time. Defaults to 250 milliseconds.
 *
 * @since 1.10.0
 *
 * @param {number} [delay] Optional. The amount of milliseconds to wait.
 * @return {Promise} Promise which resolves after the timeout has completed.
 */
export function pageWait( delay = E2E_PAGE_WAIT ) {
	if ( typeof delay !== 'number' ) {
		throw new Error( 'pageWait requires a number to be passed.' );
	}

	return page.waitForTimeout( delay );
}
