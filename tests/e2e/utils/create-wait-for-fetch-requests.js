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
 *
 * @return {Function} Wait function.
 */
export function createWaitForFetchRequests() {
	const responsePromises = [];

	const listener = ( req ) => {
		if ( req.resourceType() === 'fetch' ) {
			const promise = page.waitForResponse(
				// eslint-disable-next-line sitekit/acronym-case
				( res ) => res.request()._requestId === req._requestId
			);
			// A promise may be rejected if the execution context it was
			// captured in no longer exists (e.g. previous page) which
			// is necessary in some cases, and can be ignored since
			// there is nothing to wait for any more.
			responsePromises.push( promise.catch( () => {} ) );
		}
	};

	page.on( 'request', listener );

	return () => {
		page.off( 'request', listener );

		return Promise.all( responsePromises );
	};
}

export function createWaitForFetchRequestsWithDebounce( debounceTime = 250 ) {
	const responsePromises = [];
	let timeout;
	let isWaiting = false;
	let resolveWaiting;

	const listener = ( req ) => {
		// Filter out requests that might fail during navigation or are likely to cause issues

		if ( req.url().includes( 'wp-admin/admin-ajax.php' ) ) {
			// eslint-disable-next-line no-console
			console.debug(
				'createWaitForFetchRequestsWithDebounce: skipping admin-ajax.php request',
				req.url()
			);
			return;
		}

		if (
			req.resourceType() === 'fetch' &&
			! req.url().includes( 'wp-admin/admin-ajax.php' )
		) {
			const promise = page
				.waitForResponse(
					// eslint-disable-next-line sitekit/acronym-case
					( res ) => res.request()._requestId === req._requestId,
					{ timeout: 10_000 }
				)
				.catch( () => {
					// For errors, return null to avoid breaking Promise.all.
					return null;
				} );

			responsePromises.push( promise );

			// Reset debounce timer on new request if we're currently waiting.
			if ( isWaiting && timeout ) {
				clearTimeout( timeout );
				timeout = setTimeout( () => {
					if ( resolveWaiting ) {
						resolveWaiting();
					}
				}, debounceTime );
			}
		}
	};

	page.on( 'request', listener );

	return () => {
		page.off( 'request', listener );
		isWaiting = true;

		// eslint-disable-next-line no-console
		console.debug(
			'createWaitForFetchRequestsWithDebounce: waiting for fetch requests to complete...',
			responsePromises.length
		);

		return new Promise( ( resolve ) => {
			resolveWaiting = () => {
				isWaiting = false;
				if ( timeout ) {
					clearTimeout( timeout );
					timeout = null;
				}
				// Filter out null responses before resolving
				const validPromises = responsePromises.filter(
					( p ) => p !== null
				);
				resolve( Promise.all( validPromises ) );
				resolveWaiting = null;
			};

			// Always set initial timeout, regardless of whether there are pending requests
			timeout = setTimeout( () => {
				resolveWaiting();
			}, debounceTime );
		} );
	};
}
