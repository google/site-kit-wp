/**
 * `useRefocus` hook tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { useRefocus } from './useRefocus';

describe( 'useRefocus', () => {
	beforeEach( () => {
		jest.useFakeTimers();
	} );

	it( 'should invoke the reset handler when the window is blurred and then refocused after the specified delay', () => {
		const resetSpy = jest.fn();

		renderHook( () => useRefocus( resetSpy, 1000 ) );

		act( () => {
			global.window.dispatchEvent( new Event( 'blur' ) );
		} );
		act( () => jest.advanceTimersByTime( 1000 ) );

		expect( resetSpy ).toHaveBeenCalledTimes( 0 );

		act( () => {
			global.window.dispatchEvent( new Event( 'focus' ) );
		} );

		expect( resetSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should invoke the reset handler when the window is blurred and then refocused when no delay is specified', () => {
		const resetSpy = jest.fn();

		renderHook( () => useRefocus( resetSpy ) );

		act( () => {
			global.window.dispatchEvent( new Event( 'blur' ) );
		} );

		// The default delay is 0 milliseconds
		act( () => jest.advanceTimersByTime( 0 ) );

		expect( resetSpy ).toHaveBeenCalledTimes( 0 );

		act( () => {
			global.window.dispatchEvent( new Event( 'focus' ) );
		} );

		expect( resetSpy ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not invoke the reset handler when the window is blurred and then refocused before the specified delay', () => {
		const resetSpy = jest.fn();

		renderHook( () => useRefocus( resetSpy, 1000 ) );

		act( () => {
			global.window.dispatchEvent( new Event( 'blur' ) );
		} );
		act( () => jest.advanceTimersByTime( 999 ) );

		expect( resetSpy ).toHaveBeenCalledTimes( 0 );

		act( () => {
			global.window.dispatchEvent( new Event( 'focus' ) );
		} );

		expect( resetSpy ).toHaveBeenCalledTimes( 0 );
	} );

	it( 'should continue to invoke the reset handler as the window is blurred and then refocused repeatedly', () => {
		const resetSpy = jest.fn();

		renderHook( () => useRefocus( resetSpy, 1000 ) );

		const refocusCount = 5;

		for ( let i = 0; i < refocusCount; i++ ) {
			act( () => {
				global.window.dispatchEvent( new Event( 'blur' ) );
			} );
			act( () => jest.advanceTimersByTime( 1000 ) );
			act( () => {
				global.window.dispatchEvent( new Event( 'focus' ) );
			} );

			expect( resetSpy ).toHaveBeenCalledTimes( i + 1 );
		}

		expect( resetSpy ).toHaveBeenCalledTimes( refocusCount );
	} );
} );
