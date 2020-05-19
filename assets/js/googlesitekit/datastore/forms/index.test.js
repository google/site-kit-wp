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
				const formName = 'Form 1';

				expect( () => {
					registry.dispatch( STORE_NAME ).setValues( formName );
				} ).toThrow( 'formData must be an object.' );
			} );

			it( 'requires the formData param to be an object not an array', () => {
				const formName = 'Form 1';

				expect( () => {
					registry.dispatch( STORE_NAME ).setValues( formName, [] );
				} ).toThrow( 'formData must be an object.' );
			} );

			it( 'requires the formData param to be an object not a string', () => {
				const formName = 'Form 1';

				expect( () => {
					registry.dispatch( STORE_NAME ).setValues( formName, 'formData' );
				} ).toThrow( 'formData must be an object.' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getValue', () => {
			it( 'works with a formName that does not exist', () => {
				const formName = 'Form 1';
				const formData = {
					key1: 'value1',
					key2: 'value2',
				};
				const newFormName = 'Form 2';

				registry.dispatch( STORE_NAME ).setValues( formName, { ...formData } );

				const form = registry.select( STORE_NAME ).getValue( newFormName, 'key2' );
				expect( form ).toEqual( undefined );
			} );

			it( 'works with formData where the key does not exist', () => {
				const formName = 'Form 1';
				const formData = {
					key1: 'value1',
					key2: 'value2',
				};

				registry.dispatch( STORE_NAME ).setValues( formName, { ...formData } );

				const form = registry.select( STORE_NAME ).getValue( formName, 'key3' );
				expect( form ).toEqual( undefined );
			} );

			it( 'works with an existing formName', () => {
				const formName = 'Form 1';
				const formData = {
					key1: 'value1',
					key2: 'value2',
				};

				registry.dispatch( STORE_NAME ).setValues( formName, { ...formData } );

				const { key2 } = formData;
				const form = registry.select( STORE_NAME ).getValue( formName, 'key2' );
				expect( form ).toEqual( key2 );
			} );

			it( 'preserves data from state when new data is assigned', () => {
				const formName = 'Form 1';
				const formData = {
					key1: 'value1',
					key2: 'value2',
				};
				const newFormName = 'Form 2';
				const newFormData = {
					key3: 'value3',
					key4: 'value4',
				};

				registry.dispatch( STORE_NAME ).setValues( formName, { ...formData } );

				registry.dispatch( STORE_NAME ).setValues( newFormName, { ...newFormData } );

				const { key2 } = formData;
				const form = registry.select( STORE_NAME ).getValue( formName, 'key2' );
				expect( form ).toEqual( key2 );
			} );
		} );
	} );
} );
