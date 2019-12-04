/**
 * Internal dependencies
 */
// eslint-disable-next-line @wordpress/dependency-group
import { _setStorageKeyPrefix, _setSelectedStorageBackend, _getStorage, get, set, deleteItem, getKeys, clearCache } from './cache';

let previousCacheValue;
const disableCache = () => {
	previousCacheValue = global.googlesitekit.admin.nojscache;
	global.googlesitekit.admin.nojscache = true;
};

const restoreCache = () => {
	global.googlesitekit.admin.nojscache = previousCacheValue;
};

const DISABLE_CACHE = 'Cache disabled';
const NO_BACKEND = 'Null backend';

describe( 'googlesitekit.api.cache', () => {
	describe( '_getStorage', () => {
		it( 'should return the most applicable storage driver available', async () => {
			const storage = await _getStorage();

			// localStorage is the best storage mechanism available in the test suite
			// and should be returned.
			expect( storage ).toEqual( localStorage );
		} );

		it( 'should return null if googlesitekit.admin.nojscache is true', async () => {
			disableCache();
			const storage = await _getStorage();

			expect( storage ).toEqual( null );
			restoreCache();
		} );
	} );

	[ 'localStorage', 'sessionStorage' ].forEach( ( backend ) => {
		describe( `${ backend } backend`, () => {
			let storageMechanism;
			beforeAll( () => {
				storageMechanism = global[ backend ];
				_setSelectedStorageBackend( storageMechanism );
			} );

			afterAll( () => {
				// Reset the backend storage mechanism.
				_setSelectedStorageBackend( undefined );
			} );

			describe( 'get', () => {
				it( 'should return undefined when the key is not found', async () => {
					const result = await get( 'not-a-key' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith( 'not-a-key' );
					expect( result.cacheHit ).toEqual( false );
					expect( result.value ).toEqual( undefined );
				} );

				it( 'should return undefined when the key is found but the cached value is too old', async () => {
					// Save with a timestamp ten seconds in the past.
					const didSave = await set( 'old-key', 'something', Date.now() - 10 );
					expect( didSave ).toEqual( true );

					// Only return if the cache hit is less than five seconds old.
					const result = await get( 'old-key', 5 );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith( 'old-key' );
					expect( result.cacheHit ).toEqual( false );
					expect( result.value ).toEqual( undefined );
				} );

				it( 'should return the value when the key is found and the data is not stale', async () => {
					const didSave = await set( 'modern-key', 'something' );
					expect( didSave ).toEqual( true );

					const result = await get( 'modern-key', 100 );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith( 'modern-key' );
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( 'something' );
				} );

				it( 'should return an undefined saved value but set cacheHit to true', async () => {
					const didSave = await set( 'undefined', undefined );
					expect( didSave ).toEqual( true );

					const result = await get( 'undefined' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith( 'undefined' );
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( undefined );
				} );

				it( 'should return a number value', async () => {
					const didSave = await set( 'number', 500 );
					expect( didSave ).toEqual( true );

					const result = await get( 'number' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith( 'number' );
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( 500 );
				} );

				it( 'should return an array value', async () => {
					const didSave = await set( 'array', [ 1, '2', 3 ] );
					expect( didSave ).toEqual( true );

					const result = await get( 'array' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith( 'array' );
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( [ 1, '2', 3 ] );
				} );

				it( 'should return an object value', async () => {
					const didSave = await set( 'object', { foo: 'barr' } );
					expect( didSave ).toEqual( true );

					const result = await get( 'object' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith( 'object' );
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( { foo: 'barr' } );
				} );

				it( 'should return a complex value', async () => {
					const didSave = await set( 'complex', [ 1, '2', { cool: 'times', other: [ { time: { to: 'see' } } ] } ] );
					expect( didSave ).toEqual( true );

					const result = await get( 'complex' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith( 'complex' );
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( [ 1, '2', { cool: 'times', other: [ { time: { to: 'see' } } ] } ] );
				} );

				it( 'should not mutate a value', async () => {
					await set( 'value', 'hello' );

					const result1 = await get( 'value' );
					const result2 = await get( 'value' );

					result1.value = 'mutate';

					expect( result1.value ).not.toEqual( result2.value );
				} );

				it( 'should not mutate an object value', async () => {
					await set( 'object', { foo: 'barr' } );

					const result1 = await get( 'object' );
					const result2 = await get( 'object' );

					result1.value.foo = 'mutate';

					expect( result1.value.foo ).not.toEqual( result2.value.foo );
				} );

				it( 'should not mutate an array value', async () => {
					await set( 'array', [ 1, 2, 3 ] );

					const result1 = await get( 'array' );
					const result2 = await get( 'array' );

					result1.value[ 2 ] = 4;

					expect( result1.value[ 2 ] ).not.toEqual( result2.value[ 2 ] );
				} );
			} );

			describe( 'set', () => {
				it( 'should not save when a hard-to-serialize data is set', async () => {
					const arrayBuffer = new ArrayBuffer( 8 );
					const didSave = await set( 'arrayBuffer', arrayBuffer, 500 );
					const storedData = JSON.stringify( {
						timestamp: 500,
						value: arrayBuffer,
					} );

					expect( didSave ).toEqual( false );
					expect( storageMechanism.setItem ).not.toHaveBeenCalledWith( 'arrayBuffer', storedData );
					expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 0 );
				} );

				it( 'should save data', async () => {
					// We specify a manual timestamp here to ensure the entire call to
					// `setItem` can be verified. If we don't set a timestamp manually,
					// it's obnoxious to test this :-)
					const didSave = await set( 'array', [ 1, 2, 3 ], 500 );
					const storedData = JSON.stringify( {
						timestamp: 500,
						value: [ 1, 2, 3 ],
					} );

					expect( didSave ).toEqual( true );
					expect( storageMechanism.setItem ).toHaveBeenCalledWith( 'array', storedData );
					expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 1 );
				} );
			} );

			describe( 'deleteItem', () => {
				it( 'should delete data', async () => {
					const didSave = await set( 'array', [ 1, 2, 3 ] );
					expect( didSave ).toEqual( true );

					const didDelete = await deleteItem( 'array' );
					expect( didDelete ).toEqual( true );
					expect( storageMechanism.removeItem ).toHaveBeenCalledWith( 'array' );
					expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 0 );
				} );

				it( "should not error when trying to delete data that doesn't exist", async () => {
					const didDelete = await deleteItem( 'array' );
					expect( didDelete ).toEqual( true );
					expect( storageMechanism.removeItem ).toHaveBeenCalledWith( 'array' );
				} );
			} );

			describe( 'getKeys', () => {
				beforeEach( () => {
					// Set the storage key prefix so we can compare Site Kit and
					// non-Site Kit keys.
					_setStorageKeyPrefix( 'sitekit_' );
				} );

				afterEach( () => {
					// Restore the empty storage key prefix for the rest of the tests.
					_setStorageKeyPrefix( '' );
				} );

				it( 'should return an empty array when there are no keys', async () => {
					const keys = await getKeys();
					expect( keys ).toEqual( [] );
				} );

				it( 'should return an empty array when there are no Site Kit keys', async () => {
					// Set non-Site Kit keys to ensure we don't return them.
					storageMechanism.setItem( 'whatever', 'cool' );
					storageMechanism.setItem( 'something', 'else' );
					expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 2 );

					const keys = await getKeys();
					expect( keys ).toEqual( [] );
				} );

				it( 'should return all Site Kit keys', async () => {
					await set( 'key1', 'data' );
					await set( 'key2', 'data' );

					const keys = await getKeys();
					expect( keys ).toEqual( [ 'key1', 'key2' ] );
				} );

				it( 'should not return non-Site Kit keys', async () => {
					// Set a non-Site Kit key to ensure we don't return it.
					storageMechanism.setItem( 'whatever', 'cool' );
					await set( 'key1', 'data' );
					await set( 'key2', 'data' );
					expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 3 );

					const keys = await getKeys();
					expect( keys ).toEqual( [ 'key1', 'key2' ] );
				} );
			} );

			describe( 'clearCache', () => {
				beforeEach( () => {
					// Set the storage key prefix so we can compare Site Kit and
					// non-Site Kit keys.
					_setStorageKeyPrefix( 'sitekit_' );
				} );

				afterEach( () => {
					// Restore the empty storage key prefix for the rest of the tests.
					_setStorageKeyPrefix( '' );
				} );

				it( 'should return true when storage is cleared', async () => {
					await set( 'key1', 'data' );
					await set( 'key2', 'data' );

					const didClearCache = await clearCache();
					expect( didClearCache ).toEqual( true );
				} );

				it( 'should clear all storage', async () => {
					await set( 'key1', 'data' );
					await set( 'key2', 'data' );

					await clearCache();
					expect( storageMechanism.removeItem ).toHaveBeenCalled();
					expect( storageMechanism.key ).toHaveBeenCalled();

					const keys = await getKeys();
					expect( keys.length ).toEqual( 0 );
					expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 0 );
				} );

				it( 'should clear only Site Kit keys', async () => {
					// Set a non-Site Kit key to ensure we don't return it.
					storageMechanism.setItem( 'whatever', 'cool' );
					await set( 'key1', 'data' );
					await set( 'key2', 'data' );

					await clearCache();

					const keys = await getKeys();
					expect( keys.length ).toEqual( 0 );
					expect( Object.keys( storageMechanism.__STORE__ ).length ).toBe( 1 );
				} );
			} );
		} );
	} );

	[ DISABLE_CACHE, NO_BACKEND ].forEach( ( testSuite ) => {
		describe( `No-op caching (${ testSuite })`, () => {
			beforeAll( () => {
				if ( testSuite === DISABLE_CACHE ) {
					// Set googlesitekit.admin.nojscache to `true`.
					disableCache();
				}

				if ( testSuite === NO_BACKEND ) {
					// Set the backend storage mechanism to nothing; this will cause all
					// caching to be skipped.
					_setSelectedStorageBackend( null );
				}
			} );

			afterAll( () => {
				if ( testSuite === DISABLE_CACHE ) {
					// Restore the default googlesitekit.admin.nojscache value.
					restoreCache();
				}

				if ( testSuite === NO_BACKEND ) {
					// Reset the backend storage mechanism to "unknown".
					_setSelectedStorageBackend( undefined );
				}
			} );

			describe( 'get', () => {
				it( 'should return nothing when no storage is available', async () => {
					await set( 'key1', 'data' );

					const cacheData = await get( 'key1' );
					expect( cacheData ).toEqual( {
						cacheHit: false,
						value: undefined,
					} );
					expect( localStorage.getItem ).not.toHaveBeenCalled();
					expect( sessionStorage.getItem ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'set', () => {
				it( 'should not save when no storage is available', async () => {
					const didSave = await set( 'key1', 'data' );
					expect( didSave ).toEqual( false );
					expect( localStorage.setItem ).not.toHaveBeenCalled();
					expect( sessionStorage.setItem ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'deleteItem', () => {
				it( 'should not call delete when no storage is available', async () => {
					await set( 'key1', 'data' );

					const didDelete = await deleteItem( 'key1' );
					expect( didDelete ).toEqual( false );
					expect( localStorage.removeItem ).not.toHaveBeenCalled();
					expect( sessionStorage.removeItem ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'getKeys', () => {
				it( 'should return nothing when no storage is available', async () => {
					await set( 'key1', 'data' );
					await set( 'key2', 'data' );

					const keys = await getKeys();
					expect( keys ).toEqual( [] );
					expect( localStorage.key ).not.toHaveBeenCalled();
					expect( sessionStorage.key ).not.toHaveBeenCalled();
				} );
			} );

			describe( 'clearCache', () => {
				it( 'should return false when no storage is available', async () => {
					await set( 'key1', 'data' );
					await set( 'key2', 'data' );

					const didClearCache = await clearCache();
					expect( didClearCache ).toEqual( false );
					expect( localStorage.removeItem ).not.toHaveBeenCalled();
					expect( sessionStorage.removeItem ).not.toHaveBeenCalled();
					expect( localStorage.key ).not.toHaveBeenCalled();
					expect( sessionStorage.key ).not.toHaveBeenCalled();
				} );
			} );
		} );
	} );
} );
