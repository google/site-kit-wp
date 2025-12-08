/**
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
 * External dependencies
 */
import EquivalentKeyMap from 'equivalent-key-map';

/**
 * WordPress dependencies
 */
import type { APIFetchOptions, APIFetchMiddleware } from '@wordpress/api-fetch';

/**
 * Logs a console warning for the given request options.
 *
 * @since n.e.x.t
 *
 * @param  options API fetch options of the duplicate request.
 * @return {void}
 */
export function logDuplicate( options: APIFetchOptions ) {
	global.console.warn( 'Google Site Kit API: duplicate request', options );
}

interface DedupeMiddlewareOptions {
	onDuplicate?: ( options: APIFetchOptions ) => void;
}

/**
 * Creates a new request deduplication middleware instance.
 *
 * @since n.e.x.t
 *
 * @param middlewareOptions Options for configuring the behavior of the middleware.
 * @return Middleware handler function.
 */
function createDedupeMiddleware(
	middlewareOptions: DedupeMiddlewareOptions = {}
): APIFetchMiddleware {
	const { onDuplicate } = middlewareOptions;

	const concurrentRequests = new EquivalentKeyMap();

	return function ( options, next ) {
		// If we already have a request for these options
		// call the handler, if any, and return the shared response.
		const existingRequest = concurrentRequests.get( options );
		// EquivalentKeyMap doesn't implement `has` as expected, so we need to check the value.
		// When deleting, the value is set to `undefined` so `has(key)` remains true.
		if ( existingRequest instanceof Promise ) {
			onDuplicate?.( options );

			return existingRequest;
		}

		const promise = next( options );

		concurrentRequests.set( options, promise );

		// Ensure the request entry is removed once the request
		// is completed regardless of any error.
		promise.finally( () => {
			concurrentRequests.delete( options );
		} );

		return promise;
	};
}

export default createDedupeMiddleware;
