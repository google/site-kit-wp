/**
 * Enables or disables a feature flag in E2E tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import { wpApiFetch } from './wp-api-fetch';

/**
 * Disables a feature flag during E2E tests.
 *
 * @since n.e.x.t
 *
 * @param {string} feature The feature flag to disable.
 * @return {Promise} Promise from `page.evaluate()` call.
 */
export async function disableFeature( feature ) {
	try {
		// Wait until apiFetch is available on the client.
		await page.waitForFunction( () => window.fetch !== undefined );

		return await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/feature/set-flag',
			method: 'post',
			data: { [ feature ]: false },
		} );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn( 'disableFeature failure', page.url(), feature );
		throw error;
	}
}

/**
 * Enables a feature flag during E2E tests.
 *
 * @since n.e.x.t
 *
 * @param {string} feature The feature flag to enable.
 * @return {Promise} Promise from `page.evaluate()` call.
 */
export async function enableFeature( feature ) {
	try {
		// Wait until apiFetch is available on the client.
		await page.waitForFunction( () => window.fetch !== undefined );

		return await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/feature/set-flag',
			method: 'post',
			data: { [ feature ]: true },
		} );
	} catch ( error ) {
		// eslint-disable-next-line no-console
		console.warn( 'enableFeature failure', page.url(), feature );
		throw error;
	}
}
