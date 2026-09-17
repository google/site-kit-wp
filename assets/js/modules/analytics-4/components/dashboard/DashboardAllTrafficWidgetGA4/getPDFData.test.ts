/**
 * DashboardAllTrafficWidgetGA4 getPDFData tests.
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
import fetchMock from 'fetch-mock-jest';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import ensureGoogleChartsLoaded from '@/js/components/pdf-export/ensure-google-charts-loaded';
import { PIE_CHART_COLORS } from '@/js/components/pdf-export/pdf-theme';
import renderGoogleChartToDataURI from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import getPDFData, { GetPDFDataParams } from './getPDFData';
import {
	CHANNELS_BREAKDOWN_REPORT_ID,
	DEVICES_BREAKDOWN_REPORT_ID,
	LOCATIONS_BREAKDOWN_REPORT_ID,
	getBreakdownReportArgs,
	getGraphReportArgs,
	getTotalsReportArgs,
} from './reportOptions';

jest.mock( '@/js/components/pdf-export/ensure-google-charts-loaded', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock(
	'@/js/components/pdf-export/render-google-chart-to-data-uri',
	() => ( {
		// Keep the real `getVisualization`, which `getPDFData` uses to build the
		// DataTable. Mock only the default export that renders charts to images.
		...jest.requireActual(
			'@/js/components/pdf-export/render-google-chart-to-data-uri'
		),
		__esModule: true,
		default: jest.fn(),
	} )
);

const mockEnsureGoogleChartsLoaded =
	ensureGoogleChartsLoaded as jest.MockedFunction<
		typeof ensureGoogleChartsLoaded
	>;
const mockRenderGoogleChartToDataURI =
	renderGoogleChartToDataURI as jest.MockedFunction<
		typeof renderGoogleChartToDataURI
	>;

const LINE_CHART_DATA_URI = 'data:image/jpeg;base64,TElORQ==';
const CHANNEL_CHART_DATA_URI = 'data:image/jpeg;base64,Q0hBTg==';
const LOCATION_CHART_DATA_URI = 'data:image/jpeg;base64,TE9DQQ==';
const DEVICE_CHART_DATA_URI = 'data:image/jpeg;base64,REVWSQ==';

type Registry = WPDataRegistry & GetPDFDataParams[ 'registry' ];

const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

const channelsArgs = getBreakdownReportArgs( {
	dimensionName: 'sessionDefaultChannelGrouping',
	reportID: CHANNELS_BREAKDOWN_REPORT_ID,
	...DATES,
} );
const locationsArgs = getBreakdownReportArgs( {
	dimensionName: 'country',
	reportID: LOCATIONS_BREAKDOWN_REPORT_ID,
	...DATES,
} );
const devicesArgs = getBreakdownReportArgs( {
	dimensionName: 'deviceCategory',
	reportID: DEVICES_BREAKDOWN_REPORT_ID,
	...DATES,
} );

/**
 * Builds a breakdown report with the comparison-range dimension the dashboard's
 * `extractAnalyticsDataForPieChart` helper expects.
 *
 * @since 1.183.0
 *
 * @param entries Ordered `[ label, users ]` pairs for the current range.
 * @return A GA4 report with current-range rows.
 */
function buildBreakdownReport( entries: Array< [ string, number ] > ) {
	return {
		rows: entries.map( ( [ label, users ] ) => ( {
			dimensionValues: [ { value: label }, { value: 'date_range_0' } ],
			metricValues: [ { value: String( users ) } ],
		} ) ),
	};
}

function setGoogle( value: unknown ) {
	( global as unknown as { google?: unknown } ).google = value;
}

