/**
 * `useViewContext` hook tests.
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
import { renderHook } from '../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '../googlesitekit/constants';
import useViewContext from './useViewContext';

describe( 'useViewContext', () => {
	it( 'should not error if no provider is found', () => {
		expect( () => {
			renderHook( () => useViewContext(), {} );
		} ).not.toThrow();

		const { result } = renderHook( () => useViewContext(), {} );

		expect( result.current ).toBe( null );
	} );

	it( 'should return the view context set in the nearest provider', () => {
		const { result } = renderHook( () => useViewContext(), {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( result.current ).toBe( VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY );

		// Return a different view context than above to ensure different
		// contexts are returned properly.
		const { result: dashboardResult } = renderHook(
			() => useViewContext(),
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( dashboardResult.current ).toBe( VIEW_CONTEXT_MAIN_DASHBOARD );
	} );
} );
