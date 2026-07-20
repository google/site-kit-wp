/**
 * `useUIValue` hook tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { actHook, createTestRegistry, renderHook } from '@tests/js/test-utils';
import useUIValue from './useUIValue';

describe( 'useUIValue', () => {
	let registry: WPDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'returns the value for the given key', () => {
		const key = 'testKey';
		const value = 'testValue';

		registry.dispatch( CORE_UI ).setValue( key, value );

		const { result } = renderHook( () => useUIValue( key ), {
			registry,
		} );

		expect( result.current[ 0 ] ).toBe( value );
	} );

	it( "returns undefined if the key doesn't exist", () => {
		const { result } = renderHook( () => useUIValue( 'missingKey' ), {
			registry,
		} );

		expect( result.current[ 0 ] ).toBeUndefined();
	} );

	it( 'stores the new value when setValue is called', () => {
		const key = 'testKey';
		const { result } = renderHook( () => useUIValue( key ), {
			registry,
		} );

		expect( result.current[ 0 ] ).toBeUndefined();

		actHook( () => {
			result.current[ 1 ]( 'nextValue' );
		} );

		expect( registry.select( CORE_UI ).getValue( key ) ).toBe(
			'nextValue'
		);
		expect( result.current[ 0 ] ).toBe( 'nextValue' );
	} );
} );
