/**
 * SearchFunnelWidgetGA4 getPDFData tests.
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
import { createTestRegistry, provideSiteInfo } from 'tests/js/utils';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import ensureGoogleChartsLoaded from '@/js/components/pdf-export/ensure-google-charts-loaded';
import renderGoogleChartToDataURI from '@/js/components/pdf-export/render-google-chart-to-data-uri';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { calculateChange } from '@/js/util';
import getPDFData, { GetPDFDataParams } from './getPDFData';
import {
	getGA4KeyEventsOverviewReportOptions,
	getGA4KeyEventsReportOptions,
	getGA4VisitorsReportOptions,
	getSearchConsoleReportOptions,
} from './reportOptions';

jest.mock( '@/js/components/pdf-export/ensure-google-charts-loaded', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock(
	'@/js/components/pdf-export/render-google-chart-to-data-uri',
	() => ( {
		// Keep the real `getVisualization` (used to build the DataTable); only the
		// default rasteriser export is mocked.
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

const CHART_DATA_URI = 'data:image/jpeg;base64,TU9DSw==';

type Registry = WPDataRegistry & GetPDFDataParams[ 'registry' ];

const ga4ReportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);
const searchConsoleReportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
);

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-01-14',
	compareStartDate: '2025-01-01',
	compareEndDate: '2025-01-07',
};

const DATE_RANGE_LENGTH = 7;

const searchConsoleArgs = getSearchConsoleReportOptions( {
	compareStartDate: DATES.compareStartDate,
	endDate: DATES.endDate,
} );
const keyEventsOverviewArgs = getGA4KeyEventsOverviewReportOptions( DATES );
const keyEventsStatsArgs = getGA4KeyEventsReportOptions( DATES );
const visitorsArgs = getGA4VisitorsReportOptions( DATES );

// 7 previous days (impressions 10, clicks 5) followed by 7 current days
// (impressions 20, clicks 10), so partitioning yields a clean +100% change.
function buildSearchConsoleReport() {
	return Array.from( { length: 14 }, ( _unused, index ) => {
		const isCurrent = index >= 7;
		const day = String( index + 1 ).padStart( 2, '0' );
		return {
			clicks: isCurrent ? 10 : 5,
			ctr: 0.1,
			impressions: isCurrent ? 20 : 10,
			keys: [ `2025-01-${ day }` ],
			position: 1,
		};
	} );
}

const visitorsReport = {
	totals: [
		{ metricValues: [ { value: '3000' } ] },
		{ metricValues: [ { value: '2000' } ] },
	],
	rows: [],
};

const keyEventsOverviewReport = {
	totals: [
		{ metricValues: [ { value: '600' }, { value: '55' } ] },
		{ metricValues: [ { value: '500' }, { value: '50' } ] },
	],
};

const keyEventsStatsReport = { rows: [] };

function setGoogle( value: unknown ) {
	( global as unknown as { google?: unknown } ).google = value;
}

function provideReports( registry: Registry ) {
	registry
		.dispatch( MODULES_SEARCH_CONSOLE )
		.receiveGetReport( buildSearchConsoleReport(), {
			options: searchConsoleArgs,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( keyEventsOverviewReport, {
			options: keyEventsOverviewArgs,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( keyEventsStatsReport, {
			options: keyEventsStatsArgs,
		} );
	registry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( visitorsReport, { options: visitorsArgs } );
}

describe( 'SearchFunnelWidgetGA4 getPDFData', () => {
	let registry: Registry;
	let dataTable: { addColumn: jest.Mock; addRows: jest.Mock };

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );
		registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );
		registry.dispatch( CORE_USER ).setReferenceDate( '2025-01-14' );

		mockEnsureGoogleChartsLoaded.mockReset().mockResolvedValue( undefined );
		mockRenderGoogleChartToDataURI
			.mockReset()
			.mockResolvedValue( CHART_DATA_URI );

		dataTable = { addColumn: jest.fn(), addRows: jest.fn() };
		setGoogle( {
			visualization: { DataTable: jest.fn( () => dataTable ) },
		} );
	} );

	afterEach( () => {
		setGoogle( undefined );
	} );

	it( 'should resolve all four reports in parallel and return the metrics and chart images', async () => {
		provideReports( registry );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data ).toEqual( {
			dateRangeLength: DATE_RANGE_LENGTH,
			metrics: {
				impressions: { total: 140, change: calculateChange( 70, 140 ) },
				clicks: { total: 70, change: calculateChange( 35, 70 ) },
				uniqueVisitors: {
					total: 3000,
					change: calculateChange( 2000, 3000 ),
				},
				keyEvents: { total: 600, change: calculateChange( 500, 600 ) },
			},
		} );
		expect( result.chartImages ).toEqual( {
			impressions: CHART_DATA_URI,
			clicks: CHART_DATA_URI,
			uniqueVisitors: CHART_DATA_URI,
			keyEvents: CHART_DATA_URI,
		} );

		// Pre-populated reports short-circuit their resolvers, so no network
		// request should have been made for any of the four reports.
		expect( fetchMock ).not.toHaveFetched( ga4ReportEndpoint );
		expect( fetchMock ).not.toHaveFetched( searchConsoleReportEndpoint );
	} );

	it( 'should rasterise four line charts (smoothed, dotted previous series) with the per-metric color and signal', async () => {
		provideReports( registry );

		const signal = new AbortController().signal;
		await getPDFData( { registry, dates: DATES, signal } );

		expect( mockEnsureGoogleChartsLoaded ).toHaveBeenCalledTimes( 1 );
		expect( mockRenderGoogleChartToDataURI ).toHaveBeenCalledTimes( 4 );

		const colorsByCall = [ '#6380b8', '#4bbbbb', '#3c7251', '#8e68cb' ];
		colorsByCall.forEach( ( color, index ) => {
			const args =
				mockRenderGoogleChartToDataURI.mock.calls[ index ][ 0 ];
			expect( args.chartType ).toBe( 'LineChart' );
			expect( args.signal ).toBe( signal );
			expect( args.width ).toBe( 240 );
			expect( args.height ).toBe( 120 );
			// The chart renders at 4 times its display size, so the lines
			// stay sharp.
			expect( args.scaleFactor ).toBe( 4 );
			// The line widths and dash lengths are in pixels of the rendered
			// chart, so they grow with the render size.
			expect( args.options ).toMatchObject( {
				curveType: 'function',
				colors: [ color ],
				legend: { position: 'none' },
				series: {
					0: { color, lineWidth: 4 },
					1: { color, lineWidth: 2, lineDashStyle: [ 6, 6 ] },
				},
			} );
		} );
	} );

	it( 'should isolate a single failing metric to its own card without aborting the others', async () => {
		// Pre-populate every report except Unique Visitors, which fails to fetch.
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetReport( buildSearchConsoleReport(), {
				options: searchConsoleArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( keyEventsOverviewReport, {
				options: keyEventsOverviewArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( keyEventsStatsReport, {
				options: keyEventsStatsArgs,
			} );

		fetchMock.get( ga4ReportEndpoint, {
			body: {
				code: 'test_error',
				message: 'Report request failed.',
				data: { status: 500 },
			},
			status: 500,
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.metrics.impressions ).not.toBeNull();
		expect( result.data?.metrics.clicks ).not.toBeNull();
		expect( result.data?.metrics.keyEvents ).not.toBeNull();
		expect( result.data?.metrics.uniqueVisitors ).toBeNull();

		expect( result.chartImages?.uniqueVisitors ).toBeNull();
		expect( result.chartImages?.impressions ).toBe( CHART_DATA_URI );
		expect( result.chartImages?.clicks ).toBe( CHART_DATA_URI );
		expect( result.chartImages?.keyEvents ).toBe( CHART_DATA_URI );

		// The three surviving cards are still rasterised.
		expect( mockRenderGoogleChartToDataURI ).toHaveBeenCalledTimes( 3 );

		// The failing Unique Visitors report logs an API error.
		expect( console ).toHaveErrored();
	} );

	it( 'should throw only when all four metrics fail', async () => {
		fetchMock.get( ga4ReportEndpoint, {
			body: {
				code: 'test_error',
				message: 'Report request failed.',
				data: { status: 500 },
			},
			status: 500,
		} );
		fetchMock.get( searchConsoleReportEndpoint, {
			body: {
				code: 'test_error',
				message: 'Report request failed.',
				data: { status: 500 },
			},
			status: 500,
		} );

		await expect(
			getPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
			} )
		).rejects.toThrow( /all Search traffic over time metrics failed/ );

		// No chart is rasterised when every report fails.
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();

		// Every failing report logs an API error.
		expect( console ).toHaveErrored();
	} );

	it( 'should short-circuit without loading charts when the signal is already aborted', async () => {
		provideReports( registry );

		const controller = new AbortController();
		controller.abort();

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( mockEnsureGoogleChartsLoaded ).not.toHaveBeenCalled();
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );

	it( 'should bail out before rasterising any chart when the signal aborts after the reports are dispatched', async () => {
		const controller = new AbortController();
		const deferredResolvers: Array< () => void > = [];

		function deferReport() {
			return new Promise< { body: unknown; status: number } >(
				( resolve ) => {
					deferredResolvers.push( () =>
						resolve( { body: {}, status: 200 } )
					);
				}
			);
		}

		fetchMock.get( ga4ReportEndpoint, deferReport );
		fetchMock.get( searchConsoleReportEndpoint, deferReport );

		const pdfPromise = getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		// Wait for all four report fetches to dispatch before aborting.
		while ( deferredResolvers.length < 4 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		controller.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		const result = await pdfPromise;

		expect( result ).toEqual( { data: null } );
		// The post-fetch abort check runs before Google Charts is loaded.
		expect( mockEnsureGoogleChartsLoaded ).not.toHaveBeenCalled();
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );
} );
