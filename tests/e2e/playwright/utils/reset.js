/**
 * Playwright reset utilities.
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

const { wpApiFetch } = require( './api-fetch' );
const { visitAdminPage } = require( './navigation' );

/**
 * Resets Site Kit using a utility plugin.
 *
 * @since n.e.x.t
 *
 * @param {Object}  page               Playwright page object.
 * @param {Object}  options            Reset options.
 * @param {boolean} options.persistent Additionally deletes persistent options.
 */
async function resetSiteKit( page, { persistent = false } = {} ) {
	// Navigate to admin if not already there
	if ( ! page.url().includes( '/wp-admin' ) ) {
		await visitAdminPage( page, '' );
	}

	// Clear storage
	await page.evaluate( () => {
		window.localStorage.clear();
		window.sessionStorage.clear();
	} );

	// Reset Site Kit via API
	const resetPromise = wpApiFetch( page, {
		path: 'google-site-kit/v1/core/site/data/reset',
		method: 'post',
	} );

	const promises = [ resetPromise ];

	if ( persistent ) {
		promises.push(
			wpApiFetch( page, {
				path: 'google-site-kit/v1/core/site/data/reset-persistent',
				method: 'post',
			} )
		);
	}

	await Promise.all( promises );
}

module.exports = { resetSiteKit };
