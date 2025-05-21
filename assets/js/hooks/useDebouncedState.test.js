/**
 * `useDebouncedState` hook tests.
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
import { renderHook, actHook as act } from '../../../tests/js/test-utils';
import { useDebouncedState } from './useDebouncedState';

describe( 'useDebouncedState', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	it( 'should return initial value by default and should not change it after delay is expired', () => {
		const { result } = renderHook(
			( { value, delay } ) => useDebouncedState( value, delay ),
			{ initialProps: { value: 'initial-data', delay: 500 } }
		);

		expect( result.current ).toBe( 'initial-data' );
		act( () => jest.advanceTimersByTime( 510 ) );
		expect( result.current ).toBe( 'initial-data' );
	} );

	it( 'should correctly update value when delay is expired', () => {
		const { result, rerender } = renderHook(
			( { value, delay } ) => useDebouncedState( value, delay ),
			{ initialProps: { value: '', delay: 500 } }
		);

		rerender( { value: 'search query', delay: 500 } );

		act( () => jest.advanceTimersByTime( 498 ) );
		expect( result.current ).toBe( '' );
		act( () => jest.advanceTimersByTime( 3 ) );
		expect( result.current ).toBe( 'search query' );
	} );
} );
