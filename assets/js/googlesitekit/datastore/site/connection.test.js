/**
 * core/site data store: connection info tests.
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
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import { STORE_NAME } from './constants';

describe( 'core/site connection', () => {
	const responseConnected = { connected: true, resettable: true, setupCompleted: true };
	let apiFetchSpy;
	let registry;
	let select;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
		select = registry.select( STORE_NAME );

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
		describe( 'fetchGetConnection', () => {
			it( 'does not require any params', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).fetchGetConnection();
				} ).not.toThrow();
			} );
		} );

		describe( 'receiveGetConnection', () => {
			it( 'requires the response param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveGetConnection();
				} ).toThrow( 'response is required.' );
			} );

			it( 'receives and sets connection ', async () => {
				const connection = { coolSite: true };
				await registry.dispatch( STORE_NAME ).receiveGetConnection( connection );

				const state = store.getState();

				expect( state ).toMatchObject( { connection } );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getConnection', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( responseConnected ),
						{ status: 200 }
					);

				const initialConnection = select.getConnection();
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialConnection ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						select.getConnection() !== undefined
					),
				);

				const connection = select.getConnection();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( connection ).toEqual( responseConnected );

				const connectionSelect = select.getConnection();
				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( connectionSelect ).toEqual( connection );
			} );

			it( 'does not make a network request if data is already in state', async () => {
				registry.dispatch( STORE_NAME ).receiveGetConnection( responseConnected );

				const connection = select.getConnection();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getConnection' )
				);

				expect( fetch ).not.toHaveBeenCalled();
				expect( connection ).toEqual( responseConnected );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				select.getConnection();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => select.isFetchingGetConnection() === false,
				);

				const connection = select.getConnection();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( connection ).toEqual( undefined );
			} );
		} );

		describe( 'isConnected', () => {
			it( 'uses a resolver get all connection info', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( responseConnected ),
						{ status: 200 }
					);

				const initialIsConnected = select.isConnected();
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialIsConnected ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						select.isConnected() !== undefined
					),
				);

				const isConnected = select.isConnected();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isConnected ).toEqual( responseConnected.connected );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				select.isConnected();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => select.isFetchingGetConnection() === false,
				);

				const isConnected = select.isConnected();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isConnected ).toEqual( undefined );
			} );

			it( 'returns undefined if connection info is not available', async () => {
				// This triggers a network request, so ignore the error.
				muteConsole( 'error' );
				const isConnected = select.isConnected();

				expect( isConnected ).toEqual( undefined );
			} );
		} );

		describe( 'isResettable', () => {
			it( 'uses a resolver get all connection info', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( responseConnected ),
						{ status: 200 }
					);

				const initialIsResettable = select.isResettable();
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialIsResettable ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						select.isResettable() !== undefined
					),
				);

				const isResettable = select.isResettable();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isResettable ).toEqual( responseConnected.resettable );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				select.isResettable();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => select.isFetchingGetConnection() === false,
				);

				const isResettable = select.isResettable();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isResettable ).toEqual( undefined );
			} );

			it( 'returns undefined if connection info is not available', async () => {
				// This triggers a network request, so ignore the error.
				muteConsole( 'error' );
				const isResettable = select.isResettable();

				expect( isResettable ).toEqual( undefined );
			} );
		} );

		describe( 'isSetupCompleted', () => {
			it( 'uses a resolver get all connection info', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( responseConnected ),
						{ status: 200 }
					);

				const initialIsSetupCompleted = select.isSetupCompleted();
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialIsSetupCompleted ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						select.isSetupCompleted() !== undefined
					),
				);

				const isSetupCompleted = select.isSetupCompleted();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isSetupCompleted ).toEqual( responseConnected.setupCompleted );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/core\/site\/data\/connection/
					)
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				select.isSetupCompleted();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => select.isFetchingGetConnection() === false,
				);

				const isSetupCompleted = select.isSetupCompleted();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isSetupCompleted ).toEqual( undefined );
			} );

			it( 'returns undefined if connection info is not available', async () => {
				// This triggers a network request, so ignore the error.
				muteConsole( 'error' );
				const isSetupCompleted = select.isSetupCompleted();

				expect( isSetupCompleted ).toEqual( undefined );
			} );
		} );
	} );
} );
