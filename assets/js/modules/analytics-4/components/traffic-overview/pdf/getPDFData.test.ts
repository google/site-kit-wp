/**
 * Traffic Overview getPDFData tests.
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
import renderGoogleChartToDataURI from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { mockChartAxisLabels } from '@/js/components/pdf-export/test-utils';
import { PLACEHOLDER_TRAFFIC_BREAKDOWN } from '@/js/modules/analytics-4/components/traffic-overview/breakdown/placeholderTrafficBreakdown';
import { getPlaceholderDailyTraffic } from '@/js/modules/analytics-4/components/traffic-overview/charts/placeholderTrafficChartData';
import { getTotalsReportArgs } from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import { getBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import {
	createTestRegistry,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import getPDFData, { GetPDFDataParams } from './getPDFData';

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

type Registry = WPDataRegistry & GetPDFDataParams[ 'registry' ];

const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

/** A 28-day range, and the 28 days before it. */
const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

function setGoogle( value: unknown ) {
	( global as unknown as { google?: unknown } ).google = value;
}

/**
 * Seeds the totals report so `getPDFData` resolves it from state without a
 * network request.
 *
 * @since 1.189.0
 * @since n.e.x.t Renamed from `seedTotalsAndGraphReports()`, and seeds the totals report alone.
 *
 * @param {Object} testRegistry Registry to seed.
 * @return {void}
 */
function seedTotalsReport( testRegistry: Registry ) {
	testRegistry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport(
			{ totals: [ { metricValues: [ { value: '100' } ] } ] },
			{ options: getTotalsReportArgs( DATES ) }
		);
}

