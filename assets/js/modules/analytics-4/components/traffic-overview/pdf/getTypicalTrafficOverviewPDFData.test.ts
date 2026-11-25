/**
 * Typical Traffic Overview getTypicalTrafficOverviewPDFData tests.
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
import { enabledFeatures } from '@/js/features';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import {
	CHANNELS_BREAKDOWN_REPORT_ID,
	DEVICES_BREAKDOWN_REPORT_ID,
	LOCATIONS_BREAKDOWN_REPORT_ID,
	getTotalsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
import {
	KEY_FACTORS,
	createBenchmarkingResponse,
	createBreakdownReport,
	createBreakdownValues,
} from '@/js/modules/analytics-4/components/traffic-overview/test-utils';
import {
	getDailyVisitsReportArgs,
	getTypicalBreakdownReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/typicalReportOptions';
import { getTypicalBreakdownRows } from '@/js/modules/analytics-4/components/traffic-overview/utils';
import {
	benchmarkingInsight,
	provideBenchmarkingData,
	provideBenchmarkingInsight,
} from '@/js/modules/analytics-4/datastore/__factories__/benchmarking';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { Report } from '@/js/modules/analytics-4/datastore/types';
import { DecodedBenchmarkingResponse } from '@/js/modules/analytics-4/utils/benchmarking/types';
import {
	createTestRegistry,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { GetPDFDataParams } from './getPDFData';
import getTypicalTrafficOverviewPDFData from './getTypicalTrafficOverviewPDFData';

jest.mock( '@/js/components/pdf-export/ensure-google-charts-loaded', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock(
	'@/js/components/pdf-export/render-google-chart-to-data-uri',
	() => ( {
		// Keep the real `getVisualization`, which `getTypicalTrafficOverviewPDFData` uses to build the
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
const benchmarkingDataEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-data'
);
const benchmarkingInsightEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/benchmarking-insight'
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
 * Builds the arguments of the five reports `getTypicalTrafficOverviewPDFData` reads.
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
		dailyVisits: getDailyVisitsReportArgs( { ...dates, url } ),
		channels: getTypicalBreakdownReportArgs( {
			dimensionName: 'sessionDefaultChannelGrouping',
			reportID: CHANNELS_BREAKDOWN_REPORT_ID,
			startDate,
			endDate,
			url,
		} ),
		locations: getTypicalBreakdownReportArgs( {
			dimensionName: 'country',
			reportID: LOCATIONS_BREAKDOWN_REPORT_ID,
			startDate,
			endDate,
			url,
		} ),
		devices: getTypicalBreakdownReportArgs( {
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
 * Puts the five reports `getTypicalTrafficOverviewPDFData` reads in the store, so it resolves them
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

/**
 * Marks the benchmarking request for the date range as finished without a
 * response, as the dashboard leaves it when the request fails, so the loader
 * reads the daily visits report without a request for the response.
 *
 * @since n.e.x.t
 *
 * @param {Object} testRegistry      The registry to mark the request in.
 * @param {Object} [dates]           Optional. The date range. Default `DATES`.
 * @param {string} [dates.startDate] Optional. The first day of the range.
 * @param {string} [dates.endDate]   Optional. The last day of the range.
 * @return {void}
 */
function provideNoBenchmarkingResponse(
	testRegistry: Registry,
	{ startDate, endDate }: Dates = DATES
) {
	testRegistry
		.dispatch( MODULES_ANALYTICS_4 )
		.finishResolution( 'getBenchmarkingData', [ startDate, endDate ] );
}

