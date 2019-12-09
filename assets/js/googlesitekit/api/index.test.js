/**
 * Internal dependencies
 */
import { invalidateCache, usingCache, get, set, setUsingCache } from './index';

describe( 'googlesitekit.api', () => {
	it( 'should have caching enabled by default', () => {
		expect( usingCache() ).toEqual( true );
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
} );
