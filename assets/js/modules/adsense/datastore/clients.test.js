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
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
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

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {

	} );

	describe( 'selectors', () => {
		describe( 'getClients', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/clients/,
					{ body: fixtures.clients, status: 200 }
				);

				const accountID = fixtures.clients[ 0 ]._accountID;

				const initialClients = registry.select( STORE_NAME ).getClients( accountID );

				expect( initialClients ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getClients( accountID ) !== undefined
					),
				);

				const clients = registry.select( STORE_NAME ).getClients( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( clients ).toEqual( fixtures.clients );
			} );

			it( 'does not make a network request if clients for this account are already present', async () => {
				const accountID = fixtures.clients[ 0 ]._accountID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveGetClients( fixtures.clients, { accountID } );

				const clients = registry.select( STORE_NAME ).getClients( accountID );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
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
					/^\/google-site-kit\/v1\/modules\/adsense\/data\/clients/,
					{ body: response, status: 500 }
				);

				const fakeAccountID = 'pub-777888999';
				registry.select( STORE_NAME ).getClients( fakeAccountID );
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).isFetchingGetClients( fakeAccountID ) === false,
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const clients = registry.select( STORE_NAME ).getClients( fakeAccountID );
				expect( clients ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
