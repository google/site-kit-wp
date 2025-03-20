/**
 * Fetch page content E2E utility function.
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
 * Fetches markup for any given URL in the context of Puppeteer.
 *
 * @since 1.10.0
 *
 * @param {string} url     Page URI to retrieve the content for.
 * @param {Object} options Options object to be passed to fetch().
 * @return {Promise} Promise from `page.evaluate()` call.
 */
export async function fetchPageContent( url, options = {} ) {
	try {
		// Wait until apiFetch is available on the client.
		await page.waitForFunction( () => window.fetch !== undefined, {
			timeout: options?.timeout,
		} );
	} catch ( e ) {
		// eslint-disable-next-line no-console
		console.warn(
			'fetchPageContent failure',
			page.url(),
			JSON.stringify( options )
		);
		throw e;
	}

	return await page.evaluate(
		( fetchURL, fetchOptions ) => {
			return window
				.fetch( fetchURL, fetchOptions )
				.then( ( res ) => res.text() );
		},
		url,
		options
	);
}