describe( 'Typical Traffic Overview getTypicalTrafficOverviewPDFData', () => {
	let registry: Registry;
	let dataTable: { addColumn: jest.Mock; addRows: jest.Mock };

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );

		mockEnsureGoogleChartsLoaded.mockReset().mockResolvedValue( undefined );
		mockRenderGoogleChartToDataURI
			.mockReset()
			.mockResolvedValue( LINE_CHART_DATA_URI );

		// `getTypicalTrafficOverviewPDFData` builds the chart's data with `new google.visualization.DataTable()`.
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

	describe( 'without a benchmarking response', () => {
		beforeEach( () => {
			provideNoBenchmarkingResponse( registry );
		} );

		it( 'should read the totals, daily visits, and breakdown reports over the selected range, with no entity URL', async () => {
			seedReports( registry );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( fetchMock ).not.toHaveFetched( reportEndpoint );
			expect( result.data ).toEqual( {
				totalVisits: { current: 0, previous: 0 },
				uniqueVisitors: 100,
				dailyTraffic: expect.any( Array ),
				channelBreakdown: [],
				locationBreakdown: [],
				deviceBreakdown: [],
			} );
		} );

		it( 'should give the visits over the range and the range before it from the daily visits report, and the unique visitors from the totals report', async () => {
			seedReports( registry, {
				totals: {
					totals: [
						{ metricValues: [ { value: '310' } ] },
						{ metricValues: [ { value: '290' } ] },
					],
				},
				dailyVisits: {
					rows: [],
					totals: [
						{ metricValues: [ { value: '412' } ] },
						{ metricValues: [ { value: '388' } ] },
					],
				},
			} );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			// The visits are sessions, as on the dashboard, rather than the
			// unique visitors of the totals report.
			expect( result.data?.totalVisits ).toEqual( {
				current: 412,
				previous: 388,
			} );
			expect( result.data?.uniqueVisitors ).toBe( 310 );
			expect( result.data?.typicalTraffic ).toBeUndefined();
		} );

		it( 'should read each report with the current entity URL when one is set', async () => {
			const entityURL = 'https://example.com/post-1';
			provideSiteInfo( registry, { currentEntityURL: entityURL } );

			seedReports( registry, {
				url: entityURL,
				channels: createBreakdownReport( [ [ 'Direct', 1 ] ] ),
			} );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( fetchMock ).not.toHaveFetched( reportEndpoint );
			expect( result.data?.uniqueVisitors ).toBe( 100 );
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

			const result = await getTypicalTrafficOverviewPDFData( {
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

		it( 'should shape the visits of each breakdown report with `getTypicalBreakdownRows()`', async () => {
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

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( result.data?.channelBreakdown ).toEqual(
				getTypicalBreakdownRows( createBreakdownValues( channelPairs ) )
			);
			expect( result.data?.locationBreakdown ).toEqual(
				getTypicalBreakdownRows(
					createBreakdownValues( locationPairs )
				)
			);
			// The six countries collapse to the top four and an "Others" row, as
			// in the dashboard's column.
			expect( result.data?.locationBreakdown ).toHaveLength( 5 );
			expect( result.data?.deviceBreakdown ).toEqual( [
				{
					label: 'desktop',
					percentage: 0.75,
					formattedPercentage: '75%',
				},
				{
					label: 'mobile',
					percentage: 0.25,
					formattedPercentage: '25%',
				},
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
						`${ encodeURIComponent(
							'dimensions[0][name]'
						) }=country`
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

			const result = await getTypicalTrafficOverviewPDFData( {
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

			const result = await getTypicalTrafficOverviewPDFData( {
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

			provideNoBenchmarkingResponse( registry, sevenDays );
			seedReports( registry, {
				dates: sevenDays,
				dailyVisits: createDailyVisitsReport( [
					[ '20250108', 40 ],
					[ '20250111', 152 ],
				] ),
			} );

			await getTypicalTrafficOverviewPDFData( {
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
			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal,
			} );

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

			const renderArgs =
				mockRenderGoogleChartToDataURI.mock.calls[ 0 ][ 0 ];

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

			const result = await getTypicalTrafficOverviewPDFData( {
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

			const result = await getTypicalTrafficOverviewPDFData( {
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

			mockRenderGoogleChartToDataURI
				.mockReset()
				.mockImplementation( () => {
					controller.abort();
					return Promise.resolve( LINE_CHART_DATA_URI );
				} );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: controller.signal,
			} );

			expect( result ).toEqual( { data: null } );
		} );

		it( 'should forward the abort signal to each report request', async () => {
			fetchMock.get( reportEndpoint, {
				body: { rows: [] },
				status: 200,
			} );

			const { signal } = new AbortController();

			await getTypicalTrafficOverviewPDFData( {
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

			const firstRun = getTypicalTrafficOverviewPDFData( {
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

			const secondRun = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 10 );
			expect( secondRun.data?.uniqueVisitors ).toBe( 0 );
			expect( secondRun.chartImages?.lineChart ).toBe(
				'data:image/jpeg;base64,TElORQ=='
			);
		} );
	} );

	describe( 'with the benchmarking response on the main dashboard', () => {
		const { startDate, endDate } = DATES;

		/**
		 * Stores a benchmarking response for `DATES`, built by
		 * `createBenchmarkingResponse()` with the given changes.
		 *
		 * @since n.e.x.t
		 *
		 * @param {Object} [changes] Optional. The members to change.
		 * @return {Object} The stored response.
		 */
		function provideResponse(
			changes: Partial< DecodedBenchmarkingResponse > = {}
		): DecodedBenchmarkingResponse {
			const response = {
				...createBenchmarkingResponse( startDate, endDate ),
				...changes,
			};

			provideBenchmarkingData(
				registry,
				{ startDate, endDate },
				response
			);

			return response;
		}

		beforeEach( () => {
			registry.dispatch( CORE_USER ).setReferenceDate( '2025-02-05' );
			// The daily visits report stays out of the store, so a request
			// for it would fail the test.
			seedReports( registry, { dailyVisits: null } );
		} );

		it( 'should read the visits and the daily traffic from the benchmarking response, as the dashboard does, and request no daily visits report', async () => {
			const response = provideResponse();

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( fetchMock ).not.toHaveFetched();
			expect( result.data?.totalVisits ).toEqual( {
				current: 1234,
				previous: 1101,
			} );
			expect( result.data?.dailyTraffic ).toEqual(
				response.dailyTraffic
			);
			expect( result.data?.uniqueVisitors ).toBe( 100 );
		} );

		it( 'should draw the typical traffic range behind the line, as the dashboard chart does', async () => {
			const response = provideResponse();

			await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( dataTable.addColumn ).toHaveBeenCalledTimes( 4 );
			expect( dataTable.addColumn ).toHaveBeenNthCalledWith( 3, {
				type: 'number',
				role: 'interval',
			} );
			expect( dataTable.addColumn ).toHaveBeenNthCalledWith( 4, {
				type: 'number',
				role: 'interval',
			} );

			const [ rows ] = dataTable.addRows.mock.calls[ 0 ];
			const [ firstDay ] = response.dailyTraffic;

			expect( rows[ 0 ] ).toEqual( [
				new Date( 2025, 0, 8 ),
				firstDay.visits,
				firstDay.expectedMin,
				firstDay.expectedMax,
			] );
			expect(
				mockRenderGoogleChartToDataURI.mock.calls[ 0 ][ 0 ].options
			).toMatchObject( {
				intervals: {
					style: 'area',
					color: '#e3d1ff',
					fillOpacity: 0.5,
					lineWidth: 0,
				},
			} );
		} );

		it( 'should fit the value axis to a band that reaches above the busiest day', async () => {
			provideResponse( {
				dailyTraffic: createBenchmarkingResponse(
					startDate,
					endDate
				).dailyTraffic.map( ( day ) => ( {
					...day,
					visits: 10,
					expectedMin: 5,
					expectedMax: 150,
				} ) ),
			} );

			await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			// A busiest value of 150 writes the labels in short form; 10 would
			// not.
			expect(
				mockRenderGoogleChartToDataURI.mock.calls[ 0 ][ 0 ].options
			).toMatchObject( { vAxis: { format: 'short' } } );
		} );

		it( 'should draw no band while the days have no typical range', async () => {
			provideResponse( {
				dailyTraffic: createBenchmarkingResponse(
					startDate,
					endDate
				).dailyTraffic.map( ( day ) => ( {
					...day,
					expectedMin: null,
					expectedMax: null,
				} ) ),
			} );

			await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( dataTable.addColumn ).toHaveBeenCalledTimes( 2 );
			expect(
				mockRenderGoogleChartToDataURI.mock.calls[ 0 ][ 0 ].options
			).not.toHaveProperty( 'intervals' );
		} );

		it( 'should give the key factor cards with the names and changes the dashboard shows, and no notice', async () => {
			provideResponse( {
				keyFactors: [
					...KEY_FACTORS,
					{
						kind: 'CHANNEL_GROUP',
						label: 'Paid',
						current: 30,
						previous: 10,
						sharePct: 4,
						attributes: [],
					},
					{
						kind: 'CONTENT',
						label: '/',
						current: 50,
						previous: 70,
						sharePct: 8,
						attributes: [],
					},
					{
						kind: 'CHANNEL',
						label: null,
						current: 1,
						previous: 0,
						sharePct: 1,
						attributes: [],
					},
				],
			} );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( result.data?.typicalTraffic ).toEqual( {
				daysInRange: 28,
				analysis: null,
				availabilityNotice: null,
				keyFactorsAvailable: true,
				driver: null,
				keyFactorsNotice: null,
				keyFactors: [
					{
						name: 'Referral',
						change: 365,
						shareText: null,
					},
					{
						name: 'Organic Video',
						change: 48,
						shareText: null,
					},
					{
						name: 'Organic Search',
						change: -21,
						shareText: null,
					},
					{
						name: 'Paid traffic',
						change: 20,
						shareText: null,
					},
					// A card without a name is left out.
					{
						name: 'Homepage',
						change: -20,
						shareText: null,
					},
				],
			} );
		} );

		it( 'should give each card its share of the visits, and say that no channel changed notably, on a steady period', async () => {
			provideResponse( { steadyTraffic: true } );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( result.data?.typicalTraffic?.keyFactorsNotice ).toBe(
				'No channel changed notably compared with the previous 28 days'
			);
			expect(
				result.data?.typicalTraffic?.keyFactors.map(
					( { shareText } ) => shareText
				)
			).toEqual( [
				'52.4% of all visits',
				'38.7% of all visits',
				'100% of all visits',
			] );
		} );

		it( 'should give a card that took its channel’s place its share of the channel’s change, as the dashboard shows it', async () => {
			provideResponse( {
				keyFactors: [
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
				],
			} );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( result.data?.typicalTraffic?.keyFactors ).toEqual( [
				{
					name: 'news.example',
					change: 220,
					shareText: '73.3% of Referral’s +300 visits',
				},
			] );
		} );

		it( 'should say when the band and the key factors will show, in one notice, and leave out the key factors while the history is too short for them', async () => {
			const response = createBenchmarkingResponse( startDate, endDate );

			provideResponse( {
				availability: {
					...response.availability,
					bandAvailable: false,
					bandAvailableFrom: '2025-04-02',
					keyFactorsAvailable: false,
					keyFactorsAvailableFrom: '2025-02-06',
					insightRequestAllowed: false,
					performanceInsightAvailable: false,
				},
				dailyTraffic: response.dailyTraffic.map( ( day ) => ( {
					...day,
					expectedMin: null,
					expectedMax: null,
				} ) ),
				keyFactors: [],
			} );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			// No comparison was made, so the key factors' section, which
			// the PDF leaves out, says nothing either.
			expect( result.data?.typicalTraffic ).toMatchObject( {
				availabilityNotice:
					'We’re still learning what’s usual for your site. Check back on February 6, 2025 to see which channels changed the most, and on April 2, 2025 to see your typical traffic range.',
				keyFactorsAvailable: false,
				keyFactorsNotice: null,
				keyFactors: [],
			} );
		} );

		it.each( [
			[
				'say what range the insight needs, with the `trafficInsights` feature',
				true,
				'Select a date range of up to 364 days to see insights about your traffic.',
			],
			[
				'have no notice without the `trafficInsights` feature',
				false,
				null,
			],
		] )(
			'should %s, for a range too long for the insight',
			async ( _label, insightsEnabled, availabilityNotice ) => {
				if ( insightsEnabled ) {
					enabledFeatures.add( 'trafficInsights' );
				}

				const response = createBenchmarkingResponse(
					startDate,
					endDate
				);

				provideResponse( {
					availability: {
						...response.availability,
						insightRequestAllowed: false,
						performanceInsightAvailable: false,
						rangeTooLong: true,
					},
				} );

				const result = await getTypicalTrafficOverviewPDFData( {
					registry,
					dates: DATES,
					signal: new AbortController().signal,
				} );

				expect( result.data?.typicalTraffic ).toMatchObject( {
					analysis: null,
					availabilityNotice,
					driver: null,
				} );
			}
		);

		it( 'should give the generated insight the dashboard already has, with the `trafficInsights` feature', async () => {
			enabledFeatures.add( 'trafficInsights' );
			provideResponse();
			provideBenchmarkingInsight( registry, { startDate, endDate } );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( result.data?.typicalTraffic ).toMatchObject( {
				analysis: benchmarkingInsight.analysis,
				driver: benchmarkingInsight.driver,
			} );
		} );

		it( 'should leave out the analysis where the chart draws no band, and keep the driver', async () => {
			enabledFeatures.add( 'trafficInsights' );

			const response = createBenchmarkingResponse( startDate, endDate );

			provideResponse( {
				availability: {
					...response.availability,
					bandAvailable: false,
					performanceInsightAvailable: false,
				},
			} );
			provideBenchmarkingInsight( registry, { startDate, endDate } );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( result.data?.typicalTraffic ).toMatchObject( {
				analysis: null,
				driver: benchmarkingInsight.driver,
			} );
		} );

		it( 'should neither ask for nor wait for an insight the dashboard doesn’t have yet', async () => {
			enabledFeatures.add( 'trafficInsights' );
			provideResponse();

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			await waitForDefaultTimeouts();

			expect( fetchMock ).not.toHaveFetched(
				benchmarkingInsightEndpoint
			);
			expect( result.data?.typicalTraffic ).toMatchObject( {
				analysis: null,
				driver: null,
			} );
		} );

		it( 'should give no insight without the `trafficInsights` feature', async () => {
			provideResponse();
			provideBenchmarkingInsight( registry, { startDate, endDate } );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( result.data?.typicalTraffic ).toMatchObject( {
				analysis: null,
				driver: null,
			} );
		} );

		it( 'should leave out the typical traffic view while the property gathers data, as the dashboard does', async () => {
			provideResponse();
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveIsGatheringData( true );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.finishResolution( 'isGatheringData', [] );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( result.data?.typicalTraffic ).toBeUndefined();
		} );

		it( 'should read the visits from the daily visits report when the benchmarking request fails, with no typical traffic view', async () => {
			fetchMock.getOnce( benchmarkingDataEndpoint, {
				body: {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				},
				status: 500,
			} );
			seedReports( registry, {
				dailyVisits: {
					rows: [],
					totals: [
						{ metricValues: [ { value: '412' } ] },
						{ metricValues: [ { value: '388' } ] },
					],
				},
			} );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( fetchMock ).toHaveFetched( benchmarkingDataEndpoint );
			expect( result.data?.totalVisits ).toEqual( {
				current: 412,
				previous: 388,
			} );
			expect( result.data?.typicalTraffic ).toBeUndefined();
			expect( console ).toHaveErrored();
		} );

		it( 'should not request the benchmarking response on an entity dashboard', async () => {
			const entityURL = 'https://example.com/post-1';
			provideSiteInfo( registry, { currentEntityURL: entityURL } );
			seedReports( registry, { url: entityURL } );

			const result = await getTypicalTrafficOverviewPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} );

			expect( fetchMock ).not.toHaveFetched();
			expect( result.data?.typicalTraffic ).toBeUndefined();
		} );
	} );
} );
