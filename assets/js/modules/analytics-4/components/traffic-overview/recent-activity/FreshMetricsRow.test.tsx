/**
 * Recent activity fresh metrics row tests.
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
import { get } from 'googlesitekit-api';
import { VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY } from '@/js/googlesitekit/constants';
import { PERMISSION_READ_SHARED_MODULE_DATA } from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { provideFreshMetricsReports } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import {
	createTestRegistry,
	fireEvent,
	render,
	screen,
} from '@tests/js/test-utils';
import {
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import FreshMetricsRow from './FreshMetricsRow';

// Spy on `get()`, because `cacheTTL` never reaches the network request.
jest.mock( 'googlesitekit-api', () =>
	jest.requireActual( '@tests/js/mock-api-utils' ).mockAPIModuleWithGetSpy()
);

describe( 'FreshMetricsRow', () => {
	let registry: WPDataRegistry;
	let dateNowSpy: jest.SpyInstance;

	const analyticsReportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const searchConsoleReportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
	);

	beforeEach( () => {
		// The clock starts at 08:14 UTC on October 13, so the last 24 hours
		// start at 09:00 UTC on October 12, which is 02:00 in Pacific Time,
		// in every run. It keeps running from there, because the registry
		// waits for time to pass.
		const realDateNow = Date.now;
		const offset = Date.parse( '2026-10-13T08:14:00Z' ) - realDateNow();
		dateNowSpy = jest
			.spyOn( Date, 'now' )
			.mockImplementation( () => realDateNow() + offset );

		jest.mocked( get ).mockClear();

		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		// A report error reads the module names and the module settings.
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
	} );

	afterEach( () => {
		dateNowSpy.mockRestore();
	} );

	it( 'should render "Total visitors", "Search clicks", and "Search impressions" for the last 24 hours', async () => {
		// The helper puts in the Total visitors report for the hours of the
		// `Asia/Tokyo` time zone, the time zone its other report gives.
		provideFreshMetricsReports( registry, {
			totalVisitors: 157,
			searchPerformance: { clicks: 72, impressions: 8000 },
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Site traffic since yesterday157Total visitors'
		);
		expect( container ).toHaveTextContent(
			'Search performance72Search clicks8KSearch impressions'
		);
	} );

	it( 'should count only the Search Console hours in the last 24 hours', async () => {
		provideFreshMetricsReports( registry, { totalVisitors: 157 } );
		// The first row is the hour before the last 24 hours.
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport(
			[
				{
					keys: [ '2026-10-12T01:00:00-07:00' ],
					clicks: 40,
					impressions: 900,
				},
				{
					keys: [ '2026-10-12T02:00:00-07:00' ],
					clicks: 2,
					impressions: 56,
				},
			],
			{
				options: {
					startDate: '2026-10-12',
					endDate: '2026-10-13',
					dimensions: 'hour',
					reportID:
						'search-console_fresh-metrics-row_widget_searchPerformanceArgs',
				},
			}
		);

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Search performance2Search clicks56Search impressions'
		);
	} );

	it( 'should render a notice in place of each group of figures when the last 24 hours have no data', async () => {
		provideFreshMetricsReports( registry, { totalVisitors: 0 } );
		registry.dispatch( MODULES_SEARCH_CONSOLE ).receiveGetReport( [], {
			options: {
				startDate: '2026-10-12',
				endDate: '2026-10-13',
				dimensions: 'hour',
				reportID:
					'search-console_fresh-metrics-row_widget_searchPerformanceArgs',
			},
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'No recent visitor data yetAnalytics hasn’t reported any visits in the last 24 hours. Data may still be on its way.'
		);
		expect(
			screen.queryByText( 'Site traffic since yesterday' )
		).not.toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'Search performanceNo recent Search data yetSearch Console hasn’t reported clicks or impressions in the last 24 hours.'
		);
		expect( screen.queryByText( 'Search clicks' ) ).not.toBeInTheDocument();
	} );

	it( 'should render zero visitors instead of the notice while Analytics is gathering data', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );
		provideFreshMetricsReports( registry, {
			totalVisitors: 0,
			searchPerformance: { clicks: 72, impressions: 8000 },
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Site traffic since yesterday0Total visitors'
		);
		expect(
			screen.queryByText( 'No recent visitor data yet' )
		).not.toBeInTheDocument();
	} );

	it( 'should render the search figures when the last 24 hours have impressions but no clicks', async () => {
		provideFreshMetricsReports( registry, {
			totalVisitors: 157,
			searchPerformance: { clicks: 0, impressions: 30 },
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Search performance0Search clicks30Search impressions'
		);
	} );

	it( 'should render a loading placeholder for each figure when the reports load', () => {
		freezeFetch( analyticsReportEndpoint );
		freezeFetch( searchConsoleReportEndpoint );

		const { container } = render( <FreshMetricsRow />, { registry } );

		expect(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__fresh-metric .googlesitekit-preview-block'
			)
		).toHaveLength( 3 );
	} );

	it( 'should not request the reports when the row is out of view', async () => {
		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
			inView: false,
		} );

		await waitForRegistry();
		await waitForDefaultTimeouts();

		expect(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__fresh-metric .googlesitekit-preview-block'
			)
		).toHaveLength( 3 );
		expect( fetchMock ).not.toHaveFetched( analyticsReportEndpoint );
		expect( fetchMock ).not.toHaveFetched( searchConsoleReportEndpoint );
	} );

	it( 'should request the Total visitors report and the Search Console report with a five-minute cache', async () => {
		// Only the time zone report is put in, so both other reports are
		// requested.
		provideFreshMetricsReports( registry, {} );
		fetchMock.getOnce( analyticsReportEndpoint, {
			body: { rows: [ { metricValues: [ { value: '157' } ] } ] },
			status: 200,
		} );
		fetchMock.getOnce( searchConsoleReportEndpoint, {
			body: [],
			status: 200,
		} );

		const { waitForRegistry } = render( <FreshMetricsRow />, { registry } );

		await waitForRegistry();

		expect(
			jest
				.mocked( get )
				.mock.calls.filter( ( [ , , datapoint ] ) =>
					[ 'report', 'searchanalytics' ].includes( datapoint )
				)
				.map( ( [ , identifier, , , options ] ) => [
					identifier,
					options,
				] )
		).toEqual( [
			[ 'analytics-4', { cacheTTL: 300 } ],
			[ 'search-console', { cacheTTL: 300 } ],
		] );
	} );

	it( 'should render a report error for the search figures when the Search Console report fails, and keep "Total visitors"', async () => {
		provideFreshMetricsReports( registry, { totalVisitors: 157 } );
		fetchMock.getOnce( searchConsoleReportEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect(
			screen.getByText( 'Data error in Search Console' )
		).toBeInTheDocument();
		expect( screen.queryByText( 'Search clicks' ) ).not.toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'Site traffic since yesterday157Total visitors'
		);
	} );

	it( 'should request the Search Console report again when "Retry" is clicked', async () => {
		provideFreshMetricsReports( registry, { totalVisitors: 157 } );
		fetchMock.getOnce( searchConsoleReportEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { waitForRegistry } = render( <FreshMetricsRow />, { registry } );

		await waitForRegistry();

		expect( console ).toHaveErrored();

		fetchMock.getOnce( searchConsoleReportEndpoint, {
			body: [
				{
					keys: [ '2026-10-12T02:00:00-07:00' ],
					clicks: 2,
					impressions: 56,
				},
			],
			status: 200,
		} );

		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect(
			await screen.findByText( 'Search clicks' )
		).toBeInTheDocument();
		expect( fetchMock ).toHaveFetchedTimes(
			2,
			searchConsoleReportEndpoint
		);
	} );

	it( 'should render a report error for "Total visitors" when its report fails, and keep the search figures', async () => {
		provideFreshMetricsReports( registry, {
			searchPerformance: { clicks: 72, impressions: 8000 },
		} );
		fetchMock.getOnce( analyticsReportEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect(
			screen.getByText( 'Data error in Analytics' )
		).toBeInTheDocument();
		expect(
			screen.queryByText( 'Total visitors' )
		).not.toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'Search performance72Search clicks8KSearch impressions'
		);
	} );

	it( 'should request the Total visitors report again when "Retry" is clicked', async () => {
		provideFreshMetricsReports( registry, {
			searchPerformance: { clicks: 72, impressions: 8000 },
		} );
		fetchMock.getOnce( analyticsReportEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();

		fetchMock.getOnce( analyticsReportEndpoint, {
			body: { rows: [ { metricValues: [ { value: '157' } ] } ] },
			status: 200,
		} );

		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( await screen.findByText( '157' ) ).toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'Site traffic since yesterday157Total visitors'
		);
		expect( fetchMock ).toHaveFetchedTimes( 2, analyticsReportEndpoint );
	} );

	it( 'should render a report error for "Total visitors" when the report that gives the time zone of the Analytics property fails', async () => {
		freezeFetch( searchConsoleReportEndpoint );
		fetchMock.getOnce( analyticsReportEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { waitForRegistry } = render( <FreshMetricsRow />, { registry } );

		await waitForRegistry();

		expect( console ).toHaveErrored();
		expect(
			screen.getByText( 'Data error in Analytics' )
		).toBeInTheDocument();
		expect( fetchMock ).toHaveFetchedTimes( 1, analyticsReportEndpoint );
	} );

	it( 'should request the time zone report again when "Retry" is clicked', async () => {
		freezeFetch( searchConsoleReportEndpoint );
		fetchMock.getOnce( analyticsReportEndpoint, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		expect( console ).toHaveErrored();

		// The time zone report and the Total visitors report both ask for
		// `totalUsers` without dimensions, so one response serves both.
		fetchMock.get( analyticsReportEndpoint, {
			body: {
				rows: [ { metricValues: [ { value: '157' } ] } ],
				metadata: { timeZone: 'Asia/Tokyo' },
			},
			status: 200,
		} );

		fireEvent.click( screen.getByRole( 'button', { name: 'Retry' } ) );

		expect( await screen.findByText( '157' ) ).toBeInTheDocument();
		expect( container ).toHaveTextContent(
			'Site traffic since yesterday157Total visitors'
		);
	} );

	it( 'should render both groups for a view-only user who can view Analytics and Search Console', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: true,
		} );
		provideFreshMetricsReports( registry, {
			totalVisitors: 157,
			searchPerformance: { clicks: 72, impressions: 8000 },
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Site traffic since yesterday157Total visitors'
		);
		expect( container ).toHaveTextContent(
			'Search performance72Search clicks8KSearch impressions'
		);
	} );

	it( 'should not render "Search performance" or request the Search Console report for a view-only user who cannot view Search Console', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: false,
		} );
		provideFreshMetricsReports( registry, { totalVisitors: 157 } );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		await waitForRegistry();

		expect( container ).toHaveTextContent(
			'Site traffic since yesterday157Total visitors'
		);
		expect(
			screen.queryByText( 'Search performance' )
		).not.toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched( searchConsoleReportEndpoint );
	} );

	it( 'should explain the window and its delay in the tooltip of "Site traffic since yesterday"', async () => {
		provideFreshMetricsReports( registry, {
			totalVisitors: 157,
			searchPerformance: { clicks: 72, impressions: 8000 },
		} );

		const { container, waitForRegistry } = render( <FreshMetricsRow />, {
			registry,
		} );

		await waitForRegistry();

		fireEvent.mouseOver(
			container.querySelector( '.googlesitekit-info-tooltip' ) as Element
		);

		expect(
			await screen.findByRole( 'link', {
				name: 'Learn more (opens in a new tab)',
			} )
		).toHaveAttribute(
			'href',
			'https://sitekit.withgoogle.com/support/?doc=fresh-data'
		);
		expect(
			document.querySelector(
				'.googlesitekit-traffic-overview__fresh-metrics-tooltip'
			)
		).toHaveTextContent(
			'Shows traffic from the last 24 hours. Data may take up to 6 hours to update. Learn more'
		);
	} );
} );
