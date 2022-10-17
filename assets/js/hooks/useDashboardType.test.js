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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
	VIEW_CONTEXT_SETTINGS,
} from '../googlesitekit/constants';
import useDashboardType, {
	DASHBOARD_TYPE_ENTITY,
	DASHBOARD_TYPE_MAIN,
} from './useDashboardType';

describe( 'useDashboardType', () => {
	it( 'should return null when the view context is not set', () => {
		const { result } = renderHook( () => useDashboardType() );

		expect( result.current ).toBeNull();
	} );

	it( 'should return DASHBOARD_TYPE_MAIN for VIEW_CONTEXT_MAIN_DASHBOARD view context', () => {
		const { result } = renderHook( () => useDashboardType(), {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( result.current ).toEqual( DASHBOARD_TYPE_MAIN );
	} );

	it( 'should return DASHBOARD_TYPE_MAIN for VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY view context', () => {
		const { result } = renderHook( () => useDashboardType(), {
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( result.current ).toEqual( DASHBOARD_TYPE_MAIN );
	} );

	it( 'should return DASHBOARD_TYPE_ENTITY for VIEW_CONTEXT_ENTITY_DASHBOARD view context', () => {
		const { result } = renderHook( () => useDashboardType(), {
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
		} );

		expect( result.current ).toEqual( DASHBOARD_TYPE_ENTITY );
	} );

	it( 'should return DASHBOARD_TYPE_ENTITY for VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY view context', () => {
		const { result } = renderHook( () => useDashboardType(), {
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
		} );

		expect( result.current ).toEqual( DASHBOARD_TYPE_ENTITY );
	} );

	it( 'should return null when view context is not a Unified Dashboard type (eg not VIEW_CONTEXT_MAIN_DASHBOARD or VIEW_CONTEXT_ENTITY_DASHBOARD)', () => {
		const { result } = renderHook( () => useDashboardType(), {
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		expect( result.current ).toBeNull();
	} );
} );
