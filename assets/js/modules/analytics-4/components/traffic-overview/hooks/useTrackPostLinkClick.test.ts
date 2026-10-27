/**
 * Traffic Overview `useTrackPostLinkClick` hook tests.
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
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import * as tracking from '@/js/util/tracking';
import { renderHook } from '@tests/js/test-utils';
import { useTrackPostLinkClick } from './useTrackPostLinkClick';

describe( 'useTrackPostLinkClick', () => {
	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should track `click_post_link` under `mainDashboard_recent-activity` labeled with the given section', () => {
		const { result } = renderHook(
			() => useTrackPostLinkClick( 'top-posts' ),
			{ viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		result.current();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_recent-activity',
			'click_post_link',
			'top-posts'
		);
	} );

	it( 'should track `click_post_link` under `mainDashboardViewOnly_recent-activity` for a view-only user', () => {
		const { result } = renderHook(
			() => useTrackPostLinkClick( 'latest-post-header' ),
			{ viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		result.current();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboardViewOnly_recent-activity',
			'click_post_link',
			'latest-post-header'
		);
	} );
} );
