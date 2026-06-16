/**
 * Tests for createGetReportResolver().
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
import invariant from 'invariant';
import { isPlainObject } from 'lodash';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { get, setUsingCache } from 'googlesitekit-api';
import { combineStores, commonStore, createReducer } from 'googlesitekit-data';
import {
	getCacheableReportOptions,
	getReportCacheKey,
} from '@/js/util/report-options';
import {
	createTestRegistry,
	untilResolved,
	waitForDefaultTimeouts,
} from '@tests/js/utils';
import { createErrorStore } from './create-error-store';
import { createFetchStore } from './create-fetch-store';
import { createGetReportResolver } from './create-get-report-resolver';

const TEST_STORE = 'test/report';
const reportEndpointRegExp = new RegExp(
	'^/google-site-kit/v1/core/test/data/report'
);
const baseOptions = {
	startDate: '2024-01-01',
	endDate: '2024-01-28',
};
const report = [ { totalUsers: 1 } ];

interface TestReportState {
	reports: Record< string, unknown >;
}

// Builds a small report store for the test. It combines the shared resolver,
// a fetch store, an error store, and a selector that reads each report by its
// cache key.
function createReportStore() {
	const fetchGetReportStore = createFetchStore( {
		baseName: 'getReport',
		controlCallback: ( { options }: { options: unknown } ) =>
			get(
				'core',
				'test',
				'report',
				options as Parameters< typeof get >[ 3 ]
			),
		reducerCallback: createReducer(
			(
				state: TestReportState,
				response: unknown,
				{ options }: { options: unknown }
			) => {
				state.reports[ getReportCacheKey( options ) ] = response;
			}
		),
		argsToParams: ( options: unknown ) => {
			return { options: getCacheableReportOptions( options ) };
		},
		validateParams: ( { options }: { options?: unknown } = {} ) => {
			invariant( isPlainObject( options ), 'options must be an object.' );
		},
	} );

	return combineStores(
		commonStore,
		createErrorStore( TEST_STORE ),
		fetchGetReportStore,
		{
			initialState: { reports: {} },
			resolvers: {
				getReport: createGetReportResolver( TEST_STORE ),
			},
			selectors: {
				getReport( state: TestReportState, options: unknown ) {
					return state.reports[ getReportCacheKey( options ) ];
				},
			},
		}
	);
}

describe( 'createGetReportResolver', () => {
	let registry: WPDataRegistry;

	beforeAll( () => {
		setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.registerStore( TEST_STORE, createReportStore() );
	} );

	afterAll( () => {
		setUsingCache( true );
	} );

	// The selectors that `untilResolved` returns are typed to take no
	// arguments, but they accept arguments when they run. This helper changes
	// their type so the test can pass the report options.
	function resolved() {
		return untilResolved( registry, TEST_STORE ) as Record<
			string,
			( ...args: unknown[] ) => Promise< unknown >
		>;
	}

	it( 'requires a store name', () => {
		expect( () => createGetReportResolver( '' ) ).toThrow(
			'storeName is required.'
		);
	} );

	it( 'returns a generator function', () => {
		const resolver = createGetReportResolver( TEST_STORE );

		expect( typeof resolver ).toBe( 'function' );
		expect( typeof resolver().next ).toBe( 'function' );
	} );

	it( 'sends one request when two getReport calls differ only in `reportID`', async () => {
		fetchMock.getOnce( reportEndpointRegExp, { body: report } );

		const firstOptions = {
			...baseOptions,
			reportID: 'test_first-widget_component_reportArgs',
		};
		const secondOptions = {
			...baseOptions,
			reportID: 'test_second-widget_component_reportArgs',
		};

		registry.select( TEST_STORE ).getReport( firstOptions );
		registry.select( TEST_STORE ).getReport( secondOptions );

		// Wait for both resolvers together. `untilResolved` checks only on the
		// next registry update, so awaiting them one after the other can hang
		// if the second finishes during the first wait.
		const firstResolution = resolved().getReport( firstOptions );
		const secondResolution = resolved().getReport( secondOptions );

		await Promise.all( [ firstResolution, secondResolution ] );

		expect( fetchMock ).toHaveFetchedTimes( 1 );

		const firstReport = registry
			.select( TEST_STORE )
			.getReport( firstOptions );
		const secondReport = registry
			.select( TEST_STORE )
			.getReport( secondOptions );

		expect( firstReport ).toEqual( report );
		// Both calls read the same saved report, so state stores the report
		// once.
		expect( firstReport ).toBe( secondReport );
	} );

	it( 'does not make a network request when the same report is already saved under another `reportID`', async () => {
		registry.dispatch( TEST_STORE ).receiveGetReport( report, {
			options: {
				...baseOptions,
				reportID: 'test_first-widget_component_reportArgs',
			},
		} );

		const secondOptions = {
			...baseOptions,
			reportID: 'test_second-widget_component_reportArgs',
		};

		// An error for these options stays set when a matching report is
		// already cached. The resolver reads the shared report without
		// clearing the error.
		const error = { code: 'test_error', message: 'Test error' };
		registry
			.dispatch( TEST_STORE )
			.setErrorForSelector( error, 'getReport', [ secondOptions ] );

		const savedReport = registry
			.select( TEST_STORE )
			.getReport( secondOptions );

		await resolved().getReport( secondOptions );

		expect( fetchMock ).not.toHaveFetched();
		expect( savedReport ).toEqual( report );
		expect(
			registry
				.select( TEST_STORE )
				.getErrorForSelector( 'getReport', [ secondOptions ] )
		).toEqual( error );
	} );

	it( 'stores the error for every getReport call that shares one failed request', async () => {
		const response = {
			code: 'internal_server_error',
			message: 'Internal server error',
			data: { status: 500 },
		};

		// Hold the response open so both calls join one running request,
		// instead of the first finishing before the second resolver runs.
		const deferredResolvers: Array< () => void > = [];
		fetchMock.getOnce(
			reportEndpointRegExp,
			() =>
				new Promise( ( resolve ) => {
					deferredResolvers.push( () =>
						resolve( { body: response, status: 500 } )
					);
				} )
		);

		const firstOptions = {
			...baseOptions,
			reportID: 'test_first-widget_component_reportArgs',
		};
		const secondOptions = {
			...baseOptions,
			reportID: 'test_second-widget_component_reportArgs',
		};

		// Start the first call and wait until it sends the shared request.
		registry.select( TEST_STORE ).getReport( firstOptions );
		while ( deferredResolvers.length < 1 ) {
			await waitForDefaultTimeouts();
		}

		// The request is running now. Start the second call so it joins
		// that request instead of sending another.
		registry.select( TEST_STORE ).getReport( secondOptions );
		await waitForDefaultTimeouts();

		// Create both waiters before releasing the request, so each
		// subscribes while its resolver still runs. `untilResolved`
		// checks only on the next registry update, so a resolver that
		// finishes first would otherwise leave its waiter waiting until
		// the test times out.
		const firstResolution = resolved().getReport( firstOptions );
		const secondResolution = resolved().getReport( secondOptions );

		deferredResolvers.forEach( ( resolve ) => resolve() );

		await Promise.all( [ firstResolution, secondResolution ] );

		expect( fetchMock ).toHaveFetchedTimes( 1 );
		expect(
			registry
				.select( TEST_STORE )
				.getErrorForSelector( 'getReport', [ firstOptions ] )
		).toEqual( response );
		expect(
			registry
				.select( TEST_STORE )
				.getErrorForSelector( 'getReport', [ secondOptions ] )
		).toEqual( response );
		expect( console ).toHaveErrored();
	} );
} );
