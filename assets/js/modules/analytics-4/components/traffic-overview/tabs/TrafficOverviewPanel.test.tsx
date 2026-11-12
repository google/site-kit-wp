/**
 * Traffic Overview panel tests.
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
import {
	CORE_USER,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { PLACEHOLDER_TRAFFIC_INSIGHT } from '@/js/modules/analytics-4/components/traffic-overview/components/placeholderTrafficInsight';
import { getTotalsReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import {
	createBenchmarkingResponse,
	getSectionClassNames,
	provideBenchmarkingResponse,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
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
import TrafficOverviewPanel from './TrafficOverviewPanel';

describe( 'TrafficOverviewPanel', () => {
	let registry: WPDataRegistry;

	const reportEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/report'
	);

	/**
	 * Puts a totals report in the store under the arguments the panel requests.
	 *
	 * @since 1.188.0
	 *
	 * @param {number} currentValue  Visitors over the selected range.
	 * @param {number} previousValue Visitors over the range before it.
	 * @param {string} [url]         Optional. The entity URL the report covers.
	 * @return {void}
	 */
	function provideTotalsReport(
		currentValue: number,
		previousValue: number,
		url?: string
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
					...( url ? { url } : {} ),
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
		fetchMock.get( reportEndpoint, { body: {}, status: 200 } );
	} );

	it( 'marks the panel as a tab panel and names it using the content in the "Traffic overview" tab', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

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

	it( 'renders the visitor total, the traffic chart, and the traffic breakdown in that order', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getSectionClassNames( container ) ).toEqual( [
			'googlesitekit-traffic-overview__summary',
			'googlesitekit-traffic-overview__chart',
			'googlesitekit-traffic-overview__breakdown',
		] );
	} );

	it( 'should build the unique visitors from the totals report', async () => {
		provideTotalsReport( 843, 700 );

		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( '843' ) ).toHaveClass(
			'googlesitekit-traffic-overview__unique-visitors-figure'
		);
	} );

	it( 'should build the unique visitors from the entity-scoped totals report', async () => {
		const entityURL = 'https://example.com/about/';

		provideSiteInfo( registry, { currentEntityURL: entityURL } );
		// Only the entity-scoped report is in the store, so these values can
		// only come from the request that has the URL.
		provideTotalsReport( 500, 400, entityURL );

		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( '500' ) ).toHaveClass(
			'googlesitekit-traffic-overview__unique-visitors-figure'
		);
	} );

	it( 'should draw the placeholder visits for each day of the selected range in the chart, and show the placeholder total visits, without the typicalTraffic feature', async () => {
		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		// Google Charts draws nothing under Jest, so this test reads the
		// chart's screen-reader lines instead.
		expect( getByText( 'January 9, 2025: 39 visits' ) ).toBeInTheDocument();
		expect(
			getByText( 'February 5, 2025: 152 visits' )
		).toBeInTheDocument();
		expect( getByText( '1.2K' ) ).toHaveClass(
			'googlesitekit-traffic-overview__total-visits-figure'
		);
	} );

	it( 'should show the placeholder values in the three columns of the traffic breakdown', async () => {
		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		const labelsByColumn = Array.from(
			container.querySelectorAll(
				'.googlesitekit-traffic-overview__breakdown-column'
			)
		).map( ( column ) =>
			Array.from(
				column.querySelectorAll(
					'.googlesitekit-traffic-overview__breakdown-row-label'
				)
			).map( ( label ) => label.textContent )
		);

		expect( labelsByColumn ).toEqual( [
			[ 'Direct', 'Organic Search', 'Organic Social', 'Referral' ],
			[ 'Singapore', 'Brazil', 'China', 'United States' ],
			[ 'desktop', 'mobile', 'tablet' ],
		] );
	} );

	it( 'sends a report request when the panel renders', async () => {
		const { waitForRegistry } = render( <TrafficOverviewPanel />, {
			registry,
		} );

		await waitForRegistry();

		await waitFor( () =>
			expect( fetchMock ).toHaveFetched( reportEndpoint )
		);
	} );

	it( 'should render the three sections as placeholders while the totals report is still loading', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ getTotalsArgs() ] );

		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

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

		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

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

		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toBeInTheDocument();

		act( () => {
			registry.dispatch( CORE_USER ).setDateRange( 'last-14-days' );
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

		const { container, getByRole, getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			getByText( 'The total visitors report failed.' )
		).toBeInTheDocument();
		expect( getByRole( 'button', { name: 'Retry' } ) ).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-traffic-overview__total-visitors'
			)
		).toBeNull();
		expect(
			container.querySelector( '.googlesitekit-traffic-overview__chart' )
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

		const { container, getByRole, queryByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

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
			container.querySelector( '.googlesitekit-traffic-overview__chart' )
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
		registry.dispatch( MODULES_ANALYTICS_4 ).setWebDataStreamID( '13579' );

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

		const { getByText, queryByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( 'Request access' ) ).toBeInTheDocument();
		expect( queryByText( 'Retry' ) ).not.toBeInTheDocument();
	} );

	it( 'should render the "Gathering data…" notice, and "We’re still collecting data" in each of the three columns, while the property is gathering data', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveIsGatheringData( true );

		provideAnalytics4MockReport( registry, getTotalsArgs() );

		const { container, getAllByText, getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( 'Gathering data…' ) ).toBeInTheDocument();
		expect( getAllByText( 'We’re still collecting data' ) ).toHaveLength(
			3
		);
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

		const { container, getByText, queryByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

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
			container.querySelector( '.googlesitekit-traffic-overview__chart' )
		).toBeInTheDocument();
		expect( container.querySelector( '.googlesitekit-cta' ) ).toBeNull();
	} );

	it( 'renders placeholders and requests no report for a view-only user who cannot view Analytics', async () => {
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: false,
		} );

		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY }
		);

		await waitForRegistry();

		expect( getPlaceholderCounts( container ) ).toEqual( {
			totalVisitors: 1,
			chart: 1,
			breakdownRows: 15,
		} );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
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
		 * Renders the panel on the main dashboard with the typicalTraffic
		 * feature, where the panel reads the benchmarking response.
		 *
		 * @since n.e.x.t
		 *
		 * @return {Object} The render result.
		 */
		function renderPanel() {
			return render( <TrafficOverviewPanel />, {
				registry,
				features: [ 'typicalTraffic' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );
		}

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
							current: 90,
							previous: 40,
							sharePct: 61.2,
							attributes: [],
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

		it( 'should say that no channel changed notably when the benchmarking response has no key factor cards', async () => {
			provideBenchmarkingResponse(
				registry,
				createResponse( { keyFactors: [] } )
			);

			const { getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				getByText(
					'No channel changed notably compared with the previous 28 days'
				)
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

		it( 'should render the report error and its "Retry" button in place of the sections when the benchmarking request fails', async () => {
			provideBenchmarkingError();

			const { container, getByRole, getByText, waitForRegistry } =
				renderPanel();

			await waitForRegistry();

			expect(
				getByText( 'The benchmarking request failed.' )
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
					'.googlesitekit-traffic-overview__key-factors'
				)
			).toBeNull();
		} );

		it( 'should request the benchmarking response once again and render the sections on a "Retry" click', async () => {
			provideBenchmarkingError();
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
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__chart'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__key-factors'
				)
			).toBeInTheDocument();
		} );

		it( 'should send no benchmarking request for a view-only user who cannot view Analytics', async () => {
			provideUserCapabilities( registry, {
				[ getMetaCapabilityPropertyName(
					PERMISSION_READ_SHARED_MODULE_DATA,
					MODULE_SLUG_ANALYTICS_4
				) ]: false,
			} );

			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
				}
			);

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
			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

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

			const { getByRole, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect(
				getByRole( 'heading', {
					name: 'Biggest channel shifts vs. the previous 14 days',
				} )
			).toBeInTheDocument();
		} );

		it.each( [
			[ 'with', [ 'typicalTraffic', 'trafficInsights' ], true ],
			[ 'without', [ 'typicalTraffic' ], false ],
		] )(
			'should render the summary above the key factor cards only %s the trafficInsights feature',
			async ( _, features, hasInsight ) => {
				const { container, waitForRegistry } = render(
					<TrafficOverviewPanel />,
					{
						registry,
						features,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				);

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

		it( 'should leave out the key factors without the typicalTraffic feature', async () => {
			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			await waitForRegistry();

			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__breakdown'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector( keyFactorsSelector )
			).not.toBeInTheDocument();
		} );

		it( 'should leave out the key factors on the entity dashboard', async () => {
			provideSiteInfo( registry, {
				currentEntityURL: 'https://example.com/about/',
			} );

			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect(
				container.querySelector(
					'.googlesitekit-traffic-overview__breakdown'
				)
			).toBeInTheDocument();
			expect(
				container.querySelector( keyFactorsSelector )
			).not.toBeInTheDocument();
		} );

		it( 'should leave out the key factors while the property is gathering data', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			provideAnalytics4MockReport( registry, getTotalsArgs() );

			const { container, getByText, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

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

			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

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
		const entityURL = 'https://example.com/about/';

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
		 * Renders the panel on the main dashboard with the typicalTraffic
		 * feature, where the panel reads the benchmarking response.
		 *
		 * @since n.e.x.t
		 *
		 * @return {Object} The render result.
		 */
		function renderPanel() {
			return render( <TrafficOverviewPanel />, {
				registry,
				features: [ 'typicalTraffic' ],
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
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
			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
				'Typical traffic range',
				'Published post',
			] );
		} );

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

		it( 'should draw no typical range on a day of the benchmarking response without bounds', async () => {
			// The first ten days have fewer than 28 days of recorded traffic.
			provideDailyTraffic( ( day, index ) =>
				index < 10
					? { ...day, expectedMin: null, expectedMax: null }
					: day
			);

			const { container, getByText, waitForRegistry } = renderPanel();

			await waitForRegistry();

			expect(
				getByText( 'January 9, 2025: 39 visits' )
			).toBeInTheDocument();
			expect(
				getByText( /^January 19, 2025: \d+ visits, typical range / )
			).toBeInTheDocument();
			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
				'Typical traffic range',
				'Published post',
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

		it( 'should draw neither without the typicalTraffic feature', async () => {
			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			await waitForRegistry();

			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
			] );
		} );

		it( 'should draw neither on the entity dashboard', async () => {
			provideSiteInfo( registry, { currentEntityURL: entityURL } );

			const { container, getByText, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
				}
			);

			await waitForRegistry();

			// The day's line has no typical range.
			expect(
				getByText( 'January 9, 2025: 39 visits' )
			).toBeInTheDocument();
			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
			] );
		} );

		it( 'should draw neither while the property is gathering data', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );

			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
			] );
		} );
	} );

	describe( 'traffic insight', () => {
		const trafficInsightSelector =
			'.googlesitekit-traffic-overview__traffic-insight';

		beforeEach( () => {
			// With the typicalTraffic feature, the panel waits for the
			// benchmarking response before it renders the insight.
			provideBenchmarkingResponse( registry );
		} );

		it( 'should render the traffic insight above the visitor figures on the main dashboard', async () => {
			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic', 'trafficInsights' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

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
			expect(
				container.querySelector( trafficInsightSelector )
			).toHaveTextContent( PLACEHOLDER_TRAFFIC_INSIGHT );
		} );

		it.each( [
			[ 'trafficInsights', [ 'typicalTraffic' ] ],
			[ 'typicalTraffic', [ 'trafficInsights' ] ],
		] )(
			'should leave out the traffic insight without the %s feature',
			async ( _, features ) => {
				const { container, waitForRegistry } = render(
					<TrafficOverviewPanel />,
					{
						registry,
						features,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				);

				await waitForRegistry();

				expect(
					container.querySelector(
						'.googlesitekit-traffic-overview__total-visitors'
					)
				).toBeInTheDocument();
				expect(
					container.querySelector( trafficInsightSelector )
				).not.toBeInTheDocument();
			}
		);

		it( 'should leave out the traffic insight on the entity dashboard', async () => {
			provideSiteInfo( registry, {
				currentEntityURL: 'https://example.com/about/',
			} );

			const { container, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic', 'trafficInsights' ],
					viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
				}
			);

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

			const { container, getByText, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic', 'trafficInsights' ],
					viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
				}
			);

			await waitForRegistry();

			expect( getByText( 'Gathering data…' ) ).toBeInTheDocument();
			expect(
				container.querySelector( trafficInsightSelector )
			).not.toBeInTheDocument();
		} );
	} );
} );
