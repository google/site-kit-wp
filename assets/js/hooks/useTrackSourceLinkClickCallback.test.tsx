/**
 * `useTrackSourceLinkClickCallback` hook tests.
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import * as tracking from '@/js/util/tracking';
import { renderHook } from '@tests/js/test-utils';
import useTrackSourceLinkClickCallback from './useTrackSourceLinkClickCallback';

describe( 'useTrackSourceLinkClickCallback', () => {
	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	it( 'should track a `click_source_link` event for the widget the link renders in', () => {
		const { result } = renderHook(
			() => useTrackSourceLinkClickCallback(),
			{
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				widget: { slug: 'analyticsTrafficOverview' },
			}
		);

		result.current();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_widget',
			'click_source_link',
			'analyticsTrafficOverview'
		);
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not track an event when the link renders outside a widget', () => {
		const { result } = renderHook(
			() => useTrackSourceLinkClickCallback(),
			{ viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		result.current();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );

	it( 'should not track an event when the link renders with no view context', () => {
		const { result } = renderHook(
			() => useTrackSourceLinkClickCallback(),
			{ widget: { slug: 'analyticsTrafficOverview' } }
		);

		result.current();

		expect( mockTrackEvent ).not.toHaveBeenCalled();
	} );
} );
