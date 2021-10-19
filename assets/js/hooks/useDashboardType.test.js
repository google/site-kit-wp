/**
 * `useDashboardType` hook tests.
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
import useDashboardType, {
	DASHBOARD_TYPE_ENTITY,
	DASHBOARD_TYPE_MAIN,
} from './useDashboardType';

describe( 'useDashboardType', () => {
	it( 'should return null when the view context is not set', () => {
		const { result } = renderHook( () => useDashboardType() );

		expect( result.current ).toBeNull();
	} );

	it( 'should return DASHBOARD_TYPE_MAIN for DASHBOARD_TYPE_MAIN view context', () => {
		const { result } = renderHook( () => useDashboardType(), {
			viewContext: DASHBOARD_TYPE_MAIN,
		} );

		expect( result.current ).toEqual( DASHBOARD_TYPE_MAIN );
	} );

	it( 'should return DASHBOARD_TYPE_ENTITY for DASHBOARD_TYPE_ENTITY view context', () => {
		const { result } = renderHook( () => useDashboardType(), {
			viewContext: DASHBOARD_TYPE_ENTITY,
		} );

		expect( result.current ).toEqual( DASHBOARD_TYPE_ENTITY );
	} );

	it( 'should return null when view context is neither.', () => {
		const { result } = renderHook( () => useDashboardType(), {
			viewContext: 'notDashboard',
		} );

		expect( result.current ).toBeNull();
	} );
} );
