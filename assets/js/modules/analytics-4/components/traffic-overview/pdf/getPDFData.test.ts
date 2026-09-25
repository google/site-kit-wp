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
	getGraphReportArgs,
	getTotalsReportArgs,
} from '@/js/modules/analytics-4/components/traffic-overview/reportOptions';
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

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/**
 * Builds one breakdown's report args at the shared `DATES`.
 *
 * @since n.e.x.t
 *
 * @param {string} dimensionName Breakdown dimension name.
 * @param {string} reportID      Report ID for cache isolation.
 * @param {string} [url]         Current entity URL, when the test provides one.
 * @return {Object} Args for `getBreakdownReportArgs()`.
 */
function breakdownArgsFor(
	dimensionName: string,
	reportID: string,
	url?: string
) {
	return getBreakdownReportArgs( {
		dimensionName,
		reportID,
		startDate: DATES.startDate,
		endDate: DATES.endDate,
		url,
	} );
}

const channelsArgs = breakdownArgsFor(
	'sessionDefaultChannelGrouping',
	CHANNELS_BREAKDOWN_REPORT_ID
);
const locationsArgs = breakdownArgsFor(
	'country',
	LOCATIONS_BREAKDOWN_REPORT_ID
);
const devicesArgs = breakdownArgsFor(
	'deviceCategory',
	DEVICES_BREAKDOWN_REPORT_ID
);

/**
 * Builds a breakdown report ordered by visitors, matching what GA4 returns.
 *
 * @since n.e.x.t
 *
 * @param {Array} entries Ordered `[ label, users ]` pairs.
 * @return {Object} A GA4 report with rows, no `totals`.
 */
function buildBreakdownReport( entries: Array< [ string, number ] > ) {
	return {
		rows: entries.map( ( [ label, users ] ) => ( {
			dimensionValues: [ { value: label } ],
			metricValues: [ { value: String( users ) } ],
		} ) ),
	};
}

function setGoogle( value: unknown ) {
	( global as unknown as { google?: unknown } ).google = value;
}

/**
 * Seeds the totals and graph reports so `getPDFData` resolves them from state
 * without a network request.
 *
 * @since n.e.x.t
 *
 * @param {Object} testRegistry Registry to seed.
 * @return {void}
 */
function seedTotalsAndGraphReports( testRegistry: Registry ) {
	testRegistry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport(
			{ totals: [ { metricValues: [ { value: '100' } ] } ] },
			{ options: getTotalsReportArgs( DATES ) }
		);
	testRegistry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
		{ rows: [] },
		{
			options: getGraphReportArgs( {
				startDate: DATES.startDate,
				endDate: DATES.endDate,
			} ),
		}
	);
}

/**
 * Seeds the channels, locations, and devices breakdown reports with one row
 * each, so none of them resolve to `null`.
 *
 * @since n.e.x.t
 *
 * @param {Object} testRegistry Registry to seed.
 * @return {void}
 */
