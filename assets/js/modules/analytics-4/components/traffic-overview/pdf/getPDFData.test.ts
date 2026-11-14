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
import {
	CHANNELS_BREAKDOWN_REPORT_ID,
	DEVICES_BREAKDOWN_REPORT_ID,
	LOCATIONS_BREAKDOWN_REPORT_ID,
	getBreakdownReportArgs,
	getDailyVisitsReportArgs,
	getTotalsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import {
	createBreakdownReport,
	createBreakdownValues,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import { getBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/utils/getBreakdownRows';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
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

type Dates = typeof DATES;

const TOTALS_REPORT: Report = {
	totals: [ { metricValues: [ { value: '100' } ] } ],
};

function setGoogle( value: unknown ) {
	( global as unknown as { google?: unknown } ).google = value;
}

/**
 * Builds the arguments of the five reports `getPDFData` reads.
 *
 * @since n.e.x.t
 *
 * @param {Object} [dates] Optional. The date range. Default `DATES`.
 * @param {string} [url]   Optional. The current entity URL.
 * @return {Object} The arguments of each report, keyed by report.
 */
function getReportArgs( dates: Dates = DATES, url?: string ) {
	const { startDate, endDate } = dates;

	return {
		totals: getTotalsReportArgs( { ...dates, url } ),
		dailyVisits: getDailyVisitsReportArgs( { startDate, endDate, url } ),
		channels: getBreakdownReportArgs( {
			dimensionName: 'sessionDefaultChannelGrouping',
			reportID: CHANNELS_BREAKDOWN_REPORT_ID,
			startDate,
			endDate,
			url,
		} ),
		locations: getBreakdownReportArgs( {
			dimensionName: 'country',
			reportID: LOCATIONS_BREAKDOWN_REPORT_ID,
			startDate,
			endDate,
			url,
		} ),
		devices: getBreakdownReportArgs( {
			dimensionName: 'deviceCategory',
			reportID: DEVICES_BREAKDOWN_REPORT_ID,
			startDate,
			endDate,
			url,
		} ),
	};
}

type ReportKey = keyof ReturnType< typeof getReportArgs >;

interface SeedReportsOptions
	extends Partial< Record< ReportKey, Report | null > > {
	/** The date range. Default `DATES`. */
	dates?: Dates;
	/** The current entity URL. */
	url?: string;
}

/**
 * Puts the five reports `getPDFData` reads in the store, so it resolves them
 * without a request. A report the options leave out has no rows, and one they
 * set to `null` stays out of the store.
 *
 * @since n.e.x.t
 *
 * @param {Object} testRegistry    The registry to put the reports in.
 * @param {Object} [options]       Optional. The date range, the entity URL, and the reports to put in the store, keyed by report.
 * @param {Object} [options.dates] Optional. The date range. Default `DATES`.
 * @param {string} [options.url]   Optional. The current entity URL.
 * @return {void}
 */
function seedReports(
	testRegistry: Registry,
	{ dates = DATES, url, ...reports }: SeedReportsOptions = {}
) {
	const argsByReport = getReportArgs( dates, url );
	const reportsByKey: Record< ReportKey, Report | null > = {
		totals: TOTALS_REPORT,
		dailyVisits: { rows: [] },
		channels: createBreakdownReport( [] ),
		locations: createBreakdownReport( [] ),
		devices: createBreakdownReport( [] ),
		...reports,
	};

	( Object.keys( argsByReport ) as ReportKey[] ).forEach( ( key ) => {
		const report = reportsByKey[ key ];

		if ( report ) {
			testRegistry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetReport( report, {
					options: argsByReport[ key ],
				} );
		}
	} );
}

/**
 * Builds a daily visits report from `[ YYYYMMDD, visits ]` pairs. Its rows
 * have the shape of a breakdown report's: one dimension value and one metric
 * value.
 *
 * @since n.e.x.t
 *
 * @param {Array<Array>} pairs `[ YYYYMMDD, visits ]` pairs.
 * @return {Object} The daily visits report.
 */
function createDailyVisitsReport( pairs: Array< [ string, number ] > ) {
	return createBreakdownReport( pairs );
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

	it( 'should read the totals, daily visits, and breakdown reports over the selected range, with no entity URL', async () => {
		seedReports( registry );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.data ).toEqual( {
			totalsReport: TOTALS_REPORT,
			dailyTraffic: expect.any( Array ),
			channelBreakdown: [],
			locationBreakdown: [],
			deviceBreakdown: [],
		} );
	} );

	it( 'should read each report with the current entity URL when one is set', async () => {
		const entityURL = 'https://example.com/post-1';
		provideSiteInfo( registry, { currentEntityURL: entityURL } );

		seedReports( registry, {
			url: entityURL,
			channels: createBreakdownReport( [ [ 'Direct', 1 ] ] ),
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.data?.totalsReport ).toEqual( TOTALS_REPORT );
		expect( result.data?.channelBreakdown ).toEqual( [
			{ label: 'Direct', percentage: 1, formattedPercentage: '100%' },
		] );
	} );

	it( 'should give the visits on each day of the range from the daily visits report, with zero visits on a day the report leaves out', async () => {
		seedReports( registry, {
			dailyVisits: createDailyVisitsReport( [
				[ '20250108', 10 ],
				[ '20250109', 20 ],
				[ '20250204', 30 ],
			] ),
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		const dailyTraffic = result.data?.dailyTraffic;

		// One row for each of the 28 days, from the first day to the last.
		expect( dailyTraffic ).toHaveLength( 28 );
		expect( dailyTraffic?.[ 0 ] ).toEqual( {
			date: '2025-01-08',
			visits: 10,
			expectedMin: null,
			expectedMax: null,
		} );
		expect( dailyTraffic?.[ 1 ] ).toEqual( {
			date: '2025-01-09',
			visits: 20,
			expectedMin: null,
			expectedMax: null,
		} );
		expect( dailyTraffic?.[ 2 ] ).toEqual( {
			date: '2025-01-10',
			visits: 0,
			expectedMin: null,
			expectedMax: null,
		} );
		expect( dailyTraffic?.[ 27 ] ).toEqual( {
			date: '2025-02-04',
			visits: 30,
			expectedMin: null,
			expectedMax: null,
		} );
	} );

	it( 'should shape the visits of each breakdown report with `getBreakdownRows()`', async () => {
		const channelPairs: Array< [ string, number ] > = [
			[ 'Organic Search', 60 ],
			[ 'Direct', 20 ],
			[ 'Referral', 20 ],
		];
		const locationPairs: Array< [ string, number ] > = [
			[ 'Singapore', 60 ],
			[ 'Brazil', 50 ],
			[ 'China', 40 ],
			[ 'United States', 30 ],
			[ 'India', 20 ],
			[ 'Canada', 10 ],
		];
		const devicePairs: Array< [ string, number ] > = [
			[ 'desktop', 3 ],
			[ 'mobile', 1 ],
		];

		seedReports( registry, {
			channels: createBreakdownReport( channelPairs ),
			locations: createBreakdownReport( locationPairs ),
			devices: createBreakdownReport( devicePairs ),
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.channelBreakdown ).toEqual(
			getBreakdownRows( createBreakdownValues( channelPairs ) )
		);
		expect( result.data?.locationBreakdown ).toEqual(
			getBreakdownRows( createBreakdownValues( locationPairs ) )
		);
		// The six countries collapse to the top four and an "Others" row, as
		// in the dashboard's column.
		expect( result.data?.locationBreakdown ).toHaveLength( 5 );
		expect( result.data?.deviceBreakdown ).toEqual( [
			{ label: 'desktop', percentage: 0.75, formattedPercentage: '75%' },
			{ label: 'mobile', percentage: 0.25, formattedPercentage: '25%' },
		] );
	} );

	it( 'should give no rows for a breakdown whose report fails, while the other two still have theirs', async () => {
		seedReports( registry, {
			channels: createBreakdownReport( [ [ 'Direct', 1 ] ] ),
			locations: null,
			devices: createBreakdownReport( [ [ 'mobile', 1 ] ] ),
		} );

		// The `country` dimension is unique to the locations request, since the
		// report ID is a cache key, not part of the request URL.
		fetchMock.get(
			( url ) =>
				reportEndpoint.test( url ) &&
				url.includes(
					`${ encodeURIComponent( 'dimensions[0][name]' ) }=country`
				),
			{
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			}
		);

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.locationBreakdown ).toEqual( [] );
		expect( result.data?.channelBreakdown ).toEqual( [
			{ label: 'Direct', percentage: 1, formattedPercentage: '100%' },
		] );
		expect( result.data?.deviceBreakdown ).toEqual( [
			{ label: 'mobile', percentage: 1, formattedPercentage: '100%' },
		] );
		expect( console ).toHaveErrored();
	} );

	it( 'should return chartImages holding only lineChart', async () => {
		seedReports( registry );

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

		seedReports( registry, {
			dates: sevenDays,
			dailyVisits: createDailyVisitsReport( [
				[ '20250108', 40 ],
				[ '20250111', 152 ],
			] ),
		} );

		await getPDFData( {
			registry,
			dates: sevenDays,
			signal: new AbortController().signal,
		} );

		// The busiest day has 152 visits, so the labels are written in short
		// form.
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

	it( 'should draw the line chart with one point for each day of the range', async () => {
		seedReports( registry, {
			dailyVisits: createDailyVisitsReport( [
				[ '20250108', 39 ],
				[ '20250204', 152 ],
			] ),
		} );

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
		// A day the report leaves out is drawn at zero.
		expect( rows ).toHaveLength( 28 );
		expect( rows[ 0 ] ).toEqual( [ new Date( 2025, 0, 8 ), 39 ] );
		expect( rows[ 1 ] ).toEqual( [ new Date( 2025, 0, 9 ), 0 ] );
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

	it( 'should stop before requesting anything when the signal is already aborted', async () => {
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

	it( 'should stop after the reports resolve when the signal aborts before the chart renders', async () => {
		const controller = new AbortController();

		seedReports( registry );

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

	it( 'should stop after the chart renders when the signal is aborted', async () => {
		const controller = new AbortController();

		seedReports( registry );

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

	it( 'should forward the abort signal to each report request', async () => {
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

		expect( signals ).toEqual( Array( 5 ).fill( signal ) );
	} );

	it( 'should fetch the reports again when a new run starts after a canceled run', async () => {
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
		expect( secondRun.data?.totalsReport ).toEqual( { rows: [] } );
		expect( secondRun.chartImages?.lineChart ).toBe(
			'data:image/jpeg;base64,TElORQ=='
		);
	} );
} );
