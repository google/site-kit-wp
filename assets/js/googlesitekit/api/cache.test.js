/**
 * Internal dependencies
 */
// eslint-disable-next-line @wordpress/dependency-group
import { unexpectedSuccess } from 'tests/js/utils';
import { get, set, deleteItem, getKeys } from './cache';

describe( 'googlesitekit.api.cache', () => {
	describe( 'get', () => {
		it( 'should return undefined when the key is not found', async () => {
			const result = await get( 'not-a-key' );

			expect( localStorage.getItem ).toHaveBeenCalledWith( 'not-a-key' );
			expect( result.cacheHit ).toEqual( false );
			expect( result.value ).toEqual( undefined );
		} );

		it( 'should return undefined when the key is found but the TTL is too high', async () => {
			const didSave = await set( 'old-key', 'something', 1 );
			expect( didSave ).toEqual( true );

			const result = await get( 'old-key', 5 );

			expect( localStorage.getItem ).toHaveBeenCalledWith( 'old-key' );
			expect( result.cacheHit ).toEqual( false );
			expect( result.value ).toEqual( undefined );
		} );

		it( 'should return the value when the key is found and the data is not stale', async () => {
			const didSave = await set( 'modern-key', 'something' );
			expect( didSave ).toEqual( true );

			const result = await get( 'modern-key', 100 );

			expect( localStorage.getItem ).toHaveBeenCalledWith( 'modern-key' );
			expect( result.cacheHit ).toEqual( true );
			expect( result.value ).toEqual( 'something' );
		} );

		it( 'should return an undefined saved value but set cacheHit to true', async () => {
			const didSave = await set( 'undefined', undefined );
			expect( didSave ).toEqual( true );

			const result = await get( 'undefined' );

			expect( localStorage.getItem ).toHaveBeenCalledWith( 'undefined' );
			expect( result.cacheHit ).toEqual( true );
			expect( result.value ).toEqual( undefined );
		} );

		it( 'should return a number value', async () => {
			const didSave = await set( 'number', 500 );
			expect( didSave ).toEqual( true );

			const result = await get( 'number', 100 );

			expect( localStorage.getItem ).toHaveBeenCalledWith( 'number' );
			expect( result.cacheHit ).toEqual( true );
			expect( result.value ).toEqual( 500 );
		} );

		it( 'should return an array value', async () => {
			const didSave = await set( 'array', [ 1, '2', 3 ] );
			expect( didSave ).toEqual( true );

			const result = await get( 'array', 100 );

			expect( localStorage.getItem ).toHaveBeenCalledWith( 'array' );
			expect( result.cacheHit ).toEqual( true );
			expect( result.value ).toEqual( [ 1, '2', 3 ] );
		} );

		it( 'should return an object value', async () => {
			const didSave = await set( 'object', { foo: 'barr' } );
			expect( didSave ).toEqual( true );

			const result = await get( 'object', 100 );

			expect( localStorage.getItem ).toHaveBeenCalledWith( 'object' );
			expect( result.cacheHit ).toEqual( true );
			expect( result.value ).toEqual( { foo: 'barr' } );
		} );

		it( 'should return a complex value', async () => {
			const didSave = await set( 'complex', [ 1, '2', { cool: 'times', other: [ { time: { to: 'see' } } ] } ] );
			expect( didSave ).toEqual( true );

			const result = await get( 'complex', 100 );

			expect( localStorage.getItem ).toHaveBeenCalledWith( 'complex' );
			expect( result.cacheHit ).toEqual( true );
			expect( result.value ).toEqual( [ 1, '2', { cool: 'times', other: [ { time: { to: 'see' } } ] } ] );
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
			expect( localStorage.setItem ).not.toHaveBeenCalledWith( 'arrayBuffer', storedData );
		} );

		it( 'should save data', async () => {
			const didSave = await set( 'array', [ 1, 2, 3 ], 500 );
			const storedData = JSON.stringify( {
				timestamp: 500,
				value: [ 1, 2, 3 ],
			} );

			expect( didSave ).toEqual( true );
			expect( localStorage.setItem ).toHaveBeenCalledWith( 'array', storedData );
		} );
	} );

	describe( 'deleteItem', () => {
		it( 'should delete data', async () => {
			const didSave = await set( 'array', [ 1, 2, 3 ], 500 );
			expect( didSave ).toEqual( true );

			const didDelete = await deleteItem( 'array' );
			expect( didDelete ).toEqual( true );
			expect( localStorage.removeItem ).toHaveBeenCalledWith( 'array' );
		} );
	} );

	describe( 'getKeys', () => {
		it( 'should throw an error while not implemented', async () => {
			try {
				await getKeys();
				return unexpectedSuccess();
			} catch ( error ) {
				expect( error.message ).toEqual( 'Not yet implemented.' );
			}
		} );
	} );
} );
