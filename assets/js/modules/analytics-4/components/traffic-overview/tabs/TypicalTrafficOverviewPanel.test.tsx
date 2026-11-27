/**
 * Typical Traffic Overview panel tests.
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
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
	PERMISSION_SETUP,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { getTotalsReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import {
	createBenchmarkingResponse,
	getSectionClassNames,
	getTypicalTrafficBreakdownReportArgs,
	getTypicalTrafficDailyVisitsReportArgs,
	provideBenchmarkingResponse,
	provideTypicalTrafficBreakdownReports,
	provideTypicalTrafficDailyVisitsReport,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import {
	availabilityWithoutTraffic,
	benchmarkingInsight,
	provideBenchmarkingInsight,
} from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import { benchmarkingData } from '@/js/modules/analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
import {
	BenchmarkingDailyTrafficRow,
	DecodedBenchmarkingResponse,
} from '@/js/modules/analytics-4/utils/benchmarking/types';
import { provideAnalytics4MockReport } from '@/js/modules/analytics-4/utils/data-mock';
import {
	act,
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
	provideUserInfo,
} from '@tests/js/utils';
import TypicalTrafficOverviewPanel from './TypicalTrafficOverviewPanel';

describe( 'TypicalTrafficOverviewPanel', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	/**
	 * Renders the panel the way the widget does: with the `typicalTraffic`
	 * feature, on the main dashboard.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} [options] Optional. Options for `render`, in place of the defaults.
	 * @return {Object} The render result.
	 */
	function renderPanel( options = {} ) {
		return render( <TypicalTrafficOverviewPanel />, {
			registry,
			features: [ 'typicalTraffic' ],
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			...options,
		} );
	}

	/**
	 * Puts a totals report in the store under the arguments the panel requests.
	 *
	 * @since 1.188.0
	 *
	 * @param {number} currentValue  Visitors over the selected range.
	 * @param {number} previousValue Visitors over the range before it.
	 * @return {void}
	 */
	function provideTotalsReport(
		currentValue: number,
		previousValue: number
	) {
		const { startDate, endDate, compareStartDate, compareEndDate } =
			registry.select( CORE_USER ).getDateRangeDates( { compare: true } );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				totals: [
					{ metricValues: [ { value: String( currentValue ) } ] },
					{ metricValues: [ { value: String( previousValue ) } ] },
				],
			},
			{
				options: getTotalsReportArgs( {
					startDate,
					endDate,
					compareStartDate,
					compareEndDate,
				} ),
			}
		);
	}

	/**
	 * Builds the arguments the panel passes to `getReport` for the totals
	 * report, over the selected date range.
	 *
	 * @since 1.189.0
	 * @since n.e.x.t Renamed from `getReportArgs()`, and builds the totals report's arguments alone.
	 *
	 * @return {Object} The totals report's arguments.
	 */
	function getTotalsArgs(): ReportOptions {
		const { startDate, endDate, compareStartDate, compareEndDate } =
			registry.select( CORE_USER ).getDateRangeDates( { compare: true } );

		return getTotalsReportArgs( {
			startDate,
			endDate,
			compareStartDate,
			compareEndDate,
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
	 * @since 1.189.0
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

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
		registry.dispatch( CORE_USER ).setDateRange( 'last-28-days' );
		provideSiteInfo( registry );
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
		// The breakdown reports are in the store from the start, so a test
		// that counts report requests counts the totals report alone.
		provideTypicalTrafficBreakdownReports( registry );
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
	} );

	describe( 'GA4 reports', () => {
		beforeEach( () => {
			// The panel waits for the benchmarking response before it shows
			// the figures of its reports.
			provideBenchmarkingResponse( registry );
		} );

		it( 'marks the panel as a tab panel and names it using the content in the "Traffic overview" tab', async () => {
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

		it( 'should build the unique visitors from the totals report', async () => {
			provideTotalsReport( 843, 700 );

			const { getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getByText( '843' ) ).toHaveClass(
				'googlesitekit-traffic-overview__unique-visitors-figure'
			);
		} );

		it( 'should show the visits of each breakdown report as shares in its column of the traffic breakdown', async () => {
			provideTypicalTrafficBreakdownReports( registry, {
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
		} );

		it( 'should say that the site has no visitors in a column whose breakdown report has no rows', async () => {
			provideTypicalTrafficBreakdownReports( registry, {
				channels: [ [ 'Direct', 10 ] ],
				locations: [],
				devices: [ [ 'desktop', 10 ] ],
			} );

			const { getByRole, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				getByRole( 'region', { name: 'Visits by locations' } )
			).toHaveTextContent(
				'No data to display: your site hasn’t received any visitors yet'
			);
		} );

		it( 'sends a report request when the panel renders', async () => {
			const { waitForRegistry } = renderPanel();

			await waitForRegistry();

			await waitFor( () =>
				expect( fetchMock ).toHaveFetched( reportEndpoint )
			);
		} );

		it( 'should render the three sections as placeholders while the totals report is still loading', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ getTotalsArgs() ] );

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 1,
				chart: 1,
				// Five placeholder rows in each of the three columns.
				breakdownRows: 15,
			} );
			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).toBeNull();
			expect(
				container.querySelectorAll( '.screen-reader-text' )
			).toHaveLength( 0 );
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__breakdown-row'
				)
			).toBeNull();
		} );

		it( 'should render the visitor total, the chart and the three columns together when the totals report arrives', async () => {
			const totalsArgs = getTotalsArgs();

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ totalsArgs ] );

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).toBeNull();

			act( () => {
				provideAnalytics4MockReport( registry, totalsArgs );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getReport', [ totalsArgs ] );
			} );

			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).toBeInTheDocument();
			expect(
				container.querySelectorAll( '.screen-reader-text' ).length
			).toBeGreaterThan( 0 );
			expect(
				container.querySelectorAll(
					'.googlesitekit-traffic-overview__breakdown-column'
				)
			).toHaveLength( 3 );
			container
				.querySelectorAll(
					'.googlesitekit-traffic-overview__breakdown-column'
				)
				.forEach( ( column ) =>
					expect(
						column.querySelectorAll(
							'.googlesitekit-traffic-overview__breakdown-row'
						).length
					).toBeGreaterThan( 0 )
				);
			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 0,
				chart: 0,
				breakdownRows: 0,
			} );
		} );

		it( 'returns the three sections to their placeholders when the date range changes', async () => {
			provideAnalytics4MockReport( registry, getTotalsArgs() );

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).toBeInTheDocument();

			act( () => {
				registry.dispatch( CORE_USER ).setDateRange( 'last-14-days' );
				provideTypicalTrafficBreakdownReports( registry );
				provideBenchmarkingResponse( registry );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.startResolution( 'getReport', [ getTotalsArgs() ] );
			} );

			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 1,
				chart: 1,
				breakdownRows: 15,
			} );
			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).toBeNull();
		} );

		it( 'should render the report error and its "Retry" button in place of the three sections when the report fails', async () => {
			const totalsArgs = getTotalsArgs();

			registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
				{
					code: 'test_error',
					message: 'The total visitors report failed.',
					data: { status: 500, reason: 'backendError' },
				},
				'getReport',
				[ totalsArgs ]
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ totalsArgs ] );

			const { container, getByRole, getByText, waitForRegistry } =
				renderPanel();

			await waitForRegistry();

			expect(
				getByText( 'The total visitors report failed.' )
			).toBeInTheDocument();
			expect(
				getByRole( 'button', { name: 'Retry' } )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__total-visitors'
				)
			).toBeNull();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__chart'
				)
			).toBeNull();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__breakdown'
				)
			).toBeNull();
		} );

		it( 'should request the report again and render the three sections on a "Retry" click', async () => {
			const totalsArgs = getTotalsArgs();

			registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
				{
					code: 'test_error',
					message: 'The total visitors report failed.',
					data: { status: 500, reason: 'backendError' },
				},
				'getReport',
				[ totalsArgs ]
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ totalsArgs ] );

			const { container, getByRole, queryByText, waitForRegistry } =
				renderPanel();

			await waitForRegistry();

			fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetchedTimes( 1, reportEndpoint )
			);
			await waitFor( () =>
				expect(
					queryByText( 'The total visitors report failed.' )
				).not.toBeInTheDocument()
			);

			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__total-visitors'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__chart'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__breakdown'
				)
			).toBeInTheDocument();
		} );

		it( 'renders "Request access" and no "Retry" when the report error is a missing permission', async () => {
			provideUserInfo( registry );
			registry.dispatch( MODULES_ANALYTICS_4 ).setAccountID( '12345' );
			registry.dispatch( MODULES_ANALYTICS_4 ).setPropertyID( '67890' );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setWebDataStreamID( '13579' );

			const totalsArgs = getTotalsArgs();

			registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
				{
					code: 'test_error',
					message: 'Request had insufficient authentication scopes.',
					data: { status: 403, reason: 'insufficientPermissions' },
				},
				'getReport',
				[ totalsArgs ]
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ totalsArgs ] );

			const { getByText, queryByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getByText( 'Request access' ) ).toBeInTheDocument();
			expect( queryByText( 'Retry' ) ).not.toBeInTheDocument();
		} );

		it( 'should render the three sections as placeholders while a breakdown report is still loading', async () => {
			// The store holds the breakdown reports of the last 28 days from
			// `beforeEach`, so the test reads the last 14 days, where it holds
			// no devices report.
			registry.dispatch( CORE_USER ).setDateRange( 'last-14-days' );
			provideBenchmarkingResponse( registry );
			provideTotalsReport( 843, 700 );
			provideTypicalTrafficBreakdownReports( registry, {
				channels: [ [ 'Direct', 10 ] ],
				locations: [ [ 'Ukraine', 10 ] ],
			} );

			const { devices } =
				getTypicalTrafficBreakdownReportArgs( registry );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ devices ] );

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 1,
				chart: 1,
				breakdownRows: 15,
			} );
		} );

		it( 'should render the report error in place of the three sections when a breakdown report fails, and request the report again on a "Retry" click', async () => {
			// The store holds the breakdown reports of the last 28 days from
			// `beforeEach`, so the test reads the last 14 days, where it holds
			// no locations report for "Retry" to find.
			registry.dispatch( CORE_USER ).setDateRange( 'last-14-days' );
			provideBenchmarkingResponse( registry );
			provideTotalsReport( 843, 700 );
			provideTypicalTrafficBreakdownReports( registry, {
				channels: [ [ 'Direct', 10 ] ],
				devices: [ [ 'desktop', 10 ] ],
			} );

			const { locations } =
				getTypicalTrafficBreakdownReportArgs( registry );

			registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
				{
					code: 'test_error',
					message: 'The locations report failed.',
					data: { status: 500, reason: 'backendError' },
				},
				'getReport',
				[ locations ]
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ locations ] );

			const {
				container,
				getByRole,
				getByText,
				queryByText,
				waitForRegistry,
			} = renderPanel();

			await waitForRegistry();

			expect(
				getByText( 'The locations report failed.' )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__breakdown'
				)
			).toBeNull();

			fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

			await waitFor( () =>
				expect( fetchMock ).toHaveFetchedTimes( 1, reportEndpoint )
			);
			await waitFor( () =>
				expect(
					queryByText( 'The locations report failed.' )
				).not.toBeInTheDocument()
			);

			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__breakdown'
				)
			).toBeInTheDocument();
		} );

		it( 'should render the "Gathering data…" notice, and "We’re still collecting data" in each of the three columns, while the property is gathering data', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			provideAnalytics4MockReport( registry, getTotalsArgs() );

			const { container, getAllByText, getByText, waitForRegistry } =
				renderPanel();

			await waitForRegistry();

			expect( getByText( 'Gathering data…' ) ).toBeInTheDocument();
			expect(
				getAllByText( 'We’re still collecting data' )
			).toHaveLength( 3 );
			// Neither the report nor the placeholders put a figure on the screen.
			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).toBeNull();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__breakdown-row'
				)
			).toBeNull();
			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 0,
				chart: 0,
				breakdownRows: 0,
			} );
		} );

		it( 'should render 0 unique visitors when the totals report shows no traffic', async () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
				{
					totals: [
						{ metricValues: [ { value: '0' } ] },
						{ metricValues: [ { value: '0' } ] },
					],
				},
				{ options: getTotalsArgs() }
			);

			const { container, getByText, queryByText, waitForRegistry } =
				renderPanel();

			await waitForRegistry();

			expect( getByText( '0' ) ).toHaveClass(
				'googlesitekit-traffic-overview__unique-visitors-figure'
			);
			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 0,
				chart: 0,
				breakdownRows: 0,
			} );
			expect( queryByText( 'Gathering data…' ) ).not.toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__chart'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector( '.googlesitekit-cta' )
			).toBeNull();
		} );

		it( 'renders placeholders and requests no report for a view-only user who cannot view Analytics', async () => {
			provideUserCapabilities( registry, {
				[ getMetaCapabilityPropertyName(
					PERMISSION_READ_SHARED_MODULE_DATA,
					MODULE_SLUG_ANALYTICS_4
				) ]: false,
			} );

			const { container, waitForRegistry } = renderPanel( {
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
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

	describe( 'benchmarking response', () => {
		const benchmarkingEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
		);

		const benchmarkingError = {
			code: 'test_error',
			message: 'The benchmarking request failed.',
			data: { status: 500, reason: 'backendError' },
		};

		/**
		 * Builds a benchmarking response for the selected date range with the
		 * figures of the design, and the given fields in place of theirs.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} [fields] Optional. The fields to set.
		 * @return {Object} The decoded response.
		 */
		function createResponse(
			fields: Partial< DecodedBenchmarkingResponse > = {}
		): DecodedBenchmarkingResponse {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();

			return {
				...createBenchmarkingResponse( startDate, endDate ),
				...fields,
			};
		}

		/**
		 * Stores an error for the benchmarking request over the selected date
		 * range, and finishes its resolution, so the store sends no request.
		 *
		 * @since n.e.x.t
		 *
		 * @return {void}
		 */
		function provideBenchmarkingError() {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setErrorForSelector(
					benchmarkingError,
					'getBenchmarkingData',
					[ startDate, endDate ]
				);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getBenchmarkingData', [
					startDate,
					endDate,
				] );
		}

		beforeEach( () => {
			provideTotalsReport( 843, 700 );
		} );

		it( 'should request the benchmarking response for the selected date range', async () => {
			fetchMock.get( benchmarkingEndpoint, {
				body: benchmarkingData,
				status: 200,
			} );

			const { waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( fetchMock ).toHaveFetchedTimes( 1, benchmarkingEndpoint, {
				query: { startDate: '2025-01-09', endDate: '2025-02-05' },
			} );
		} );

		it( 'should show the total visits of the benchmarking response', async () => {
			provideBenchmarkingResponse(
				registry,
				createResponse( { visits: { current: 4321, previous: 3000 } } )
			);

			const { getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getByText( '4.3K' ) ).toHaveClass(
				'googlesitekit-traffic-overview__total-visits-figure'
			);
		} );

		it( 'should draw the visits on each day of the benchmarking response in the chart', async () => {
			const { dailyTraffic } = createResponse();

			provideBenchmarkingResponse(
				registry,
				createResponse( {
					dailyTraffic: dailyTraffic.map( ( day, index ) => ( {
						...day,
						visits: 100 + index,
					} ) ),
				} )
			);

			const { getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			// Google Charts draws nothing under Jest, so this test reads the
			// chart's screen-reader lines instead. Each line goes on to name
			// the day's typical range.
			expect(
				getByText( /^January 9, 2025: 100 visits,/ )
			).toBeInTheDocument();
			expect(
				getByText( /^February 5, 2025: 127 visits,/ )
			).toBeInTheDocument();
		} );

		it( 'should render the key factor cards of the benchmarking response', async () => {
			provideBenchmarkingResponse(
				registry,
				createResponse( {
					keyFactors: [
						{
							kind: 'CHANNEL',
							label: 'Email',
							current: 180,
							previous: 40,
							sharePct: 61.2,
							attributes: [
								{
									kind: 'CAMPAIGN',
									label: 'spring-sale',
									current: 145,
									previous: 40,
									sharePct: 75,
								},
							],
						},
					],
				} )
			);

			const { container, getByRole, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				container.querySelectorAll(
					'.googlesitekit-traffic-overview__key-factor'
				)
			).toHaveLength( 1 );
			expect(
				getByRole( 'heading', { name: 'Email' } )
			).toBeInTheDocument();
		} );

		it( 'should render the shares of the benchmarking response’s key factor cards and their attributes, so a card that took its channel’s place names the channel, and an attribute larger than its card says why', async () => {
			provideBenchmarkingResponse(
				registry,
				createResponse( {
					keyFactors: [
						// The referring site carried 220 of the 300 visits
						// Referral gained, so it took Referral's card.
						{
							kind: 'REFERRING_SITE',
							label: 'news.example',
							current: 220,
							previous: 0,
							sharePct: 73.3,
							shareBasis: 'PARENT_CHANNEL',
							parentChannel: { label: 'Referral', change: 300 },
							attributes: [],
						},
						// Direct gained 1,280 visits: 1,643 on desktop, less
						// the 362 it lost on mobile.
						{
							kind: 'CHANNEL',
							label: 'Direct',
							current: 3280,
							previous: 2000,
							sharePct: 64.5,
							shareBasis: 'GROSS_CHANGE',
							attributes: [
								{
									kind: 'DEVICE',
									label: 'desktop',
									current: 2643,
									previous: 1000,
									sharePct: 0,
									oversized: true,
								},
								{
									kind: 'DEVICE',
									label: 'mobile',
									current: 638,
									previous: 1000,
									sharePct: 0,
								},
							],
						},
						{
							kind: 'CHANNEL',
							label: 'Email',
							current: 180,
							previous: 40,
							sharePct: 20.1,
							shareBasis: 'GROSS_CHANGE',
							attributes: [
								{
									kind: 'CAMPAIGN',
									label: 'spring-sale',
									current: 145,
									previous: 40,
									sharePct: 75,
								},
							],
						},
					],
				} )
			);

			const { getByRole, waitForRegistry } = renderPanel();

			await waitForRegistry();

			const referringSite = getByRole( 'region', {
				name: 'news.example',
			} );

			expect(
				referringSite.querySelector(
					'.googlesitekit-traffic-overview__key-factor-share'
				)
			).toHaveTextContent( '73.3% of Referral’s +300 visits' );

			const direct = getByRole( 'region', { name: 'Direct' } );
			const email = getByRole( 'region', { name: 'Email' } );

			// A card on any other basis shows its change alone.
			expect(
				direct.querySelector(
					'.googlesitekit-traffic-overview__key-factor-share'
				)
			).not.toBeInTheDocument();
			// Only the attributes with a share, or larger than their card,
			// say what their change is. The two sides of Direct's net are one
			// row, whose line names the side that moved the other way.
			expect(
				Array.from(
					direct.querySelectorAll(
						'.googlesitekit-traffic-overview__key-factor-attribute-share'
					)
				).map( ( share ) => share.textContent )
			).toEqual( [ 'Partly offset by -362 visits from mobile' ] );
			expect(
				email.querySelector(
					'.googlesitekit-traffic-overview__key-factor-attribute-share'
				)
			).toHaveTextContent( '75% of the change' );
		} );

		it( 'should say that no channel changed notably when the benchmarking response has no key factor cards', async () => {
			provideBenchmarkingResponse(
				registry,
				createResponse( { keyFactors: [] } )
			);

			const { getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				getByText(
					'No channel changed notably compared with the previous 28 days.'
				)
			).toBeInTheDocument();
		} );

		it( 'should say that no channel changed notably above the key factor cards, each with its share of all visits, when the benchmarking response says traffic was steady', async () => {
			provideBenchmarkingResponse(
				registry,
				createResponse( {
					keyFactors: [
						{
							kind: 'CHANNEL',
							label: 'Email',
							current: 41,
							previous: 40,
							sharePct: 61.2,
							attributes: [],
						},
						{
							kind: 'CHANNEL',
							label: 'Direct',
							current: 25,
							previous: 26,
							sharePct: 38.8,
							attributes: [],
						},
					],
					steadyTraffic: true,
				} )
			);

			const { getByRole, getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				getByText(
					'No channel changed notably compared with the previous 28 days.'
				)
			).toBeInTheDocument();
			expect(
				getByRole( 'heading', { name: 'Email' } )
			).toBeInTheDocument();
			expect( getByText( '61.2% of all visits' ) ).toBeInTheDocument();
		} );

		it( 'should render the key factor cards, however little their visits changed, when the benchmarking response says traffic was not steady', async () => {
			provideBenchmarkingResponse(
				registry,
				createResponse( {
					keyFactors: [
						{
							kind: 'CHANNEL',
							label: 'Email',
							current: 41,
							previous: 40,
							sharePct: 61.2,
							attributes: [],
						},
						{
							kind: 'CHANNEL',
							label: 'Direct',
							current: 25,
							previous: 26,
							sharePct: 38.8,
							attributes: [],
						},
					],
				} )
			);

			const { getByRole, queryByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				getByRole( 'heading', { name: 'Email' } )
			).toBeInTheDocument();
			expect(
				queryByText(
					'No channel changed notably compared with the previous 28 days.'
				)
			).not.toBeInTheDocument();
			expect(
				queryByText( '61.2% of all visits' )
			).not.toBeInTheDocument();
		} );

		it( 'should leave out the key factors section when the benchmarking response’s only card has nothing under its title, and there is no insight', async () => {
			provideBenchmarkingResponse(
				registry,
				createResponse( {
					keyFactors: [
						{
							kind: 'CHANNEL',
							label: 'Email',
							current: 180,
							previous: 40,
							sharePct: 100,
							shareBasis: 'GROSS_CHANGE',
							attributes: [],
						},
					],
				} )
			);

			const { container, queryByRole, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__key-factors'
				)
			).not.toBeInTheDocument();
			expect(
				queryByRole( 'heading', { name: 'Email' } )
			).not.toBeInTheDocument();
		} );

		it.each( [
			// The previous period runs from `2024-12-12` to `2025-01-08`, so
			// with recorded traffic from `2024-12-13` on, a 28-day range has
			// the key factors from the one that ends on `2025-02-06`.
			[
				'the previous period starts the day before the first day with recorded traffic',
				{
					...availabilityWithoutTraffic,
					bandAvailableFrom: '2025-04-02',
					keyFactorsAvailableFrom: '2025-02-06',
				},
				'We’re still learning what’s usual for your site. Check back on February 6, 2025 to see your biggest traffic shifts, and on April 2, 2025 to see your typical traffic range.',
			],
			[
				'the site has no recorded traffic',
				availabilityWithoutTraffic,
				'There isn’t enough traffic history for a typical traffic range on these dates, and there’s no previous period to compare to.',
			],
		] )(
			'should say when the key factors and the typical traffic range will show, in one notice above the visitor figures, and leave out the key factors, when the benchmarking response has neither for the selected range, as when %s',
			async ( _, availability, notice ) => {
				// The response has no key factors until every day of the
				// previous period has recorded traffic, and says so in its
				// availability, which the panel reads rather than working it
				// out again.
				provideBenchmarkingResponse(
					registry,
					createResponse( { availability, keyFactors: [] } )
				);

				const { container, queryByRole, queryByText, waitForRegistry } =
					renderPanel();

				await waitForRegistry();

				const notices = container.querySelectorAll(
					'.googlesitekit-notice'
				);

				// One notice says it all, at the top of the summary, above the
				// visitor figures.
				expect( notices ).toHaveLength( 1 );
				expect( notices[ 0 ] ).toHaveTextContent( notice );
				expect(
					notices[ 0 ].closest( '.googlesitekit-notice-container' )
						?.nextElementSibling
				).toHaveClass(
					'googlesitekit-traffic-overview__total-visitors'
				);
				expect( getSectionClassNames( container ) ).toEqual( [
					'googlesitekit-traffic-overview__summary',
					'googlesitekit-traffic-overview__chart',
					'googlesitekit-traffic-overview__breakdown',
				] );
				expect(
					queryByRole( 'heading', {
						name: 'Biggest traffic shifts vs. the previous 28 days',
					} )
				).not.toBeInTheDocument();
				// No comparison was made, so nothing says that no channel
				// changed.
				expect(
					queryByText(
						'No channel changed notably compared with the previous 28 days.'
					)
				).not.toBeInTheDocument();
			}
		);

		it( 'should ask for a date range that ends on or after the day of each part when the selected range ends in the past, whether the day has passed or not', async () => {
			// With recorded traffic from `2024-12-08` on, the 28 days that
			// end on `2025-01-20` have no key factors, and the 28-day ranges
			// that end on `2025-02-01` or later have them: one could be
			// selected today. The first with the typical traffic range ends
			// on `2025-03-28`, after today, but the selected range never
			// gains it by waiting, so the notice doesn't say to check back.
			registry.dispatch( CORE_USER ).setDateRangeSelection( {
				type: 'custom',
				startDate: '2024-12-24',
				endDate: '2025-01-20',
			} );

			provideBenchmarkingResponse(
				registry,
				createResponse( {
					availability: {
						...availabilityWithoutTraffic,
						bandAvailableFrom: '2025-03-28',
						keyFactorsAvailableFrom: '2025-02-01',
					},
					keyFactors: [],
				} )
			);

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			const notices = container.querySelectorAll(
				'.googlesitekit-notice'
			);

			expect( notices ).toHaveLength( 1 );
			expect( notices[ 0 ] ).toHaveTextContent(
				'There isn’t enough traffic history for these dates. Select a date range that ends on or after February 1, 2025 to see your biggest traffic shifts, and on or after March 28, 2025 to see your typical traffic range.'
			);
		} );

		it.each( [
			[
				'ends today',
				null,
				'We’re still learning what’s usual for your site. Check back on April 2, 2025 to see your typical traffic range.',
			],
			[
				'ends in the past',
				{ startDate: '2024-12-24', endDate: '2025-01-20' },
				'There isn’t enough traffic history for a typical traffic range on these dates. Select a date range that ends on or after April 2, 2025 to see it.',
			],
		] )(
			'should say when the typical traffic range will show, above the visitor figures, when the days of the selected range have none but it has its key factors, and the range %s',
			async ( _, customRange, notice ) => {
				// A range that ends in the past never gains the typical
				// traffic range by waiting, so its notice asks for a range
				// that ends later, though the day is still ahead.
				if ( customRange ) {
					registry.dispatch( CORE_USER ).setDateRangeSelection( {
						type: 'custom',
						...customRange,
					} );
				}

				// The key factors need every day of the previous period, and
				// the typical traffic range 55 days of history before the
				// range's first day, so a range of under 55 days has its key
				// factors first.
				const availability = {
					...availabilityWithoutTraffic,
					bandAvailableFrom: '2025-04-02',
					keyFactorsAvailable: true,
					keyFactorsAvailableFrom: '2024-12-01',
				};

				provideBenchmarkingResponse(
					registry,
					createResponse( {
						dailyTraffic: createResponse().dailyTraffic.map(
							( day ) => ( {
								...day,
								expectedMin: null,
								expectedMax: null,
							} )
						),
						availability,
						keyFactors: [],
					} )
				);

				const { getByText, waitForRegistry } = renderPanel();

				await waitForRegistry();

				const bandNotice = getByText( notice ).closest(
					'.googlesitekit-notice-container'
				);

				// The notice sits where the analysis would, at the top of
				// the summary, above the visitor figures.
				expect( bandNotice?.parentElement ).toHaveClass(
					'googlesitekit-traffic-overview__summary'
				);
				expect( bandNotice?.nextElementSibling ).toHaveClass(
					'googlesitekit-traffic-overview__total-visitors'
				);
				expect(
					bandNotice?.querySelector(
						'.googlesitekit-traffic-overview__availability-notice'
					)
				).toBeInTheDocument();
			}
		);

		it( 'should leave out the notice of what the selected range lacks when it has every part', async () => {
			provideBenchmarkingResponse( registry, createResponse() );

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__availability-notice'
				)
			).not.toBeInTheDocument();
		} );

		it( 'should render the key factors when the benchmarking response has them for the selected range, as when the previous period starts on the first day with recorded traffic', async () => {
			// The previous period runs from `2024-12-12` to `2025-01-08`, so
			// with recorded traffic from `2024-12-12` on, the selected range is
			// the first 28-day range with the key factors.
			provideBenchmarkingResponse(
				registry,
				createResponse( {
					availability: {
						...availabilityWithoutTraffic,
						bandAvailableFrom: '2025-04-01',
						keyFactorsAvailable: true,
						keyFactorsAvailableFrom: '2025-02-05',
						insightRequestAllowed: true,
					},
				} )
			);

			const { getByRole, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				getByRole( 'heading', { name: 'Referral' } )
			).toBeInTheDocument();
		} );

		it( 'should render the sections as placeholders while the benchmarking response is still loading, and render them together when it arrives', async () => {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();

			// A started resolution sends no request, so the response stays
			// on its way.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getBenchmarkingData', [
					startDate,
					endDate,
				] );

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			const placeholderCardSelector =
				'.googlesitekit-traffic-overview__key-factor--loading';

			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 1,
				chart: 1,
				breakdownRows: 15,
			} );
			expect(
				container.querySelectorAll( placeholderCardSelector )
			).toHaveLength( 3 );

			act( () => {
				provideBenchmarkingResponse( registry );
			} );

			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 0,
				chart: 0,
				breakdownRows: 0,
			} );
			expect(
				container.querySelector( placeholderCardSelector )
			).not.toBeInTheDocument();
		} );

		it( 'should render the error of the benchmarking request and its "Retry" button in place of the key factors, between the chart and the breakdown, when the request fails', async () => {
			provideBenchmarkingError();
			provideTypicalTrafficDailyVisitsReport( registry, [], {
				current: 1234,
				previous: 1000,
			} );

			const { container, getByRole, getByText, waitForRegistry } =
				renderPanel();

			await waitForRegistry();

			expect( getSectionClassNames( container ) ).toEqual( [
				'googlesitekit-traffic-overview__summary',
				'googlesitekit-traffic-overview__chart',
				'googlesitekit-traffic-overview__benchmarking-error',
				'googlesitekit-traffic-overview__breakdown',
			] );
			expect(
				getByText( 'The benchmarking request failed.' )
			).toBeInTheDocument();
			expect(
				getByRole( 'button', { name: 'Retry' } )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__key-factors'
				)
			).toBeNull();
		} );

		it( 'should show the visits of the daily visits report, against the range before, and the unique visitors of the totals report when the benchmarking request fails', async () => {
			provideBenchmarkingError();
			provideTypicalTrafficDailyVisitsReport( registry, [], {
				current: 1234,
				previous: 1000,
			} );

			const { container, getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getByText( '1.2K' ) ).toHaveClass(
				'googlesitekit-traffic-overview__total-visits-figure'
			);
			expect(
				container.querySelector( '.googlesitekit-change-badge' )
			).toBeInTheDocument();
			expect( getByText( 'Vs. prev. 28 days' ) ).toBeInTheDocument();
			expect( getByText( '843' ) ).toHaveClass(
				'googlesitekit-traffic-overview__unique-visitors-figure'
			);
		} );

		it( 'should draw the visits on each day of the daily visits report in the chart, without a typical range, when the benchmarking request fails', async () => {
			provideBenchmarkingError();
			provideTypicalTrafficDailyVisitsReport(
				registry,
				[
					[ '20250109', 12 ],
					[ '20250111', 34 ],
				],
				{ current: 46, previous: 40 }
			);

			const { getByText, queryByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			// Google Charts draws nothing under Jest, so this test reads the
			// chart's screen-reader lines instead. Without a typical range,
			// a line names the day's visits alone.
			expect(
				getByText( 'January 9, 2025: 12 visits' )
			).toBeInTheDocument();
			expect(
				getByText( 'January 10, 2025: 0 visits' )
			).toBeInTheDocument();
			expect(
				getByText( 'January 11, 2025: 34 visits' )
			).toBeInTheDocument();
			expect(
				queryByText( 'Typical traffic range' )
			).not.toBeInTheDocument();
		} );

		it( 'should render the sections as placeholders while the daily visits report is still loading after the benchmarking request fails', async () => {
			provideBenchmarkingError();
			// A started resolution sends no request, so the report stays on
			// its way.
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [
					getTypicalTrafficDailyVisitsReportArgs( registry ),
				] );

			const { container, queryByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 1,
				chart: 1,
				breakdownRows: 15,
			} );
			expect(
				queryByText( 'The benchmarking request failed.' )
			).not.toBeInTheDocument();

			act( () => {
				provideTypicalTrafficDailyVisitsReport( registry, [], {
					current: 1234,
					previous: 1000,
				} );
			} );

			// The benchmarking error renders with the figures, and updates
			// once more after it mounts, so the test waits for the registry
			// before it ends.
			await waitForRegistry();

			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 0,
				chart: 0,
				breakdownRows: 0,
			} );
			expect(
				queryByText( 'The benchmarking request failed.' )
			).toBeInTheDocument();
		} );

		it( 'should render the errors of the daily visits report and of the benchmarking request in place of the sections when both fail', async () => {
			const dailyVisitsArgs =
				getTypicalTrafficDailyVisitsReportArgs( registry );

			provideBenchmarkingError();
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

			const { container, getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				getByText( 'The daily visits report failed.' )
			).toBeInTheDocument();
			expect(
				getByText( 'The benchmarking request failed.' )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__summary'
				)
			).toBeNull();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__chart'
				)
			).toBeNull();
		} );

		it( 'should request the benchmarking response once again and render its sections on a "Retry" click', async () => {
			provideBenchmarkingError();
			provideTypicalTrafficDailyVisitsReport( registry, [], {
				current: 1234,
				previous: 1000,
			} );
			fetchMock.get( benchmarkingEndpoint, {
				body: benchmarkingData,
				status: 200,
			} );

			const { container, getByRole, queryByText, waitForRegistry } =
				renderPanel();

			await waitForRegistry();

			fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

			await waitFor( () =>
				expect(
					queryByText( 'The benchmarking request failed.' )
				).not.toBeInTheDocument()
			);
			await waitForRegistry();

			// `ReportError` and the panel's `onRetry` both invalidate the
			// resolution, and the two send one request.
			expect( fetchMock ).toHaveFetchedTimes( 1, benchmarkingEndpoint );
			// The fixture's availability has the key factors, so every section
			// shows.
			expect( getSectionClassNames( container ) ).toEqual( [
				'googlesitekit-traffic-overview__summary',
				'googlesitekit-traffic-overview__chart',
				'googlesitekit-traffic-overview__key-factors',
				'googlesitekit-traffic-overview__breakdown',
			] );
		} );

		it( 'should send no benchmarking request for a view-only user who cannot view Analytics', async () => {
			provideUserCapabilities( registry, {
				[ getMetaCapabilityPropertyName(
					PERMISSION_READ_SHARED_MODULE_DATA,
					MODULE_SLUG_ANALYTICS_4
				) ]: false,
			} );

			const { container, waitForRegistry } = renderPanel( {
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
			} );

			await waitForRegistry();

			expect( getPlaceholderCounts( container ) ).toEqual( {
				totalVisitors: 1,
				chart: 1,
				breakdownRows: 15,
			} );
			expect( fetchMock ).not.toHaveFetched( benchmarkingEndpoint );
		} );
	} );

	describe( 'key factors', () => {
		const keyFactorsSelector =
			'.googlesitekit-traffic-overview__key-factors';

		beforeEach( () => {
			// The panel reads the key factors from the benchmarking response.
			provideBenchmarkingResponse( registry );
		} );

		it( 'should render the key factors between the traffic chart and the traffic breakdown on the main dashboard', async () => {
			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getSectionClassNames( container ) ).toEqual( [
				'googlesitekit-traffic-overview__summary',
				'googlesitekit-traffic-overview__chart',
				'googlesitekit-traffic-overview__key-factors',
				'googlesitekit-traffic-overview__breakdown',
			] );
		} );

		it( 'should name the number of days in the selected date range in the heading of the key factors', async () => {
			registry.dispatch( CORE_USER ).setDateRange( 'last-14-days' );
			provideBenchmarkingResponse( registry );

			const { getByRole, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				getByRole( 'heading', {
					name: 'Biggest traffic shifts vs. the previous 14 days',
				} )
			).toBeInTheDocument();
		} );

		it( 'should render "Select a date range of at least 7 days…" above the visitor figures, alone, and leave out the key factors, when the benchmarking response says the selected range is too short for them', async () => {
			registry.dispatch( CORE_USER ).setDateRangeSelection( {
				type: 'custom',
				startDate: '2025-02-03',
				endDate: '2025-02-05',
			} );

			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();
			const response = createBenchmarkingResponse( startDate, endDate );

			// A 3-day range has no key factors, whatever its history, and the
			// response says it is too short for them.
			provideBenchmarkingResponse( registry, {
				...response,
				availability: {
					...response.availability,
					rangeTooShort: true,
					// The typical traffic range waits for a day of a range
					// this short, which a longer range moves, so the notice
					// says nothing of it.
					bandAvailable: false,
					bandAvailableFrom: '2025-04-02',
					keyFactorsAvailable: false,
					keyFactorsAvailableFrom: null,
					insightRequestAllowed: false,
					performanceInsightAvailable: false,
				},
				keyFactors: [],
			} );

			const { container, queryByRole, waitForRegistry } = renderPanel();

			await waitForRegistry();

			const notices = container.querySelectorAll(
				'.googlesitekit-notice'
			);

			expect( notices ).toHaveLength( 1 );
			expect( notices[ 0 ] ).toHaveTextContent(
				'Select a date range of at least 7 days to see your biggest traffic shifts.'
			);
			expect(
				notices[ 0 ].closest(
					'.googlesitekit-traffic-overview__summary'
				)
			).toBeInTheDocument();
			// The heading would name a comparison with the previous 3 days
			// that wasn't made.
			expect( getSectionClassNames( container ) ).toEqual( [
				'googlesitekit-traffic-overview__summary',
				'googlesitekit-traffic-overview__chart',
				'googlesitekit-traffic-overview__breakdown',
			] );
			expect(
				queryByRole( 'heading', {
					name: 'Biggest traffic shifts vs. the previous 3 days',
				} )
			).not.toBeInTheDocument();
		} );

		it.each( [
			[ 'with', [ 'typicalTraffic', 'trafficInsights' ], true ],
			[ 'without', [ 'typicalTraffic' ], false ],
		] )(
			'should render the summary above the key factor cards only %s the trafficInsights feature',
			async ( _, features, hasInsight ) => {
				provideBenchmarkingInsight(
					registry,
					registry.select( CORE_USER ).getDateRangeDates()
				);

				const { container, waitForRegistry } = renderPanel( {
					features,
				} );

				await waitForRegistry();

				expect(
					container.querySelector( keyFactorsSelector )
				).toBeInTheDocument();
				expect(
					container.querySelector(
						'.googlesitekit-traffic-overview__key-factors-insight'
					) !== null
				).toBe( hasInsight );
			}
		);

		it( 'should leave out the key factors while the property is gathering data', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			provideAnalytics4MockReport( registry, getTotalsArgs() );

			const { container, getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getByText( 'Gathering data…' ) ).toBeInTheDocument();
			expect(
				container.querySelector( keyFactorsSelector )
			).not.toBeInTheDocument();
		} );

		it( 'should render the key factors as three placeholder cards while the totals report is still loading, and the cards once it arrives', async () => {
			const totalsArgs = getTotalsArgs();

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ totalsArgs ] );

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			const placeholderCardSelector =
				'.googlesitekit-traffic-overview__key-factor--loading';

			expect( getPlaceholderCounts( container ).breakdownRows ).toBe(
				15
			);
			expect(
				container.querySelectorAll( placeholderCardSelector )
			).toHaveLength( 3 );

			act( () => {
				provideAnalytics4MockReport( registry, totalsArgs );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getReport', [ totalsArgs ] );
			} );

			expect(
				container.querySelector( placeholderCardSelector )
			).not.toBeInTheDocument();
			expect(
				container.querySelectorAll(
					'.googlesitekit-traffic-overview__key-factor'
				).length
			).toBeGreaterThan( 0 );
		} );
	} );

	describe( 'typical traffic range and published posts', () => {
		beforeEach( () => {
			// The chart draws both along the visits of the benchmarking
			// response.
			provideBenchmarkingResponse( registry );
		} );

		/**
		 * Stores a benchmarking response for the selected date range with the
		 * figures of the design, and each day changed by `mapDay`.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Function} mapDay Gets a day of the response from the design's day and its position.
		 * @return {void}
		 */
		function provideDailyTraffic(
			mapDay: (
				day: BenchmarkingDailyTrafficRow,
				index: number
			) => BenchmarkingDailyTrafficRow
		) {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();
			const response = createBenchmarkingResponse( startDate, endDate );

			provideBenchmarkingResponse( registry, {
				...response,
				dailyTraffic: response.dailyTraffic.map( mapDay ),
			} );
		}

		/**
		 * Reads the labels of the chart's legend items.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Element} container The element the panel rendered into.
		 * @return {Array.<string>} The label of each legend item, in order.
		 */
		function getLegendLabels( container: Element ) {
			return Array.from(
				container.querySelectorAll(
					'.googlesitekit-traffic-overview__chart-legend-label'
				)
			).map( ( label ) => label.textContent );
		}

		it( 'should draw the typical traffic range and the published posts on the chart on the main dashboard', async () => {
			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
				'Typical traffic range',
				'Published post',
			] );
		} );

		it.each( [
			[
				'without last year in the history',
				false,
				/Based on 52 weeks of your traffic\. Learn more/,
			],
			[
				'with last year in the history',
				true,
				/Based on 52 weeks of your traffic, including the same time last year\. Learn more/,
			],
		] )(
			'should say in the typical range tooltip how many weeks of traffic the benchmarking response fitted the band on, %s',
			async ( _label, lastYearAvailable, name ) => {
				const { startDate, endDate } = registry
					.select( CORE_USER )
					.getDateRangeDates();
				const response = createBenchmarkingResponse(
					startDate,
					endDate
				);

				provideBenchmarkingResponse( registry, {
					...response,
					availability: {
						...response.availability,
						lastYearAvailable,
					},
					bandReferenceDays: 365,
				} );

				const { getByRole, waitForRegistry } = renderPanel();

				await waitForRegistry();

				expect( getByRole( 'button', { name } ) ).toBeInTheDocument();
			}
		);

		it( 'should draw the typical range of each day of the benchmarking response', async () => {
			provideDailyTraffic( ( day ) => ( {
				...day,
				expectedMin: 118.4,
				expectedMax: 183.1,
			} ) );

			const { getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			// Google Charts draws nothing under Jest, so this test reads the
			// chart's screen-reader lines instead.
			expect(
				getByText(
					'January 9, 2025: 39 visits, typical range 118.4 to 183.1'
				)
			).toBeInTheDocument();
			expect(
				getByText(
					'February 5, 2025: 152 visits, typical range 118.4 to 183.1'
				)
			).toBeInTheDocument();
		} );

		it( 'should draw no typical range when a day of the benchmarking response has no bounds', async () => {
			// The band covers the whole range or none of it, so the first ten
			// days without bounds leave it out on every day.
			provideDailyTraffic( ( day, index ) =>
				index < 10
					? { ...day, expectedMin: null, expectedMax: null }
					: day
			);

			const { container, getByText, queryAllByText, waitForRegistry } =
				renderPanel();

			await waitForRegistry();

			expect(
				getByText( 'January 9, 2025: 39 visits' )
			).toBeInTheDocument();
			expect(
				getByText( /^January 19, 2025: \d+ visits$/ )
			).toBeInTheDocument();
			expect( queryAllByText( /typical range/ ) ).toHaveLength( 0 );
			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
				'Published post',
			] );
		} );

		it( 'should mark the posts of the content markers of the benchmarking response on the chart', async () => {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();

			provideBenchmarkingResponse( registry, {
				...createBenchmarkingResponse( startDate, endDate ),
				contentMarkers: [
					{
						date: startDate,
						posts: [
							{
								title: 'How to plant garlic',
								url: '/how-to-plant-garlic/',
							},
							{
								title: 'Storing garlic',
								url: '/storing-garlic/',
							},
						],
					},
				],
			} );

			const { container, getAllByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			// Google Charts draws nothing under Jest, so this test reads the
			// chart's screen-reader lines instead.
			expect(
				getAllByText( /^Post published on / ).map(
					( line ) => line.textContent
				)
			).toEqual( [
				expect.stringMatching( /: How to plant garlic$/ ),
				expect.stringMatching( /: Storing garlic$/ ),
			] );
			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
				'Typical traffic range',
				'Published post',
			] );
		} );

		it( 'should leave the published posts out of the legend when the benchmarking response has no content markers', async () => {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();

			provideBenchmarkingResponse( registry, {
				...createBenchmarkingResponse( startDate, endDate ),
				contentMarkers: [],
			} );

			const { container, queryAllByText, waitForRegistry } =
				renderPanel();

			await waitForRegistry();

			expect( queryAllByText( /^Post published on / ) ).toHaveLength( 0 );
			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
				'Typical traffic range',
			] );
		} );

		it( 'should leave the typical range out of the legend when no day of the benchmarking response has bounds', async () => {
			provideDailyTraffic( ( day ) => ( {
				...day,
				expectedMin: null,
				expectedMax: null,
			} ) );

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
				'Published post',
			] );
		} );

		it( 'should draw neither while the property is gathering data', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
			] );
		} );
	} );

	describe( 'traffic insight', () => {
		const trafficInsightSelector =
			'.googlesitekit-traffic-overview__traffic-insight';
		const keyFactorsInsightSelector =
			'.googlesitekit-traffic-overview__key-factors-insight';
		const insightEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-insight'
		);

		beforeEach( () => {
			// With the typicalTraffic feature, the panel waits for the
			// benchmarking response before it renders the insight.
			provideBenchmarkingResponse( registry );
		} );

		/**
		 * Stores a benchmarking response for the selected date range that
		 * carries the request of the generated insight.
		 *
		 * @since n.e.x.t
		 *
		 * @return {void}
		 */
		function provideBenchmarkingResponseWithInsightRequest() {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();

			provideBenchmarkingResponse( registry, {
				...createBenchmarkingResponse( startDate, endDate ),
				insightLocale: 'en_US',
				insightPayload: 'signed-payload',
			} );
		}

		it( 'should render the traffic insight above the visitor figures on the main dashboard', async () => {
			provideBenchmarkingInsight(
				registry,
				registry.select( CORE_USER ).getDateRangeDates()
			);

			const { container, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			const summary = container.querySelector(
				'.googlesitekit-traffic-overview__summary'
			) as Element;

			expect(
				Array.from( summary.children ).map(
					( { className } ) => className
				)
			).toEqual( [
				'googlesitekit-traffic-overview__insight-notice googlesitekit-traffic-overview__traffic-insight',
				'googlesitekit-traffic-overview__total-visitors',
			] );
			// The analysis compares the period with the site's typical range.
			expect(
				container.querySelector( trafficInsightSelector )
			).toHaveTextContent(
				'Over the last 28 days, your site had 1,740 visits, about 12% above what is usual for it.'
			);
		} );

		it( 'should render the driver of the insight above the key factor cards', async () => {
			provideBenchmarkingInsight(
				registry,
				registry.select( CORE_USER ).getDateRangeDates()
			);

			const { container, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			expect(
				container.querySelector( keyFactorsInsightSelector )
			).toHaveTextContent(
				'Visits rose 18% (+265 visits) compared to the previous 28 days, led by Organic Search (+190 visits).'
			);
			expect(
				container.querySelector(
					`${ keyFactorsInsightSelector } strong`
				)
			).toHaveTextContent( 'Organic Search' );
		} );

		it( 'should leave out the traffic insight, and not ask for it, when the selected range has no key factors', async () => {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();
			const response = createBenchmarkingResponse( startDate, endDate );

			// The response has no key factors, as when the previous period
			// starts before the first day with recorded traffic. The insight's
			// driver would describe a change against days that weren't
			// measured, so the panel asks for no insight, even though every
			// day has its typical range, as the days of a 90-day range have it
			// before its key factors.
			provideBenchmarkingResponse( registry, {
				...response,
				availability: {
					...response.availability,
					keyFactorsAvailable: false,
					keyFactorsAvailableFrom: '2025-02-06',
					insightRequestAllowed: false,
					performanceInsightAvailable: false,
				},
				keyFactors: [],
				insightLocale: 'en_US',
				insightPayload: 'signed-payload',
			} );

			const { container, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			expect( fetchMock ).not.toHaveFetched( insightEndpoint );
			expect(
				container.querySelector( trafficInsightSelector )
			).not.toBeInTheDocument();
			expect(
				container.querySelector( keyFactorsInsightSelector )
			).not.toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__total-visitors'
				)
			).toBeInTheDocument();
		} );

		it( 'should say what range the insight needs in place of its analysis, and not ask for it, when the selected range is too long for it', async () => {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();
			const response = createBenchmarkingResponse( startDate, endDate );

			// The Site Kit service writes the insight for a range of up to 364
			// days, so the response of a longer range has the band and the key
			// factors, but no request of the insight.
			provideBenchmarkingResponse( registry, {
				...response,
				availability: {
					...response.availability,
					insightRequestAllowed: false,
					performanceInsightAvailable: false,
					rangeTooLong: true,
				},
				insightLocale: 'en_US',
			} );

			const { container, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			const summary = container.querySelector(
				'.googlesitekit-traffic-overview__summary'
			) as Element;

			expect( fetchMock ).not.toHaveFetched( insightEndpoint );
			expect(
				Array.from( summary.children ).map(
					( { className } ) => className
				)
			).toEqual( [
				'googlesitekit-notice-container',
				'googlesitekit-traffic-overview__total-visitors',
			] );
			expect(
				summary.firstElementChild?.querySelector(
					'.googlesitekit-traffic-overview__availability-notice'
				)
			).toHaveTextContent(
				'Select a date range of up to 364 days to see insights about your traffic.'
			);
			expect(
				container.querySelector( keyFactorsInsightSelector )
			).not.toBeInTheDocument();
			expect(
				container.querySelectorAll(
					'.googlesitekit-traffic-overview__key-factors-cards > *'
				).length
			).toBeGreaterThan( 0 );
		} );

		it( 'should warn that the site has too little traffic in place of the analysis, and leave out the band, the key factors and the insight, for a site with low traffic', async () => {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();
			const response = createBenchmarkingResponse( startDate, endDate );

			// The response of a site with low traffic has no band on any day
			// and no key factors, and its availability says why, though the
			// site's history is long enough for both.
			provideBenchmarkingResponse( registry, {
				...response,
				dailyTraffic: response.dailyTraffic.map( ( day ) => ( {
					...day,
					expectedMin: null,
					expectedMax: null,
				} ) ),
				availability: {
					...response.availability,
					bandAvailable: false,
					keyFactorsAvailable: false,
					insightRequestAllowed: false,
					performanceInsightAvailable: false,
					lowTraffic: true,
				},
				bandReferenceDays: null,
				keyFactors: [],
				insightLocale: 'en_US',
				insightPayload: 'signed-payload',
			} );

			const { container, getByRole, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			const summary = container.querySelector(
				'.googlesitekit-traffic-overview__summary'
			) as Element;

			expect( fetchMock ).not.toHaveFetched( insightEndpoint );
			expect(
				Array.from( summary.children ).map(
					( { className } ) => className
				)
			).toEqual( [
				'googlesitekit-notice-container',
				'googlesitekit-traffic-overview__total-visitors',
			] );
			expect(
				summary.firstElementChild?.querySelector(
					'.googlesitekit-notice--warning.googlesitekit-traffic-overview__low-traffic-notice'
				)
			).toHaveTextContent(
				'There isn’t enough traffic data right now to show a reliable typical range or traffic shifts. These insights will come back once your site gets more regular visits. Learn more'
			);
			expect(
				getByRole( 'button', { name: 'Got it' } )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__availability-notice'
				)
			).not.toBeInTheDocument();
			expect(
				container.querySelector( trafficInsightSelector )
			).not.toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__key-factors'
				)
			).not.toBeInTheDocument();
			// The chart draws the line and the published posts, as the design
			// has them, without the band.
			expect(
				Array.from(
					container.querySelectorAll(
						'.googlesitekit-traffic-overview__chart-legend-label'
					)
				).map( ( label ) => label.textContent )
			).toEqual( [ 'Last 28 days traffic', 'Published post' ] );
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__breakdown'
				)
			).toBeInTheDocument();
		} );

		it.each( [
			[
				'without the trafficInsights feature',
				[ 'typicalTraffic' ],
				true,
			],
			[
				'while the key factors wait for the period before the range',
				[ 'typicalTraffic', 'trafficInsights' ],
				false,
			],
		] )(
			'should not say what range the insight needs for a range too long for it %s',
			async ( _label, features, keyFactorsAvailable ) => {
				const { startDate, endDate } = registry
					.select( CORE_USER )
					.getDateRangeDates();
				const response = createBenchmarkingResponse(
					startDate,
					endDate
				);

				provideBenchmarkingResponse( registry, {
					...response,
					availability: {
						...response.availability,
						keyFactorsAvailable,
						keyFactorsAvailableFrom: '2026-02-06',
						insightRequestAllowed: false,
						performanceInsightAvailable: false,
						rangeTooLong: true,
					},
					keyFactors: keyFactorsAvailable ? response.keyFactors : [],
				} );

				const { container, queryByText, waitForRegistry } = renderPanel(
					{
						features,
					}
				);

				await waitForRegistry();

				// While the key factors wait, the panel's notice says when
				// they will show instead, since there is no insight either
				// way until they do.
				expect(
					container.querySelector(
						'.googlesitekit-traffic-overview__total-visitors'
					)
				).toBeInTheDocument();
				expect(
					queryByText(
						'Select a date range of up to 364 days to see insights about your traffic.'
					)
				).not.toBeInTheDocument();
			}
		);

		it( 'should ask for the insight, and render its driver but leave out its analysis, when the days of the selected range have no typical range', async () => {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();
			const response = createBenchmarkingResponse( startDate, endDate );

			// The site recorded its first visits on `2024-12-12`, the first day
			// of the previous period: the 56 days of history give the key
			// factors, and are too few for the typical range, which needs 111.
			// Without the band, the analysis would only say that the service is
			// still learning what's usual for the site.
			provideBenchmarkingResponse( registry, {
				...response,
				dailyTraffic: response.dailyTraffic.map( ( day ) => ( {
					...day,
					expectedMin: null,
					expectedMax: null,
				} ) ),
				availability: {
					...response.availability,
					bandAvailable: false,
					bandAvailableFrom: '2025-04-01',
					keyFactorsAvailableFrom: '2025-02-05',
					performanceInsightAvailable: false,
				},
				insightLocale: 'en_US',
				insightPayload: 'signed-payload',
			} );
			fetchMock.postOnce( insightEndpoint, {
				body: { insight: benchmarkingInsight },
			} );

			const { container, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint );
			expect(
				container.querySelector( trafficInsightSelector )
			).not.toBeInTheDocument();
			expect(
				container.querySelector( keyFactorsInsightSelector )
			).toHaveTextContent(
				'Visits rose 18% (+265 visits) compared to the previous 28 days, led by Organic Search (+190 visits).'
			);
		} );

		it( 'should render placeholders in place of the analysis and the driver while the insight loads', async () => {
			const { startDate, endDate } = registry
				.select( CORE_USER )
				.getDateRangeDates();

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getBenchmarkingInsight', [
					startDate,
					endDate,
				] );

			const { container, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			expect(
				container.querySelector(
					`${ trafficInsightSelector } .googlesitekit-preview-block`
				)
			).toBeInTheDocument();
			expect(
				container.querySelector(
					`${ keyFactorsInsightSelector } .googlesitekit-preview-block`
				)
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__insight-notice-content'
				)
			).not.toBeInTheDocument();
		} );

		it( 'should ask for the insight with the request of the benchmarking response, and render it once it arrives', async () => {
			provideBenchmarkingResponseWithInsightRequest();
			fetchMock.postOnce( insightEndpoint, {
				body: { insight: benchmarkingInsight },
			} );

			const { container, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			expect( fetchMock ).toHaveFetchedTimes( 1, insightEndpoint, {
				method: 'POST',
				body: { data: { payload: 'signed-payload' } },
			} );
			expect(
				container.querySelector( trafficInsightSelector )
			).toHaveTextContent( 'your site had 1,740 visits' );
			expect(
				container.querySelector( keyFactorsInsightSelector )
			).toHaveTextContent( 'Visits rose 18% (+265 visits)' );
		} );

		it( 'should render the figures without the insight when the request for it fails', async () => {
			provideBenchmarkingResponseWithInsightRequest();
			fetchMock.postOnce( insightEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} );

			const { container, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			expect( console ).toHaveErrored();
			expect(
				container.querySelector( trafficInsightSelector )
			).not.toBeInTheDocument();
			expect(
				container.querySelector( keyFactorsInsightSelector )
			).not.toBeInTheDocument();
			expect(
				container.querySelector( '.googlesitekit-report-error' )
			).not.toBeInTheDocument();
			expect(
				container.querySelectorAll(
					'.googlesitekit-traffic-overview__key-factor'
				).length
			).toBeGreaterThan( 0 );
		} );

		it.each( [
			[ 'offer a reset of Site Kit to a user who can set it up', true ],
			[ 'offer no reset to a user who cannot set up Site Kit', false ],
		] )(
			'should %s when the Site Kit service has no record of the site',
			async ( _, canSetup ) => {
				provideUserCapabilities( registry, {
					[ PERMISSION_SETUP ]: canSetup,
				} );
				provideBenchmarkingResponseWithInsightRequest();
				fetchMock.postOnce( insightEndpoint, {
					body: {
						code: 'benchmarking_insight_error',
						message:
							'Unable to retrieve site connection. You may need to perform a plugin reset.',
						data: { status: 400, reason: 'SITE_NOT_FOUND' },
					},
					status: 400,
				} );

				const { container, queryByRole, waitForRegistry } = renderPanel(
					{
						features: [ 'typicalTraffic', 'trafficInsights' ],
					}
				);

				await waitForRegistry();

				expect( console ).toHaveErrored();
				expect(
					container.querySelector( trafficInsightSelector )
				).not.toBeInTheDocument();
				expect(
					container.querySelector( keyFactorsInsightSelector )
				).not.toBeInTheDocument();

				const notice = container.querySelector(
					'.googlesitekit-traffic-overview__insight-reset-notice'
				);

				if ( canSetup ) {
					expect( notice ).toHaveTextContent(
						'The Site Kit service no longer recognizes this site.'
					);
					expect(
						queryByRole( 'button', { name: 'Reset Site Kit' } )
					).toBeInTheDocument();
				} else {
					expect( notice ).not.toBeInTheDocument();
				}

				// The figures and the key factor cards show either way.
				expect(
					container.querySelectorAll(
						'.googlesitekit-traffic-overview__key-factor'
					).length
				).toBeGreaterThan( 0 );
			}
		);

		it( 'should not offer a reset when the request for the insight fails for another reason', async () => {
			provideUserCapabilities( registry );
			provideBenchmarkingResponseWithInsightRequest();
			fetchMock.postOnce( insightEndpoint, {
				body: {
					code: 'benchmarking_insight_error',
					message: 'rate limit exceeded',
					data: {
						status: 429,
						reason: 'RATE_LIMITED',
						retryAfter: 60,
					},
				},
				status: 429,
			} );

			const { container, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			expect( console ).toHaveErrored();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__insight-reset-notice'
				)
			).not.toBeInTheDocument();
		} );

		it( 'should leave out the traffic insight without the trafficInsights feature', async () => {
			const { container, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__total-visitors'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector( trafficInsightSelector )
			).not.toBeInTheDocument();
		} );

		it( 'should leave out the traffic insight while the property is gathering data', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			provideAnalytics4MockReport( registry, getTotalsArgs() );

			const { container, getByText, waitForRegistry } = renderPanel( {
				features: [ 'typicalTraffic', 'trafficInsights' ],
			} );

			await waitForRegistry();

			expect( getByText( 'Gathering data…' ) ).toBeInTheDocument();
			expect(
				container.querySelector( trafficInsightSelector )
			).not.toBeInTheDocument();
		} );
	} );
} );
