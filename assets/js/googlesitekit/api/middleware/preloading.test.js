/**
 * createPreloadingMiddleware tests.
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
 * WordPress dependencies
 */
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import createPreloadingMiddleware from './preloading';

const requestURI = 'google-site-kit/v1/core/user/authentication';
const body = {
	status: 'this is the preloaded response',
};
const preloadedData = {
	[ requestURI ]: {
		method: 'GET',
		body,
	},
};

describe( 'Preloading Middleware', () => {
	it( 'returns a preloaded response when present', async () => {
		const preloadingMiddleware = createPreloadingMiddleware(
			preloadedData
		);

		const requestOptions = {
			method: 'GET',
			path: requestURI,
		};
		const next = jest.fn();
		const firstRequest = await preloadingMiddleware( requestOptions, next );
		expect( firstRequest ).toEqual( body );
		expect( next ).not.toHaveBeenCalled();
	} );

	it( 'does nothing and calls next middleware when no preloaded response exists for the request', async () => {
		const next = jest.fn();
		const preloadingMiddleware = createPreloadingMiddleware( {} );
		const requestOptions = {
			method: 'GET',
			path: requestURI,
		};
		await preloadingMiddleware( requestOptions, next );
		expect( next ).toHaveBeenCalled();
	} );

	it( 'returns a preloaded response only once for each preloaded request', async () => {
		const preloadingMiddleware = createPreloadingMiddleware(
			preloadedData
		);

		const requestOptions = {
			method: 'GET',
			path: requestURI,
		};
		const firstRequest = await preloadingMiddleware( requestOptions, jest.fn() );
		expect( firstRequest ).toEqual( body );

		const secondRequest = await preloadingMiddleware( requestOptions, jest.fn() );
		expect( secondRequest ).toBeUndefined();
	} );
	it( 'deletes a preloaded response from the cache when requested with a timestamp query paramater', async () => {
		const preloadingMiddleware = createPreloadingMiddleware(
			preloadedData
		);

		const requestOptions = {
			method: 'GET',
			path: addQueryArgs( requestURI, { timestamp: Date.now() } ),
		};
		const next = jest.fn();

		const request = await preloadingMiddleware( requestOptions, next );
		expect( request ).toBeUndefined();
		expect( next ).toHaveBeenCalled();
	} );

	describe( 'apiFetch integration', () => {
		let apiFetch;
		beforeEach( async () => {
			apiFetch = require( '@wordpress/api-fetch' ).default;
			apiFetch.use( createPreloadingMiddleware( preloadedData ) );
		} );

		afterEach( async () => {
			// Invalidate the require cache for `api-fetch` so that it uses a fresh instance.
			delete require.cache[ require.resolve( '@wordpress/api-fetch' ) ];
		} );

		it( 'returns a preloaded response when present.', async () => {
			// This mock is set up but the expectation is that it should never be run.
			fetchMock.any( '*', 200 );
			const response = await apiFetch( {
				method: 'GET',
				path: requestURI,
			} );
			expect( response ).toEqual( body );
			expect( fetchMock ).not.toHaveFetched();
		} );

		it( 'returns uncached response timestamp query parmeter is present.', async () => {
			fetchMock.get(
				/^\/google-site-kit\/v1\/core\/user\/authentication/,
				{ body: { status: 'non-cached response' }, status: 200 }
			);
			const response = await apiFetch( {
				method: 'GET',
				path: addQueryArgs( requestURI, { timestamp: Date.now() } ),
			} );
			expect( response ).toEqual( { status: 'non-cached response' } );
			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );
	} );
} );
