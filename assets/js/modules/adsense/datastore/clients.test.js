/**
 * `modules/adsense` data store: clients tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { MODULES_ADSENSE } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/adsense clients', () => {
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

	afterEach( () => {} );

	describe( 'actions', () => {} );

	describe( 'selectors', () => {
		describe( 'getClients', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/clients'
					),
					{ body: fixtures.clients, status: 200 }
				);

				const accountID = fixtures.clients[ 0 ]._accountID;

				const initialClients = registry
					.select( MODULES_ADSENSE )
					.getClients( accountID );

				expect( initialClients ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.getClients( accountID ) !== undefined
				);

				const clients = registry
					.select( MODULES_ADSENSE )
					.getClients( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( clients ).toEqual( fixtures.clients );
			} );

			it( 'does not make a network request if clients for this account are already present', async () => {
				const accountID = fixtures.clients[ 0 ]._accountID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetClients( fixtures.clients, { accountID } );

				const clients = registry
					.select( MODULES_ADSENSE )
					.getClients( accountID );

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ADSENSE )
						.hasFinishedResolution( 'getClients', [ accountID ] )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( clients ).toEqual( fixtures.clients );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/clients'
					),
					{ body: response, status: 500 }
				);

				const fakeAccountID = 'pub-777888999';
				registry.select( MODULES_ADSENSE ).getClients( fakeAccountID );
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.isFetchingGetClients( fakeAccountID ) === false
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const clients = registry
					.select( MODULES_ADSENSE )
					.getClients( fakeAccountID );
				expect( clients ).toEqual( undefined );

				await untilResolved( registry, MODULES_ADSENSE ).getClients(
					fakeAccountID
				);
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getAFClient', () => {
			it( 'returns undefined if clients are not yet resolved', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/adsense/data/clients'
					),
					{ body: fixtures.clients, status: 200 }
				);

				const accountID = fixtures.clients[ 0 ]._accountID;

				const initialAFCClient = registry
					.select( MODULES_ADSENSE )
					.getAFCClient( accountID );

				expect( initialAFCClient ).toEqual( undefined );

				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.getAFCClient( accountID ) !== undefined
				);
			} );

			it( 'returns null if there are no clients', async () => {
				const fakeAccountID = 'pub-777888999';
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetClients( [], { accountID: fakeAccountID } );

				const client = registry
					.select( MODULES_ADSENSE )
					.getAFCClient( fakeAccountID );

				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ADSENSE )
							.isFetchingGetClients( fakeAccountID ) === false
				);

				expect( client ).toEqual( null );
			} );

			it( 'returns the first AFC client', async () => {
				const accountID = fixtures.clients[ 0 ]._accountID;
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetClients( fixtures.clients, { accountID } );

				const client = registry
					.select( MODULES_ADSENSE )
					.getAFCClient( accountID );

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ADSENSE )
						.hasFinishedResolution( 'getClients', [ accountID ] )
				);

				expect( client ).toEqual( fixtures.clients[ 0 ] );
			} );
		} );
	} );
} );
