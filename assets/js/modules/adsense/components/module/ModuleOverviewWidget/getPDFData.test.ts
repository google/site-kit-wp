/**
 * ModuleOverviewWidget getPDFData tests.
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
import { createTestRegistry } from 'tests/js/utils';

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
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import { calculateChange } from '@/js/util';
import getPDFData from './getPDFData';
import {
	getCurrentRangeArgs,
	getCurrentRangeChartArgs,
	getPreviousRangeArgs,
	getPreviousRangeChartArgs,
} from './reportOptions';

jest.mock( '@/js/components/pdf-export/ensure-google-charts-loaded', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock(
	'@/js/components/pdf-export/render-google-chart-to-data-uri',
	() => ( {
		// Keep the real `getVisualization`, which builds the DataTable. Mock
		// only the default export that renders the chart to an image.
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

const adsenseReportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/adsense/data/report'
);

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-01-14',
	compareStartDate: '2025-01-01',
	compareEndDate: '2025-01-07',
};

const DATE_RANGE_LENGTH = 7;

const CURRENT_RANGE_DAYS = [
	'2025-01-08',
	'2025-01-09',
	'2025-01-10',
	'2025-01-11',
	'2025-01-12',
	'2025-01-13',
	'2025-01-14',
];
const PREVIOUS_RANGE_DAYS = [
	'2025-01-01',
	'2025-01-02',
	'2025-01-03',
	'2025-01-04',
	'2025-01-05',
	'2025-01-06',
	'2025-01-07',
];

const METRIC_HEADERS = [
	{
		name: 'ESTIMATED_EARNINGS',
		type: 'METRIC_CURRENCY',
		currencyCode: 'USD',
	},
	{ name: 'PAGE_VIEWS_RPM', type: 'METRIC_CURRENCY', currencyCode: 'USD' },
	{ name: 'IMPRESSIONS', type: 'METRIC_TALLY' },
	{ name: 'PAGE_VIEWS_CTR', type: 'METRIC_RATIO' },
];

/**
 * Splits a `YYYY-MM-DD` date into the parts the AdSense API returns.
 *
 * @since n.e.x.t
 *
 * @param date The date string.
 * @return The date parts.
 */
function toAdSenseDate( date: string ) {
	const [ year, month, day ] = date.split( '-' ).map( Number );
	return { year, month, day };
}

/**
 * Builds an AdSense totals report fixture with one cell per metric.
 *
 * @since n.e.x.t
 *
 * @param options           Options.
 * @param options.startDate First day of the report.
 * @param options.endDate   Last day of the report.
 * @param options.totals    One total per metric, in report column order.
 * @return The totals report fixture.
 */
function buildTotalsReport( {
	startDate,
	endDate,
	totals,
}: {
	startDate: string;
	endDate: string;
	totals: number[];
} ) {
	return {
		startDate: toAdSenseDate( startDate ),
		endDate: toAdSenseDate( endDate ),
		headers: METRIC_HEADERS,
		totals: {
			cells: totals.map( ( value ) => ( { value: String( value ) } ) ),
		},
		rows: [],
	};
}

/**
 * Builds an AdSense daily series report fixture, one row per day.
 *
 * @since n.e.x.t
 *
 * @param options             Options.
 * @param options.days        The report days, as `YYYY-MM-DD` strings.
 * @param options.dailyValues One value per metric, repeated for every day.
 * @param options.totals      One total per metric, in report column order.
 * @return The daily series report fixture.
 */
function buildChartReport( {
	days,
	dailyValues,
	totals,
}: {
	days: string[];
	dailyValues: number[];
	totals: number[];
} ) {
	return {
		startDate: toAdSenseDate( days[ 0 ] ),
		endDate: toAdSenseDate( days[ days.length - 1 ] ),
		headers: [ { name: 'DATE' }, ...METRIC_HEADERS ],
		totals: {
			cells: [
				{ value: '' },
				...totals.map( ( value ) => ( { value: String( value ) } ) ),
			],
		},
		rows: days.map( ( day ) => ( {
			cells: [
				{ value: day },
				...dailyValues.map( ( value ) => ( {
					value: String( value ),
				} ) ),
			],
		} ) ),
	};
}

