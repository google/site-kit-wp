/**
 * Enhanced fetch request wait utility for E2E tests.
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
 * Waits for network requests to complete using a progressive strategy:
 *
 * 1. Uses `page.waitForNetworkIdle()` to wait for network idle state.
 * 2. If that times out, it tracks active requests and waits for them to complete
 *
 * Within E2E tests, cleanup functions can disconnect the plugin and form other actions which cause
 * pending requests from previous pages to error. This utility waits for all requests to complete
 * using a combination of network idle and request tracking, ensuring that tests can be isolated.
 *
 * @since n.e.x.t
 *
 * @param {Object} options                    Configuration options.
 * @param {number} options.timeout            Maximum time to wait for requests in milliseconds.
 * @param {number} options.debounceTime       Time to wait after last request before resolving.
 * @param {number} options.networkIdleTimeout Time to wait for network idle.
 * @return {Function} Wait function.
 */
export function createEnhancedWaitForFetchRequests( {
	timeout = 60000,
	debounceTime = 500,
	networkIdleTimeout = 15000,
} = {} ) {
	const activeRequests = new Set();

	const listener = ( req ) => {
		if ( req.resourceType() !== 'fetch' ) {
			return;
		}

		const requestID = req._requestId; // eslint-disable-line sitekit/acronym-case
		const url = req.url();

		// Skip requests unless they're Site Kit WordPress API calls.
		if (
			! url.includes( 'google-site-kit' ) &&
			! url.includes( 'wp-json' )
		) {
			return;
		}

		// Collect request ID to track completion.
		activeRequests.add( requestID );

		// Wait for response or timeout
		page.waitForResponse(
			( res ) => res.request()._requestID === req._requestID,
			{ timeout }
		)
			.then( ( response ) => {
				activeRequests.delete( requestID );
				return response;
			} )
			.catch( () => {
				// Clean up request ID on error
				activeRequests.delete( requestID );
			} );
	};

	page.on( 'request', listener );

	return async () => {
		page.off( 'request', listener );

		// Strategy 1: Use page.waitForNetworkIdle() as primary mechanism.
		try {
			await page.waitForNetworkIdle( { timeout: networkIdleTimeout } );

			// If all requests are already idle, we can resolve immediately.
			if ( activeRequests.size === 0 ) {
				return;
			}
		} catch ( error ) {
			// If network idle times out, we fall back to tracking active requests.
		}

		// Strategy 2: Wait for tracked requests to be resolved.
		return new Promise( ( resolve ) => {
			const checkCompletion = () => {
				if ( activeRequests.size === 0 ) {
					resolve();
					return;
				}

				setTimeout( checkCompletion, debounceTime );
			};

			checkCompletion();
		} );
	};
}
