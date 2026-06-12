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
import { createTestRegistry } from 'tests/js/utils';
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import getPDFData, { GetPDFDataParams } from './getPDFData';

type Registry = WPDataRegistry & GetPDFDataParams[ 'registry' ];

const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

const DATES = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
};

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

const TITLES_REPORT = {
	rows: [
		{ dimensionValues: [ { value: '/' }, { value: 'Home' } ] },
		{ dimensionValues: [ { value: '/about' }, { value: 'About' } ] },
	],
};

function reportIDForRequest( requestURL: string ) {
	const parsedURL = new URL(
		requestURL.startsWith( 'http' )
			? requestURL
			: `http://example.com${ requestURL }`
	);
	return parsedURL.searchParams.get( 'reportID' ) ?? '';
}

describe( 'ModulePopularPagesWidgetGA4 getPDFData', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
	} );

	it( 'fetches the main report, then the page titles report, and returns rows with the resolved titles', async () => {
		const requestedReportIDs: string[] = [];

		fetchMock.get( reportEndpoint, ( requestURL ) => {
			const reportID = reportIDForRequest( requestURL );
			requestedReportIDs.push( reportID );

			return {
				body: reportID.includes( 'get-page-titles' )
					? TITLES_REPORT
					: MAIN_REPORT,
				status: 200,
			};
		} );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( requestedReportIDs ).toHaveLength( 2 );
		expect( requestedReportIDs[ 0 ] ).toContain(
			'module-popular-pages-widget-ga4'
		);
		expect( requestedReportIDs[ 1 ] ).toContain( 'get-page-titles' );

		expect( result ).toEqual( {
			data: {
				rows: MAIN_REPORT.rows,
				titles: { '/': 'Home', '/about': 'About' },
			},
		} );
	} );

	it( 'falls back to "(unknown)" for a page path the titles report misses', async () => {
		fetchMock.get( reportEndpoint, ( requestURL ) => ( {
			body: reportIDForRequest( requestURL ).includes( 'get-page-titles' )
				? { rows: [ { dimensionValues: [ { value: '/' }, { value: 'Home' } ] } ] }
				: MAIN_REPORT,
			status: 200,
		} ) );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result.data?.titles ).toEqual( {
			'/': 'Home',
			'/about': '(unknown)',
		} );
	} );

	it( 'returns empty data without fetching the titles report when the main report has no rows', async () => {
		fetchMock.get( reportEndpoint, { body: { rows: [] }, status: 200 } );

		const result = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( result ).toEqual( { data: { rows: [], titles: {} } } );
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

	it( 'returns null data and skips the titles fetch when the signal aborts after the main report resolves', async () => {
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

		const pdfDataPromise = getPDFData( {
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

		const result = await pdfDataPromise;

		expect( result ).toEqual( { data: null } );
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 1 );
	} );
} );
