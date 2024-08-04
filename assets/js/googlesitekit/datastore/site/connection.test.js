/**
 * `core/site` data store: connection info tests.
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
import {
	createTestRegistry,
	muteFetch,
	subscribeUntil,
	untilResolved,
} from '../../../../../tests/js/utils';
import { CORE_SITE } from './constants';

describe( 'core/site connection', () => {
	const responseConnected = {
		connected: true,
		resettable: true,
		setupCompleted: true,
		hasConnectedAdmins: true,
		ownerID: 123,
	};

	let registry;
	let select;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_SITE ].store;
		select = registry.select( CORE_SITE );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'fetchGetConnection', () => {
			it( 'does not require any params', () => {
				expect( () => {
					muteFetch(
						new RegExp(
							'^/google-site-kit/v1/core/site/data/connection'
						)
					);
					registry.dispatch( CORE_SITE ).fetchGetConnection();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveGetConnection', () => {
			it( 'requires the response param', () => {
				expect( () => {
					registry.dispatch( CORE_SITE ).receiveGetConnection();
				} ).toThrow( 'response is required.' );
			} );

			it( 'receives and sets connection ', async () => {
				const connection = { coolSite: true };
				await registry
					.dispatch( CORE_SITE )
					.receiveGetConnection( connection );

				const state = store.getState();

				expect( state ).toMatchObject( { connection } );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getConnection', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/connection'
					),
					{ body: responseConnected, status: 200 }
				);

				const initialConnection = select.getConnection();
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialConnection ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() => select.getConnection() !== undefined
				);

				const connection = select.getConnection();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( connection ).toEqual( responseConnected );

				const connectionSelect = select.getConnection();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( connectionSelect ).toEqual( connection );
			} );

			it( 'does not make a network request if data is already in state', async () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetConnection( responseConnected, {} );

				const connection = select.getConnection();

				await subscribeUntil( registry, () =>
					registry
						.select( CORE_SITE )
						.hasFinishedResolution( 'getConnection' )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( connection ).toEqual( responseConnected );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/connection'
					),
					{ body: response, status: 500 }
				);

				select.getConnection();
				await subscribeUntil(
					registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => select.isFetchingGetConnection() === false
				);

				const connection = select.getConnection();

				await untilResolved( registry, CORE_SITE ).getConnection();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( connection ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe.each( [
			[ 'getOwnerID', 'ownerID' ],
			[ 'hasConnectedAdmins', 'hasConnectedAdmins' ],
			[ 'isConnected', 'connected' ],
			[ 'isResettable', 'resettable' ],
			[ 'isSetupCompleted', 'setupCompleted' ],
		] )( '%s', ( selector, connectionKey ) => {
			it( `references the "${ connectionKey }" key in the connection data`, () => {
				registry
					.dispatch( CORE_SITE )
					.receiveGetConnection( responseConnected );

				const connection = registry.select( CORE_SITE ).getConnection();

				expect( connection ).toHaveProperty( connectionKey );
			} );

			it( 'depends on the getConnection selector and resolver', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/connection'
					),
					{ body: responseConnected, status: 200 }
				);

				expect( select[ selector ]() ).toBeUndefined();
				await untilResolved( registry, CORE_SITE ).getConnection();

				expect( select[ selector ]() ).toEqual(
					responseConnected[ connectionKey ]
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'dispatches an error if the request fails while resolving', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/connection'
					),
					{ body: response, status: 500 }
				);

				select[ selector ]();
				await untilResolved( registry, CORE_SITE ).getConnection();

				expect( select[ selector ]() ).toBeUndefined();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( console ).toHaveErrored();
			} );

			it( 'returns undefined if connection info is not available', async () => {
				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/core/site/data/connection'
					)
				);
				expect( select[ selector ]() ).toBeUndefined();

				await untilResolved( registry, CORE_SITE ).getConnection();
			} );
		} );
	} );
} );
