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
	VIEW_CONTEXT_ENTITY_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Provider as WidgetContextProvider } from '@/js/googlesitekit/widgets/components/WidgetContext';
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
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideUserInfo( registry );
		// The site shares the time zone of the machine that runs these tests,
		// so the date range starts one day before the reference date.
		provideSiteInfo( registry, {
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		} );
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

	it( 'should link "Analytics" to the Analytics traffic acquisition report for the day before the reference date and the reference date', async () => {
		const { waitForRegistry } = render( <RecentActivityFooter />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		const analyticsReportURL = registry
			.select( MODULES_ANALYTICS_4 )
			.getServiceReportURL( 'lifecycle-traffic-acquisition-v2', {
				dates: { startDate: '2025-02-04', endDate: '2025-02-05' },
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

	it( 'should link "Search Console" to the Search Console performance report for the day before the reference date and the reference date', async () => {
		const { waitForRegistry } = render( <RecentActivityFooter />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		const searchConsoleReportURL = registry
			.select( MODULES_SEARCH_CONSOLE )
			.getServiceReportURL( {
				start_date: '20250204',
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

	it( 'should link "Analytics" and "Search Console" to the reports of the whole site when the page has an entity URL set', async () => {
		provideSiteInfo( registry, {
			currentEntityURL: 'https://example.com/about/',
		} );

		const { waitForRegistry } = render( <RecentActivityFooter />, {
			registry,
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
		} );

		await waitForRegistry();

		const analyticsLink = screen.getByRole( 'link', {
			name: 'Analytics (opens in a new tab)',
		} );
		const searchConsoleLink = screen.getByRole( 'link', {
			name: 'Search Console (opens in a new tab)',
		} );

		// `getServiceReportURL()` encodes the report parameters, and
		// `getAccountChooserURL()` then encodes the report URL as the
		// `continue` parameter of the account chooser URL, so the report
		// parameters in each `href` are encoded twice.
		const analyticsHref = decodeURIComponent(
			decodeURIComponent( analyticsLink.getAttribute( 'href' ) as string )
		);
		const searchConsoleHref = decodeURIComponent(
			decodeURIComponent(
				searchConsoleLink.getAttribute( 'href' ) as string
			)
		);

		expect( analyticsHref ).toContain( '/p1234567890/reports/explorer' );
		expect( analyticsHref ).not.toContain( '/about/' );

		expect( searchConsoleHref ).toContain(
			'resource_id=https://example.com/'
		);
		expect( searchConsoleHref ).not.toContain( '/about/' );
	} );

	it( 'should render nothing for a view-only user', async () => {
		const { container, waitForRegistry } = render(
			<RecentActivityFooter />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

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
		const { waitForRegistry } = render(
			<WidgetContextProvider
				value={ { slug: 'analyticsTrafficOverview' } }
			>
				<RecentActivityFooter />
			</WidgetContextProvider>,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
		);

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
