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

const preloadedData = {
	'google-site-kit/v1/core/site/data/connection': {
		headers: [],
		body: {
			connected: true,
			resettable: true,
			setupCompleted: true,
		},
	},

	'google-site-kit/v1/core/user/authentication': {
		headers: [],
		body: {
			authenticated: true,
			grantedScopes: [],
			requiredScopes: [
				'openid',
				'https://www.googleapis.com/auth/userinfo.profile',
				'https://www.googleapis.com/auth/userinfo.email',
				'https://www.googleapis.com/auth/siteverification',
				'https://www.googleapis.com/auth/webmasters',
				'https://www.googleapis.com/auth/adsense.readonly',
				'https://www.googleapis.com/auth/analytics.readonly',
			],
			unsatisfiedScopes: [],
		},
	},
};

describe( 'Preloading Middleware', () => {
	it( 'returns a preloaded response when present', async () => {
		const requestURI = 'google-site-kit/v1/core/user/authentication';
		const preloadingMiddleware = createPreloadingMiddleware(
			preloadedData
		);

		const requestOptions = {
			method: 'GET',
			path: requestURI,
		};
		const next = jest.fn();
		const firstResponse = await preloadingMiddleware( requestOptions, next );
		expect( firstResponse ).toEqual( preloadedData[ requestURI ].body );
		expect( next ).not.toHaveBeenCalled();
	} );

	it( 'returns a preloaded reponse from multiple URIs', async () => {
		const firstRequestURI = 'google-site-kit/v1/core/user/authentication';
		const secondRequestURI = 'google-site-kit/v1/core/site/data/connection';

		const preloadingMiddleware = createPreloadingMiddleware(
			preloadedData
		);

		const firstResponseNext = jest.fn();
		const secondResponseNext = jest.fn();

		const firstResponse = await preloadingMiddleware( { method: 'GET', path: firstRequestURI }, firstResponseNext );
		expect( firstResponse ).toEqual( preloadedData[ firstRequestURI ].body );
		expect( firstResponseNext ).not.toHaveBeenCalled();

		const firstResponseAgain = await preloadingMiddleware( { method: 'GET', path: firstRequestURI }, firstResponseNext );
		expect( firstResponseAgain ).toBeUndefined();
		expect( firstResponseNext ).toHaveBeenCalled();

		const secondResponse = await preloadingMiddleware( { method: 'GET', path: secondRequestURI }, secondResponseNext );
		expect( secondResponse ).toEqual( preloadedData[ secondRequestURI ].body );
		expect( secondResponseNext ).not.toHaveBeenCalled();

		const secondResponseAgain = await preloadingMiddleware( { method: 'GET', path: secondRequestURI }, secondResponseNext );
		expect( secondResponseAgain ).toBeUndefined();
		expect( secondResponseNext ).toHaveBeenCalled();
	} );

	it( 'does nothing and calls next middleware when no preloaded response exists for the request', async () => {
		const requestURI = 'google-site-kit/v1/core/user/authentication';
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
		const requestURI = 'google-site-kit/v1/core/user/authentication';
		const preloadingMiddleware = createPreloadingMiddleware(
			preloadedData
		);

		const requestOptions = {
			method: 'GET',
			path: requestURI,
		};
		const next = jest.fn();
		const firstResponse = await preloadingMiddleware( requestOptions, next );
		expect( firstResponse ).toEqual( preloadedData[ requestURI ].body );
		expect( next ).not.toHaveBeenCalled();

		const secondRequest = await preloadingMiddleware( requestOptions, next );
		expect( secondRequest ).toBeUndefined();
		expect( next ).toHaveBeenCalled();
	} );
	it( 'deletes a preloaded response from the cache when requested with a timestamp query paramater', async () => {
		const requestURI = 'google-site-kit/v1/core/user/authentication';
		const preloadingMiddleware = createPreloadingMiddleware(
			preloadedData
		);

		const requestOptions = {
			method: 'GET',
			path: addQueryArgs( requestURI, { timestamp: Date.now() } ),
		};
		const next = jest.fn();

		const firstResponse = await preloadingMiddleware( requestOptions, next );
		expect( firstResponse ).toBeUndefined();
		expect( next ).toHaveBeenCalled();

		// Confirm that the preloaded response was deleted
		const secondResponse = await preloadingMiddleware( { method: 'GET', path: requestURI }, next );
		expect( secondResponse ).toBeUndefined();
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
			const requestURI = 'google-site-kit/v1/core/user/authentication';
			// This mock is set up but the expectation is that it should never be run.
			fetchMock.any( '*', 200 );
			const response = await apiFetch( {
				method: 'GET',
				path: requestURI,
			} );
			expect( response ).toEqual( preloadedData[ requestURI ].body );
			expect( fetchMock ).not.toHaveFetched();
		} );

		it( 'returns an uncached response when a timestamp query parameter is present.', async () => {
			const requestURI = 'google-site-kit/v1/core/user/authentication';
			fetchMock.get(
				/^\/google-site-kit\/v1\/core\/user\/authentication/,
				{ body: { message: 'non-cached response' }, status: 200 }
			);
			const response = await apiFetch( {
				method: 'GET',
				path: addQueryArgs( requestURI, { timestamp: Date.now() } ),
			} );
			expect( response ).toEqual( { message: 'non-cached response' } );
			expect( fetchMock ).toHaveFetchedTimes( 1 );
		} );
	} );
} );
