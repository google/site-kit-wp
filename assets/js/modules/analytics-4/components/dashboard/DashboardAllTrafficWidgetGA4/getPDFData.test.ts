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
import {
	createTestRegistry,
	provideSiteInfo,
	waitForDefaultTimeouts,
} from 'tests/js/utils';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import getPDFData, { GetPDFDataParams } from './getPDFData';
import { getGraphReportArgs, getTotalsReportArgs } from './reportOptions';

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

describe( 'DashboardAllTrafficWidgetGA4 getPDFData', () => {
	let registry: Registry;

	beforeEach( () => {
		registry = createTestRegistry() as Registry;
		provideSiteInfo( registry );
	} );

	it( 'resolves both totals and graph reports in parallel and returns the expected shape', async () => {
		const totalsReport = {
			totals: [ { metricValues: [ { value: '100' } ] } ],
		};
		const graphReport = {
			rows: [ { metricValues: [ { value: '10' } ] } ],
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
			dates: DATES,
			signal: new AbortController().signal,
		} );

		const calls = fetchMock.calls( reportEndpoint );
		expect( calls ).toHaveLength( 2 );
		for ( const [ requestedURL ] of calls ) {
			expect( requestedURL ).toContain( encodeURIComponent( entityURL ) );
		}
	} );

	it( 'forwards the abort signal to each report request', async () => {
		fetchMock.get( reportEndpoint, { body: { rows: [] }, status: 200 } );

		const { signal } = new AbortController();

		await getPDFData( {
			registry,
			dates: DATES,
			signal,
		} );

		// The registry starts resolver runs from a timeout. Wait the
		// timeouts out, so an extra run would add its request to the calls
		// this test counts.
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

	it( 'stops building the report without dispatching a request when signal is already aborted', async () => {
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
	} );

	it( 'fetches the reports again when a new run starts after an aborted run', async () => {
		const firstController = new AbortController();
		const deferredResolvers: Array< () => void > = [];
		let requestCount = 0;

		fetchMock.get( reportEndpoint, () => {
			requestCount++;

			// Keep the first run's two requests waiting, so the abort
			// happens while they still run. Later requests get a normal
			// response.
			if ( requestCount <= 2 ) {
				return new Promise< { body: unknown; status: number } >(
					( resolve ) => {
						deferredResolvers.push( () =>
							resolve( { body: { rows: [] }, status: 200 } )
						);
					}
				);
			}

			return { body: { rows: [] }, status: 200 };
		} );

		const firstRun = getPDFData( {
			registry,
			dates: DATES,
			signal: firstController.signal,
		} );

		// Wait for both report requests to start before aborting.
		while ( deferredResolvers.length < 2 ) {
			await new Promise( ( advance ) => setTimeout( advance, 0 ) );
		}

		firstController.abort();
		deferredResolvers.forEach( ( resolve ) => resolve() );

		expect( await firstRun ).toEqual( { data: null } );
		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 2 );

		const secondRun = await getPDFData( {
			registry,
			dates: DATES,
			signal: new AbortController().signal,
		} );

		expect( fetchMock.calls( reportEndpoint ) ).toHaveLength( 4 );
		expect( secondRun ).toEqual( {
			data: {
				totalsReport: { rows: [] },
				graphReport: { rows: [] },
			},
		} );
	} );
} );
