/**
 * Internal dependencies
 */
// eslint-disable-next-line @wordpress/dependency-group
import { unexpectedSuccess } from 'tests/js/utils';
import * as CacheModule from './cache';
import { setSelectedStorageBackend } from './cache.private';
import { invalidateCache, usingCache, get, set, setUsingCache } from './index';
import { createCacheKey } from './index.private';

describe( 'googlesitekit.api', () => {
	// We import the entire caching module so we can use
	// `jest.spyOn(CacheModule, 'getItem')` to monitor caching calls.
	const { getItem, setItem } = CacheModule;
	let storageMechanism;

	beforeAll( () => {
		const backend = 'localStorage';
		storageMechanism = global[ backend ];
		setSelectedStorageBackend( storageMechanism );
	} );

	afterEach( () => {
		// Re-enable the default caching setting after each test.
		setUsingCache( true );
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
				expect( error.message ).toEqual( '`type` argument for GET requests is required.' );
			}

			try {
				await get( 'core' );

				return unexpectedSuccess();
			} catch ( error ) {
				expect( error.message ).toEqual( '`identifier` argument for GET requests is required.' );
			}

			try {
				await get( 'core', 'search-console' );

				return unexpectedSuccess();
			} catch ( error ) {
				expect( error.message ).toEqual( '`datapoint` argument for GET requests is required.' );
			}
		} );

		it( 'should return a response', async () => {
			// TODO: Maybe refactor this into a helper once we know how we usually
			// mock requests.
			fetch
				.doMockOnceIf(
					/^\/google-site-kit\/v1\/core\/search-console\/data\/users/
				)
				.mockResponseOnce( JSON.stringify( { foo: 'bar' } ), { status: 200 } );

			const response = await get( 'core', 'search-console', 'users' );

			// Ensure the correct URL was used to make this HTTP fetch request.
			expect( response ).toEqual( { foo: 'bar' } );
		} );

		it( 'should throw an error if the fetch request encounters a 404 error code', async () => {
			const errorResponse = {
				code: 'rest_no_route',
				message: 'No route was found matching the URL and request method',
				data: { status: 404 },
			};

			fetch
				.doMockOnceIf(
					/^\/google-site-kit\/v1\/core\/search-console\/data\/other/
				)
				.mockResponseOnce( JSON.stringify( errorResponse ), { status: 404 } );

			try {
				await get( 'core', 'search-console', 'other' );
			} catch ( err ) {
				expect( err ).toEqual( errorResponse );
			}
		} );

		it( 'should throw an error if the fetch request encounters a 500 error code', async () => {
			const errorResponse = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};

			fetch
				.doMockOnceIf(
					/^\/google-site-kit\/v1\/core\/search-console\/data\/users/
				)
				.mockResponseOnce( JSON.stringify( errorResponse ), { status: 500 } );

			try {
				await get( 'core', 'search-console', 'users' );
			} catch ( err ) {
				expect( err ).toEqual( errorResponse );
			}
		} );

		it( 'should cache requests by default', async () => {
			const getItemSpy = jest.spyOn( CacheModule, 'getItem' );
			const setItemSpy = jest.spyOn( CacheModule, 'setItem' );
			expect( fetch ).toHaveBeenCalledTimes( 0 );

			fetch
				.doMockIf(
					/^\/google-site-kit\/v1\/core\/search-console\/data\/users/
				)
				.mockResponse( JSON.stringify( { foo: 'bar' } ), { status: 200 } );

			const firstResponse = await get( 'core', 'search-console', 'users' );
			expect( fetch ).toHaveBeenCalledTimes( 1 );
			// Ensure the response was saved to the cache.
			expect( setItemSpy ).toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'users' ),
				firstResponse
			);

			// Ensure `fetch()` is not called a second time, because we have a cached
			// version of this response.
			const secondResponse = await get( 'core', 'search-console', 'users' );

			expect( secondResponse ).toEqual( firstResponse );
			expect( fetch ).toHaveBeenCalledTimes( 1 );

			// Ensure cache functions were used.
			expect( getItemSpy ).toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'users' ),
				3600
			);
		} );

		it( 'should not use cache if caching is disabled globally', async () => {
			const getItemSpy = jest.spyOn( CacheModule, 'getItem' );
			const setItemSpy = jest.spyOn( CacheModule, 'setItem' );

			setUsingCache( false );

			fetch
				.doMockIf(
					/^\/google-site-kit\/v1\/core\/search-console\/data\/notifications/
				)
				.mockResponse( JSON.stringify( { foo: 'bar' } ), { status: 200 } );

			await get( 'core', 'search-console', 'notifications' );
			expect( setItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'notifications' ),
				{ foo: 'bar' }
			);
			expect( fetch ).toHaveBeenCalledTimes( 1 );

			// Ensure `fetch()` is called a second time; the cache is disabled.
			await get( 'core', 'search-console', 'notifications' );
			expect( fetch ).toHaveBeenCalledTimes( 2 );

			// Ensure the cache was never used.
			expect( getItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'notifications' ),
				3600
			);
		} );

		it( 'should not use cache if caching is disabled with arguments', async () => {
			const getItemSpy = jest.spyOn( CacheModule, 'getItem' );
			const setItemSpy = jest.spyOn( CacheModule, 'setItem' );

			fetch
				.doMockIf(
					/^\/google-site-kit\/v1\/core\/search-console\/data\/other/
				)
				.mockResponse( JSON.stringify( { foo: 'bar' } ), { status: 200 } );

			await get( 'core', 'search-console', 'other', undefined, { useCache: false } );
			expect( setItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'other' ),
				{ foo: 'bar' }
			);
			expect( fetch ).toHaveBeenCalledTimes( 1 );

			// Ensure `fetch()` is called a second time; the cache is disabled.
			await get( 'core', 'search-console', 'other', undefined, { useCache: false } );
			expect( fetch ).toHaveBeenCalledTimes( 2 );

			// Ensure the cache was never used.
			expect( getItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'other' ),
				3600
			);
		} );

		it( 'should not use cache even if cached values exist', async () => {
			const getItemSpy = jest.spyOn( CacheModule, 'getItem' );
			const setItemSpy = jest.spyOn( CacheModule, 'setItem' );

			fetch
				.doMockIf(
					/^\/google-site-kit\/v1\/core\/search-console\/data\/cached/
				)
				.mockResponse( JSON.stringify( { foo: 'bar' } ), { status: 200 } );

			await get( 'core', 'search-console', 'cached' );
			expect( setItemSpy ).toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'cached' ),
				{ foo: 'bar' }
			);
			expect( fetch ).toHaveBeenCalledTimes( 1 );

			// Ensure `fetch()` is called a second time; the cache is disabled.
			getItemSpy.mockReset();
			await get( 'core', 'search-console', 'cached', undefined, { useCache: false } );
			expect( fetch ).toHaveBeenCalledTimes( 2 );

			// Ensure the cache was never used.
			expect( getItemSpy ).not.toHaveBeenCalledWith(
				createCacheKey( 'core', 'search-console', 'cached' ),
				3600
			);
		} );
	} );

	describe( 'set', () => {
		it( 'should throw an error while not implemented', async () => {
			try {
				await set();
			} catch ( error ) {
				expect( error.message ).toEqual( 'Not yet implemented.' );
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
				createCacheKey( 'core', 'search-console', 'accounts', { foo: 'test' } ),
				'other-data'
			);

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 2 );

			await invalidateCache( 'core', 'search-console', 'accounts' );

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 0 );
		} );

		it( 'should remove cached item with query params', async () => {
			await setItem(
				createCacheKey( 'core', 'search-console', 'accounts', { foo: 'bar' } ),
				'data'
			);

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 1 );

			await invalidateCache( 'core', 'search-console', 'accounts' );

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 0 );
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

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 2 );

			await invalidateCache( 'core', 'search-console', 'accounts' );
			const { value } = await getItem(
				createCacheKey( 'core', 'search-console', 'users' )
			);

			expect( value ).toEqual( 'other-data' );
			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 1 );
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

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 2 );

			await invalidateCache( 'core', 'search-console' );

			expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 0 );
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

			expect(
				createCacheKey( 'core', 'adsense', 'accounts' )
			).toEqual( 'core::adsense::accounts' );
		} );

		it( 'should create a cache key with query params when provided', () => {
			const queryParams = {
				hello: 'world',
				test: 2,
				foo: 'bar',
			};
			expect(
				// Query params are stored in the key as an MD5-hash of key-sorted
				// params, eg:
				// `md5( JSON.stringify( sortObjectProperties( queryParams ) ) )`
				// We manually set the value here to ensure all the external functions
				// are working as expected. :-)
				createCacheKey( 'core', 'search-console', 'users', queryParams )
			).toEqual( 'core::search-console::users::a9e286c390a430f5dd1fbab4b31dd2a6' );
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
} );
