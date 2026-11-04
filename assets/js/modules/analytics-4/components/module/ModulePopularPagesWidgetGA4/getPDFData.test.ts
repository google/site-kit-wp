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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { getFullURL } from '@/js/util';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
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
 * Analytics property ID the registry settings hold, for the page links.
 */
const PROPERTY_ID = '123456789';

/**
 * Builds the Analytics report link the loader resolves for a page path.
 *
 * The link comes from the same selector the loader uses, so a test checks the
 * page filter and date range, not the URL format.
 *
 * @since 1.186.0
 *
 * @param {Registry} registry Registry that holds the Analytics property.
 * @param {string}   pagePath Page path from a report row.
 * @return {string} The All pages and screens report link for the page.
 */
function getExpectedPageLink( registry: Registry, pagePath: string ): string {
	return registry
		.select( MODULES_ANALYTICS_4 )
		.getServiceReportURL( 'all-pages-and-screens', {
			filters: { unifiedPagePathScreen: pagePath },
			dates: { startDate: DATES.startDate, endDate: DATES.endDate },
		} );
}

/**
 * Builds the entity dashboard link the loader resolves for a view-only page path.
 *
 * The link comes from the same selector the loader uses, so a test checks the
 * title falls back to the page's entity dashboard, not the URL format.
 *
 * @since 1.186.0
 *
 * @param {Registry} registry Registry that holds the reference site URL.
 * @param {string}   pagePath Page path from a report row.
 * @return {string} The page's entity dashboard link.
 */
function getExpectedDetailsURL( registry: Registry, pagePath: string ): string {
	const siteURL = registry.select( CORE_SITE ).getReferenceSiteURL();

	return registry
		.select( CORE_SITE )
		.getAdminURL( 'googlesitekit-dashboard', {
			permaLink: getFullURL( siteURL, pagePath ),
		} );
}

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
		provideUserInfo( registry );
		// Receive the Analytics property so each page link builds without
		// fetching the module settings, which these report tests don't mock.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetSettings( { propertyID: PROPERTY_ID } );
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
			viewOnly: false,
		} );

		// The loader requests the main report first, then the page titles report.
		expect( requestedReports ).toEqual( [ 'main', 'page-titles' ] );

		// An unset Analytics property would make the expected link and the
		// loader's link both empty, so check the link holds a URL first.
		const homeLink = getExpectedPageLink( registry, '/' );
		expect( homeLink ).toBeTruthy();

		expect( result ).toEqual( {
			data: {
				rows: MAIN_REPORT.rows,
				titles: { '/': 'Home', '/about': 'About' },
				links: {
					'/': {
						titleURL: homeLink,
						permaLink: 'http://example.com/',
					},
					'/about': {
						titleURL: getExpectedPageLink( registry, '/about' ),
						permaLink: 'http://example.com/about',
					},
				},
			},
		} );
	} );

	it( 'links each title to its entity dashboard on a view-only dashboard', async () => {
		fetchMock.get( reportEndpoint, ( requestURL ) => ( {
			body: requestURL.includes( 'pageTitle' )
				? TITLES_REPORT
				: MAIN_REPORT,
			status: 200,
		} ) );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
			viewOnly: true,
		} );

		// A view-only user can't reach the Analytics report, so each title falls
		// back to the page's entity dashboard, the same link the dashboard widget
		// renders. The URL line still links to the page itself.
		const homeDetailsURL = getExpectedDetailsURL( registry, '/' );
		expect( homeDetailsURL ).toBeTruthy();
		expect( homeDetailsURL ).not.toBe(
			getExpectedPageLink( registry, '/' )
		);

		expect( result ).toEqual( {
			data: {
				rows: MAIN_REPORT.rows,
				titles: { '/': 'Home', '/about': 'About' },
				links: {
					'/': {
						titleURL: homeDetailsURL,
						permaLink: 'http://example.com/',
					},
					'/about': {
						titleURL: getExpectedDetailsURL( registry, '/about' ),
						permaLink: 'http://example.com/about',
					},
				},
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
			viewOnly: false,
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

		await getPDFData( {
			registry,
			dates: DATES,
			signal,
			viewOnly: false,
		} );

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
			viewOnly: false,
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
			viewOnly: false,
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
			viewOnly: false,
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
			viewOnly: false,
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
			viewOnly: false,
		} );

		expect( secondRun ).toEqual( {
			data: {
				rows: MAIN_REPORT.rows,
				titles: { '/': 'Home', '/about': 'About' },
				links: {
					'/': {
						titleURL: getExpectedPageLink( registry, '/' ),
						permaLink: 'http://example.com/',
					},
					'/about': {
						titleURL: getExpectedPageLink( registry, '/about' ),
						permaLink: 'http://example.com/about',
					},
				},
			},
		} );
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 3 );
	} );
} );