function seedDefaultBreakdownReports( testRegistry: Registry ) {
	testRegistry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( buildBreakdownReport( [ [ 'Direct', 1 ] ] ), {
			options: channelsArgs,
		} );
	testRegistry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( buildBreakdownReport( [ [ 'Brazil', 1 ] ] ), {
			options: locationsArgs,
		} );
	testRegistry
		.dispatch( MODULES_ANALYTICS_4 )
		.receiveGetReport( buildBreakdownReport( [ [ 'Mobile', 1 ] ] ), {
			options: devicesArgs,
		} );
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

	it( 'builds the five reports with the selected range and no entity URL', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [] },
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
			.receiveGetReport( { rows: [] }, { options: channelsArgs } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { rows: [] }, { options: locationsArgs } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( { rows: [] }, { options: devicesArgs } );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.data ).toEqual( {
			totalsReport: { totals: [] },
			graphReport: { rows: [] },
			channelBreakdown: [],
			locationBreakdown: [],
			deviceBreakdown: [],
		} );
	} );

	it( 'builds the five reports with the current entity URL when one is set', async () => {
		const entityURL = 'https://example.com/post-1';
		provideSiteInfo( registry, { currentEntityURL: entityURL } );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [] },
				{ options: getTotalsReportArgs( { ...DATES, url: entityURL } ) }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: getGraphReportArgs( {
					startDate: DATES.startDate,
					endDate: DATES.endDate,
					url: entityURL,
				} ),
			}
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: breakdownArgsFor(
					'sessionDefaultChannelGrouping',
					CHANNELS_BREAKDOWN_REPORT_ID,
					entityURL
				),
			}
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: breakdownArgsFor(
					'country',
					LOCATIONS_BREAKDOWN_REPORT_ID,
					entityURL
				),
			}
		);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{ rows: [] },
			{
				options: breakdownArgsFor(
					'deviceCategory',
					DEVICES_BREAKDOWN_REPORT_ID,
					entityURL
				),
			}
		);

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
		expect( result.data ).toEqual( {
			totalsReport: { totals: [] },
			graphReport: { rows: [] },
			channelBreakdown: [],
			locationBreakdown: [],
			deviceBreakdown: [],
		} );
	} );

	it( 'returns chartImages holding only lineChart', async () => {
		seedTotalsAndGraphReports( registry );
		seedDefaultBreakdownReports( registry );

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

	it( 'writes the value labels in short form, leaves room for them, and labels every day', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport(
				{ totals: [ { metricValues: [ { value: '8400' } ] } ] },
				{ options: getTotalsReportArgs( DATES ) }
			);
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{
				rows: [
					[ '20250108', '900' ],
					[ '20250109', '1200' ],
					[ '20250110', '1500' ],
					[ '20250111', '1100' ],
					[ '20250112', '1300' ],
					[ '20250113', '1000' ],
					[ '20250114', '1400' ],
				].map( ( [ date, users ] ) => ( {
					dimensionValues: [ { value: date } ],
					metricValues: [ { value: users } ],
				} ) ),
			},
			{
				options: getGraphReportArgs( {
					startDate: DATES.startDate,
					endDate: DATES.endDate,
				} ),
			}
		);
		seedDefaultBreakdownReports( registry );

		await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

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

	it( 'shapes each breakdown report with getBreakdownRows()', async () => {
		seedTotalsAndGraphReports( registry );
		const channelReport = buildBreakdownReport( [
			[ 'Organic Search', 60 ],
			[ 'Direct', 20 ],
			[ 'Referral', 20 ],
		] );
		const locationReport = buildBreakdownReport( [
			[ 'Singapore', 60 ],
			[ 'Brazil', 50 ],
			[ 'China', 40 ],
			[ 'United States', 30 ],
			[ 'India', 20 ],
			[ 'Canada', 10 ],
		] );
		const deviceReport = buildBreakdownReport( [
			[ 'Desktop', 3 ],
			[ 'Mobile', 1 ],
		] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( channelReport, { options: channelsArgs } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( locationReport, { options: locationsArgs } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( deviceReport, { options: devicesArgs } );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.channelBreakdown ).toEqual(
			getBreakdownRows( channelReport )
		);
		expect( result.data?.locationBreakdown ).toEqual(
			getBreakdownRows( locationReport )
		);
		// The six-country report collapses to the top four plus one "Others"
		// row, matching the card's column.
		expect( result.data?.locationBreakdown ).toHaveLength( 5 );
		expect( result.data?.deviceBreakdown ).toEqual(
			getBreakdownRows( deviceReport )
		);
	} );

	it( 'leaves a failed breakdown report null while the other two still resolve', async () => {
		seedTotalsAndGraphReports( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Direct', 1 ] ] ), {
				options: channelsArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [ [ 'Mobile', 1 ] ] ), {
				options: devicesArgs,
			} );

		// The `country` dimension is unique to the locations request among the
		// three breakdowns, since the report ID is a cache key, not part of the
		// request URL.
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

		expect( result.data?.locationBreakdown ).toBeNull();
		expect( result.data?.channelBreakdown ).toEqual( [
			{ label: 'Direct', percentage: 1 },
		] );
		expect( result.data?.deviceBreakdown ).toEqual( [
			{ label: 'Mobile', percentage: 1 },
		] );
		expect( console ).toHaveErrored();
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

	it( 'stops after the reports resolve when the signal aborts before the chart renders', async () => {
		const controller = new AbortController();

		seedTotalsAndGraphReports( registry );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [] ), {
				options: channelsArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [] ), {
				options: locationsArgs,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( buildBreakdownReport( [] ), {
				options: devicesArgs,
			} );

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

		seedTotalsAndGraphReports( registry );
		seedDefaultBreakdownReports( registry );

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

	it( 'forwards the abort signal to each report request', async () => {
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

		expect( signals ).toHaveLength( 5 );
		signals.forEach( ( forwardedSignal ) => {
			expect( forwardedSignal ).toBe( signal );
		} );
	} );
} );
