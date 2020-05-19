/**
 * core/forms data store tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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

describe( 'core/forms store', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setValues', () => {
			it( 'requires the formName param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValues();
				} ).toThrow( 'formName is required for setting values.' );
			} );

			it( 'requires the formData param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValues( 'form-name' );
				} ).toThrow( 'formData must be an object.' );
			} );

			it( 'requires the formData param to be an object not an array', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValues( 'form-name', [] );
				} ).toThrow( 'formData must be an object.' );
			} );

			it( 'requires the formData param to be an object not a string', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).setValues( 'form-name', 'formData' );
				} ).toThrow( 'formData must be an object.' );
			} );

			it( 'works with formData where the key value is updated, and the untouched key and updated key return expected values', () => {
				const formData = { key1: 'value1', key2: 'value2' };
				const newFormData = { key1: 'value3' };

				registry.dispatch( STORE_NAME ).setValues( 'form-name', formData );

				registry.dispatch( STORE_NAME ).setValues( 'form-name', newFormData );

				const formOriginalValue = registry.select( STORE_NAME ).getValue( 'form-name', 'key2' );
				expect( formOriginalValue ).toEqual( 'value2' );

				const formUpdatedValue = registry.select( STORE_NAME ).getValue( 'form-name', 'key1' );
				expect( formUpdatedValue ).toEqual( 'value3' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getValue', () => {
			it( 'works with a formName that does not exist', () => {
				const formData = { key1: 'value1', key2: 'value2' };

				registry.dispatch( STORE_NAME ).setValues( 'form-name', formData );

				const formValue = registry.select( STORE_NAME ).getValue( 'new-form-name', 'key2' );
				expect( formValue ).toEqual( undefined );
			} );

			it( 'works with formData where the key does not exist', () => {
				const formData = { key1: 'value1', key2: 'value2' };

				registry.dispatch( STORE_NAME ).setValues( 'form-name', formData );

				const formValue = registry.select( STORE_NAME ).getValue( 'form-name', 'key3' );
				expect( formValue ).toEqual( undefined );
			} );

			it( 'works with an existing formName', () => {
				const formData = { key1: 'value1', key2: 'value2' };

				registry.dispatch( STORE_NAME ).setValues( 'form-name', formData );

				const formValue = registry.select( STORE_NAME ).getValue( 'form-name', 'key2' );
				expect( formValue ).toEqual( 'value2' );
			} );

			it( 'preserves data from state when new data is assigned', () => {
				const formData = { key1: 'value1', key2: 'value2' };
				const newFormData = { key3: 'value3', key4: 'value4' };

				registry.dispatch( STORE_NAME ).setValues( 'form-name', formData );

				registry.dispatch( STORE_NAME ).setValues( 'new-form-name', newFormData );

				const formValue = registry.select( STORE_NAME ).getValue( 'form-name', 'key2' );
				expect( formValue ).toEqual( 'value2' );
			} );
		} );
	} );
} );
