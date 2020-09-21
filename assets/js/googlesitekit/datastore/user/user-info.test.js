/**
 * core/user Data store: userInfo tests.
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
 *
 * Internal dependencies
 */
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import { initialState } from './index';
import { STORE_NAME } from './constants';

describe( 'core/user userInfo', () => {
	const userDataGlobal = '_googlesitekitUserData';
	const userData = {
		connectURL: 'http://example.com/wp-admin/admin.php?page=googlesitekit-splash&googlesitekit_connect=1&nonce=a1b2c3d4e5',
		user: {
			id: 1,
			email: 'admin@example.com',
			name: 'admin',
			picture: 'https://path/to/image',
		},
		verified: true,
	};

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		delete global[ userDataGlobal ];
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveUserInfo', () => {
			it( 'requires the userInfo param', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveUserInfo();
				} ).toThrow( 'userInfo is required.' );
			} );

			it( 'receives and sets userInfo', async () => {
				const { user } = userData;
				await registry.dispatch( STORE_NAME ).receiveUserInfo( user );
				expect( registry.select( STORE_NAME ).getUser() ).toMatchObject( user );
			} );
		} );
		describe( 'receiveUserIsVerified', () => {
			it( 'requires the userIsVerified param ', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).receiveUserIsVerified();
				} ).toThrow( 'userIsVerified is required.' );
			} );
			it( 'receives and sets userIsVerified', async () => {
				const { verified } = userData;
				await registry.dispatch( STORE_NAME ).receiveUserIsVerified( verified );
				expect( registry.select( STORE_NAME ).isVerified() ).toEqual( verified );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getConnectURL', () => {
			it( 'uses a resolver to load data from a global variable', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;

				registry.select( STORE_NAME ).getConnectURL();
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getConnectURL' )
				);

				const connectURL = registry.select( STORE_NAME ).getConnectURL();
				expect( connectURL ).toBe( userData.connectURL );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );
				const connectURL = registry.select( STORE_NAME ).getConnectURL();

				expect( connectURL ).toEqual( initialState.connectURL );
				expect( console ).toHaveErrored();
			} );

			it( 'accepts an optional list of additional scopes to add as a query parameter', () => {
				registry.dispatch( STORE_NAME ).receiveConnectURL( userData.connectURL );
				const additionalScopes = [ 'http://example.com/test/scope/a', 'http://example.com/test/scope/b' ];
				const connectURL = registry.select( STORE_NAME ).getConnectURL( { additionalScopes } );

				expect( connectURL ).toMatchQueryParameters( {
					'additional_scopes[0]': 'http://example.com/test/scope/a',
					'additional_scopes[1]': 'http://example.com/test/scope/b',
				} );
			} );

			it( 'accepts an optional redirectURL to add as a query parameter', () => {
				registry.dispatch( STORE_NAME ).receiveConnectURL( userData.connectURL );
				const redirectURL = 'http://example.com/test/redirect/';
				const connectURL = registry.select( STORE_NAME ).getConnectURL( { redirectURL } );

				expect( connectURL ).toMatchQueryParameters( {
					redirect: redirectURL,
				} );
			} );

			it( 'does not add query parameters when no options are passed', () => {
				registry.dispatch( STORE_NAME ).receiveConnectURL( userData.connectURL );
				const connectURL = registry.select( STORE_NAME ).getConnectURL();
				expect( connectURL ).not.toContain( '&additional_scopes' );
				expect( connectURL ).not.toContain( '&redirect' );
			} );
		} );

		describe( 'getUser', () => {
			it( 'uses a resolver to load user data from a global variable', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );

				registry.select( STORE_NAME ).getUser();
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getUser() !== initialState
					),
				);

				const userInfo = registry.select( STORE_NAME ).getUser();
				expect( userInfo ).toMatchObject( userData.user );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
			} );
			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );

				const userInfo = registry.select( STORE_NAME ).getUser();

				const { user } = initialState;
				expect( userInfo ).toEqual( user );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isVerified', () => {
			it( 'uses a resolver to load verification status from a global variable', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
				registry.select( STORE_NAME ).isVerified();
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).isVerified() !== initialState
					),
				);
				const isVerified = registry.select( STORE_NAME ).isVerified();
				expect( isVerified ).toEqual( userData.verified );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
			} );
			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );

				const isVerified = registry.select( STORE_NAME ).isVerified();

				const { verified } = initialState;
				expect( isVerified ).toEqual( verified );
				expect( console ).toHaveErrored();
			} );
		} );

		describe.each( [
			[ 'getID' ],
			[ 'getName' ],
			[ 'getEmail' ],
			[ 'getPicture' ],
		] )( `%s()`, ( selector ) => {
			it( 'uses a resolver to load user info then returns the info when this specific selector is used', async () => {
			// Set up the global
				global[ userDataGlobal ] = userData;

				registry.select( STORE_NAME )[ selector ]();
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME )[ selector ]() !== undefined
					),
				);

				const userInfo = registry.select( STORE_NAME ).getUser();

				expect( userInfo ).toEqual( userData.user );
			} );
			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );

				const result = registry.select( STORE_NAME )[ selector ]();

				expect( result ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
