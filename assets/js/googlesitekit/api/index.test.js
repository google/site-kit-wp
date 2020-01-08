/**
 * Internal dependencies
 */
import { setItem, getItem } from './cache';
import { setSelectedStorageBackend } from './cache.private';
import { invalidateCache, usingCache, get, set, setUsingCache } from './index';
import { createCacheKey } from './index.private';

describe( 'googlesitekit.api', () => {
	let storageMechanism;
	beforeAll( () => {
		const backend = 'localStorage';
		storageMechanism = global[ backend ];
		setSelectedStorageBackend( storageMechanism );
	} );

	afterAll( () => {
		// Reset the backend storage mechanism.
		setSelectedStorageBackend( undefined );
	} );

	it( 'should have caching enabled by default', () => {
		expect( usingCache() ).toEqual( true );
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

	describe( 'get', () => {
		it( 'should throw an error while not implemented', async () => {
			try {
				await get();
			} catch ( error ) {
				expect( error.message ).toEqual( 'Not yet implemented.' );
			}
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

	describe( 'setUsingCache', () => {
		afterEach( () => {
			// Re-enable the default caching setting after each test.
			setUsingCache( true );
		} );

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
