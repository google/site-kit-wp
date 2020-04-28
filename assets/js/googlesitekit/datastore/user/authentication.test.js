/**
 * core/user Data store: Authentication info tests.
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
import './index';

describe( 'core/user authentication', () => {
	const responseAuthenticated = { authenticated: true, requiredScopes: [], grantedScopes: [] };
	const apiEndpoint = /^\/google-site-kit\/v1\/core\/user\/data\/authentication/;
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
		describe( 'fetchAuthentication', () => {
			it( 'does not require any params', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).fetchAuthentication();
				} ).not.toThrow();
			} );
		} );
		describe( 'receiveConnection', () => {
			it( 'requires the authentication param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveAuthentication();
				} ).toThrow( 'authentication is required.' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAuthentication', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetch
					.doMockOnceIf( apiEndpoint )
					.mockResponseOnce(
						JSON.stringify( responseAuthenticated ),
						{ status: 200 }
					);

				const initialConnection = registry.select( STORE_NAME ).getAuthentication();
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialConnection ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getAuthentication() !== undefined
					),
				);

				const authentication = registry.select( STORE_NAME ).getAuthentication();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( authentication ).toEqual( responseAuthenticated );

				const connectionSelect = registry.select( STORE_NAME ).getAuthentication();
				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( connectionSelect ).toEqual( authentication );
			} );

			it( 'does not make a network request if data is already in state', async () => {
				registry.dispatch( STORE_NAME ).receiveAuthentication( responseAuthenticated );

				const authentication = registry.select( STORE_NAME ).getAuthentication();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getAuthentication' )
				);

				expect( fetch ).not.toHaveBeenCalled();
				expect( authentication ).toEqual( responseAuthenticated );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf( apiEndpoint )
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getAuthentication();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingAuthentication === false,
				);

				const connection = registry.select( STORE_NAME ).getAuthentication();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( connection ).toEqual( undefined );
			} );
		} );

		describe( 'isAuthenticated', () => {
			it( 'uses a resolver get all authentication info', async () => {
				fetch
					.doMockOnceIf( apiEndpoint )
					.mockResponseOnce(
						JSON.stringify( responseAuthenticated ),
						{ status: 200 }
					);

				const initialIsAuthenticated = registry.select( STORE_NAME ).isAuthenticated();
				// The autentication info will be its initial value while the authentication
				// info is fetched.
				expect( initialIsAuthenticated ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).isAuthenticated() !== undefined
					),
				);

				const isAuthenticated = registry.select( STORE_NAME ).isAuthenticated();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isAuthenticated ).toEqual( responseAuthenticated.authenticated );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf( apiEndpoint )
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).isAuthenticated();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingAuthentication === false,
				);

				const isAuthenticated = registry.select( STORE_NAME ).isAuthenticated();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( isAuthenticated ).toEqual( undefined );
			} );

			it( 'returns undefined if connection info is not available', async () => {
				// This triggers a network request, so ignore the error.
				muteConsole( 'error' );
				const isAuthenticated = registry.select( STORE_NAME ).isAuthenticated();

				expect( isAuthenticated ).toEqual( undefined );
			} );
		} );

		describe( 'getGrantedScopes', () => {
			it( 'uses a resolver get all authentication info', async () => {
				fetch
					.doMockOnceIf( apiEndpoint )
					.mockResponseOnce(
						JSON.stringify( responseAuthenticated ),
						{ status: 200 }
					);

				const initialIsAuthenticated = registry.select( STORE_NAME ).getGrantedScopes();
				// The autentication info will be its initial value while the authentication
				// info is fetched.
				expect( initialIsAuthenticated ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getGrantedScopes() !== undefined
					),
				);

				const grantedScopes = registry.select( STORE_NAME ).getGrantedScopes();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( grantedScopes ).toEqual( responseAuthenticated.grantedScopes );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf( apiEndpoint )
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getGrantedScopes();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingAuthentication === false,
				);

				const grantedScopes = registry.select( STORE_NAME ).getGrantedScopes();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( grantedScopes ).toEqual( undefined );
			} );

			it( 'returns undefined if connection info is not available', async () => {
				// This triggers a network request, so ignore the error.
				muteConsole( 'error' );
				const grantedScopes = registry.select( STORE_NAME ).getGrantedScopes();

				expect( grantedScopes ).toEqual( undefined );
			} );
		} );
		describe( 'getRequiredScopes', () => {
			it( 'uses a resolver get all authentication info', async () => {
				fetch
					.doMockOnceIf( apiEndpoint )
					.mockResponseOnce(
						JSON.stringify( responseAuthenticated ),
						{ status: 200 }
					);

				const initialIsAuthenticated = registry.select( STORE_NAME ).getRequiredScopes();
				// The autentication info will be its initial value while the authentication
				// info is fetched.
				expect( initialIsAuthenticated ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getRequiredScopes() !== undefined
					),
				);

				const requiredScopes = registry.select( STORE_NAME ).getRequiredScopes();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( requiredScopes ).toEqual( responseAuthenticated.requiredScopes );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf( apiEndpoint )
					.mockResponseOnce(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getRequiredScopes();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingAuthentication === false,
				);

				const requiredScopes = registry.select( STORE_NAME ).getRequiredScopes();

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( requiredScopes ).toEqual( undefined );
			} );

			it( 'returns undefined if connection info is not available', async () => {
				// This triggers a network request, so ignore the error.
				muteConsole( 'error' );
				const requiredScopes = registry.select( STORE_NAME ).getRequiredScopes();

				expect( requiredScopes ).toEqual( undefined );
			} );
		} );
	} );
} );
