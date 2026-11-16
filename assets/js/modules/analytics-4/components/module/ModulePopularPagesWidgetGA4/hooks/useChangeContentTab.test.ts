/**
 * ModulePopularPagesWidgetGA4 `useChangeContentTab` hook tests.
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
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import * as tracking from '@/js/util/tracking';
import {
	actHook as act,
	createTestRegistry,
	renderHook,
} from '@tests/js/test-utils';
import { useChangeContentTab } from './useChangeContentTab';

describe( 'useChangeContentTab', () => {
	let registry: WPDataRegistry;

	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	beforeEach( () => {
		mockTrackEvent.mockClear();

		registry = createTestRegistry();
	} );

	it( 'should track `change_tab` under `mainDashboard_content-tabs` labeled with the tab ID, and set it as the active content tab', () => {
		const { result } = renderHook( () => useChangeContentTab(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		act( () => {
			result.current( 'googlesitekit-latest-content-tab' );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_content-tabs',
			'change_tab',
			'googlesitekit-latest-content-tab'
		);
		expect(
			registry.select( MODULES_ANALYTICS_4 ).getActiveContentTab()
		).toBe( 'googlesitekit-latest-content-tab' );
	} );

	it( 'should track nothing, and keep the active content tab, when the tab is already active', () => {
		const { result } = renderHook( () => useChangeContentTab(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		act( () => {
			result.current( 'googlesitekit-top-content-tab' );
		} );

		expect( mockTrackEvent ).not.toHaveBeenCalled();
		expect(
			registry.select( MODULES_ANALYTICS_4 ).getActiveContentTab()
		).toBe( 'googlesitekit-top-content-tab' );
	} );

	it( 'should track `change_tab` under `mainDashboardViewOnly_content-tabs` for a view-only user', () => {
		const { result } = renderHook( () => useChangeContentTab(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		act( () => {
			result.current( 'googlesitekit-latest-content-tab' );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboardViewOnly_content-tabs',
			'change_tab',
			'googlesitekit-latest-content-tab'
		);
	} );
} );
