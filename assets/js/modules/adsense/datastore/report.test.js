/**
 * modules/adsense data store: report tests.
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
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

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

describe( 'modules/adsense report', () => {
	let apiFetchSpy;
	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;

		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {

	} );

	describe( 'selectors', () => {
		describe( 'getReport', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/earnings/
					)
					.mockResponseOnce(
						JSON.stringify( fixtures.report ),
						{ status: 200 }
					);

				const initialReport = registry.select( STORE_NAME ).getReport( {} );

				expect( initialReport ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getReport( {} ) !== undefined
					),
				);

				const report = registry.select( STORE_NAME ).getReport( {} );

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				const options = {
					dateRange: 'last-90-days',
				};

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveReport( { options, report: fixtures.report } );

				const report = registry.select( STORE_NAME ).getReport( options );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getReport', [ options ] )
				);

				expect( fetch ).not.toHaveBeenCalled();
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/adsense\/data\/earnings/
					)
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				const options = {
					dateRange: 'last-90-days',
					dimensions: [ 'DATE' ],
				};

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getReport( options );
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					// This hash must remain stable, so hard-coding it here ensures it is the case.
					() => store.getState().isFetchingReport[ '029df8a6f771dcfe67c270ef5f3fa62a' ] === false,
				);

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				const report = registry.select( STORE_NAME ).getReport( options );
				expect( report ).toEqual( undefined );
			} );
		} );
	} );
} );
