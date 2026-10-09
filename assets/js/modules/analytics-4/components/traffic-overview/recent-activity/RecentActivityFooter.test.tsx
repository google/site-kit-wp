/**
 * Recent activity footer tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import * as tracking from '@/js/util/tracking';
import {
	createTestRegistry,
	fireEvent,
	render,
	screen,
} from '@tests/js/test-utils';
import {
	provideSiteInfo,
	provideUserInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import RecentActivityFooter from './RecentActivityFooter';

describe( 'RecentActivityFooter', () => {
	let registry: WPDataRegistry;

	const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
	mockTrackEvent.mockImplementation( () => Promise.resolve() );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
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

	it( 'should render the text "Sources: Analytics Search Console"', async () => {
		const { container, waitForRegistry } = render(
			<RecentActivityFooter />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Sources: Analytics Search Console'
		);
	} );

	it( 'should link "Analytics" to the Analytics traffic acquisition report from two days before the reference date to the reference date', async () => {
		const { waitForRegistry } = render( <RecentActivityFooter />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		const analyticsReportURL = registry
			.select( MODULES_ANALYTICS_4 )
			.getServiceReportURL( 'lifecycle-traffic-acquisition-v2', {
				dates: { startDate: '2025-02-03', endDate: '2025-02-05' },
				otherArgs: {
					// The Analytics URL spells this parameter `collectionId`.
					// eslint-disable-next-line sitekit/acronym-case
					collectionId: 'life-cycle',
				},
			} );

		expect(
			screen
				.getByRole( 'link', { name: 'Analytics (opens in a new tab)' } )
				.getAttribute( 'href' )
		).toBe( analyticsReportURL );
	} );

	it( 'should link "Search Console" to the Search Console performance report from two days before the reference date to the reference date', async () => {
		const { waitForRegistry } = render( <RecentActivityFooter />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		const searchConsoleReportURL = registry
			.select( MODULES_SEARCH_CONSOLE )
			.getServiceReportURL( {
				start_date: '20250203',
				end_date: '20250205',
			} );

		expect(
			screen
				.getByRole( 'link', {
					name: 'Search Console (opens in a new tab)',
				} )
				.getAttribute( 'href' )
		).toBe( searchConsoleReportURL );
	} );

	it( 'should render nothing for a view-only user', () => {
		const { container } = render( <RecentActivityFooter />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not request the Analytics settings or the Search Console settings for a view-only user', async () => {
		const analyticsSettingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/settings'
		);
		const searchConsoleSettingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/search-console/data/settings'
		);

		// We create a registry with no settings in it, so that reading the
		// Analytics property ID or the Search Console property ID would request
		// the settings.
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		provideUserInfo( registry );
		provideSiteInfo( registry );

		fetchMock.get( analyticsSettingsEndpoint, { body: {}, status: 200 } );
		fetchMock.get( searchConsoleSettingsEndpoint, {
			body: {},
			status: 200,
		} );

		render( <RecentActivityFooter />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		await waitForDefaultTimeouts();

		expect( fetchMock ).not.toHaveFetched( analyticsSettingsEndpoint );
		expect( fetchMock ).not.toHaveFetched( searchConsoleSettingsEndpoint );
	} );

	it( 'should track a `click_source_link` event for the widget when the user clicks the "Analytics" link, and another when the user clicks the "Search Console" link', async () => {
		const { waitForRegistry } = render( <RecentActivityFooter />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			widget: { slug: 'analyticsTrafficOverview' },
		} );

		await waitForRegistry();

		fireEvent.click(
			screen.getByRole( 'link', {
				name: 'Analytics (opens in a new tab)',
			} )
		);

		expect( mockTrackEvent ).toHaveBeenLastCalledWith(
			'mainDashboard_widget',
			'click_source_link',
			'analyticsTrafficOverview'
		);
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

		fireEvent.click(
			screen.getByRole( 'link', {
				name: 'Search Console (opens in a new tab)',
			} )
		);

		expect( mockTrackEvent ).toHaveBeenLastCalledWith(
			'mainDashboard_widget',
			'click_source_link',
			'analyticsTrafficOverview'
		);
		expect( mockTrackEvent ).toHaveBeenCalledTimes( 2 );
	} );
} );
