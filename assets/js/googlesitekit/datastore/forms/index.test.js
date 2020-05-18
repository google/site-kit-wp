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
import {
	createTestRegistry,
	unsubscribeFromAll,
} from 'tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'core/forms store', () => {
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
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
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
					registry.dispatch( STORE_NAME ).setValues( formName );
				} ).toThrow( 'formData must be an object.' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getValue', () => {
			it( 'works with a formName not previously assigned', async () => {
				await registry.dispatch( STORE_NAME ).setValues( formName, { ...formData } );

				const { key2 } = formData;
				const form = registry.select( STORE_NAME ).getValue( formName, Object.keys( formData )[ 1 ] );
				expect( form ).toEqual( key2 );
			} );
			it( 'works with a formName previously assigned', async () => {
				await registry.dispatch( STORE_NAME ).setValues( formName, { ...formData } );

				await registry.dispatch( STORE_NAME ).setValues( newFormName, { ...newFormData } );

				const { key4 } = newFormData;
				const form = registry.select( STORE_NAME ).getValue( newFormName, Object.keys( newFormData )[ 1 ] );
				expect( form ).toEqual( key4 );
			} );
			it( 'preserves data from state when new data is assigned', async () => {
				await registry.dispatch( STORE_NAME ).setValues( formName, { ...formData } );

				await registry.dispatch( STORE_NAME ).setValues( newFormName, { ...newFormData } );

				const { key2 } = formData;
				const form = registry.select( STORE_NAME ).getValue( formName, Object.keys( formData )[ 1 ] );
				expect( form ).toEqual( key2 );
			} );
		} );
	} );
} );
