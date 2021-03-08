/**
 * `useScreenContext` hook tests.
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
import { renderHook } from '../../../tests/js/test-utils';
import { useScreenContext } from './useScreenContext';

describe( 'useScreenContext', () => {
	it( 'should return `null` when there is no screen context set', () => {
		const { result } = renderHook(
			() => useScreenContext()
		);

		expect( result.current ).toBe( null );
	} );

	it( 'should return the current screen context set in the provider', () => {
		const { result } = renderHook(
			() => useScreenContext(),
			{ screenContext: 'test-screen' }
		);

		expect( result.current ).toEqual( 'test-screen' );
	} );
} );

