/**
 * SearchFunnelWidgetGA4 component tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';
import { mocked } from 'jest-mock';
import { useIntersection as mockUseIntersection } from 'react-use';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import coreModulesFixture from '@/js/googlesitekit/modules/datastore/__fixtures__';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { getWidgetComponentProps } from '@/js/googlesitekit/widgets/util';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	muteFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	provideUserInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import { getViewportWidth, setViewportWidth } from '@tests/js/viewport-utils';
import {
	getGA4KeyEventsOverviewReportOptions,
	getGA4KeyEventsReportOptions,
	getGA4VisitorsReportOptions,
	getSearchConsoleReportOptions,
} from './reportOptions';
import SearchFunnelWidgetGA4 from '.';

jest.mock( 'react-use', () => ( {
	...( jest.requireActual( 'react-use' ) as Record< string, unknown > ),
	useIntersection: jest.fn(),
} ) );

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'SearchFunnelWidgetGA4', () => {
	mockLocation();
	let registry: WPDataRegistry;
	let originalViewport: number;

	const widgetComponentProps = getWidgetComponentProps( 'searchFunnel' );

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideSiteInfo( registry );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetSettings( {
			propertyID: 'http://example.com/',
		} );
		registry.dispatch( CORE_USER ).setReferenceDate( '2021-01-28' );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		fetchMock.getOnce(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
			),
			{
				body: [
					{
						clicks: 123,
						ctr: 4.56,
						impressions: 7890,
						keys: [ '2022-06-21' ],
						position: 12.345,
					},
				],
			}
		);

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ 'analytics-setup-cta-search-funnel' ],
			status: 200,
		} );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/data-available'
			)
		);

		originalViewport = getViewportWidth();
		setViewportWidth( 450 );
	} );

	afterEach( () => {
		setViewportWidth( originalViewport );
		jest.resetAllMocks();
	} );

	it( 'should render the Search Funnel Widget, including the Activate Analytics CTA', async () => {
		const { container, getByText, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect( getByText( /Set up Google Analytics/ ) ).toBeInTheDocument();
	} );

	it( 'should not render the Activate Analytics CTA when the Analytics module is not available', async () => {
		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules(
				( coreModulesFixture as { slug: string }[] ).filter(
					( { slug } ) => slug !== MODULE_SLUG_ANALYTICS_4
				)
			);

		const { container, queryByText, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{ registry }
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			queryByText( /Set up Google Analytics/ )
		).not.toBeInTheDocument();
	} );

	it( 'should track the `view_cta` event when the Activate Analytics CTA is viewed', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );

		const { rerender } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		mocked( mockUseIntersection ).mockImplementation(
			() =>
				( {
					isIntersecting: true,
					intersectionRatio: 1,
				} as unknown as IntersectionObserverEntry )
		);

		rerender( <SearchFunnelWidgetGA4 { ...widgetComponentProps } /> );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'view_cta',
				'search_funnel'
			);
		} );
	} );

	it( 'should track the `dismiss_cta` event when the "Maybe later" button is clicked in the Activate Analytics CTA', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ 'analytics-setup-cta-search-funnel' ],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click( getByRole( 'button', { name: 'Maybe later' } ) );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'dismiss_cta',
				'search_funnel'
			);
		} );
	} );

	it( 'should track the `confirm_cta` event when the "Set up Analytics" button is clicked in the Activate Analytics CTA', async () => {
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: false,
			},
		] );
		provideModuleRegistrations( registry );

		fetchMock.postOnce( dismissItemEndpoint, {
			body: [ 'analytics-setup-cta-search-funnel' ],
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click( getByRole( 'button', { name: 'Complete setup' } ) );

		await waitFor( () => {
			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
				'confirm_cta',
				'search_funnel'
			);
		} );
	} );

	it( 'should track the `click_learn_more_link` event when the "Learn more" link is clicked in the Activate Analytics CTA', async () => {
		const { getByRole, waitForRegistry } = render(
			<SearchFunnelWidgetGA4 { ...widgetComponentProps } />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click( getByRole( 'link', { name: /Learn more/i } ) );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_activate-analytics-cta`,
			'click_learn_more_link',
			'search_funnel'
		);
	} );

	// Regression coverage for the reportOptions.ts extraction: the builders must
	// keep producing the exact report args the dashboard relied on when they were
	// inlined, so the dashboard and PDF report cannot drift.
	describe( 'report options', () => {
		const dates = {
			startDate: '2025-01-08',
			endDate: '2025-02-04',
			compareStartDate: '2024-12-11',
			compareEndDate: '2025-01-07',
		};

		it( 'should build the Search Console date-series args used by the dashboard', () => {
			expect(
				getSearchConsoleReportOptions( {
					compareStartDate: dates.compareStartDate,
					endDate: dates.endDate,
				} )
			).toEqual( {
				startDate: dates.compareStartDate,
				endDate: dates.endDate,
				dimensions: 'date',
			} );
		} );

		it( 'should append the entity URL to the Search Console args when provided', () => {
			expect(
				getSearchConsoleReportOptions( {
					compareStartDate: dates.compareStartDate,
					endDate: dates.endDate,
					url: 'https://example.com/post-1',
				} )
			).toMatchObject( { url: 'https://example.com/post-1' } );
		} );

		it( 'should build the GA4 Key Events overview args used by the dashboard', () => {
			expect( getGA4KeyEventsOverviewReportOptions( dates ) ).toEqual( {
				...dates,
				metrics: [ { name: 'keyEvents' }, { name: 'engagementRate' } ],
				dimensionFilters: {
					sessionDefaultChannelGrouping: [ 'Organic Search' ],
				},
				reportID:
					'search-console_search-funnel-widget-ga4_widget_ga4OverviewArgs',
			} );
		} );

		it( 'should build the GA4 Key Events date-series args inheriting the overview metrics and filters', () => {
			expect( getGA4KeyEventsReportOptions( dates ) ).toEqual( {
				...dates,
				metrics: [ { name: 'keyEvents' }, { name: 'engagementRate' } ],
				dimensionFilters: {
					sessionDefaultChannelGrouping: [ 'Organic Search' ],
				},
				dimensions: [ { name: 'date' } ],
				orderby: [ { dimension: { dimensionName: 'date' } } ],
				reportID:
					'search-console_search-funnel-widget-ga4_widget_ga4StatsArgs',
			} );
		} );

		it( 'should build the GA4 Unique Visitors overview + date-series args used by the dashboard', () => {
			expect( getGA4VisitorsReportOptions( dates ) ).toEqual( {
				...dates,
				metrics: [ { name: 'totalUsers' } ],
				dimensions: [ { name: 'date' } ],
				dimensionFilters: {
					sessionDefaultChannelGrouping: [ 'Organic Search' ],
				},
				orderby: [ { dimension: { dimensionName: 'date' } } ],
				reportID:
					'search-console_search-funnel-widget-ga4_widget_ga4VisitorsOverviewAndStatsArgs',
			} );
		} );
	} );
} );
