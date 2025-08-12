/**
 * `useFormValue` hook tests.
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
import { CORE_FORMS } from '../googlesitekit/datastore/forms/constants';
import { createTestRegistry, renderHook } from '../../../tests/js/test-utils';
import useFormValue from './useFormValue';

describe( 'useFormValue', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should return the value for the given key in the form', () => {
		const formName = 'testForm';
		const key = 'testKey';
		const value = 'testValue';

		registry
			.dispatch( CORE_FORMS )
			.setValues( formName, { [ key ]: value } );

		const { result } = renderHook( () => useFormValue( formName, key ), {
			registry,
		} );

		expect( result.current ).toBe( value );
	} );

	it( 'should return undefined if the key does not exist in the form', () => {
		const formName = 'testForm';
		const key = 'nonExistentKey';

		registry.dispatch( CORE_FORMS ).setValues( formName, {} );

		const { result } = renderHook( () => useFormValue( formName, key ), {
			registry,
		} );

		expect( result.current ).toBeUndefined();
	} );

	it( 'should return undefined if the form does not exist', () => {
		const formName = 'nonExistentForm';
		const key = 'testKey';
		const { result } = renderHook( () => useFormValue( formName, key ), {
			registry,
		} );

		expect( result.current ).toBeUndefined();
	} );

	it( 'should return undefined if the form is not provided', () => {
		const key = 'testKey';
		const { result } = renderHook( () => useFormValue( undefined, key ), {
			registry,
		} );

		expect( result.current ).toBeUndefined();
	} );

	it( 'should return undefined if the key is not provided', () => {
		const formName = 'testForm';
		const { result } = renderHook(
			() => useFormValue( formName, undefined ),
			{
				registry,
			}
		);

		expect( result.current ).toBeUndefined();
	} );

	it( 'should return undefined if both formName and key are not provided', () => {
		const { result } = renderHook( () => useFormValue(), { registry } );

		expect( result.current ).toBeUndefined();
	} );
} );
