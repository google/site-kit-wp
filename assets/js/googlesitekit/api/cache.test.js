/**
 * Caching functions tests.
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
	STORAGE_KEY_PREFIX,
	clearCache,
	deleteItem,
	getItem,
	getKeys,
	getStorage,
	resetDefaultStorageOrder,
	setItem,
	setSelectedStorageBackend,
	setStorageOrder,
	STORAGE_KEY_PREFIX_ROOT,
} from './cache';

describe( 'googlesitekit.api.cache', () => {
	describe( 'getStorage', () => {
		it( 'should return the most applicable storage driver available', async () => {
			let storage = await getStorage();

			// localStorage is the best storage mechanism available in the test suite
			// by default and should be returned.
			expect( storage ).toEqual( localStorage );

			setStorageOrder( [ 'sessionStorage', 'localStorage' ] );
			storage = await getStorage();

			expect( storage ).toEqual( sessionStorage );

			// Ensure an empty order still works.
			setStorageOrder( [] );
			storage = await getStorage();

			expect( storage ).toEqual( null );

			resetDefaultStorageOrder();
		} );
	} );

	describe.each( [ [ 'localStorage' ], [ 'sessionStorage' ] ] )(
		'%s backend',
		( backend ) => {
			let storageMechanism;
			beforeAll( () => {
				storageMechanism = global[ backend ];
				setSelectedStorageBackend( storageMechanism );
			} );

			afterAll( () => {
				// Reset the backend storage mechanism.
				setSelectedStorageBackend( undefined );
			} );

			describe( 'get', () => {
				it( 'should return undefined when the key is not found', async () => {
					const result = await getItem( 'not-a-key' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }not-a-key`
					);
					expect( result.cacheHit ).toEqual( false );
					expect( result.value ).toEqual( undefined );
				} );

				it( 'should return undefined when the key is found but the cached value is too old', async () => {
					// Save with a timestamp ten seconds in the past.
					const didSave = await setItem( 'old-key', 'something', {
						timestamp: Math.round( Date.now() / 1000 ) - 10,
						ttl: 5,
					} );
					expect( didSave ).toEqual( true );

					// Only return if the cache hit is less than five seconds old.
					const result = await getItem( 'old-key' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }old-key`
					);
					expect( result.cacheHit ).toEqual( false );
					expect( result.value ).toEqual( undefined );
				} );

				it( 'should return the value when the key is found and the data is not stale', async () => {
					const didSave = await setItem( 'modern-key', 'something', {
						ttl: 100,
					} );
					expect( didSave ).toEqual( true );

					const result = await getItem( 'modern-key' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }modern-key`
					);
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( 'something' );
				} );

				it( 'should return an undefined saved value but set cacheHit to true', async () => {
					const didSave = await setItem( 'undefined', undefined );
					expect( didSave ).toEqual( true );

					const result = await getItem( 'undefined' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }undefined`
					);
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( undefined );
				} );

				it( 'should return a number value', async () => {
					const didSave = await setItem( 'number', 500 );
					expect( didSave ).toEqual( true );

					const result = await getItem( 'number' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }number`
					);
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( 500 );
				} );

				it( 'should return an array value', async () => {
					const didSave = await setItem( 'array', [ 1, '2', 3 ] );
					expect( didSave ).toEqual( true );

					const result = await getItem( 'array' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }array`
					);
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( [ 1, '2', 3 ] );
				} );

				it( 'should return an object value', async () => {
					const didSave = await setItem( 'object', { foo: 'barr' } );
					expect( didSave ).toEqual( true );

					const result = await getItem( 'object' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }object`
					);
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( { foo: 'barr' } );
				} );

				it( 'should return a complex value', async () => {
					const didSave = await setItem( 'complex', [
						1,
						'2',
						{ cool: 'times', other: [ { time: { to: 'see' } } ] },
					] );
					expect( didSave ).toEqual( true );

					const result = await getItem( 'complex' );

					expect( storageMechanism.getItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }complex`
					);
					expect( result.cacheHit ).toEqual( true );
					expect( result.value ).toEqual( [
						1,
						'2',
						{ cool: 'times', other: [ { time: { to: 'see' } } ] },
					] );
				} );

				it( 'should not mutate a value', async () => {
					await setItem( 'value', 'hello' );

					const result1 = await getItem( 'value' );
					const result2 = await getItem( 'value' );

					result1.value = 'mutate';

					expect( result1.value ).not.toEqual( result2.value );
				} );

				it( 'should not mutate an object value', async () => {
					await setItem( 'object', { foo: 'barr' } );

					const result1 = await getItem( 'object' );
					const result2 = await getItem( 'object' );

					result1.value.foo = 'mutate';

					expect( result1.value.foo ).not.toEqual(
						result2.value.foo
					);
				} );

				it( 'should not mutate an array value', async () => {
					await setItem( 'array', [ 1, 2, 3 ] );

					const result1 = await getItem( 'array' );
					const result2 = await getItem( 'array' );

					result1.value[ 2 ] = 4;

					expect( result1.value[ 2 ] ).not.toEqual(
						result2.value[ 2 ]
					);
				} );
			} );

			describe( 'set', () => {
				it( 'should save data', async () => {
					// We specify a manual timestamp here to ensure the entire call to
					// `setItem` can be verified. If we don't set a timestamp manually,
					// it's obnoxious to test this :-)
					const didSave = await setItem( 'array', [ 1, 2, 3 ], {
						timestamp: 500,
					} );
					const storedData = JSON.stringify( {
						timestamp: 500,
						ttl: 3600,
						value: [ 1, 2, 3 ],
						isError: false,
					} );

					expect( didSave ).toEqual( true );
					expect( storageMechanism.setItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }array`,
						storedData
					);
					expect(
						Object.keys( storageMechanism.__STORE__ ).length
					).toBe( 1 );
				} );
			} );

			describe( 'deleteItem', () => {
				it( 'should delete Site Kit data for the current version without needing to specify the storage key prefix', async () => {
					const didSave = await setItem( 'array', [ 1, 2, 3 ] );
					expect( didSave ).toEqual( true );

					const didDelete = await deleteItem( 'array' );
					expect( didDelete ).toEqual( true );
					expect( storageMechanism.removeItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }array`
					);
					expect(
						Object.keys( storageMechanism.__STORE__ ).length
					).toBe( 0 );
				} );

				it( 'should delete Site Kit data for the current version when the full key is specified', async () => {
					const didSave = await setItem( 'array', [ 1, 2, 3 ] );
					expect( didSave ).toEqual( true );

					const didDelete = await deleteItem(
						`${ STORAGE_KEY_PREFIX }array`
					);
					expect( didDelete ).toEqual( true );
					expect( storageMechanism.removeItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }array`
					);
					expect(
						Object.keys( storageMechanism.__STORE__ ).length
					).toBe( 0 );
				} );

				it( 'should delete Site Kit data for an old version when the full key is specified', async () => {
					// Simulate an item stored by a previous version of Site Kit.
					const oldStorageKeyPrefix = `${ STORAGE_KEY_PREFIX_ROOT }1.0.0_xyz123_`;
					storageMechanism.setItem(
						`${ oldStorageKeyPrefix }array`,
						[ 1, 2, 3 ]
					);

					const didDelete = await deleteItem(
						`${ oldStorageKeyPrefix }array`
					);
					expect( didDelete ).toEqual( true );
					expect( storageMechanism.removeItem ).toHaveBeenCalledWith(
						`${ oldStorageKeyPrefix }array`
					);
					expect(
						Object.keys( storageMechanism.__STORE__ ).length
					).toBe( 0 );
				} );

				it( "should not error when trying to delete data that doesn't exist", async () => {
					const didDelete = await deleteItem( 'array' );
					expect( didDelete ).toEqual( true );
					expect( storageMechanism.removeItem ).toHaveBeenCalledWith(
						`${ STORAGE_KEY_PREFIX }array`
					);
				} );
			} );

			describe( 'getKeys', () => {
				it( 'should return an empty array when there are no keys', async () => {
					const keys = await getKeys();
					expect( keys ).toEqual( [] );
				} );

				it( 'should return an empty array when there are no Site Kit keys', async () => {
					// Set non-Site Kit keys to ensure we don't return them.
					storageMechanism.setItem( 'whatever', 'cool' );
					storageMechanism.setItem( 'something', 'else' );
					expect(
						Object.keys( storageMechanism.__STORE__ ).length
					).toBe( 2 );

					const keys = await getKeys();
					expect( keys ).toEqual( [] );
				} );

				it( 'should return all Site Kit keys', async () => {
					await setItem( 'key1', 'data' );
					await setItem( 'key2', 'data' );

					// Simulate an item stored by a previous version of Site Kit.
					const oldStorageKeyPrefix = `${ STORAGE_KEY_PREFIX_ROOT }1.0.0_xyz123_`;
					storageMechanism.setItem(
						`${ oldStorageKeyPrefix }key3`,
						'data'
					);

					const keys = await getKeys();
					// The returned keys should include the Site Kit prefix.
					expect( keys ).toEqual( [
						`${ STORAGE_KEY_PREFIX }key1`,
						`${ STORAGE_KEY_PREFIX }key2`,
						`${ oldStorageKeyPrefix }key3`,
					] );
				} );

				it( 'should not return non-Site Kit keys', async () => {
					// Set a non-Site Kit key to ensure we don't return it.
					storageMechanism.setItem( 'whatever', 'cool' );
					await setItem( 'key1', 'data' );
					await setItem( 'key2', 'data' );

					// Simulate an item stored by a previous version of Site Kit.
					const oldStorageKeyPrefix = `${ STORAGE_KEY_PREFIX_ROOT }1.0.0_xyz123_`;
					storageMechanism.setItem(
						`${ oldStorageKeyPrefix }key3`,
						'data'
					);

					expect(
						Object.keys( storageMechanism.__STORE__ ).length
					).toBe( 4 );

					const keys = await getKeys();
					// The returned keys should include the Site Kit prefix.
					expect( keys ).toEqual( [
						`${ STORAGE_KEY_PREFIX }key1`,
						`${ STORAGE_KEY_PREFIX }key2`,
						`${ oldStorageKeyPrefix }key3`,
					] );
				} );
			} );

			describe( 'clearCache', () => {
				it( 'should return true when storage is cleared', async () => {
					await setItem( 'key1', 'data' );
					await setItem( 'key2', 'data' );

					const didClearCache = await clearCache();
					expect( didClearCache ).toEqual( true );
				} );

				it( 'should clear all storage', async () => {
					await setItem( 'key1', 'data' );
					await setItem( 'key2', 'data' );

					await clearCache();
					expect( storageMechanism.removeItem ).toHaveBeenCalled();
					expect( storageMechanism.key ).toHaveBeenCalled();

					const keys = await getKeys();
					expect( keys.length ).toEqual( 0 );
					expect(
						Object.keys( storageMechanism.__STORE__ ).length
					).toBe( 0 );
				} );

				it( 'should clear only Site Kit keys', async () => {
					// Set a non-Site Kit key to ensure we don't return it.
					storageMechanism.setItem( 'whatever', 'cool' );
					await setItem( 'key1', 'data' );
					await setItem( 'key2', 'data' );

					await clearCache();

					const keys = await getKeys();
					expect( keys.length ).toEqual( 0 );
					expect(
						Object.keys( storageMechanism.__STORE__ ).length
					).toBe( 1 );
				} );
			} );
		}
	);

	describe( 'No-op caching (Null backend)', () => {
		beforeAll( () => {
			// Set the backend storage mechanism to nothing; this will cause all
			// caching to be skipped.
			setSelectedStorageBackend( null );
		} );

		afterAll( () => {
			// Reset the backend storage mechanism to "unknown".
			setSelectedStorageBackend( undefined );
		} );

		// eslint-disable-next-line jest/no-identical-title
		describe( 'get', () => {
			it( 'should return nothing when no storage is available', async () => {
				await setItem( 'key1', 'data' );

				const cacheData = await getItem( 'key1' );
				expect( cacheData ).toEqual( {
					cacheHit: false,
					value: undefined,
				} );
				expect( localStorage.getItem ).not.toHaveBeenCalled();
				expect( sessionStorage.getItem ).not.toHaveBeenCalled();
			} );
		} );

		// eslint-disable-next-line jest/no-identical-title
		describe( 'set', () => {
			it( 'should not save when no storage is available', async () => {
				const didSave = await setItem( 'key1', 'data' );
				expect( didSave ).toEqual( false );
				expect( localStorage.setItem ).not.toHaveBeenCalled();
				expect( sessionStorage.setItem ).not.toHaveBeenCalled();
			} );
		} );

		// eslint-disable-next-line jest/no-identical-title
		describe( 'deleteItem', () => {
			it( 'should not call delete when no storage is available', async () => {
				await setItem( 'key1', 'data' );

				const didDelete = await deleteItem( 'key1' );
				expect( didDelete ).toEqual( false );
				expect( localStorage.removeItem ).not.toHaveBeenCalled();
				expect( sessionStorage.removeItem ).not.toHaveBeenCalled();
			} );
		} );

		// eslint-disable-next-line jest/no-identical-title
		describe( 'getKeys', () => {
			it( 'should return nothing when no storage is available', async () => {
				await setItem( 'key1', 'data' );
				await setItem( 'key2', 'data' );

				const keys = await getKeys();
				expect( keys ).toEqual( [] );
				expect( localStorage.key ).not.toHaveBeenCalled();
				expect( sessionStorage.key ).not.toHaveBeenCalled();
			} );
		} );

		// eslint-disable-next-line jest/no-identical-title
		describe( 'clearCache', () => {
			it( 'should return false when no storage is available', async () => {
				await setItem( 'key1', 'data' );
				await setItem( 'key2', 'data' );

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
