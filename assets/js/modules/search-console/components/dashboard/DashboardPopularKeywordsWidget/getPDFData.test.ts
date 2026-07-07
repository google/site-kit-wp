/**
 * DashboardPopularKeywordsWidget getPDFData tests.
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
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
	waitForDefaultTimeouts,
} from 'tests/js/utils';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { GetPDFDataParams } from '@/js/googlesitekit/widgets/types';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { generateDateRangeArgs } from '@/js/modules/search-console/util';
import getPDFData from './getPDFData';

type Registry = WPDataRegistry & GetPDFDataParams[ 'registry' ];

/**
 * Matches the Search Console report REST endpoint.
 */
const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/search-console/data/searchanalytics'
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
 * Report fixture returned for the Top search queries request. Search Console
 * returns the rows as a top-level array, so each row has `keys`, `clicks`, and
 * `impressions`.
 */
const REPORT = [
	{ keys: [ 'cat food' ], clicks: 1200, impressions: 4500 },
	{ keys: [ 'dog toys' ], clicks: 300, impressions: 900 },
];

/**
 * Reads the query args from a report request URL.
 *
 * @since n.e.x.t
 *
 * @param requestURL Report request URL.
 * @return The request's URL search params.
 */
function paramsForRequest( requestURL: string ) {
	const parsedURL = new URL(
		requestURL.startsWith( 'http' )
			? requestURL
			: `http://example.com${ requestURL }`
	);
	return parsedURL.searchParams;
}

describe( 'DashboardPopularKeywordsWidget getPDFData', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );
		provideUserInfo( registry );
		// Receive the Search Console property so each query link builds without
		// fetching the module settings, which these report tests don't mock.
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveGetSettings( { propertyID: 'https://example.com/' } );
	} );

	it( 'fetches the Top search queries report and returns its rows', async () => {
		fetchMock.getOnce( reportEndpoint, { body: REPORT, status: 200 } );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock ).toHaveFetchedTimes( 1, reportEndpoint );
		expect( result.data?.rows ).toEqual( REPORT );
	} );

	it( 'builds a Search Console report link for each query', async () => {
		fetchMock.getOnce( reportEndpoint, { body: REPORT, status: 200 } );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		// Build the expected link from the same selector the loader uses, so the
		// test checks the query filter and date range, not the URL format.
		function reportURL( query: string ) {
			return registry
				.select( MODULES_SEARCH_CONSOLE )
				.getServiceReportURL( {
					...generateDateRangeArgs( DATES ),
					query: `!${ query }`,
				} );
		}

		expect( result.data?.links ).toEqual( {
			'cat food': reportURL( 'cat food' ),
			'dog toys': reportURL( 'dog toys' ),
		} );
	} );

	it( 'requests the report with the query dimension, a limit of 10 rows, and the date range', async () => {
		fetchMock.getOnce( reportEndpoint, { body: REPORT, status: 200 } );

		await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		const [ [ requestURL ] ] = fetchMock.calls( reportEndpoint );
		const params = paramsForRequest( requestURL );

		expect( params.get( 'dimensions' ) ).toBe( 'query' );
		expect( params.get( 'limit' ) ).toBe( '10' );
		expect( params.get( 'startDate' ) ).toBe( '2025-01-08' );
		expect( params.get( 'endDate' ) ).toBe( '2025-02-04' );
	} );

	it( 'forwards the abort signal to the report request', async () => {
		fetchMock.getOnce( reportEndpoint, { body: REPORT, status: 200 } );

		const { signal } = new AbortController();

		await getPDFData( { registry, dates: DATES, signal } );

		// The registry starts resolver runs from a timeout. Wait for those
		// timeouts to finish, so any extra request shows up in the call count
		// this test checks.
		await waitForDefaultTimeouts();

		// The request must receive the same `signal` object, so aborting the
		// export stops it. A `toEqual` check would pass for any signal.
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 1 );

		const [ [ , options ] ] = fetchMock.calls( reportEndpoint );
		expect( options?.signal ).toBe( signal );
	} );

	it( 'skips the request and returns null data when the signal is already aborted', async () => {
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

	it( 'returns null data when the report has no rows', async () => {
		fetchMock.getOnce( reportEndpoint, { body: [], status: 200 } );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		// Null data tells the report document to skip the widget, so the PDF
		// holds no empty section.
		expect( result ).toEqual( { data: null } );
	} );

	it( 'returns null data when the signal aborts after the report request is sent', async () => {
		const controller = new AbortController();
		const deferredResolvers: Array< () => void > = [];

		fetchMock.get(
			reportEndpoint,
			() =>
				new Promise< { body: unknown; status: number } >(
					( resolve ) => {
						deferredResolvers.push( () =>
							resolve( { body: REPORT, status: 200 } )
						);
					}
				)
		);

		const pdfDataRun = getPDFData( {
			registry,
			dates: DATES,
			signal: controller.signal,
		} );

		// Wait for the report request to dispatch before aborting.
		while ( deferredResolvers.length < 1 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		controller.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		const result = await pdfDataRun;

		expect( result ).toEqual( { data: null } );
	} );

	it( 'fetches the report again on a new call after an earlier call was aborted', async () => {
		const firstController = new AbortController();
		const deferredResolvers: Array< () => void > = [];
		let requestCount = 0;

		fetchMock.get( reportEndpoint, () => {
			requestCount++;

			// Hold the first run's request open, so the abort happens while it
			// is still running. Later requests respond at once.
			if ( requestCount === 1 ) {
				return new Promise< { body: unknown; status: number } >(
					( resolve ) => {
						deferredResolvers.push( () =>
							resolve( { body: REPORT, status: 200 } )
						);
					}
				);
			}

			return { body: REPORT, status: 200 };
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

		expect( secondRun.data?.rows ).toEqual( REPORT );
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 2 );
	} );
} );
