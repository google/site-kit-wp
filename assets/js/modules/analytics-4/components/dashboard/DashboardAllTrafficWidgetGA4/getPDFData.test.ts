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
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import getPDFData, { GetPDFDataParams } from './getPDFData';
import { getGraphReportArgs, getTotalsReportArgs } from './reportOptions';

jest.mock( '@/js/components/pdf-export/ensure-google-charts-loaded', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );
jest.mock(
	'@/js/components/pdf-export/render-google-chart-to-data-uri',
	() => ( {
		// Keep the real `getVisualization` (used by `getPDFData` to build the
		// DataTable); only the default rasteriser export is mocked.
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

const LINE_CHART_DATA_URI = 'data:image/jpeg;base64,TU9DSw==';

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

function setGoogle( value: unknown ) {
	( global as unknown as { google?: unknown } ).google = value;
}

describe( 'DashboardAllTrafficWidgetGA4 getPDFData', () => {
	let registry: Registry;
	let dataTable: { addColumn: jest.Mock; addRows: jest.Mock };

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );

		mockEnsureGoogleChartsLoaded.mockReset().mockResolvedValue( undefined );
		mockRenderGoogleChartToDataURI
			.mockReset()
			.mockResolvedValue( LINE_CHART_DATA_URI );

		// `getPDFData` builds the chart data via `new google.visualization.DataTable()`.
		dataTable = { addColumn: jest.fn(), addRows: jest.fn() };
		setGoogle( {
			visualization: { DataTable: jest.fn( () => dataTable ) },
		} );
	} );

	afterEach( () => {
		setGoogle( undefined );
	} );

	it( 'should resolve both totals and graph reports in parallel and return the expected shape', async () => {
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

		const totalsArgs = getTotalsReportArgs( DATES );
		const graphArgs = getGraphReportArgs( {
			startDate: DATES.startDate,
			endDate: DATES.endDate,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( totalsReport, { options: totalsArgs } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( graphReport, { options: graphArgs } );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result ).toEqual( {
			data: { totalsReport, graphReport },
			chartImages: { lineChart: LINE_CHART_DATA_URI },
		} );

		// The resolver short-circuits when data is already present, so no
		// network request should have been made.
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'should load Google Charts and rasterise the line chart with the expected DataTable and options', async () => {
		const totalsReport = {
			totals: [ { metricValues: [ { value: '100' } ] } ],
		};
		const graphReport = {
			rows: [
				{
					dimensionValues: [ { value: '20250108' } ],
					metricValues: [ { value: '10' } ],
				},
				{
					dimensionValues: [ { value: '20250109' } ],
					metricValues: [ { value: '20' } ],
				},
			],
		};

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
		expect( renderArgs.width ).toBe( 540 );
		expect( renderArgs.height ).toBe( 200 );
		expect( renderArgs.signal ).toBe( signal );
		expect( renderArgs.dataTable ).toBe( dataTable );
		expect( renderArgs.options ).toMatchObject( {
			curveType: 'function',
			colors: [ '#3c7251' ],
			legend: { position: 'none' },
			hAxis: { format: 'MMM d' },
			series: { 0: { color: '#3c7251', lineWidth: 3 } },
		} );

		expect( result.chartImages ).toEqual( {
			lineChart: LINE_CHART_DATA_URI,
		} );
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
		expect( calls ).toHaveLength( 2 );
		for ( const [ requestedURL ] of calls ) {
			expect( requestedURL ).toContain( encodeURIComponent( entityURL ) );
		}
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

		// Wait for both `resolveSelect( ... ).getReport( ... )` calls to dispatch
		// their fetches before aborting.
		while ( deferredResolvers.length < 2 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		controller.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		const result = await pdfPromise;

		expect( result ).toEqual( { data: null } );
		expect( fetchMock ).toHaveFetched( reportEndpoint );
		// The post-fetch abort check runs before the chart is rasterised.
		expect( mockEnsureGoogleChartsLoaded ).not.toHaveBeenCalled();
		expect( mockRenderGoogleChartToDataURI ).not.toHaveBeenCalled();
	} );
} );
