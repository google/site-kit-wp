/**
 * Fetch request wait utility.
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
 * Creates a function that waits for all fetch requests dispatched
 * since the function was called to complete.
 *
 * @since 1.25.0
 * @since n.e.x.t Updated to use progressive strategy for waiting for requests.
 *
 * @param {Object} options                    Options for the wait function.
 * @param {number} options.networkIdleTimeout Time to wait for network idle.
 * @param {number} options.responseTimeout    Maximum time to wait for requests in milliseconds.
 * @return {Function} Wait function.
 */
export function createWaitForFetchRequests( {
	networkIdleTimeout = 15000,
	responseTimeout = 60000,
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
			{ timeout: responseTimeout }
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

				setTimeout( checkCompletion, 500 );
			};

			checkCompletion();
		} );
	};
}
