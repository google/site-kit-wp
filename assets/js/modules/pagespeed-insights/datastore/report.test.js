/**
 * modules/pagespeed-insights data store: report tests.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME } from './index';
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/pagespeed-insights report', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'fetchGetReport', () => {
			it( 'fetches and returns a report as response', async () => {
				const strategy = 'desktop';
				const url = 'http://example.com/';

				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/pagespeed/
					)
					.mockResponseOnce(
						JSON.stringify( fixtures.pagespeedDesktop ),
						{ status: 200 }
					);

				const { response } = await registry.dispatch( STORE_NAME ).fetchGetReport( url, strategy );

				expect( response ).toEqual( fixtures.pagespeedDesktop );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getReport', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/pagespeed/
					)
					.mockResponseOnce(
						JSON.stringify( fixtures.pagespeedDesktop ),
						{ status: 200 }
					);

				const strategy = 'mobile';
				const url = 'http://example.com/';

				const initialReport = registry.select( STORE_NAME ).getReport( url, strategy );

				// Ensure the proper parameters were passed.
				expect( fetch.mock.calls[ 0 ][ 0 ] ).toMatchQueryParameters(
					{ url, strategy }
				);

				expect( initialReport ).toEqual( undefined );
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getReport', [ url, strategy ] )
				);

				const report = registry.select( STORE_NAME ).getReport( url, strategy );

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( report ).toEqual( fixtures.pagespeedDesktop );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				const strategy = 'mobile';
				const url = 'http://example.com/';

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedMobile, { url, strategy } );

				const report = registry.select( STORE_NAME ).getReport( url, strategy );

				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getReport', [ url, strategy ] )
				);

				expect( fetch ).not.toHaveBeenCalled();
				expect( report ).toEqual( fixtures.pagespeedMobile );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/pagespeed/
					)
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				const strategy = 'mobile';
				const url = 'http://example.com/';

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getReport( url, strategy );
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getReport', [ url, strategy ] )
				);

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				const report = registry.select( STORE_NAME ).getReport( url, strategy );
				expect( report ).toEqual( undefined );
			} );
		} );
	} );
} );