describe( 'Traffic Overview getPDFData', () => {
	let registry: Registry;
	let dataTable: { addColumn: jest.Mock; addRows: jest.Mock };

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );

		mockEnsureGoogleChartsLoaded.mockReset().mockResolvedValue( undefined );
		mockRenderGoogleChartToDataURI
			.mockReset()
			.mockResolvedValue( LINE_CHART_DATA_URI );

		// `getPDFData` builds the chart's data with `new google.visualization.DataTable()`.
		dataTable = { addColumn: jest.fn(), addRows: jest.fn() };
		setGoogle( {
			visualization: {
				DataTable: jest.fn( () => dataTable ),
				...mockChartAxisLabels(),
			},
		} );
	} );

	afterEach( () => {
		setGoogle( undefined );
	} );

	it( 'should request the totals report over the selected range, with no entity URL', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [] },
				{ options: getTotalsReportArgs( DATES ) }
			);

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.data?.totalsReport ).toEqual( { totals: [] } );
	} );

	it( 'should request the totals report with the current entity URL when one is set', async () => {
		const entityURL = 'https://example.com/post-1';
		provideSiteInfo( registry, { currentEntityURL: entityURL } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [] },
				{ options: getTotalsReportArgs( { ...DATES, url: entityURL } ) }
			);

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.data?.totalsReport ).toEqual( { totals: [] } );
	} );

	it( "should give the dashboard's placeholder daily traffic, and the rows `getBreakdownRows()` shapes from its placeholder breakdown", async () => {
		seedTotalsReport( registry );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data ).toEqual( {
			totalsReport: {
				totals: [ { metricValues: [ { value: '100' } ] } ],
			},
			dailyTraffic: getPlaceholderDailyTraffic(
				DATES.startDate,
				DATES.endDate
			),
			channelBreakdown: getBreakdownRows(
				PLACEHOLDER_TRAFFIC_BREAKDOWN.channels
			),
			locationBreakdown: getBreakdownRows(
				PLACEHOLDER_TRAFFIC_BREAKDOWN.locations
			),
			deviceBreakdown: getBreakdownRows(
				PLACEHOLDER_TRAFFIC_BREAKDOWN.devices
			),
		} );
	} );

	it( 'returns chartImages holding only lineChart', async () => {
		seedTotalsReport( registry );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.chartImages ).toEqual( {
			lineChart: LINE_CHART_DATA_URI,
		} );
		expect( mockRenderGoogleChartToDataURI ).toHaveBeenCalledTimes( 1 );
		expect(
			mockRenderGoogleChartToDataURI.mock.calls[ 0 ][ 0 ].chartType
		).toBe( 'LineChart' );
	} );

	it( 'should write the value labels in short form, make their space 45 pixels wide, and label every day of a 7-day range', async () => {
		const sevenDays = {
			startDate: '2025-01-08',
			endDate: '2025-01-14',
			compareStartDate: '2025-01-01',
			compareEndDate: '2025-01-07',
		};

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [ { metricValues: [ { value: '8400' } ] } ] },
				{ options: getTotalsReportArgs( sevenDays ) }
			);

		await getPDFData( {
			registry,
			dates: sevenDays,
			signal: new AbortController().signal,
		} );

		// The placeholder daily traffic tops out at 152 visits, so the labels
		// are written in short form.
		expect(
			mockRenderGoogleChartToDataURI.mock.calls[ 0 ][ 0 ].options
		).toMatchObject( {
			chartArea: { right: 45 },
			hAxis: {
				ticks: [
					{ f: 'Jan 8' },
					{ f: 'Jan 9' },
					{ f: 'Jan 10' },
					{ f: 'Jan 11' },
					{ f: 'Jan 12' },
					{ f: 'Jan 13' },
					{ f: 'Jan 14' },
				],
			},
			vAxis: { format: 'short' },
		} );
	} );

	it( 'should draw the line chart with one point for each day of the placeholder daily traffic', async () => {
		seedTotalsReport( registry );

		const signal = new AbortController().signal;
		const result = await getPDFData( { registry, dates: DATES, signal } );

		expect( mockEnsureGoogleChartsLoaded ).toHaveBeenCalledTimes( 1 );

		expect( dataTable.addColumn ).toHaveBeenNthCalledWith(
			1,
			'date',
			'Day'
		);
		expect( dataTable.addColumn ).toHaveBeenNthCalledWith(
			2,
			'number',
			'Visits'
		);

		const [ rows ] = dataTable.addRows.mock.calls[ 0 ];

		// One point for each of the 28 days, from the first day to the last.
		expect( rows ).toHaveLength( 28 );
		expect( rows[ 0 ] ).toEqual( [ new Date( 2025, 0, 8 ), 39 ] );
		expect( rows[ 27 ] ).toEqual( [ new Date( 2025, 1, 4 ), 152 ] );

		expect( mockRenderGoogleChartToDataURI ).toHaveBeenCalledTimes( 1 );

		const renderArgs = mockRenderGoogleChartToDataURI.mock.calls[ 0 ][ 0 ];

		expect( renderArgs.chartType ).toBe( 'LineChart' );
		expect( renderArgs.width ).toBe( 1085 );
		expect( renderArgs.height ).toBe( 133 );
		expect( renderArgs.signal ).toBe( signal );
		expect( renderArgs.dataTable ).toBe( dataTable );
		expect( renderArgs.options ).toMatchObject( {
			curveType: 'function',
			colors: [ '#462083' ],
			legend: { position: 'none' },
		} );

		expect( result.chartImages?.lineChart ).toBe(
			'data:image/jpeg;base64,TElORQ=='
		);
	} );

	it( 'stops before requesting anything when the signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( mockEnsureGoogleChartsLoaded ).not.toHaveBeenCalled();
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );

	it( 'should stop after the report resolves when the signal aborts before the chart renders', async () => {
		const controller = new AbortController();

		seedTotalsReport( registry );

		// The export is canceled while Google Charts loads, so the abort
		// check after it stops the run before the line chart renders.
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

	it( 'stops after the chart renders when the signal is aborted', async () => {
		const controller = new AbortController();

		seedTotalsReport( registry );

		mockRenderGoogleChartToDataURI.mockReset().mockImplementation( () => {
			controller.abort();
			return Promise.resolve( LINE_CHART_DATA_URI );
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
	} );

	it( 'should forward the abort signal to the report request', async () => {
		fetchMock.get( reportEndpoint, { body: { rows: [] }, status: 200 } );

		const { signal } = new AbortController();

		await getPDFData( {
			registry,
			dates: DATES,
			signal,
		} );

		// Resolver runs start on a timeout; wait it out, or a delayed extra run
		// would add to the count below.
		await waitForDefaultTimeouts();

		const signals = fetchMock
			.calls( reportEndpoint )
			.map( ( [ , options ] ) => options?.signal );

		expect( signals ).toEqual( [ signal ] );
	} );

	it( 'should fetch the report again when a new run starts after a canceled run', async () => {
		const firstController = new AbortController();
		const deferredResolvers: Array< () => void > = [];
		let requestCount = 0;

		fetchMock.get( reportEndpoint, () => {
			requestCount++;

			// Keep the first run's request waiting, so the abort happens while
			// it still runs. Later requests get a normal response.
			if ( requestCount === 1 ) {
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

		// Wait for the report request to start before aborting.
		while ( deferredResolvers.length < 1 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		firstController.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		expect( await firstRun ).toEqual( { data: null } );
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 1 );

		const secondRun = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 2 );
		expect( secondRun.data?.totalsReport ).toEqual( { rows: [] } );
		expect( secondRun.chartImages?.lineChart ).toBe(
			'data:image/jpeg;base64,TElORQ=='
		);
	} );
} );