describe( 'DashboardAllTrafficWidgetGA4 getPDFData', () => {
	let registry: Registry;
	let dataTable: { addColumn: jest.Mock; addRows: jest.Mock };

	/**
	 * Dispatches the reports the line chart reads, with empty breakdowns so the
	 * line chart is the only chart that renders.
	 *
	 * @since n.e.x.t
	 *
	 * @param  dailyUsers One user count per day, starting on 2025-01-08.
	 * @return {void}
	 */
	function provideLineChartReports( dailyUsers: number[] ) {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [ { metricValues: [ { value: '100' } ] } ] },
				{ options: getTotalsReportArgs( DATES ) }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: dailyUsers.map( ( users, index ) => ( {
					dimensionValues: [
						{
							value: `202501${ String( 8 + index ).padStart(
								2,
								'0'
							) }`,
						},
					],
					metricValues: [ { value: String( users ) } ],
				} ) ),
			},
			{
				options: getGraphReportArgs( {
					startDate: DATES.startDate,
					endDate: DATES.endDate,
				} ),
			}
		);
		[ channelsArgs, locationsArgs, devicesArgs ].forEach( ( options ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( buildBreakdownReport( [] ), { options } );
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );

		mockEnsureGoogleChartsLoaded.mockReset().mockResolvedValue( undefined );
		mockRenderGoogleChartToDataURI
			.mockReset()
			.mockResolvedValue( LINE_CHART_DATA_URI );

		// `getPDFData` builds each chart's data with `new google.visualization.DataTable()`.
		dataTable = { addColumn: jest.fn(), addRows: jest.fn() };
		setGoogle( {
			visualization: { DataTable: jest.fn( () => dataTable ) },
		} );
	} );

	afterEach( () => {
		setGoogle( undefined );
	} );

	it( 'should resolve the totals, graph, and three breakdown reports in parallel and return the expected shape', async () => {
		const totalsReport = {
			totals: [ { metricValues: [ { value: '100' } ] } ],
		};
		const graphReport = {
			rows: [
				{
					dimensionValues: [ { value: '20250108' } ],
					metricValues: [ { value: '10' } ],
				},
			],
		};
		const channelReport = buildBreakdownReport( [
			[ 'Organic Search', 3 ],
			[ 'Direct', 1 ],
		] );
		const locationReport = buildBreakdownReport( [
			[ 'Singapore', 1 ],
			[ 'Brazil', 1 ],
		] );
		const deviceReport = buildBreakdownReport( [
			[ 'Desktop', 3 ],
			[ 'Mobile', 1 ],
		] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( totalsReport, {
				options: getTotalsReportArgs( DATES ),
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( graphReport, {
				options: getGraphReportArgs( {
					startDate: DATES.startDate,
					endDate: DATES.endDate,
				} ),
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( channelReport, { options: channelsArgs } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( locationReport, { options: locationsArgs } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( deviceReport, { options: devicesArgs } );

		// The line chart renders first, then the channel, location, and device
		// donuts, in that order.
		mockRenderGoogleChartToDataURI
			.mockReset()
			.mockResolvedValueOnce( LINE_CHART_DATA_URI )
			.mockResolvedValueOnce( CHANNEL_CHART_DATA_URI )
			.mockResolvedValueOnce( LOCATION_CHART_DATA_URI )
			.mockResolvedValueOnce( DEVICE_CHART_DATA_URI );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data ).toEqual( {
			totalsReport,
			graphReport,
			channelBreakdown: [
				{ label: 'Organic Search', percentage: 0.75 },
				{ label: 'Direct', percentage: 0.25 },
			],
			locationBreakdown: [
				{ label: 'Singapore', percentage: 0.5 },
				{ label: 'Brazil', percentage: 0.5 },
			],
			deviceBreakdown: [
				{ label: 'Desktop', percentage: 0.75 },
				{ label: 'Mobile', percentage: 0.25 },
			],
		} );
		expect( result.chartImages ).toEqual( {
			lineChart: LINE_CHART_DATA_URI,
			channelChart: CHANNEL_CHART_DATA_URI,
			locationChart: LOCATION_CHART_DATA_URI,
			deviceChart: DEVICE_CHART_DATA_URI,
		} );

		// The resolver returns early when data is already present, so it makes
		// no network request.
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should load Google Charts and render the line chart with the expected DataTable and options', async () => {
		provideLineChartReports( [ 10, 20 ] );

		const signal = new AbortController().signal;
		const result = await getPDFData( { registry, dates: DATES, signal } );

		expect( mockEnsureGoogleChartsLoaded ).toHaveBeenCalledTimes( 1 );

		// The DataTable mirrors the dashboard's UserCountGraph shape: a date
		// column followed by a total-users column.
		expect( dataTable.addColumn ).toHaveBeenNthCalledWith(
			1,
			'date',
			'Day'
		);
		expect( dataTable.addColumn ).toHaveBeenNthCalledWith(
			2,
			'number',
			'Users'
		);
		expect( dataTable.addRows ).toHaveBeenCalledWith( [
			[ new Date( 2025, 0, 8 ), 10 ],
			[ new Date( 2025, 0, 9 ), 20 ],
		] );

		expect( mockRenderGoogleChartToDataURI ).toHaveBeenCalledTimes( 1 );
		const renderArgs = mockRenderGoogleChartToDataURI.mock.calls[ 0 ][ 0 ];
		expect( renderArgs.chartType ).toBe( 'LineChart' );
		expect( renderArgs.width ).toBe( 506 );
		expect( renderArgs.height ).toBe( 133 );
		expect( renderArgs.signal ).toBe( signal );
		expect( renderArgs.dataTable ).toBe( dataTable );
		expect( renderArgs.options ).toMatchObject( {
			curveType: 'function',
			colors: [ '#3c7251' ],
			legend: { position: 'none' },
			hAxis: {
				format: 'MMM d',
				textStyle: { fontName: 'Google Sans Text' },
			},
			// The series renders against axis 1, so that axis carries the
			// styling and the shortened number format. Axis 0 draws nothing.
			vAxes: {
				0: { textPosition: 'none' },
				1: {
					format: 'short',
					textStyle: { fontName: 'Google Sans Text' },
				},
			},
			series: { 0: { color: '#3c7251', lineWidth: 4 } },
		} );

		expect( result.chartImages?.lineChart ).toBe( LINE_CHART_DATA_URI );
	} );

	it.each( [
		[ 20, 21 ],
		[ 5500, 38 ],
	] )(
		'should reserve the label width a peak of %p users needs',
		async ( peakUsers, expectedGutter ) => {
			provideLineChartReports( [ peakUsers / 2, peakUsers ] );

			await getPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			// `5.5K` takes two characters more than `20`, so its labels need a
			// wider column beside the plot.
			expect(
				mockRenderGoogleChartToDataURI.mock.calls[ 0 ][ 0 ].options
			).toMatchObject( { chartArea: { right: expectedGutter } } );
		}
	);

	it( 'should collapse a long breakdown to the top slices plus a single Others row', async () => {
		const totalsReport = {
			totals: [ { metricValues: [ { value: '210' } ] } ],
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( totalsReport, {
				options: getTotalsReportArgs( DATES ),
			} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: getGraphReportArgs( {
					startDate: DATES.startDate,
					endDate: DATES.endDate,
				} ),
			}
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [] ), {
				options: channelsArgs,
			} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			buildBreakdownReport( [
				[ 'Singapore', 60 ],
				[ 'Brazil', 50 ],
				[ 'China', 40 ],
				[ 'United States', 30 ],
				[ 'India', 20 ],
				[ 'Canada', 10 ],
			] ),
			{ options: locationsArgs }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [] ), {
				options: devicesArgs,
			} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		// Six countries collapse to the top four plus a single "Others" row,
		// matching the dashboard's five-slice pie.
		const locationLabels = result.data?.locationBreakdown?.map(
			( { label } ) => label
		);
		expect( locationLabels ).toEqual( [
			'Singapore',
			'Brazil',
			'China',
			'United States',
			'Others',
		] );
		expect( result.chartImages?.locationChart ).toBe( LINE_CHART_DATA_URI );
	} );

	it( 'should render each donut as a PieChart with the shared colors', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [ { metricValues: [ { value: '100' } ] } ] },
				{ options: getTotalsReportArgs( DATES ) }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: getGraphReportArgs( {
					startDate: DATES.startDate,
					endDate: DATES.endDate,
				} ),
			}
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Direct', 1 ] ] ), {
				options: channelsArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Brazil', 1 ] ] ), {
				options: locationsArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Mobile', 1 ] ] ), {
				options: devicesArgs,
			} );

		await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		const pieCalls = mockRenderGoogleChartToDataURI.mock.calls.filter(
			( [ args ] ) => args.chartType === 'PieChart'
		);
		expect( pieCalls ).toHaveLength( 3 );
		pieCalls.forEach( ( [ args ] ) => {
			expect( args.options ).toMatchObject( {
				pieHole: 0.542,
				colors: PIE_CHART_COLORS,
				// The donut segments touch, with no white separator.
				pieSliceBorderColor: 'transparent',
			} );
			// The donut renders at 4x its display size so its edges stay sharp.
			expect( args.scaleFactor ).toBe( 4 );
		} );
	} );

	it( 'should still return the other breakdowns when one breakdown report fails', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [ { metricValues: [ { value: '100' } ] } ] },
				{ options: getTotalsReportArgs( DATES ) }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: getGraphReportArgs( {
					startDate: DATES.startDate,
					endDate: DATES.endDate,
				} ),
			}
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Direct', 1 ] ] ), {
				options: channelsArgs,
			} );
		// The locations report is missing the comparison-range dimension, so it
		// cannot be turned into slices. Only its tile should fall back to the
		// placeholder.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					{
						dimensionValues: [ { value: 'Brazil' } ],
						metricValues: [ { value: '1' } ],
					},
				],
			},
			{ options: locationsArgs }
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Mobile', 1 ] ] ), {
				options: devicesArgs,
			} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.locationBreakdown ).toBeNull();
		expect( result.chartImages?.locationChart ).toBeUndefined();

		expect( result.data?.channelBreakdown ).toEqual( [
			{ label: 'Direct', percentage: 1 },
		] );
		expect( result.chartImages?.channelChart ).toBe( LINE_CHART_DATA_URI );
		expect( result.data?.deviceBreakdown ).toEqual( [
			{ label: 'Mobile', percentage: 1 },
		] );
		expect( result.chartImages?.deviceChart ).toBe( LINE_CHART_DATA_URI );
	} );

	it( 'should still return the other breakdowns when one breakdown chart render fails', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [ { metricValues: [ { value: '100' } ] } ] },
				{ options: getTotalsReportArgs( DATES ) }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: getGraphReportArgs( {
					startDate: DATES.startDate,
					endDate: DATES.endDate,
				} ),
			}
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Direct', 1 ] ] ), {
				options: channelsArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Brazil', 1 ] ] ), {
				options: locationsArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Mobile', 1 ] ] ), {
				options: devicesArgs,
			} );

		// Line chart resolves, then the channel donut resolves, the location
		// donut render throws, and the device donut resolves.
		mockRenderGoogleChartToDataURI
			.mockReset()
			.mockResolvedValueOnce( LINE_CHART_DATA_URI )
			.mockResolvedValueOnce( CHANNEL_CHART_DATA_URI )
			.mockRejectedValueOnce( new Error( 'render failed' ) )
			.mockResolvedValueOnce( DEVICE_CHART_DATA_URI );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.locationBreakdown ).toBeNull();
		expect( result.chartImages?.locationChart ).toBeUndefined();

		expect( result.chartImages?.channelChart ).toBe(
			CHANNEL_CHART_DATA_URI
		);
		expect( result.chartImages?.deviceChart ).toBe( DEVICE_CHART_DATA_URI );
	} );

	it( 'should forward the current entity URL when one is set', async () => {
		const entityURL = 'https://example.com/post-1';
		provideSiteInfo( registry, { currentEntityURL: entityURL } );

		fetchMock.get( reportEndpoint, ( url ) => {
			const requestedURL = new URL(
				url.startsWith( 'http' ) ? url : `http://example.com${ url }`
			);
			const requestedID =
				requestedURL.searchParams.get( 'reportID' ) || '';
			return {
				body: requestedID.endsWith( 'graphArgs' )
					? { rows: [] }
					: { totals: [] },
				status: 200,
			};
		} );

		await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		const calls = fetchMock.calls( reportEndpoint );
		// Totals, graph, and the three breakdown reports each include the URL.
		expect( calls ).toHaveLength( 5 );
		for ( const [ requestedURL ] of calls ) {
			expect( requestedURL ).toContain( encodeURIComponent( entityURL ) );
		}
	} );

	it( 'should forward the abort signal to each report request', async () => {
		fetchMock.get( reportEndpoint, { body: { rows: [] }, status: 200 } );

		const { signal } = new AbortController();

		await getPDFData( {
			registry,
			dates: DATES,
			signal,
		} );

		// The registry starts resolver runs from a timeout. Wait the
		// timeouts out, so an extra run would add its request to the calls
		// this test counts.
		await waitForDefaultTimeouts();

		const signals = fetchMock
			.calls( reportEndpoint )
			.map( ( [ , options ] ) => options?.signal );

		// Check with `toBe` that each request received this exact signal
		// object. Every `AbortSignal` looks the same to `toEqual`, so a
		// `toEqual` check could pass with the wrong signal.
		expect( signals ).toHaveLength( 5 );
		signals.forEach( ( forwardedSignal ) => {
			expect( forwardedSignal ).toBe( signal );
		} );
	} );

	it( 'should stop building the report without dispatching a request when signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		// No chart work happens once the export is aborted.
		expect( mockEnsureGoogleChartsLoaded ).not.toHaveBeenCalled();
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );

	it( 'should stop building the report when signal aborts after the request is dispatched but is not yet resolved', async () => {
		const controller = new AbortController();
		const deferredResolvers: Array< () => void > = [];

		fetchMock.get( reportEndpoint, () => {
			return new Promise< { body: unknown; status: number } >(
				( resolve ) => {
					deferredResolvers.push( () =>
						resolve( {
							body: { rows: [] },
							status: 200,
						} )
					);
				}
			);
		} );

		const pdfPromise = getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		// Wait for the report fetches to dispatch before aborting.
		while ( deferredResolvers.length < 2 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		controller.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		const result = await pdfPromise;

		expect( result ).toEqual( { data: null } );
		expect( fetchMock ).toHaveFetched( reportEndpoint );
		// The post-fetch abort check runs before any chart is rendered.
		expect( mockEnsureGoogleChartsLoaded ).not.toHaveBeenCalled();
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );

	it( 'should not render any chart once the export is aborted before the chart stage', async () => {
		const controller = new AbortController();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [ { metricValues: [ { value: '100' } ] } ] },
				{ options: getTotalsReportArgs( DATES ) }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: getGraphReportArgs( {
					startDate: DATES.startDate,
					endDate: DATES.endDate,
				} ),
			}
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Direct', 1 ] ] ), {
				options: channelsArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Brazil', 1 ] ] ), {
				options: locationsArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Mobile', 1 ] ] ), {
				options: devicesArgs,
			} );

		// The export is canceled while Google Charts loads, so the abort
		// check after it stops the run before the line chart or any donut.
		mockEnsureGoogleChartsLoaded.mockReset().mockImplementation( () => {
			controller.abort();
			return Promise.resolve();
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );

	it( 'should fetch the reports again when a new run starts after an aborted run', async () => {
		const firstController = new AbortController();
		const deferredResolvers: Array< () => void > = [];
		let requestCount = 0;

		fetchMock.get( reportEndpoint, () => {
			requestCount++;

			// Keep the first run's five requests waiting, so the abort happens
			// while they still run. Later requests get a normal response.
			if ( requestCount <= 5 ) {
				return new Promise< { body: unknown; status: number } >(
					( resolve ) => {
						deferredResolvers.push( () =>
							resolve( { body: { rows: [] }, status: 200 } )
						);
					}
				);
			}

			return { body: { rows: [] }, status: 200 };
		} );

		const firstRun = getPDFData( {
			registry,
			dates: DATES,
			signal: firstController.signal,
		} );

		// Wait for all five report requests to start before aborting.
		while ( deferredResolvers.length < 5 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		firstController.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		expect( await firstRun ).toEqual( { data: null } );
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 5 );

		const secondRun = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 10 );
		expect( secondRun.data ).toEqual( {
			totalsReport: { rows: [] },
			graphReport: { rows: [] },
			channelBreakdown: null,
			locationBreakdown: null,
			deviceBreakdown: null,
		} );
		expect( secondRun.chartImages?.lineChart ).toBe( LINE_CHART_DATA_URI );
	} );
} );