describe( 'ModuleOverviewWidget getPDFData', () => {
	let registry: Registry;
	let dataTable: { addColumn: jest.Mock; addRows: jest.Mock };

	/**
	 * Sets the global `google` object the loader reads to build chart data tables.
	 *
	 * @since n.e.x.t
	 *
	 * @param  value The new `google` global, or `undefined` to remove it.
	 * @return {void}
	 */
	function setGoogle( value: unknown ) {
		( global as unknown as { google?: unknown } ).google = value;
	}

	/**
	 * Dispatches the four report fixtures into the registry, so the loader
	 * resolves them without fetching.
	 *
	 * @since n.e.x.t
	 *
	 * @param  reports                The four reports keyed by range.
	 * @param  reports.currentTotals  Current-period totals report.
	 * @param  reports.previousTotals Previous-period totals report.
	 * @param  reports.currentChart   Current-period daily series report.
	 * @param  reports.previousChart  Previous-period daily series report.
	 * @return {void}
	 */
	function provideReports( {
		currentTotals,
		previousTotals,
		currentChart,
		previousChart,
	}: {
		currentTotals: unknown;
		previousTotals: unknown;
		currentChart: unknown;
		previousChart: unknown;
	} ) {
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport( currentTotals, {
			options: getCurrentRangeArgs( DATES ),
		} );
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport( previousTotals, {
			options: getPreviousRangeArgs( DATES ),
		} );
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport( currentChart, {
			options: getCurrentRangeChartArgs( DATES ),
		} );
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport( previousChart, {
			options: getPreviousRangeChartArgs( DATES ),
		} );
	}

	/**
	 * Dispatches fixtures where every metric has data in both periods.
	 *
	 * @since n.e.x.t
	 *
	 * @return {void}
	 */
	function provideReportsWithData() {
		provideReports( {
			currentTotals: buildTotalsReport( {
				startDate: DATES.startDate,
				endDate: DATES.endDate,
				totals: [ 10.5, 2.5, 4200, 0.05 ],
			} ),
			previousTotals: buildTotalsReport( {
				startDate: DATES.compareStartDate,
				endDate: DATES.compareEndDate,
				totals: [ 5.25, 2, 2100, 0.04 ],
			} ),
			currentChart: buildChartReport( {
				days: CURRENT_RANGE_DAYS,
				dailyValues: [ 1.5, 2.5, 600, 0.05 ],
				totals: [ 10.5, 2.5, 4200, 0.05 ],
			} ),
			previousChart: buildChartReport( {
				days: PREVIOUS_RANGE_DAYS,
				dailyValues: [ 0.75, 2, 300, 0.04 ],
				totals: [ 5.25, 2, 2100, 0.04 ],
			} ),
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		registry.dispatch( CORE_USER ).setDateRange( 'last-7-days' );

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

	it( 'should resolve the four reports in parallel and return the metrics, currency, and chart images', async () => {
		provideReportsWithData();

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
			viewOnly: false,
		} );

		expect( result.data ).toEqual( {
			dateRangeLength: DATE_RANGE_LENGTH,
			currencyCode: 'USD',
			metrics: {
				estimatedEarnings: {
					total: 10.5,
					change: calculateChange( 5.25, 10.5 ),
				},
				pageRPM: { total: 2.5, change: calculateChange( 2, 2.5 ) },
				impressions: {
					total: 4200,
					change: calculateChange( 2100, 4200 ),
				},
				pageCTR: { total: 0.05, change: calculateChange( 0.04, 0.05 ) },
			},
		} );
		expect( result.chartImages ).toEqual( {
			estimatedEarnings: CHART_DATA_URI,
			pageRPM: CHART_DATA_URI,
			impressions: CHART_DATA_URI,
			pageCTR: CHART_DATA_URI,
		} );

		// The reports are already in the store, so their resolvers make no
		// network request.
		expect( fetchMock ).not.toHaveFetched( adsenseReportEndpoint );
	} );

	it( 'should render the four line charts with the dashboard color for each metric, a dotted previous line, and the abort signal', async () => {
		provideReportsWithData();

		const signal = new AbortController().signal;
		await getPDFData( {
			registry,
			dates: DATES,
			signal,
			viewOnly: false,
		} );

		expect( mockEnsureGoogleChartsLoaded ).toHaveBeenCalledTimes( 1 );
		expect( mockRenderGoogleChartToDataURI ).toHaveBeenCalledTimes( 4 );

		const colorsByCall = [ '#6380b8', '#4bbbbb', '#3c7251', '#8e68cb' ];
		colorsByCall.forEach( ( color, index ) => {
			const args =
				mockRenderGoogleChartToDataURI.mock.calls[ index ][ 0 ];
			expect( args.chartType ).toBe( 'LineChart' );
			expect( args.signal ).toBe( signal );
			expect( args.width ).toBe( 506 );
			expect( args.height ).toBe( 133 );
			// The chart renders at 4 times its size, so the line stays sharp.
			expect( args.scaleFactor ).toBe( 4 );
			// The line widths and dash lengths are in pixels of the rendered
			// chart, so they grow with the render size.
			expect( args.options ).toMatchObject( {
				curveType: 'function',
				colors: [ color ],
				legend: { position: 'none' },
				hAxis: {
					textStyle: { fontName: 'Google Sans Text' },
				},
				vAxis: { textStyle: { fontName: 'Google Sans Text' } },
				series: {
					0: { color, lineWidth: 8 },
					1: { color, lineWidth: 8, lineDashStyle: [ 4, 20 ] },
				},
			} );
		} );
	} );

	it( 'should drop a metric with no data in either period, like its dashboard card', async () => {
		// Page CTR is zero across both periods. The other metrics keep their data.
		provideReports( {
			currentTotals: buildTotalsReport( {
				startDate: DATES.startDate,
				endDate: DATES.endDate,
				totals: [ 10.5, 2.5, 4200, 0 ],
			} ),
			previousTotals: buildTotalsReport( {
				startDate: DATES.compareStartDate,
				endDate: DATES.compareEndDate,
				totals: [ 5.25, 2, 2100, 0 ],
			} ),
			currentChart: buildChartReport( {
				days: CURRENT_RANGE_DAYS,
				dailyValues: [ 1.5, 2.5, 600, 0 ],
				totals: [ 10.5, 2.5, 4200, 0 ],
			} ),
			previousChart: buildChartReport( {
				days: PREVIOUS_RANGE_DAYS,
				dailyValues: [ 0.75, 2, 300, 0 ],
				totals: [ 5.25, 2, 2100, 0 ],
			} ),
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
			viewOnly: false,
		} );

		expect( result.data?.metrics.pageCTR ).toBeNull();
		expect( result.chartImages?.pageCTR ).toBeNull();

		expect( result.data?.metrics.estimatedEarnings ).not.toBeNull();
		expect( result.data?.metrics.pageRPM ).not.toBeNull();
		expect( result.data?.metrics.impressions ).not.toBeNull();

		// Only the three remaining cards render a chart image.
		expect( mockRenderGoogleChartToDataURI ).toHaveBeenCalledTimes( 3 );
	} );

	it( 'should return null data without loading charts when every metric is empty in both periods', async () => {
		provideReports( {
			currentTotals: buildTotalsReport( {
				startDate: DATES.startDate,
				endDate: DATES.endDate,
				totals: [ 0, 0, 0, 0 ],
			} ),
			previousTotals: buildTotalsReport( {
				startDate: DATES.compareStartDate,
				endDate: DATES.compareEndDate,
				totals: [ 0, 0, 0, 0 ],
			} ),
			currentChart: buildChartReport( {
				days: CURRENT_RANGE_DAYS,
				dailyValues: [ 0, 0, 0, 0 ],
				totals: [ 0, 0, 0, 0 ],
			} ),
			previousChart: buildChartReport( {
				days: PREVIOUS_RANGE_DAYS,
				dailyValues: [ 0, 0, 0, 0 ],
				totals: [ 0, 0, 0, 0 ],
			} ),
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
			viewOnly: false,
		} );

		// Empty data is not a failure. The report skips the section.
		expect( result ).toEqual( { data: null } );
		expect( mockEnsureGoogleChartsLoaded ).not.toHaveBeenCalled();
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );

	it( 'should throw when a report fails to load, because all four cards read the same reports', async () => {
		// Fill in every report except the current daily series, which fails
		// to fetch.
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport(
			buildTotalsReport( {
				startDate: DATES.startDate,
				endDate: DATES.endDate,
				totals: [ 10.5, 2.5, 4200, 0.05 ],
			} ),
			{ options: getCurrentRangeArgs( DATES ) }
		);
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport(
			buildTotalsReport( {
				startDate: DATES.compareStartDate,
				endDate: DATES.compareEndDate,
				totals: [ 5.25, 2, 2100, 0.04 ],
			} ),
			{ options: getPreviousRangeArgs( DATES ) }
		);
		registry.dispatch( MODULES_ADSENSE ).receiveGetReport(
			buildChartReport( {
				days: PREVIOUS_RANGE_DAYS,
				dailyValues: [ 0.75, 2, 300, 0.04 ],
				totals: [ 5.25, 2, 2100, 0.04 ],
			} ),
			{ options: getPreviousRangeChartArgs( DATES ) }
		);

		fetchMock.get( adsenseReportEndpoint, {
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
				viewOnly: false,
			} )
		).rejects.toThrow(
			/Earning performance over time reports failed to load/
		);

		// No chart renders when a report fails.
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();

		// The failing report logs an API error.
		expect( console ).toHaveErrored();
	} );

	it( 'should isolate a chart render failure to its own card', async () => {
		provideReportsWithData();

		// The first card (Earnings) fails to render its chart. The rest succeed.
		mockRenderGoogleChartToDataURI
			.mockRejectedValueOnce(
				new Error( 'Site Kit: Google Charts failed to render.' )
			)
			.mockResolvedValue( CHART_DATA_URI );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
			viewOnly: false,
		} );

		expect( result.data?.metrics.estimatedEarnings ).toBeNull();
		expect( result.chartImages?.estimatedEarnings ).toBeNull();

		expect( result.data?.metrics.pageRPM ).not.toBeNull();
		expect( result.data?.metrics.impressions ).not.toBeNull();
		expect( result.data?.metrics.pageCTR ).not.toBeNull();
		expect( result.chartImages?.pageRPM ).toBe( CHART_DATA_URI );

		expect( mockRenderGoogleChartToDataURI ).toHaveBeenCalledTimes( 4 );
	} );

	it( 'should throw when every chart render fails while the metrics have data', async () => {
		provideReportsWithData();

		mockRenderGoogleChartToDataURI.mockRejectedValue(
			new Error( 'Site Kit: Google Charts failed to render.' )
		);

		await expect(
			getPDFData( {
				registry,
				dates: DATES,
				signal: new AbortController().signal,
				viewOnly: false,
			} )
		).rejects.toThrow(
			/all Earning performance over time charts failed to render/
		);
	} );

	it( 'should stop early without loading charts when the signal is already aborted', async () => {
		provideReportsWithData();

		const controller = new AbortController();
		controller.abort();

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
			viewOnly: false,
		} );

		expect( result ).toEqual( { data: null } );
		expect( mockEnsureGoogleChartsLoaded ).not.toHaveBeenCalled();
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );

	it( 'should stop before rendering any chart when the signal aborts after the reports are dispatched', async () => {
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

		fetchMock.get( adsenseReportEndpoint, deferReport );

		const pdfPromise = getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
			viewOnly: false,
		} );

		// Wait for all four report fetches to dispatch before aborting.
		while ( deferredResolvers.length < 4 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		controller.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		const result = await pdfPromise;

		expect( result ).toEqual( { data: null } );
		// The abort check after the fetch runs before Google Charts loads.
		expect( mockEnsureGoogleChartsLoaded ).not.toHaveBeenCalled();
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );
} );
