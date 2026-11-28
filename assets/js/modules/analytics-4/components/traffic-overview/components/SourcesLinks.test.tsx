/**
 * Traffic Overview sources links tests.
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
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { decodeServiceURL } from '@tests/js/mock-accountChooserURL-utils';
import {
	createTestRegistry,
	fireEvent,
	render,
	screen,
} from '@tests/js/test-utils';
import { provideSiteInfo, provideUserInfo } from '@tests/js/utils';
import SourcesLinks from './SourcesLinks';

describe( 'SourcesLinks', () => {
	let registry: WPDataRegistry;

	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	beforeEach( () => {
		registry = createTestRegistry();
		provideUserInfo( registry );
		provideSiteInfo( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '1234567890' );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.setPropertyID( 'https://example.com/' );
	} );

	afterEach( () => {
		mockTrackEvent.mockClear();
	} );

	function getAnalyticsReportURL() {
		return decodeServiceURL(
			screen
				.getByRole( 'link', { name: 'Analytics (opens in a new tab)' } )
				.getAttribute( 'href' ) as string
		);
	}

	it( 'should render "Sources: Analytics Search Console", with each source linking to its report for the given dates', async () => {
		const { container, waitForRegistry } = render(
			<SourcesLinks startDate="2025-01-09" endDate="2025-02-05" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Sources: Analytics Search Console'
		);

		const analyticsReportURL = getAnalyticsReportURL();

		expect( analyticsReportURL ).toContain(
			'r=lifecycle-traffic-acquisition-v2'
		);
		expect( analyticsReportURL ).toContain( '_u.date00=20250109' );
		expect( analyticsReportURL ).toContain( '_u.date01=20250205' );
		expect( analyticsReportURL ).not.toContain( '_u.date10' );

		expect(
			screen
				.getByRole( 'link', {
					name: 'Search Console (opens in a new tab)',
				} )
				.getAttribute( 'href' )
		).toBe(
			registry.select( MODULES_SEARCH_CONSOLE ).getServiceReportURL( {
				start_date: '20250109',
				end_date: '20250205',
			} )
		);
	} );

	it( 'should compare the Analytics report with the given range before the dates', async () => {
		const { waitForRegistry } = render(
			<SourcesLinks
				startDate="2025-01-09"
				endDate="2025-02-05"
				compareStartDate="2024-12-12"
				compareEndDate="2025-01-08"
			/>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		await waitForRegistry();

		const analyticsReportURL = getAnalyticsReportURL();

		expect( analyticsReportURL ).toContain( '_u.date10=20241212' );
		expect( analyticsReportURL ).toContain( '_u.date11=20250108' );
	} );

	it( 'should track a `click_source_link` event for the widget when the user clicks either link', async () => {
		const { waitForRegistry } = render(
			<SourcesLinks startDate="2025-01-09" endDate="2025-02-05" />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				widget: { slug: 'analyticsTrafficOverview' },
			}
		);

		await waitForRegistry();

		fireEvent.click(
			screen.getByRole( 'link', {
				name: 'Analytics (opens in a new tab)',
			} )
		);
		fireEvent.click(
			screen.getByRole( 'link', {
				name: 'Search Console (opens in a new tab)',
			} )
		);

		expect( mockTrackEvent.mock.calls ).toEqual( [
			[
				'mainDashboard_widget',
				'click_source_link',
				'analyticsTrafficOverview',
			],
			[
				'mainDashboard_widget',
				'click_source_link',
				'analyticsTrafficOverview',
			],
		] );
	} );

	it( 'should render nothing for a view-only user', () => {
		const { container } = render(
			<SourcesLinks startDate="2025-01-09" endDate="2025-02-05" />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
