/**
 * API request functions tests.
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
import {
	freezeFetch,
	unexpectedSuccess,
} from '../../../../tests/js/test-utils';
import * as CacheModule from './cache';
import {
	createCacheKey,
	get,
	invalidateCache,
	set,
	setUsingCache,
	siteKitRequest,
	usingCache,
} from './index';
import { DATA_LAYER } from '../../util/tracking/constants';
import { enableTracking } from '../../util/tracking';

describe( 'googlesitekit.api', () => {
	// We import the entire caching module so we can use
	// `jest.spyOn(CacheModule, 'getItem')` to monitor caching calls.
	const { getItem, setItem, setSelectedStorageBackend } = CacheModule;
	let storageMechanism;
	let dataLayerPushSpy;

	let getItemSpy;
	let setItemSpy;
	beforeEach( () => {
		getItemSpy = jest.spyOn( CacheModule, 'getItem' );
		setItemSpy = jest.spyOn( CacheModule, 'setItem' );
		enableTracking();
		global[ DATA_LAYER ] = [];
		dataLayerPushSpy = jest.spyOn( global[ DATA_LAYER ], 'push' );
	} );

	beforeAll( () => {
		const backend = 'localStorage';
		storageMechanism = global[ backend ];
		setSelectedStorageBackend( storageMechanism );
	} );

	afterEach( async () => {
		getItemSpy.mockRestore();
		setItemSpy.mockRestore();

		// Re-enable the default caching setting after each test.
		setUsingCache( true );

		// Clear the cache after every test.
		await invalidateCache();
	} );

	afterAll( () => {
		// Reset the backend storage mechanism.
		setSelectedStorageBackend( undefined );
	} );

	it( 'should have caching enabled by default', () => {
		expect( usingCache() ).toEqual( true );
	} );

	describe( 'get', () => {
		it( 'should throw an error when required arguments are missing', async () => {
			try {
				await get();

				return unexpectedSuccess();
			} catch ( error ) {
				expect( error.message ).toEqual(
					'`type` argument for requests is required.'
				);
			}

			try {
				await get( 'core' );

				return unexpectedSuccess();
			} catch ( error ) {
				expect( error.message ).toEqual(
					'`identifier` argument for requests is required.'
				);
			}

			try {
				await get( 'core', 'search-console' );

				return unexpectedSuccess();
			} catch ( error ) {
				expect( error.message ).toEqual(
					'`datapoint` argument for requests is required.'
				);
			}
		} );

		it( 'should return a response', async () => {
			// TODO: Maybe refactor this into a helper once we know how we usually
			// mock requests.
			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/users'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			const response = await get( 'core', 'search-console', 'users' );

			// Ensure the correct URL was used to make this HTTP fetch request.
			expect( response ).toEqual( { foo: 'bar' } );
		} );

		it( 'should send query string params from data params', async () => {
			fetchMock.get(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/search'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			const dataBody = {
				somethingElse: 'to-set',
				foo: 1,
				arrayValue: [ 1, 2 ],
			};
			await get( 'core', 'search-console', 'search', dataBody );
			expect( fetchMock ).toHaveFetched(
				'/google-site-kit/v1/core/search-console/data/search?somethingElse=to-set&foo=1&arrayValue%5B0%5D=1&arrayValue%5B1%5D=2&_locale=user',
				{
					body: undefined,
					credentials: 'include',
					headers: {
						Accept: 'application/json, */*;q=0.1',
					},
					method: 'GET',
				}
			);
		} );

		it( 'should throw an error if the fetch request encounters a 404 error code', async () => {
			const errorResponse = {
				code: 'rest_no_route',
				message:
					'No route was found matching the URL and request method',
				data: { status: 404 },
			};

			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/other'
				),
				{ body: errorResponse, status: 404 }
			);

			try {
				await get( 'core', 'search-console', 'other' );
			} catch ( err ) {
				expect( console ).toHaveErrored();
				expect( err ).toEqual( errorResponse );
			}
		} );

		it( 'should throw an error if the fetch request encounters a 500 error code', async () => {
			const errorResponse = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/users'
				),
				{ body: errorResponse, status: 500 }
			);

			try {
				await get( 'core', 'search-console', 'users' );
			} catch ( err ) {
				expect( console ).toHaveErrored();
				expect( err ).toEqual( errorResponse );
			}
		} );

		it( 'should cache requests by default', async () => {
			expect( fetchMock ).not.toHaveFetched();

			fetchMock.get(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/users'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			const firstResponse = await get(
				'core',
				'search-console',
				'users'
			);
			expect( fetchMock ).toHaveFetchedTimes( 1 );
			// Ensure the response was saved to the cache.
			expect( setItemSpy ).toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'users' ),
				firstResponse,
				{ ttl: 3600 }
			);

			// Ensure `fetch()` is not called a second time, because we have a cached
			// version of this response.
			const secondResponse = await get(
				'core',
				'search-console',
				'users'
			);

			expect( secondResponse ).toEqual( firstResponse );
			expect( fetchMock ).toHaveFetchedTimes( 1 );

			// Ensure cache functions were used.
			expect( getItemSpy ).toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'users' )
			);
		} );

		it( 'should not use cache if caching is disabled globally', async () => {
			setUsingCache( false );

			fetchMock.get(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/notifications'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			await get( 'core', 'search-console', 'notifications' );
			expect( setItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'notifications' ),
				{ foo: 'bar' }
			);
			expect( fetchMock ).toHaveFetchedTimes( 1 );

			// Ensure `fetch()` is called a second time; the cache is disabled.
			await get( 'core', 'search-console', 'notifications' );
			expect( fetchMock ).toHaveFetchedTimes( 2 );

			// Ensure the cache was never used.
			expect( getItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'notifications' ),
				3600
			);
		} );

		it( 'should not use cache if caching is disabled with arguments', async () => {
			// Ensure global caching is enabled when we disable caching on a per-request basis.
			setUsingCache( true );

			fetchMock.get(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/other'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			await get( 'core', 'search-console', 'other', undefined, {
				useCache: false,
			} );
			expect( setItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'other' ),
				{ foo: 'bar' }
			);
			expect( fetchMock ).toHaveFetchedTimes( 1 );

			// Ensure `fetch()` is called a second time; the cache is disabled.
			await get( 'core', 'search-console', 'other', undefined, {
				useCache: false,
			} );
			expect( fetchMock ).toHaveFetchedTimes( 2 );

			// Ensure the cache was never used.
			expect( getItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'other' ),
				3600
			);
		} );

		it( 'should not use cache even if cached values exist', async () => {
			fetchMock.get(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/cached'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			await get( 'core', 'search-console', 'cached' );
			expect( setItemSpy ).toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'cached' ),
				{ foo: 'bar' },
				{ ttl: 3600 }
			);
			expect( fetchMock ).toHaveFetchedTimes( 1 );

			// Ensure `fetch()` is called a second time; the cache is disabled.
			getItemSpy.mockReset();
			await get( 'core', 'search-console', 'cached', undefined, {
				useCache: false,
			} );
			expect( fetchMock ).toHaveFetchedTimes( 2 );

			// Ensure the cache was never used.
			expect( getItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'cached' ),
				3600
			);
		} );

		it( 'should add tracking info to the data layer when an error is returned on get', async () => {
			const errorResponse = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			fetchMock.getOnce(
				new RegExp(
					'^/google-site-kit/v1/test-type/test-identifier/data/test-datapoint'
				),
				{ body: errorResponse, status: 500 }
			);

			try {
				await get( 'test-type', 'test-identifier', 'test-datapoint' );
			} catch ( err ) {
				expect( console ).toHaveErrored();
				expect( dataLayerPushSpy ).toHaveBeenCalledTimes( 1 );
				const [ event, eventName, eventData ] =
					dataLayerPushSpy.mock.calls[ 0 ][ 0 ];
				expect( event ).toEqual( 'event' );
				expect( eventName ).toEqual(
					'GET:test-type/test-identifier/data/test-datapoint'
				);
				expect( eventData.event_category ).toEqual( 'api_error' );
				expect( eventData.event_label ).toEqual(
					'Internal server error (code: internal_server_error)'
				);
				expect( eventData.value ).toEqual( 500 );
			}
		} );
	} );

	describe( 'set', () => {
		it( 'should throw an error when required arguments are missing', async () => {
			try {
				await set();

				return unexpectedSuccess();
			} catch ( error ) {
				expect( error.message ).toEqual(
					'`type` argument for requests is required.'
				);
			}

			try {
				await set( 'core' );

				return unexpectedSuccess();
			} catch ( error ) {
				expect( error.message ).toEqual(
					'`identifier` argument for requests is required.'
				);
			}

			try {
				await set( 'core', 'search-console' );

				return unexpectedSuccess();
			} catch ( error ) {
				expect( error.message ).toEqual(
					'`datapoint` argument for requests is required.'
				);
			}
		} );

		it( 'should send request body data from data params', async () => {
			fetchMock.post(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/settings'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			const dataBody = {
				somethingElse: 'to-set',
				foo: 1,
				arrayValue: [ 1, 2 ],
			};
			await set( 'core', 'search-console', 'settings', dataBody );
			expect( fetchMock ).toHaveFetched(
				'/google-site-kit/v1/core/search-console/data/settings?_locale=user',
				{
					body: { data: dataBody },
					credentials: 'include',
					headers: {
						Accept: 'application/json, */*;q=0.1',
						'Content-Type': 'application/json',
					},
					method: 'POST',
				}
			);
		} );

		it( 'should send request body data from data params and query params if set', async () => {
			fetchMock.post(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/settings'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			const dataBody = {
				somethingElse: 'to-set',
				foo: 1,
				arrayValue: [ 1, 2 ],
			};
			await set( 'core', 'search-console', 'settings', dataBody, {
				queryParams: { foo: 'bar' },
			} );

			expect( fetchMock ).toHaveFetched(
				'/google-site-kit/v1/core/search-console/data/settings?foo=bar&_locale=user',
				{
					body: { data: dataBody },
					credentials: 'include',
					headers: {
						Accept: 'application/json, */*;q=0.1',
						'Content-Type': 'application/json',
					},
					method: 'POST',
				}
			);
		} );

		it( 'should never use the cache for set requests', async () => {
			fetchMock.post(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/settings'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			await set( 'core', 'search-console', 'settings', {
				somethingElse: 'to-set',
			} );
			expect( fetchMock ).toHaveFetchedTimes( 1 );

			// Ensure `fetch()` is called a second time; the cache is disabled.
			await set( 'core', 'search-console', 'settings', {
				something: 'to-set',
			} );
			expect( fetchMock ).toHaveFetchedTimes( 2 );

			// Ensure the cache was not set used.
			expect( getItemSpy ).not.toHaveBeenCalled();
			expect( setItemSpy ).not.toHaveBeenCalled();
		} );

		it( 'should invalidate the cache for matching type+identifier+datapoint combo', async () => {
			// Mock all requests for this URL.
			fetchMock.mock(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/will-cache'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			// Contents should not be found in the cache on first request.
			let cacheData = await getItem(
				createCacheKey( 'core', 'search-console', 'will-cache' )
			);
			expect( cacheData.cacheHit ).toEqual( false );

			// Make the request to prime the cache
			await get( 'core', 'search-console', 'will-cache' );

			// Now cached data will appear.
			cacheData = await getItem(
				createCacheKey( 'core', 'search-console', 'will-cache' )
			);
			expect( cacheData.cacheHit ).toEqual( true );
			expect( cacheData.value ).toEqual( { foo: 'bar' } );

			await set( 'core', 'search-console', 'will-cache', {
				somethingElse: 'to-set',
			} );

			cacheData = await getItem(
				createCacheKey( 'core', 'search-console', 'will-cache' )
			);
			expect( cacheData.cacheHit ).toEqual( false );
		} );

		it( 'should invalidate the cache for matching type+identifier+datapoint with query params', async () => {
			// Mock all requests for this URL.
			fetchMock.mock(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/will-cache'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			const queryParams = { surf: 'board' };

			// Contents should not be found in the cache on first request.
			let cacheData = await getItem(
				createCacheKey(
					'core',
					'search-console',
					'will-cache',
					queryParams
				)
			);
			expect( cacheData.cacheHit ).toEqual( false );

			// Make the request to prime the cache
			await get( 'core', 'search-console', 'will-cache', queryParams );

			// Now cached data will appear.
			cacheData = await getItem(
				createCacheKey(
					'core',
					'search-console',
					'will-cache',
					queryParams
				)
			);
			expect( cacheData.cacheHit ).toEqual( true );
			expect( cacheData.value ).toEqual( { foo: 'bar' } );

			await set( 'core', 'search-console', 'will-cache', {
				somethingElse: 'to-set',
			} );

			cacheData = await getItem(
				createCacheKey(
					'core',
					'search-console',
					'will-cache',
					queryParams
				)
			);
			expect( cacheData.cacheHit ).toEqual( false );
		} );

		it( 'should add tracking info to the data layer when an error is returned on set', async () => {
			const errorResponse = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/test-type/test-identifier/data/test-datapoint'
				),
				{ body: errorResponse, status: 500 }
			);

			try {
				await set(
					'test-type',
					'test-identifier',
					'test-datapoint',
					'data'
				);
			} catch ( err ) {
				expect( console ).toHaveErrored();
				expect( dataLayerPushSpy ).toHaveBeenCalledTimes( 1 );
				const [ event, eventName, eventData ] =
					dataLayerPushSpy.mock.calls[ 0 ][ 0 ];
				expect( event ).toEqual( 'event' );
				expect( eventName ).toEqual(
					'POST:test-type/test-identifier/data/test-datapoint'
				);
				expect( eventData.event_category ).toEqual( 'api_error' );
				expect( eventData.event_label ).toEqual(
					'Internal server error (code: internal_server_error)'
				);
				expect( eventData.value ).toEqual( 500 );
			}
		} );
	} );

	describe( 'invalidateCache', () => {
		it( 'should remove all cached items when called', async () => {
			await setItem(
				createCacheKey( 'core', 'search-console', 'accounts' ),
				'data'
			);
			await setItem(
				createCacheKey( 'core', 'search-console', 'accounts', {
					foo: 'test',
				} ),
				'other-data'
			);

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				2
			);

			await invalidateCache( 'core', 'search-console', 'accounts' );

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				0
			);
		} );

		it( 'should remove cached item with query params', async () => {
			await setItem(
				createCacheKey( 'core', 'search-console', 'accounts', {
					foo: 'bar',
				} ),
				'data'
			);

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				1
			);

			await invalidateCache( 'core', 'search-console', 'accounts' );

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				0
			);
		} );

		it( 'should only remove keys in the right scope', async () => {
			await setItem(
				createCacheKey( 'core', 'search-console', 'accounts' ),
				'data'
			);
			await setItem(
				createCacheKey( 'core', 'search-console', 'users' ),
				'other-data'
			);

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				2
			);

			await invalidateCache( 'core', 'search-console', 'accounts' );
			const { value } = await getItem(
				createCacheKey( 'core', 'search-console', 'users' )
			);

			expect( value ).toEqual( 'other-data' );
			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				1
			);
		} );

		it( 'should remove all keys when scope is broad', async () => {
			await setItem(
				createCacheKey( 'core', 'search-console', 'accounts' ),
				'data'
			);
			await setItem(
				createCacheKey( 'core', 'search-console', 'users' ),
				'other-data'
			);

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				2
			);

			await invalidateCache( 'core', 'search-console' );

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				0
			);
		} );

		it( 'should remove everything in the cache when called without arguments', async () => {
			await setItem(
				createCacheKey( 'core', 'search-console', 'accounts' ),
				'data'
			);
			await setItem(
				createCacheKey( 'modules', 'analytics-4', 'something' ),
				'other-data'
			);

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				2
			);

			await invalidateCache();

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe(
				0
			);
		} );
	} );

	describe( 'setUsingCache', () => {
		it( 'should enable the caching API', () => {
			// The cache is enabled by default, so ensure it is disabled first
			// to ensure re-enabling works as expected.
			setUsingCache( false );

			expect( setUsingCache( true ) ).toEqual( true );
			expect( usingCache() ).toEqual( true );
		} );

		it( 'should disable the caching API', () => {
			expect( setUsingCache( false ) ).toEqual( false );
			expect( usingCache() ).toEqual( false );
		} );
	} );

	describe( 'createCacheKey', () => {
		it( 'should create a cache key with all sections in order', () => {
			expect(
				createCacheKey( 'core', 'search-console', 'users' )
			).toEqual( 'core::search-console::users' );

			expect( createCacheKey( 'core', 'adsense', 'accounts' ) ).toEqual(
				'core::adsense::accounts'
			);
		} );

		it( 'should create a cache key with query params when provided', () => {
			const queryParams = {
				hello: 'world',
				test: 2,
				foo: 'bar',
			};
			expect(
				// Query params are stored in the key as an MD5-hash of key-sorted
				// params via `stringifyObject( queryParams )`.
				// We manually set the value here to ensure all the external functions
				// are working as expected. :-)
				createCacheKey( 'core', 'search-console', 'users', queryParams )
			).toEqual(
				'core::search-console::users::a9e286c390a430f5dd1fbab4b31dd2a6'
			);
		} );

		it( 'should create a cache key without query params when params are empty', () => {
			const queryParams = {};
			expect(
				createCacheKey( 'core', 'search-console', 'users', queryParams )
			).toEqual( 'core::search-console::users' );
		} );

		it( 'should ignore non-object query params', () => {
			expect(
				createCacheKey( 'core', 'search-console', 'users', 0 )
			).toEqual( 'core::search-console::users' );

			expect(
				createCacheKey( 'core', 'search-console', 'users', [ 1, 2 ] )
			).toEqual( 'core::search-console::users' );

			expect(
				createCacheKey( 'core', 'search-console', 'users', new Date() )
			).toEqual( 'core::search-console::users' );
		} );
	} );

	describe( 'siteKitRequest', () => {
		it( 'should send a request using fetch', async () => {
			fetchMock.get(
				new RegExp(
					'^/google-site-kit/v1/core/search-console/data/settings'
				),
				{ body: { foo: 'bar' }, status: 200 }
			);

			await siteKitRequest( 'core', 'search-console', 'settings' );

			expect( fetchMock ).toHaveFetched(
				'/google-site-kit/v1/core/search-console/data/settings?_locale=user',
				{
					body: undefined,
					credentials: 'include',
					headers: {
						Accept: 'application/json, */*;q=0.1',
					},
					method: 'GET',
				}
			);
		} );

		it( 'should allow aborting the request using the `signal` option', async () => {
			const controller = new AbortController();

			freezeFetch(
				new RegExp( '^/google-site-kit/v1/test/frozen/data/request' )
			);

			try {
				const promise = siteKitRequest( 'test', 'frozen', 'request', {
					signal: controller.signal,
				} );
				controller.abort();
				await promise;
			} catch ( err ) {
				expect( err.code ).toBe( 'fetch_error' );
				expect( console ).not.toHaveErrored();
			}
		} );
	} );
} );
