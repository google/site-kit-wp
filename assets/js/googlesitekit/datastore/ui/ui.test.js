/**
 * `core/ui` data store tests.
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
import { createTestRegistry } from 'tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'core/ui store', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setValues', () => {
			it( 'requires the values param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValues();
				} ).toThrow( 'values must be an object.' );
			} );

			it( 'requires the values param to be an object not an array', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValues( [] );
				} ).toThrow( 'values must be an object.' );
			} );

			it( 'does not throw if values is an object', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValues( {} );
				} ).not.toThrow();
			} );

			it( 'requires the values param to be an object not a string', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValues( 'values' );
				} ).toThrow( 'values must be an object.' );
			} );

			it( 'does not overwrite unrelated keys', () => {
				registry.dispatch( STORE_NAME ).setValues( { key1: 'value1', key2: 'value2' } );

				registry.dispatch( STORE_NAME ).setValues( { key1: 'value3' } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );

			it( 'returns a newly-set value if a new value for an existing key is set', () => {
				registry.dispatch( STORE_NAME ).setValues( { key1: 'value1', key2: 'value2' } );

				registry.dispatch( STORE_NAME ).setValues( { key1: 'value3' } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key1' );
				expect( uiValue ).toEqual( 'value3' );
			} );

			it( 'does not overwrite unrelated keys when an empty object is supplied to values', () => {
				registry.dispatch( STORE_NAME ).setValues( { key1: 'value1', key2: 'value2' } );

				registry.dispatch( STORE_NAME ).setValues( {} );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );

			it( 'works with empty values where the key value is updated', () => {
				registry.dispatch( STORE_NAME ).setValues( {} );

				registry.dispatch( STORE_NAME ).setValues( { key1: 'value1', key2: 'value2' } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );

			it( 'preserves data from state when new data is assigned', () => {
				registry.dispatch( STORE_NAME ).setValues( { key1: 'value1', key2: 'value2' } );

				registry.dispatch( STORE_NAME ).setValues( { key3: 'value3', key4: 'value4' } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );

			it( 'sets object values', () => {
				registry.dispatch( STORE_NAME ).setValues( { key1: { childKey1: 'childValue1' } } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key1' );
				expect( uiValue ).toEqual( { childKey1: 'childValue1' } );
			} );

			it( 'sets boolean values', () => {
				registry.dispatch( STORE_NAME ).setValues( { key1: false } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key1' );
				expect( uiValue ).toEqual( false );
			} );

			it( 'sets array values', () => {
				registry.dispatch( STORE_NAME ).setValues( { key1: [ 'childKey1', 'childKey2', 'childKey3' ] } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key1' );
				expect( uiValue ).toEqual( [ 'childKey1', 'childKey2', 'childKey3' ] );
			} );
		} );

		describe( 'setValue', () => {
			it( 'requires the key param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValue();
				} ).toThrow( 'key is required.' );
			} );

			it( 'does not throw with a key', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValue( 'key1', 'value1' );
				} ).not.toThrow();
			} );

			it( 'works with key and value', () => {
				registry.dispatch( STORE_NAME ).setValue( 'key1', 'value1' );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key1' );
				expect( uiValue ).toEqual( 'value1' );
			} );

			it( 'works with a boolean value', () => {
				registry.dispatch( STORE_NAME ).setValue( 'key1', false );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key1' );
				expect( uiValue ).toEqual( false );
			} );

			it( 'works with the value as an object', () => {
				registry.dispatch( STORE_NAME ).setValue( 'key1', { childKey1: 'childValue1', childKey2: 'childValue2' } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key1' );
				expect( uiValue ).toEqual( { childKey1: 'childValue1', childKey2: 'childValue2' } );
			} );

			it( 'works with the value as an array', () => {
				registry.dispatch( STORE_NAME ).setValue( 'key1', [ 'childKey1', 'childKey2', 'childKey3' ] );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key1' );
				expect( uiValue ).toEqual( [ 'childKey1', 'childKey2', 'childKey3' ] );
			} );

			it( 'works with the value undefined', () => {
				registry.dispatch( STORE_NAME ).setValue( 'key1' );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key1' );
				expect( uiValue ).toEqual( undefined );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getValue', () => {
			it( 'works with a key that does not exist', () => {
				const uiValue = registry.select( STORE_NAME ).getValue( 'key2' );
				expect( uiValue ).toEqual( undefined );
			} );

			it( 'works with key where the key does not exist', () => {
				registry.dispatch( STORE_NAME ).setValues( { key1: 'value1', key2: 'value2' } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key3' );
				expect( uiValue ).toEqual( undefined );
			} );

			it( 'works with an existing key', () => {
				registry.dispatch( STORE_NAME ).setValues( { key1: 'value1', key2: 'value2' } );

				const uiValue = registry.select( STORE_NAME ).getValue( 'key2' );
				expect( uiValue ).toEqual( 'value2' );
			} );
		} );
	} );
} );
