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
 * Internal dependencies
 */
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import getPDFData, { PDFDataRegistry } from './getPDFData';
import { getGraphReportArgs, getTotalsReportArgs } from './reportOptions';

const reportEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/report'
);

const dates = {
	startDate: '2025-01-08',
	endDate: '2025-02-04',
	compareStartDate: '2024-12-11',
	compareEndDate: '2025-01-07',
};

describe( 'DashboardAllTrafficWidgetGA4 getPDFData', () => {
	let registry: PDFDataRegistry;

	beforeEach( () => {
		registry = createTestRegistry() as PDFDataRegistry;
		provideSiteInfo( registry );
	} );

	it( 'resolves both totals and graph reports in parallel and returns the expected shape', async () => {
		const totalsReport = {
			totals: [ { metricValues: [ { value: '100' } ] } ],
		};
		const graphReport = {
			rows: [ { metricValues: [ { value: '10' } ] } ],
		};

		const totalsArgs = getTotalsReportArgs( dates );
		const graphArgs = getGraphReportArgs( {
			startDate: dates.startDate,
			endDate: dates.endDate,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( totalsReport, { options: totalsArgs } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetReport( graphReport, { options: graphArgs } );

		const result = await getPDFData( {
			registry,
			dates,
			signal: new AbortController().signal,
		} );

		expect( result ).toEqual( {
			data: { totalsReport, graphReport },
		} );

		// The resolver short-circuits when data is already present, so no
		// network request should have been made.
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'forwards the current entity URL when one is set', async () => {
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
			dates,
			signal: new AbortController().signal,
		} );

		const calls = fetchMock.calls( reportEndpoint );
		expect( calls ).toHaveLength( 2 );
		for ( const [ requestedURL ] of calls ) {
			expect( requestedURL ).toContain( encodeURIComponent( entityURL ) );
		}
	} );

	it( 'stops building the report without dispatching a request when signal is already aborted', async () => {
		const controller = new AbortController();
		controller.abort();

		const result = await getPDFData( {
			registry,
			dates,
			signal: controller.signal,
		} );

		expect( result ).toEqual( { data: null } );
		expect( fetchMock ).not.toHaveFetched( reportEndpoint );
	} );

	it( 'stops building the report when signal aborts after the request is dispatched but is not yet resolved', async () => {
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
			dates,
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
	} );
} );
