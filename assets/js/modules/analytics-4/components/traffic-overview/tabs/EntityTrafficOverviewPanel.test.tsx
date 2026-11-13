/**
 * Traffic Overview panel for the entity dashboard tests.
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
	VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { getTotalsReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import {
	getSectionClassNames,
	provideTrafficBreakdownReports,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import {
	createTestRegistry,
	fireEvent,
	render,
	waitFor,
} from '@tests/js/test-utils';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
} from '@tests/js/utils';
import EntityTrafficOverviewPanel from './EntityTrafficOverviewPanel';

describe( 'EntityTrafficOverviewPanel', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	const entityURL = 'https://example.com/about/';

	/**
	 * Builds the arguments the panel passes to `getReport` for the totals
	 * report, over the selected date range.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The totals report's arguments.
	 */
	function getTotalsArgs(): ReportOptions {
		const { startDate, endDate } = registry
			.select( CORE_USER )
			.getDateRangeDates();

		return getTotalsReportArgs( { startDate, endDate, url: entityURL } );
	}

	/**
	 * Builds the arguments the panel passes to `getReport` for the daily
	 * visits report, over the selected date range.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} The daily visits report's arguments.
	 */
	function getDailyVisitsArgs(): ReportOptions {
		const { startDate, endDate } = registry
			.select( CORE_USER )
			.getDateRangeDates();

		return {
			startDate,
			endDate,
			metrics: [ { name: 'sessions' } ],
			dimensions: [ 'date' ],
			reportID:
				'analytics-4_dashboard-all-traffic-widget-ga4_widget_dailyVisitsArgs',
			url: entityURL,
		};
	}

	/**
	 * Puts the totals report in the store with the given unique visitors.
	 *
	 * @since n.e.x.t
	 *
	 * @param {number} uniqueVisitors The unique visitors over the selected range.
	 * @return {void}
	 */
	function provideTotalsReport( uniqueVisitors: number ) {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				totals: [
					{ metricValues: [ { value: `${ uniqueVisitors }` } ] },
				],
			},
			{ options: getTotalsArgs() }
		);
	}

	/**
	 * Puts the daily visits report in the store with a row for each day given,
	 * and the given visits over the whole range in its totals.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Array.<Array>} days        Each day as `[ YYYYMMDD, visits ]`.
	 * @param {number}        totalVisits The visits over the selected range.
	 * @return {void}
	 */
	function provideDailyVisitsReport(
		days: Array< [ string, number ] >,
		totalVisits: number
	) {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: days.map( ( [ date, visits ] ) => ( {
					dimensionValues: [ { value: date } ],
					metricValues: [ { value: `${ visits }` } ],
				} ) ),
				totals: [ { metricValues: [ { value: `${ totalVisits }` } ] } ],
			},
			{ options: getDailyVisitsArgs() }
		);
	}

	/**
	 * Puts all five reports in the store, with mock figures for the totals
	 * and the daily visits.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function provideReports() {
		provideAnalytics4MockReport( registry, getTotalsArgs() );
		provideAnalytics4MockReport( registry, getDailyVisitsArgs() );
		provideTrafficBreakdownReports( registry );
	}

	/**
	 * Renders the panel on the entity dashboard.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [options] Optional. Options for `render`, in place of the defaults.
	 * @return {Object} The render result.
	 */
	function renderPanel( options = {} ) {
		return render( <EntityTrafficOverviewPanel />, {
			registry,
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
			...options,
		} );
	}

	/**
	 * Counts the placeholders each of the three sections renders.
	 *
	 * The Google Charts script never loads under Jest, so the chart shows a
	 * placeholder either way. `GoogleChart` adds
	 * `googlesitekit-chart-loading__forced` only when `loaded` is false, so the
	 * chart count reads that class.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element} container The element the panel rendered into.
	 * @return {Object} The placeholder count for each of the three sections.
	 */
	function getPlaceholderCounts( container: Element ) {
		return {
			totalVisitors: container.querySelectorAll(
				'.googlesitekit-traffic-overview__total-visitors .googlesitekit-preview-block'
			).length,
			chart: container.querySelectorAll(
				'.googlesitekit-chart-loading__forced'
			).length,
			breakdownRows: container.querySelectorAll(
				'.googlesitekit-traffic-overview__breakdown-column-loading .googlesitekit-preview-block'
			).length,
		};
	}

	/**
	 * Gets the labels of the chart's legend, in order.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Element} container The element the panel rendered into.
	 * @return {Array.<string>} The labels.
	 */
	function getLegendLabels( container: Element ) {
		return Array.from(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__chart-legend-label'
			)
		).map( ( label ) => label.textContent );
	}

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideSiteInfo( registry, { currentEntityURL: entityURL } );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );
		// `ReportError` looks up the Analytics store by the module slug, so
		// the module registrations have to be in place.
		provideModuleRegistrations( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsGatheringData( false );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
	} );

	it( 'should mark the panel as a tab panel named by the "Traffic overview" tab', async () => {
		provideReports();

		const { container, waitForRegistry } = renderPanel();

		await waitForRegistry();

		const panel = container.querySelector(
			'.googlesitekit-traffic-overview__panel'
		);

		expect( panel ).toHaveAttribute( 'role', 'tabpanel' );
		expect( panel ).toHaveAttribute(
			'aria-labelledby',
			'googlesitekit-traffic-overview-tab'
		);
	} );

	it( 'should render the visitor figures under the "Traffic over time" heading, then the traffic chart, then the traffic breakdown', async () => {
		provideReports();

		const { container, getByRole, waitForRegistry } = renderPanel();

		await waitForRegistry();

		expect( getSectionClassNames( container ) ).toEqual( [
			'googlesitekit-traffic-overview__summary',
			'googlesitekit-traffic-overview__chart',
			'googlesitekit-traffic-overview__breakdown',
		] );

		const heading = getByRole( 'heading', { name: 'Traffic over time' } );

		expect( heading ).toBe(
			container.querySelector(
				'.googlesitekit-traffic-overview__summary'
			)?.firstElementChild
		);
		expect( heading.nextElementSibling ).toHaveClass(
			'googlesitekit-traffic-overview__total-visitors'
		);
	} );

	it( 'should show the visits of the daily visits report as the total visits, and the unique visitors of the totals report', async () => {
		provideTotalsReport( 843 );
		provideDailyVisitsReport( [ [ '20250109', 12 ] ], 1234 );

		const { getByText, waitForRegistry } = renderPanel();

		await waitForRegistry();

		expect( getByText( '1.2K' ) ).toHaveClass(
			'googlesitekit-traffic-overview__total-visits-figure'
		);
		expect( getByText( '843' ) ).toHaveClass(
			'googlesitekit-traffic-overview__unique-visitors-figure'
		);
	} );

	it.each( [
		[ 'visits', 1234 ],
		[ 'no visits', 0 ],
	] )(
		'should show no change against the range before when the page had %s',
		async ( _, totalVisits ) => {
			provideTotalsReport( 843 );
			provideDailyVisitsReport( [], totalVisits );

			const { container, queryByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__total-visits-figure'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).not.toBeInTheDocument();
			expect(
				queryByText( 'Vs. prev. 28 days' )
			).not.toBeInTheDocument();
		}
	);

	it( 'should draw the visits on each day of the daily visits report in the chart, and zero visits on a day the report leaves out', async () => {
		provideTotalsReport( 843 );
		provideDailyVisitsReport(
			[
				[ '20250109', 12 ],
				[ '20250111', 34 ],
			],
			46
		);

		const { getByText, waitForRegistry } = renderPanel();

		await waitForRegistry();

		// Google Charts draws nothing under Jest, so this test reads the
		// chart's screen-reader lines instead.
		expect( getByText( 'January 9, 2025: 12 visits' ) ).toBeInTheDocument();
		expect( getByText( 'January 10, 2025: 0 visits' ) ).toBeInTheDocument();
		expect(
			getByText( 'January 11, 2025: 34 visits' )
		).toBeInTheDocument();
		expect( getByText( 'February 5, 2025: 0 visits' ) ).toBeInTheDocument();
	} );

	it( "should show the page's visits of each breakdown report as shares in its column of the traffic breakdown", async () => {
		provideReports();
		provideTrafficBreakdownReports( registry, {
			channels: [
				[ 'Organic Search', 30 ],
				[ 'Direct', 10 ],
			],
			locations: [ [ 'Ukraine', 5 ] ],
			devices: [
				[ 'mobile', 3 ],
				[ 'desktop', 1 ],
			],
		} );

		const { container, waitForRegistry } = renderPanel();

		await waitForRegistry();

		const rowsByColumn = Array.from(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__breakdown-column'
			)
		).map( ( column ) =>
			Array.from(
				column.querySelectorAll(
					'.googlesitekit-traffic-overview__breakdown-row'
				)
			).map( ( row ) => [
				row.querySelector(
					'.googlesitekit-traffic-overview__breakdown-row-label'
				)?.textContent,
				row.querySelector(
					'.googlesitekit-traffic-overview__breakdown-row-percentage'
				)?.textContent,
			] )
		);

		expect( rowsByColumn ).toEqual( [
			[
				[ 'Organic Search', '75%' ],
				[ 'Direct', '25%' ],
			],
			[ [ 'Ukraine', '100%' ] ],
			[
				[ 'mobile', '75%' ],
				[ 'desktop', '25%' ],
			],
		] );
		// The store holds every report for the entity URL, so a request
		// would mean the panel asked for a report without it.
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should say that the page has no visitors in a column whose breakdown report has no rows', async () => {
		provideReports();
		provideTrafficBreakdownReports( registry, { locations: [] } );

		const { getByRole, waitForRegistry } = renderPanel();

		await waitForRegistry();

		expect(
			getByRole( 'region', { name: 'Visits by locations' } )
		).toHaveTextContent(
			'No data to display: your page hasn’t received any visitors yet'
		);
	} );

	it( 'should draw neither the typical traffic range nor the published posts in the chart', async () => {
		provideReports();

		const { container, queryByText, waitForRegistry } = renderPanel( {
			features: [ 'typicalTraffic' ],
		} );

		await waitForRegistry();

		expect( getLegendLabels( container ) ).toEqual( [
			'Last 28 days traffic',
		] );
		expect( queryByText( /^Post published on/ ) ).not.toBeInTheDocument();
	} );

	it( 'should leave out the traffic insight and the key factors, and send no benchmarking request', async () => {
		const benchmarkingEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
		);

		provideReports();

		const { container, waitForRegistry } = renderPanel( {
			features: [ 'typicalTraffic', 'trafficInsights' ],
		} );

		await waitForRegistry();

		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__traffic-insight'
			)
		).not.toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__key-factors'
			)
		).not.toBeInTheDocument();
		expect( fetchMock ).not.toHaveFetched( benchmarkingEndpoint );
	} );

	it( 'should render the heading, and the three sections as placeholders, while a report is still loading', async () => {
		provideAnalytics4MockReport( registry, getTotalsArgs() );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ getDailyVisitsArgs() ] );

		const { container, getByRole, waitForRegistry } = renderPanel();

		await waitForRegistry();

		expect(
			getByRole( 'heading', { name: 'Traffic over time' } )
		).toBeInTheDocument();
		expect( getPlaceholderCounts( container ) ).toEqual( {
			totalVisitors: 1,
			chart: 1,
			// Five placeholder rows in each of the three columns.
			breakdownRows: 15,
		} );
	} );

	it( 'should render the report error and its "Retry" button in place of the heading and the three sections when a report fails, and request the report again on a "Retry" click', async () => {
		const dailyVisitsArgs = getDailyVisitsArgs();

		provideAnalytics4MockReport( registry, getTotalsArgs() );
		provideTrafficBreakdownReports( registry );
		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'The daily visits report failed.',
				data: { status: 500, reason: 'backendError' },
			},
			'getReport',
			[ dailyVisitsArgs ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ dailyVisitsArgs ] );

		const {
			container,
			getByRole,
			getByText,
			queryByRole,
			waitForRegistry,
		} = renderPanel();

		await waitForRegistry();

		expect(
			getByText( 'The daily visits report failed.' )
		).toBeInTheDocument();
		expect(
			queryByRole( 'heading', { name: 'Traffic over time' } )
		).not.toBeInTheDocument();
		expect( getSectionClassNames( container ) ).not.toContain(
			'googlesitekit-traffic-overview__chart'
		);

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 1, reportEndpoint )
		);
		await waitFor( () =>
			expect(
				getByRole( 'heading', { name: 'Traffic over time' } )
			).toBeInTheDocument()
		);
	} );

	it( 'should render the "Gathering data…" notice, and "We’re still collecting data" in each of the three columns, while the property is gathering data', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );
		provideReports();

		const { getAllByText, getByText, waitForRegistry } = renderPanel();

		await waitForRegistry();

		expect( getByText( 'Gathering data…' ) ).toBeInTheDocument();
		expect( getAllByText( 'We’re still collecting data' ) ).toHaveLength(
			3
		);
	} );

	it( 'should render placeholders and request no report for a view-only user who cannot view Analytics', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: false,
		} );

		const { container, waitForRegistry } = renderPanel( {
			viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD_VIEW_ONLY,
		} );

		await waitForRegistry();

		expect( getPlaceholderCounts( container ) ).toEqual( {
			totalVisitors: 1,
			chart: 1,
			breakdownRows: 15,
		} );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );
} );
