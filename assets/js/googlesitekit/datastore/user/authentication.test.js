/**
 * `core/user` data store: Authentication info tests.
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
import { CORE_USER } from './constants';

describe( 'core/user authentication', () => {
	const coreUserDataExpectedResponse = {
		authenticated: true,
		requiredScopes: [],
		grantedScopes: [],
		unsatisfiedScopes: [],
		needsReauthentication: true,
		disconnectedReason: 'test-reason',
		connectedProxyURL: 'http://example.com/current',
		previousConnectedProxyURL: 'http://example.com/previous',
	};

	const authError = {
		code: 'missing_delegation_consent',
		message:
			'Looks like your site is not allowed access to Google account data and can’t display stats in the dashboard.',
		data: {
			reason: '',
			status: 401,
			reconnectURL: 'http://example.com/',
		},
	};

	const coreUserDataEndpointRegExp = new RegExp(
		'^/google-site-kit/v1/core/user/data/authentication'
	);

	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_USER ].store;
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {} );

	describe( 'actions', () => {
		test( 'fetchGetAuthentication not to require any params', () => {
			muteFetch( coreUserDataEndpointRegExp );
			expect( () => {
				registry.dispatch( CORE_USER ).fetchGetAuthentication();
			} ).not.toThrow();
		} );

		test( 'receiveGetAuthentication to require the response param', () => {
			expect( () => {
				registry.dispatch( CORE_USER ).receiveGetAuthentication();
			} ).toThrow( 'response is required.' );
		} );

		test( 'setAuthError to add error to the state as authError property', () => {
			registry.dispatch( CORE_USER ).setAuthError( authError );
			expect( store.getState() ).toMatchObject( { authError } );
		} );

		test( 'clearAuthError to reset authError to NULL', () => {
			registry.dispatch( CORE_USER ).setAuthError( authError );
			expect( store.getState() ).toMatchObject( { authError } );
			registry.dispatch( CORE_USER ).clearAuthError();
			expect( store.getState().authError ).toBeNull();
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAuthentication', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce( coreUserDataEndpointRegExp, {
					body: coreUserDataExpectedResponse,
					status: 200,
				} );

				const initialAuthentication = registry
					.select( CORE_USER )
					.getAuthentication();
				// The authentication info will be its initial value while the authentication
				// info is fetched.
				expect( initialAuthentication ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() =>
						registry.select( CORE_USER ).getAuthentication() !==
						undefined
				);

				const authentication = registry
					.select( CORE_USER )
					.getAuthentication();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( authentication ).toEqual(
					coreUserDataExpectedResponse
				);

				const authenticationSelect = registry
					.select( CORE_USER )
					.getAuthentication();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( authenticationSelect ).toEqual( authentication );
			} );

			it( 'does not make a network request if data is already in state', async () => {
				registry
					.dispatch( CORE_USER )
					.receiveGetAuthentication( coreUserDataExpectedResponse );

				const authentication = registry
					.select( CORE_USER )
					.getAuthentication();

				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'getAuthentication' )
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( authentication ).toEqual(
					coreUserDataExpectedResponse
				);
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce( coreUserDataEndpointRegExp, {
					body: response,
					status: 500,
				} );

				registry.select( CORE_USER ).getAuthentication();
				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'getAuthentication' )
				);

				const authentication = registry
					.select( CORE_USER )
					.getAuthentication();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( authentication ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'hasScope', () => {
			it( 'uses a resolver to to load the value if not yet set', async () => {
				const grantedScope =
					'https://www.googleapis.com/auth/granted.scope';
				const ungrantedScope =
					'https://www.googleapis.com/auth/ungranted.scope';

				fetchMock.getOnce( coreUserDataEndpointRegExp, {
					body: {
						authenticated: true,
						requiredScopes: [],
						grantedScopes: [ grantedScope ],
						unsatisfiedScopes: [],
					},
					status: 200,
				} );

				const hasScope = registry
					.select( CORE_USER )
					.hasScope( grantedScope );
				// The granted scope info will be its initial value while the granted scope
				// info is fetched.
				expect( hasScope ).toEqual( undefined );
				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'getAuthentication' )
				);

				const hasScopeAfterResolved = registry
					.select( CORE_USER )
					.hasScope( grantedScope );
				expect( hasScopeAfterResolved ).toEqual( true );

				const missingScope = registry
					.select( CORE_USER )
					.hasScope( ungrantedScope );
				expect( missingScope ).toEqual( false );
			} );

			it( 'returns undefined if scope info is not available', async () => {
				muteFetch( coreUserDataEndpointRegExp );
				const hasProvisioningScope = registry
					.select( CORE_USER )
					.hasScope(
						'https://www.googleapis.com/auth/ungranted.scope'
					);
				expect( hasProvisioningScope ).toEqual( undefined );
				await untilResolved( registry, CORE_USER ).getAuthentication();
			} );
		} );

		describe.each( [
			[ 'isAuthenticated', 'authenticated' ],
			[ 'getGrantedScopes', 'grantedScopes' ],
			[ 'getRequiredScopes', 'requiredScopes' ],
			[ 'getUnsatisfiedScopes', 'unsatisfiedScopes' ],
			[ 'needsReauthentication', 'needsReauthentication' ],
			[ 'getDisconnectedReason', 'disconnectedReason' ],
			[ 'getConnectedProxyURL', 'connectedProxyURL' ],
			[ 'getPreviousConnectedProxyURL', 'previousConnectedProxyURL' ],
		] )( '%s', ( selector, property ) => {
			it( 'uses a resolver to load the authenticated value if not yet set.', async () => {
				fetchMock.getOnce( coreUserDataEndpointRegExp, {
					body: coreUserDataExpectedResponse,
					status: 200,
				} );

				// The autentication info will be its initial value while the authentication
				// info is fetched.
				expect(
					registry.select( CORE_USER )[ selector ]()
				).toBeUndefined();
				await untilResolved( registry, CORE_USER ).getAuthentication();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( registry.select( CORE_USER )[ selector ]() ).toEqual(
					coreUserDataExpectedResponse[ property ]
				);
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce( coreUserDataEndpointRegExp, {
					body: response,
					status: 500,
				} );

				registry.select( CORE_USER )[ selector ]();
				await untilResolved( registry, CORE_USER ).getAuthentication();

				const value = registry.select( CORE_USER )[ selector ]();
				const error = registry
					.select( CORE_USER )
					.getErrorForSelector( 'getAuthentication' );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( value ).toBeUndefined();
				expect( error ).toEqual( response );
				expect( console ).toHaveErrored();
			} );

			it( 'returns undefined if authentication info is not available', async () => {
				muteFetch( coreUserDataEndpointRegExp );
				expect(
					registry.select( CORE_USER )[ selector ]()
				).toBeUndefined();
				await untilResolved( registry, CORE_USER ).getAuthentication();
			} );
		} );

		describe( 'getAuthError', () => {
			it( 'should return NULL if authError is not set yet', () => {
				const error = registry.select( CORE_USER ).getAuthError();
				expect( error ).toBeNull();
			} );

			it( 'should return actual error when it has been set', () => {
				registry.dispatch( CORE_USER ).setAuthError( authError );
				const error = registry.select( CORE_USER ).getAuthError();
				expect( error ).toEqual( authError );
			} );
		} );
	} );
} );
