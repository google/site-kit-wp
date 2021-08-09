/**
 * `core/forms` data store tests.
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
import { createTestRegistry } from '../../../../../tests/js/utils';
import { CORE_FORMS } from './constants';

describe( 'core/forms store', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setValues', () => {
			it( 'requires the formName param', () => {
				expect( () => {
					registry.dispatch( CORE_FORMS ).setValues();
				} ).toThrow( 'formName is required for setting values.' );
			} );

			it( 'requires the formData param', () => {
				expect( () => {
					registry.dispatch( CORE_FORMS ).setValues( 'form-name' );
				} ).toThrow( 'formData must be an object.' );
			} );

			it( 'requires the formData param to be an object not an array', () => {
				expect( () => {
					registry
						.dispatch( CORE_FORMS )
						.setValues( 'form-name', [] );
				} ).toThrow( 'formData must be an object.' );
			} );

			it( 'does not throw if formData is an object', () => {
				expect( () => {
					registry
						.dispatch( CORE_FORMS )
						.setValues( 'form-name', {} );
				} ).not.toThrow();
			} );

			it( 'requires the formData param to be an object not a string', () => {
				expect( () => {
					registry
						.dispatch( CORE_FORMS )
						.setValues( 'form-name', 'formData' );
				} ).toThrow( 'formData must be an object.' );
			} );

			it( 'does not overwrite unrelated keys', () => {
				registry.dispatch( CORE_FORMS ).setValues( 'form-name', {
					key1: 'value1',
					key2: 'value2',
				} );

				registry
					.dispatch( CORE_FORMS )
					.setValues( 'form-name', { key1: 'value3' } );

				const formValue = registry
					.select( CORE_FORMS )
					.getValue( 'form-name', 'key2' );
				expect( formValue ).toEqual( 'value2' );
			} );

			it( 'returns a newly-set value if a new value for an existing key is set', () => {
				registry.dispatch( CORE_FORMS ).setValues( 'form-name', {
					key1: 'value1',
					key2: 'value2',
				} );

				registry
					.dispatch( CORE_FORMS )
					.setValues( 'form-name', { key1: 'value3' } );

				const formValue = registry
					.select( CORE_FORMS )
					.getValue( 'form-name', 'key1' );
				expect( formValue ).toEqual( 'value3' );
			} );

			it( 'does not overwrite unrelated keys when an empty object is supplied to formData', () => {
				registry.dispatch( CORE_FORMS ).setValues( 'form-name', {
					key1: 'value1',
					key2: 'value2',
				} );

				registry.dispatch( CORE_FORMS ).setValues( 'form-name', {} );

				const formValue = registry
					.select( CORE_FORMS )
					.getValue( 'form-name', 'key2' );
				expect( formValue ).toEqual( 'value2' );
			} );

			it( 'works with empty formData where the key value is updated', () => {
				registry.dispatch( CORE_FORMS ).setValues( 'form-name', {} );

				registry.dispatch( CORE_FORMS ).setValues( 'form-name', {
					key1: 'value1',
					key2: 'value2',
				} );

				const formValue = registry
					.select( CORE_FORMS )
					.getValue( 'form-name', 'key2' );
				expect( formValue ).toEqual( 'value2' );
			} );

			it( 'preserves data from state when new data is assigned', () => {
				registry.dispatch( CORE_FORMS ).setValues( 'form-name', {
					key1: 'value1',
					key2: 'value2',
				} );

				registry.dispatch( CORE_FORMS ).setValues( 'new-form-name', {
					key3: 'value3',
					key4: 'value4',
				} );

				const formValue = registry
					.select( CORE_FORMS )
					.getValue( 'form-name', 'key2' );
				expect( formValue ).toEqual( 'value2' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getValue', () => {
			it( 'works with a formName that does not exist', () => {
				const formValue = registry
					.select( CORE_FORMS )
					.getValue( 'form-name', 'key2' );
				expect( formValue ).toEqual( undefined );
			} );

			it( 'works with formData where the key does not exist', () => {
				registry.dispatch( CORE_FORMS ).setValues( 'form-name', {
					key1: 'value1',
					key2: 'value2',
				} );

				const formValue = registry
					.select( CORE_FORMS )
					.getValue( 'form-name', 'key3' );
				expect( formValue ).toEqual( undefined );
			} );

			it( 'works with an existing formName and key', () => {
				registry.dispatch( CORE_FORMS ).setValues( 'form-name', {
					key1: 'value1',
					key2: 'value2',
				} );

				const formValue = registry
					.select( CORE_FORMS )
					.getValue( 'form-name', 'key2' );
				expect( formValue ).toEqual( 'value2' );
			} );
		} );
	} );
} );
