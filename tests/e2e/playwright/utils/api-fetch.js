/**
 * Playwright API fetch utilities.
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
 * Proxies calls to `wp.apiFetch` within the page context.
 *
 * @since n.e.x.t
 * @see {@link https://github.com/WordPress/gutenberg/blob/trunk/packages/api-fetch/README.md}
 *
 * @param {Object} page    Playwright page object.
 * @param {Object} options Options object passed to `wp.apiFetch`.
 * @return {*} Resolved value from `apiFetch` promise.
 */
async function wpApiFetch( page, options ) {
	await page.waitForFunction( () => window._e2eApiFetch !== undefined, null, {
		timeout: 5000,
	} );

	return await page.evaluate(
		( fetchOptions ) => window._e2eApiFetch( fetchOptions ),
		options
	);
}

module.exports = { wpApiFetch };
