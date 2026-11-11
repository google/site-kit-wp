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
import { TRAFFIC_BREAKDOWN_COLUMNS } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/columns';
import { PLACEHOLDER_TRAFFIC_INSIGHT } from '@/js/modules/analytics-4/components/traffic-overview/components/placeholderTrafficInsight';
import {
	getBreakdownReportArgs,
	getGraphReportArgs,
	getTotalsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { getSectionClassNames } from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { ReportOptions } from '@/js/modules/analytics-4/datastore/types';
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
	 * Builds the five argument sets the panel passes to `getReport`, in this
	 * order:
	 *
	 * 1. totals
	 * 2. graph
	 * 3. channels
	 * 4. locations
	 * 5. devices.
	 *
	 * @since 1.189.0
	 *
	 * @param {string} [url] Optional. The entity URL the reports cover.
	 * @return {Array<Object>} The five argument sets.
	 */
	function getReportArgs( url?: string ): ReportOptions[] {
		const { startDate, endDate, compareStartDate, compareEndDate } =
			registry.select( CORE_USER ).getDateRangeDates( { compare: true } );

		const shared = { startDate, endDate, ...( url ? { url } : {} ) };

		return [
			getTotalsReportArgs( {
				...shared,
				compareStartDate,
				compareEndDate,
			} ),
			getGraphReportArgs( shared ),
			...TRAFFIC_BREAKDOWN_COLUMNS.map( ( { dimensionName, reportID } ) =>
				getBreakdownReportArgs( { ...shared, dimensionName, reportID } )
			),
		];
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

	it( 'builds the visitor total and its badge from the totals report', async () => {
		provideTotalsReport( 1200, 1000 );

		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( '1.2K' ) ).toBeInTheDocument();
		expect( getByText( '+20%' ) ).toBeInTheDocument();
	} );

	it( 'builds the visitor total and its badge from the entity-scoped totals report', async () => {
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

		expect( getByText( '500' ) ).toBeInTheDocument();
		expect( getByText( '+25%' ) ).toBeInTheDocument();
	} );

	it( "shows each day's visitors in the chart", async () => {
		provideAnalytics4MockReport(
			registry,
			getGraphReportArgs( {
				startDate: '2025-01-09',
				endDate: '2025-02-05',
			} )
		);

		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{
				registry,
			}
		);

		await waitForRegistry();

		// Google Charts draws nothing under Jest, so this test reads the
		// chart's screen-reader lines instead.
		expect(
			getByText( 'January 9, 2025: 55 visitors' )
		).toBeInTheDocument();
		expect(
			getByText( 'January 10, 2025: 14 visitors' )
		).toBeInTheDocument();
	} );

	it( "shows each day's visitors to the current URL in the chart on the entity dashboard", async () => {
		const entityURL = 'https://example.com/about/';

		provideSiteInfo( registry, { currentEntityURL: entityURL } );
		provideAnalytics4MockReport(
			registry,
			getGraphReportArgs( {
				startDate: '2025-01-09',
				endDate: '2025-02-05',
				url: entityURL,
			} )
		);

		const { getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			getByText( 'January 9, 2025: 69 visitors' )
		).toBeInTheDocument();
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

	it( 'renders the three sections as placeholders while one of the five reports is still loading', async () => {
		const [
			totalsArgs,
			graphArgs,
			channelsArgs,
			locationsArgs,
			devicesArgs,
		] = getReportArgs();

		[ totalsArgs, graphArgs, channelsArgs, locationsArgs ].forEach(
			( options ) => provideAnalytics4MockReport( registry, options )
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ devicesArgs ] );

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

	it( 'renders the visitor total, the chart and the three columns together when the last of the five reports arrives', async () => {
		const [
			totalsArgs,
			graphArgs,
			channelsArgs,
			locationsArgs,
			devicesArgs,
		] = getReportArgs();

		[ totalsArgs, graphArgs, channelsArgs, locationsArgs ].forEach(
			( options ) => provideAnalytics4MockReport( registry, options )
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.startResolution( 'getReport', [ devicesArgs ] );

		const { container, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toBeNull();

		act( () => {
			provideAnalytics4MockReport( registry, devicesArgs );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ devicesArgs ] );
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
		getReportArgs().forEach( ( options ) =>
			provideAnalytics4MockReport( registry, options )
		);

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
			getReportArgs().forEach( ( options ) =>
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.startResolution( 'getReport', [ options ] )
			);
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

	it( 'renders the report error and its "Retry" button in place of the three sections when one report fails', async () => {
		const [
			totalsArgs,
			graphArgs,
			channelsArgs,
			locationsArgs,
			devicesArgs,
		] = getReportArgs();

		[ totalsArgs, graphArgs, channelsArgs, locationsArgs ].forEach(
			( options ) =>
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetReport( {}, { options } )
		);

		registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
			{
				code: 'test_error',
				message: 'The devices report failed.',
				data: { status: 500, reason: 'backendError' },
			},
			'getReport',
			[ devicesArgs ]
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getReport', [ devicesArgs ] );

		const { container, getByRole, getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( 'The devices report failed.' ) ).toBeInTheDocument();
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

	it( 'requests the five reports again and renders the three sections on a "Retry" click', async () => {
		getReportArgs().forEach( ( options ) => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
				{
					code: 'test_error',
					message: 'The traffic reports failed.',
					data: { status: 500, reason: 'backendError' },
				},
				'getReport',
				[ options ]
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		} );

		const { container, getByRole, queryByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: 'Retry' } ) );

		await waitFor( () =>
			expect( fetchMock ).toHaveFetchedTimes( 5, reportEndpoint )
		);
		await waitFor( () =>
			expect(
				queryByText( 'The traffic reports failed.' )
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

		getReportArgs().forEach( ( options ) => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setErrorForSelector(
				{
					code: 'test_error',
					message: 'Request had insufficient authentication scopes.',
					data: { status: 403, reason: 'insufficientPermissions' },
				},
				'getReport',
				[ options ]
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'getReport', [ options ] );
		} );

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

		getReportArgs().forEach( ( options ) =>
			provideAnalytics4MockReport( registry, options )
		);

		const { container, getAllByText, getByText, waitForRegistry } = render(
			<TrafficOverviewPanel />,
			{ registry }
		);

		await waitForRegistry();

		expect( getByText( 'Gathering data…' ) ).toBeInTheDocument();
		expect( getAllByText( 'We’re still collecting data' ) ).toHaveLength(
			3
		);
		// The five reports resolved, and no figure from them reaches the screen.
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

	it( 'renders 0 visitors, a 0% badge and three empty columns when the reports show no traffic', async () => {
		const [ totalsArgs, ...remainingArgs ] = getReportArgs();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				totals: [
					{ metricValues: [ { value: '0' } ] },
					{ metricValues: [ { value: '0' } ] },
				],
			},
			{ options: totalsArgs }
		);
		remainingArgs.forEach( ( options ) =>
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( {}, { options } )
		);

		const {
			container,
			getAllByText,
			getByText,
			queryByText,
			waitForRegistry,
		} = render( <TrafficOverviewPanel />, { registry } );

		await waitForRegistry();

		expect( getByText( '0' ) ).toBeInTheDocument();
		expect( getPlaceholderCounts( container ) ).toEqual( {
			totalVisitors: 0,
			chart: 0,
			breakdownRows: 0,
		} );
		expect( queryByText( 'Gathering data…' ) ).not.toBeInTheDocument();
		expect(
			container.querySelector( '.googlesitekit-change-badge' )
		).toHaveTextContent( '0%' );
		expect(
			getAllByText(
				'No data to display: your site hasn’t received any visitors yet'
			)
		).toHaveLength( 3 );
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

	describe( 'key factors', () => {
		const keyFactorsSelector =
			'.googlesitekit-traffic-overview__key-factors';

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

			getReportArgs().forEach( ( options ) =>
				provideAnalytics4MockReport( registry, options )
			);

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

		it( 'should render the key factors as three placeholder cards while one of the five reports is still loading, and the cards once it arrives', async () => {
			const [
				totalsArgs,
				graphArgs,
				channelsArgs,
				locationsArgs,
				devicesArgs,
			] = getReportArgs();

			[ totalsArgs, graphArgs, channelsArgs, locationsArgs ].forEach(
				( options ) => provideAnalytics4MockReport( registry, options )
			);
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.startResolution( 'getReport', [ devicesArgs ] );

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
				provideAnalytics4MockReport( registry, devicesArgs );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getReport', [ devicesArgs ] );
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

		/**
		 * Puts a daily-visitors report with traffic on every day in the store.
		 *
		 * @since n.e.x.t
		 *
		 * @param {string} [url] Optional. The entity URL the report covers.
		 * @return {void}
		 */
		function provideGraphReport( url?: string ) {
			provideAnalytics4MockReport(
				registry,
				getGraphReportArgs( {
					startDate: '2025-01-09',
					endDate: '2025-02-05',
					...( url ? { url } : {} ),
				} )
			);
		}

		it( 'should draw the typical traffic range and the published posts on the chart on the main dashboard', async () => {
			provideGraphReport();

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

		it( 'should draw neither without the typicalTraffic feature', async () => {
			provideGraphReport();

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
			provideGraphReport( entityURL );

			const { container, getByText, waitForRegistry } = render(
				<TrafficOverviewPanel />,
				{
					registry,
					features: [ 'typicalTraffic' ],
					viewContext: VIEW_CONTEXT_ENTITY_DASHBOARD,
				}
			);

			await waitForRegistry();

			// The day's line, with no typical range, shows the chart has the
			// entity's report.
			expect(
				getByText( 'January 9, 2025: 69 visitors' )
			).toBeInTheDocument();
			expect( getLegendLabels( container ) ).toEqual( [
				'Last 28 days traffic',
			] );
		} );

		it( 'should draw neither while the property is gathering data', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );
			provideGraphReport();

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

			getReportArgs().forEach( ( options ) =>
				provideAnalytics4MockReport( registry, options )
			);

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
