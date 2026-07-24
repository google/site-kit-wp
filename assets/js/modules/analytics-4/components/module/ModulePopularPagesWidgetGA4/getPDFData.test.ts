/**
 * ModulePopularPagesWidgetGA4 getPDFData tests.
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
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import {
	createTestRegistry,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import getPDFData from './getPDFData';

type Registry = WPDataRegistry & GetPDFDataParams[ 'registry' ];

/**
 * Matches the GA4 report REST endpoint.
 */
const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

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
 * Main report fixture returned for non-page-titles requests.
 */
const MAIN_REPORT = {
	rows: [
		{
			dimensionValues: [ { value: '/' } ],
			metricValues: [
				{ value: '1200' },
				{ value: '800' },
				{ value: '0.5' },
				{ value: '98' },
			],
		},
		{
			dimensionValues: [ { value: '/about' } ],
			metricValues: [
				{ value: '300' },
				{ value: '200' },
				{ value: '0.4' },
				{ value: '51' },
			],
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
 * Per-page links the loader builds for each page path, from the default test
 * admin URL and reference site URL. The title links to the entity dashboard,
 * and the permaLink to the page itself.
 */
const LINKS = {
	'/': {
		detailsURL:
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=http%3A%2F%2Fexample.com%2F',
		permaLink: 'http://example.com/',
	},
	'/about': {
		detailsURL:
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&permaLink=http%3A%2F%2Fexample.com%2Fabout',
		permaLink: 'http://example.com/about',
	},
};

/**
 * Sets up `fetchMock` so each report request returns the matching fixture. Only
 * the page titles report requests the `pageTitle` dimension, so a request whose
 * URL contains `pageTitle` returns the `titles` fixture, and every other report
 * request returns the `main` fixture.
 *
 * @since 1.182.0
 *
 * @param  [reports]        Report fixtures to return.
 * @param  [reports.main]   Report returned for requests other than the page titles report.
 * @param  [reports.titles] Report returned for the page titles report request.
 * @return {void}
 */
function provideReports( {
	main = MAIN_REPORT,
	titles = TITLES_REPORT,
}: { main?: unknown; titles?: unknown } = {} ) {
	fetchMock.get( reportEndpoint, ( requestURL ) => ( {
		body: requestURL.includes( 'pageTitle' ) ? titles : main,
		status: 200,
	} ) );
}

describe( 'ModulePopularPagesWidgetGA4 getPDFData', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );
	} );

	it( 'returns rows, page titles, and per-page links from the two reports', async () => {
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
				titles: { '/': 'Home', '/about': 'About' },
				links: LINKS,
			},
		} );
	} );

	it( 'keeps the first title for a repeated path and falls back to "(unknown)" for a missing one', async () => {
		const mainReport = {
			rows: [
				...MAIN_REPORT.rows,
				{
					dimensionValues: [ { value: '/contact' } ],
					metricValues: [
						{ value: '120' },
						{ value: '90' },
						{ value: '0.3' },
						{ value: '12' },
					],
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

		// Check with `toBe` that each request received this exact signal
		// object. Every `AbortSignal` looks the same to `toEqual`, so a
		// `toEqual` check could pass with the wrong signal.
		expect( signals ).toHaveLength( 2 );
		expect( signals[ 0 ] ).toBe( signal );
		expect( signals[ 1 ] ).toBe( signal );
	} );

	it( 'returns null data without fetching the titles report when the main report has no rows', async () => {
		fetchMock.get( reportEndpoint, { body: { rows: [] }, status: 200 } );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		await waitForDefaultTimeouts();

		// Null data tells the report document to skip the widget, so the PDF
		// holds no empty section.
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

	it( 'fetches the reports again when a new run starts after an aborted run', async () => {
		const firstController = new AbortController();
		const deferredResolvers: Array< () => void > = [];
		let requestCount = 0;

		fetchMock.get( reportEndpoint, ( requestURL ) => {
			requestCount++;

			// Hold the first run's main report request open, so the abort
			// happens while it is still running. Later requests respond at once.
			if ( requestCount === 1 ) {
				return new Promise< { body: unknown; status: number } >(
					( resolve ) => {
						deferredResolvers.push( () =>
							resolve( { body: MAIN_REPORT, status: 200 } )
						);
					}
				);
			}

			// Only the page titles report requests the `pageTitle` dimension.
			return {
				body: requestURL.includes( 'pageTitle' )
					? TITLES_REPORT
					: MAIN_REPORT,
				status: 200,
			};
		} );

		const firstRun = getPDFData( {
			registry,
			dates: DATES,
			signal: firstController.signal,
		} );

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

		expect( secondRun ).toEqual( {
			data: {
				rows: MAIN_REPORT.rows,
				titles: { '/': 'Home', '/about': 'About' },
				links: LINKS,
			},
		} );
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 3 );
	} );
} );
