/**
 * DashboardTopEarningPagesWidgetGA4 getPDFData tests.
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
import { createTestRegistry, waitForDefaultTimeouts } from 'tests/js/utils';

/**
 * Internal dependencies
 */
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import { MODULES_ADSENSE } from '@/js/modules/adsense/datastore/constants';
import getPDFData from './getPDFData';

// The registry `getPDFData` receives: the WordPress data registry with
// `resolveSelect` added.
type Registry = GetPDFDataParams[ 'registry' ];

/**
 * Matches the GA4 report REST endpoint.
 */
const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

/**
 * AdSense account ID seeded into the registry.
 */
const ACCOUNT_ID = 'pub-1234567890';

/**
 * Date range fixture passed to the loader.
 */
const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

/**
 * Main Top earning pages report fixture, dimensioned by page path and ad source
 * and carrying the account currency in its metadata.
 */
const MAIN_REPORT = {
	metadata: { currencyCode: 'EUR' },
	rows: [
		{
			dimensionValues: [
				{ value: '/' },
				{ value: `Google AdSense account (${ ACCOUNT_ID })` },
			],
			metricValues: [ { value: '0.31' } ],
		},
		{
			dimensionValues: [
				{ value: '/about' },
				{ value: `Google AdSense account (${ ACCOUNT_ID })` },
			],
			metricValues: [ { value: '0.05' } ],
		},
	],
};

/**
 * Page titles report fixture returned for page-titles requests.
 */
const TITLES_REPORT = {
	rows: [
		{ dimensionValues: [ { value: '/' }, { value: 'Home' } ] },
		{ dimensionValues: [ { value: '/about' }, { value: 'About' } ] },
	],
};

/**
 * Sets up `fetchMock` so each report request returns the matching fixture. Only
 * the page titles report requests the `pageTitle` dimension, so a request whose
 * URL contains `pageTitle` returns the `titles` fixture, and every other report
 * request returns the `main` fixture.
 *
 * @since 1.184.0
 *
 * @param  [reports]        Report fixtures to return.
 * @param  [reports.main]   Report returned for requests other than the page titles report.
 * @param  [reports.titles] Report returned for the page titles report request.
 * @return {void}
 */
function provideReports( {
	main = MAIN_REPORT,
	titles = TITLES_REPORT,
}: { main?: typeof MAIN_REPORT; titles?: typeof TITLES_REPORT } = {} ) {
	fetchMock.get( reportEndpoint, ( requestURL ) => ( {
		body: requestURL.includes( 'pageTitle' ) ? titles : main,
		status: 200,
	} ) );
}

