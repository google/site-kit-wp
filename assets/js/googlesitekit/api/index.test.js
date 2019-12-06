/**
 * Internal dependencies
 */
import { invalidateCache, isAPICachingEnabled, get, set, useCache } from './index';

describe( 'googlesitekit.api', () => {
	it( 'should have caching enabled by default', () => {
		expect( isAPICachingEnabled() ).toEqual( true );
	} );

	describe( 'invalidateCache', () => {
		it( 'should throw an error while not implemented', () => {
			expect( () => {
				invalidateCache();
			} ).toThrow( 'Not yet implemented.' );
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

	describe( 'useCache', () => {
		afterEach( () => {
			// Re-enable the default caching setting after each test.
			useCache( true );
		} );

		it( 'should enable the caching API', () => {
			// The cache is enabled by default, so ensure it is disabled first
			// to ensure re-enabling works as expected.
			useCache( false );

			expect( useCache( true ) ).toEqual( true );
			expect( isAPICachingEnabled() ).toEqual( true );
		} );

		it( 'should disable the caching API', () => {
			expect( useCache( false ) ).toEqual( false );
			expect( isAPICachingEnabled() ).toEqual( false );
		} );
	} );
} );
