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
 * Waits for network requests to complete, and terminate on timeout.
 *
 * Within E2E tests, cleanup functions can disconnect the plugin and form other actions which cause
 * pending requests from previous pages to error. This utility waits for all requests to complete
 * or aborts any which cannot be completed within the specified timeout so that tests can be isolated.
 *
 * @since n.e.x.t
 *
 * @param {Object}  options                    Configuration options.
 * @param {number}  options.timeout            Maximum time to wait for requests in milliseconds.
 * @param {number}  options.debounceTime       Time to wait after last request before resolving.
 * @param {number}  options.networkIdleTimeout Time to wait for network idle.
 * @param {boolean} options.useAbortController Whether to abort pending requests on timeout.
 * @param {boolean} options.debug              Enable debug logging.
 * @return {Function} Wait function.
 */
export function createEnhancedWaitForFetchRequests( {
	timeout = 60000, // 60 seconds max wait
	debounceTime = 500, // Increased from 250ms for CI stability
	networkIdleTimeout = 15000, // 15 seconds for network idle
	useAbortController = true,
	debug = process.env.DEBUG_E2E_REQUESTS === '1',
} = {} ) {
	const activeRequests = new Map();
	const abortControllers = new Map();
	let requestCounter = 0;
	let debounceTimer;
	let isListening = true;

	const log = ( message, ...args ) => {
		if ( debug ) {
			// eslint-disable-next-line no-console
			console.debug( `[EnhancedFetchWait] ${ message }`, ...args );
		}
	};

	const listener = ( req ) => {
		if ( ! isListening || req.resourceType() !== 'fetch' ) {
			return;
		}

		// Use Date.now() for unique request IDs as this is for E2E test debugging,
		// not user-facing functionality that requires reference date consistency.
		// eslint-disable-next-line no-restricted-syntax
		const requestID = `req_${ ++requestCounter }_${ Date.now() }`; // eslint-disable-line
		const url = req.url();

		// Skip non-Site Kit requests unless they're WordPress API calls
		if (
			! url.includes( 'google-site-kit' ) &&
			! url.includes( 'wp-json' )
		) {
			return;
		}

		log( `Tracking request ${ requestID }:`, url );

		// Store request info
		activeRequests.set( requestID, {
			id: requestID,
			url,
			// Use Date.now() for performance timing measurements in E2E tests
			startTime: Date.now(), // eslint-disable-line
			request: req,
		} );

		// Set up abort controller if enabled
		if ( useAbortController ) {
			const controller = new AbortController();
			abortControllers.set( requestID, controller );
		}

		// Wait for response or timeout
		page.waitForResponse(
			( res ) => res.request()._requestID === req._requestID,
			{ timeout }
		)
			.then( ( response ) => {
				const duration =
					Date.now() - activeRequests.get( requestID )?.startTime; // eslint-disable-line
				log(
					`Request ${ requestID } completed in ${ duration }ms:`,
					response.status(),
					url
				);
				activeRequests.delete( requestID );
				abortControllers.delete( requestID );
				return response;
			} )
			.catch( ( error ) => {
				const requestInfo = activeRequests.get( requestID );
				if ( requestInfo ) {
					const duration = Date.now() - requestInfo.startTime; // eslint-disable-line
					if ( error.message?.includes( 'Timeout' ) ) {
						log(
							`Request ${ requestID } timed out after ${ duration }ms:`,
							url
						);
					} else {
						log(
							`Request ${ requestID } failed after ${ duration }ms:`,
							error.message,
							url
						);
					}
					activeRequests.delete( requestID );
					abortControllers.delete( requestID );
				}
				// Return null to avoid breaking Promise.all
				return null;
			} );

		// Reset debounce timer
		if ( debounceTimer ) {
			clearTimeout( debounceTimer );
		}
	};

	page.on( 'request', listener );

	return async () => {
		isListening = false;
		page.off( 'request', listener );

		log(
			`Waiting for ${ activeRequests.size } active requests to complete...`
		);

		// Strategy 1: Use page.waitForNetworkIdle() as primary mechanism
		try {
			log( 'Attempting waitForNetworkIdle...' );
			await page.waitForNetworkIdle( { timeout: networkIdleTimeout } );
			log( 'Network idle achieved' );

			// Double-check if we still have active requests
			if ( activeRequests.size === 0 ) {
				log( 'All requests completed via network idle' );
				return;
			}
		} catch ( error ) {
			log( 'Network idle timeout, falling back to request tracking' );
		}

		// Strategy 2: Wait for tracked requests with debounce
		return new Promise( ( resolve ) => {
			const checkCompletion = () => {
				if ( activeRequests.size === 0 ) {
					log( 'All tracked requests completed' );
					resolve();
					return;
				}

				log(
					`Still waiting for ${ activeRequests.size } requests:`,
					Array.from( activeRequests.values() ).map( ( r ) => r.url )
				);

				// Reset debounce timer
				debounceTimer = setTimeout( checkCompletion, debounceTime );
			};

			// Strategy 3: Emergency timeout with request abortion
			const emergencyTimeout = setTimeout( () => {
				if ( debounceTimer ) {
					clearTimeout( debounceTimer );
				}

				log(
					`Emergency timeout reached. Aborting ${ activeRequests.size } remaining requests`
				);

				if ( useAbortController ) {
					// Attempt to abort remaining requests
					for ( const [
						requestID,
						controller,
					] of abortControllers ) {
						try {
							controller.abort();
							log( `Aborted request ${ requestID }` );
						} catch ( abortError ) {
							log(
								`Failed to abort request ${ requestID }:`,
								abortError.message
							);
						}
					}
				}

				// Force cleanup
				activeRequests.clear();
				abortControllers.clear();
				resolve();
			}, timeout );

			// Start checking
			checkCompletion();

			// Clean up timeout when resolved
			const originalResolve = resolve;
			resolve = ( ...args ) => {
				clearTimeout( emergencyTimeout );
				if ( debounceTimer ) {
					clearTimeout( debounceTimer );
				}
				originalResolve( ...args );
			};
		} );
	};
}