describe( 'DashboardTopEarningPagesWidgetGA4 getPDFData', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		registry
			.dispatch( MODULES_ADSENSE )
			.receiveGetSettings( { accountID: ACCOUNT_ID } );
	} );

	it( 'returns rows, currency code, and page titles from the two reports', async () => {
		const requestedReports: string[] = [];

		fetchMock.get( reportEndpoint, ( requestURL ) => {
			// Only the page titles report requests the `pageTitle` dimension.
			const isPageTitlesRequest = requestURL.includes( 'pageTitle' );
			requestedReports.push(
				isPageTitlesRequest ? 'page-titles' : 'main'
			);

			return {
				body: isPageTitlesRequest ? TITLES_REPORT : MAIN_REPORT,
				status: 200,
			};
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		// The loader requests the main report first, then the page titles report.
		expect( requestedReports ).toEqual( [ 'main', 'page-titles' ] );

		expect( result ).toEqual( {
			data: {
				rows: MAIN_REPORT.rows,
				currencyCode: 'EUR',
				titles: { '/': 'Home', '/about': 'About' },
			},
		} );
	} );

	it( 'requests the main report with the expected options', async () => {
		provideReports();

		await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		// The first report request is the main Top earning pages report.
		const [ mainRequestURL ] = fetchMock.calls( reportEndpoint )[ 0 ];
		const mainRequest = decodeURIComponent( mainRequestURL );

		expect( mainRequest ).toContain( 'pagePath' );
		expect( mainRequest ).toContain( 'adSourceName' );
		expect( mainRequest ).toContain( 'totalAdRevenue' );
		// The `adSourceName` filter targets the resolved AdSense account.
		expect( mainRequest ).toContain(
			`Google AdSense account (${ ACCOUNT_ID })`
		);
		// Limited to the top five earning pages.
		expect( mainRequest ).toContain( 'limit=5' );
	} );

	it( 'resolves the AdSense settings before building the report when they are not loaded yet', async () => {
		// Fresh registry without the settings seeded in `beforeEach`, matching
		// an export that starts before the AdSense store has loaded them.
		registry = createTestRegistry() as Registry;

		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/modules/adsense/data/settings' ),
			{ body: { accountID: ACCOUNT_ID }, status: 200 }
		);
		provideReports();

		await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		// The report filter targets the fetched account, not `(undefined)`.
		const [ mainRequestURL ] = fetchMock.calls( reportEndpoint )[ 0 ];
		const mainRequest = decodeURIComponent( mainRequestURL );

		expect( mainRequest ).toContain(
			`Google AdSense account (${ ACCOUNT_ID })`
		);
		expect( mainRequest ).not.toContain( '(undefined)' );
	} );

	it( 'keeps the first title for a repeated path and falls back to "(unknown)" for a missing one', async () => {
		const mainReport = {
			metadata: { currencyCode: 'EUR' },
			rows: [
				...MAIN_REPORT.rows,
				{
					dimensionValues: [
						{ value: '/contact' },
						{ value: `Google AdSense account (${ ACCOUNT_ID })` },
					],
					metricValues: [ { value: '0.03' } ],
				},
			],
		};
		const titlesReport = {
			rows: [
				{ dimensionValues: [ { value: '/' }, { value: 'Home' } ] },
				{
					dimensionValues: [
						{ value: '/' },
						{ value: 'Home (older)' },
					],
				},
				{
					dimensionValues: [
						{ value: '/about' },
						{ value: 'About' },
					],
				},
			],
		};

		provideReports( { main: mainReport, titles: titlesReport } );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.titles ).toEqual( {
			'/': 'Home',
			'/about': 'About',
			'/contact': '(unknown)',
		} );
	} );

	it( 'forwards the abort signal to both the main report and page titles requests', async () => {
		provideReports();

		const { signal } = new AbortController();

		await getPDFData( { registry, dates: DATES, signal } );

		// The registry starts resolver runs from a timeout. Wait for those
		// timeouts, so an extra run would add its request to the calls this test
		// counts.
		await waitForDefaultTimeouts();

		const signals = fetchMock
			.calls( reportEndpoint )
			.map( ( [ , options ] ) => options?.signal );

		// Check with `toBe` that each request received this exact signal object.
		// Every `AbortSignal` looks the same to `toEqual`, so a `toEqual` check
		// could pass with the wrong signal.
		expect( signals ).toHaveLength( 2 );
		expect( signals[ 0 ] ).toBe( signal );
		expect( signals[ 1 ] ).toBe( signal );
	} );

	it( 'returns null data without fetching the titles report when the main report has no rows', async () => {
		fetchMock.get( reportEndpoint, {
			body: { metadata: { currencyCode: 'EUR' }, rows: [] },
			status: 200,
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		await waitForDefaultTimeouts();

		expect( result ).toEqual( { data: null } );
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 1 );
	} );

	it( 'returns null data without fetching when the signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'returns null data and skips the titles fetch when the signal aborts after the main report loads', async () => {
		const controller = new AbortController();
		const deferredResolvers: Array< () => void > = [];

		fetchMock.get(
			reportEndpoint,
			() =>
				new Promise< { body: unknown; status: number } >(
					( resolve ) => {
						deferredResolvers.push( () =>
							resolve( { body: MAIN_REPORT, status: 200 } )
						);
					}
				)
		);

		const pdfDataRun = getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		// Wait for the main report request to dispatch before aborting.
		while ( deferredResolvers.length < 1 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		controller.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		const result = await pdfDataRun;

		expect( result ).toEqual( { data: null } );
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 1 );
	} );
} );
