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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/adsense report', () => {
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

	} );

	describe( 'selectors', () => {
		describe( 'getReport', () => {
			const options = {
				dateRange: 'last-90-days',
				metrics: 'test',
				dimensions: [ 'DATE' ],
			};

			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/earnings/,
					{ body: fixtures.report, status: 200 }
				);

				const initialReport = registry.select( STORE_NAME ).getReport( options );

				expect( initialReport ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getReport( options ) !== undefined
					),
				);

				const report = registry.select( STORE_NAME ).getReport( options );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'does not make a network request if report for given options is already present', async () => {
				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveGetReport( fixtures.report, { options } );

				const report = registry.select( STORE_NAME ).getReport( options );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getReport', [ options ] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( report ).toEqual( fixtures.report );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/earnings/,
					{ body: response, status: 500 }
				);

				registry.select( STORE_NAME ).getReport( options );
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).isFetchingGetReport( options ) === false,
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const report = registry.select( STORE_NAME ).getReport( options );
				expect( report ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
