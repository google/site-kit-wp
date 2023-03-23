/**
 * `createPreloadingMiddleware` tests.
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
 * Internal dependencies
 */
import createPreloadingMiddleware from './preloading';

const preloadedData = {
	'test/path/a': {
		headers: [],
		body: {
			body: { keyName: 'value' },
		},
	},

	'test/path/b': {
		headers: [],
		body: { keyName: 'value' },
	},
};

describe( 'Preloading Middleware', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	it( 'returns a preloaded response when present', async () => {
		const requestURI = 'test/path/a';
		const preloadingMiddleware =
			createPreloadingMiddleware( preloadedData );

		const requestOptions = {
			method: 'GET',
			path: requestURI,
		};
		const next = jest.fn();
		const firstResponse = await preloadingMiddleware(
			requestOptions,
			next
		);
		expect( firstResponse ).toEqual( preloadedData[ requestURI ].body );
		expect( next ).not.toHaveBeenCalled();
	} );

	it( 'returns a preloaded response from multiple URIs', async () => {
		const firstRequestURI = 'test/path/a';
		const secondRequestURI = 'test/path/b';

		const preloadingMiddleware =
			createPreloadingMiddleware( preloadedData );

		const firstResponseNext = jest.fn();
		const secondResponseNext = jest.fn();

		const firstResponse = await preloadingMiddleware(
			{ method: 'GET', path: firstRequestURI },
			firstResponseNext
		);
		expect( firstResponse ).toEqual(
			preloadedData[ firstRequestURI ].body
		);
		expect( firstResponseNext ).not.toHaveBeenCalled();

		const firstResponseAgain = await preloadingMiddleware(
			{ method: 'GET', path: firstRequestURI },
			firstResponseNext
		);
		expect( firstResponseAgain ).toBeUndefined();
		expect( firstResponseNext ).toHaveBeenCalled();

		const secondResponse = await preloadingMiddleware(
			{ method: 'GET', path: secondRequestURI },
			secondResponseNext
		);
		expect( secondResponse ).toEqual(
			preloadedData[ secondRequestURI ].body
		);
		expect( secondResponseNext ).not.toHaveBeenCalled();

		const secondResponseAgain = await preloadingMiddleware(
			{ method: 'GET', path: secondRequestURI },
			secondResponseNext
		);
		expect( secondResponseAgain ).toBeUndefined();
		expect( secondResponseNext ).toHaveBeenCalled();
	} );

	it( 'does nothing and calls next middleware when no preloaded response exists for the request', async () => {
		const requestURI = 'test/path/a';
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
		const requestURI = 'test/path/a';
		const preloadingMiddleware =
			createPreloadingMiddleware( preloadedData );

		const requestOptions = {
			method: 'GET',
			path: requestURI,
		};
		const next = jest.fn();
		const firstResponse = await preloadingMiddleware(
			requestOptions,
			next
		);
		expect( firstResponse ).toEqual( preloadedData[ requestURI ].body );
		expect( next ).not.toHaveBeenCalled();

		const secondRequest = await preloadingMiddleware(
			requestOptions,
			next
		);
		expect( secondRequest ).toBeUndefined();
		expect( next ).toHaveBeenCalled();
	} );

	it( 'calls the next middleware', async () => {
		const firstRequestURI = 'test/path/a';
		const secondRequestURI = 'test/path/b';
		const preloadingMiddleware = createPreloadingMiddleware(
			preloadedData,
			10
		);
		const requestOptions = {
			method: 'GET',
			path: firstRequestURI,
		};
		const next = jest.fn();

		const firstResponse = await preloadingMiddleware(
			requestOptions,
			next
		);
		expect( firstResponse ).toEqual(
			preloadedData[ firstRequestURI ].body
		);
		expect( next ).not.toHaveBeenCalled();

		jest.runAllTimers();
		// Confirm that invocations after the timeout ignore preloaded response cache.
		const secondResponse = await preloadingMiddleware(
			{ method: 'GET', path: secondRequestURI },
			next
		);
		expect( secondResponse ).toBeUndefined();
		expect( next ).toHaveBeenCalled();
	} );

	describe( 'apiFetch integration', () => {
		let apiFetch;
		beforeEach( () => {
			apiFetch = require( '@wordpress/api-fetch' ).default;
			apiFetch.use( createPreloadingMiddleware( preloadedData ) );
		} );

		afterEach( () => {
			// Invalidate the require cache for `api-fetch` so that it uses a fresh instance.
			delete require.cache[ require.resolve( '@wordpress/api-fetch' ) ];
		} );

		it( 'returns a preloaded response when present.', async () => {
			const requestURI = 'test/path/a';
			// This mock is set up but the expectation is that it should never be run.
			fetchMock.any( '*', 200 );
			const response = await apiFetch( {
				method: 'GET',
				path: requestURI,
			} );
			expect( response ).toEqual( preloadedData[ requestURI ].body );
			expect( fetchMock ).not.toHaveFetched();
		} );
	} );
} );
