/**
 * `core/user` data store: userInfo tests.
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
 *
 * Internal dependencies
 */
import {
	createTestRegistry,
	subscribeUntil,
	untilResolved,
} from '../../../../../tests/js/utils';
import { initialState } from './index';
import { CORE_USER } from './constants';

describe( 'core/user userInfo', () => {
	const userDataGlobal = '_googlesitekitUserData';
	const user = {
		id: 1,
		email: 'admin@example.com',
		name: 'admin',
		picture: 'https://path/to/image',
		full_name: 'Dr Funkenstein',
	};
	const userData = {
		user,
		connectURL:
			'http://example.com/wp-admin/index.php?action=googlesitekit_connect&nonce=abc123',
		initialVersion: '1.0.0',
		verified: true,
		isUserInputCompleted: true,
	};

	let registry;
	let store;

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ CORE_USER ].store;
	} );

	afterEach( () => {
		delete global[ userDataGlobal ];
	} );

	describe( 'actions', () => {
		describe( 'receiveUserInfo', () => {
			it( 'requires the userInfo param', () => {
				expect( () => {
					registry.dispatch( CORE_USER ).receiveUserInfo();
				} ).toThrow( 'userInfo is required.' );
			} );

			it( 'receives and sets userInfo', async () => {
				await registry.dispatch( CORE_USER ).receiveUserInfo( user );
				expect( registry.select( CORE_USER ).getUser() ).toMatchObject(
					user
				);
			} );
		} );

		describe( 'receiveInitialSiteKitVersion', () => {
			it( 'requires the initial version', () => {
				expect( () => {
					registry
						.dispatch( CORE_USER )
						.receiveInitialSiteKitVersion();
				} ).toThrow( 'initialVersion is required.' );
			} );

			it( 'sets the internal initialVersion state', () => {
				registry
					.dispatch( CORE_USER )
					.receiveInitialSiteKitVersion( '1.2.3' );
				expect(
					registry.stores[ CORE_USER ].store.getState().initialVersion
				).toBe( '1.2.3' );
			} );
		} );

		describe( 'receiveUserIsVerified', () => {
			it( 'requires the userIsVerified param ', () => {
				expect( () => {
					registry.dispatch( CORE_USER ).receiveUserIsVerified();
				} ).toThrow( 'userIsVerified is required.' );
			} );
			it( 'receives and sets userIsVerified', async () => {
				const { verified } = userData;
				await registry
					.dispatch( CORE_USER )
					.receiveUserIsVerified( verified );
				expect( registry.select( CORE_USER ).isVerified() ).toEqual(
					verified
				);
			} );
		} );
		describe( 'receiveIsUserInputCompleted', () => {
			it( 'requires the isUserInputCompleted param', () => {
				expect( () => {
					registry
						.dispatch( CORE_USER )
						.receiveIsUserInputCompleted();
				} ).toThrow( 'The isUserInputCompleted param is required.' );
			} );

			it( 'receives and sets isUserInputCompleted', async () => {
				const { isUserInputCompleted } = userData;
				await registry
					.dispatch( CORE_USER )
					.receiveIsUserInputCompleted( isUserInputCompleted );
				expect( store.getState().isUserInputCompleted ).toBe( true );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getConnectURL', () => {
			it( 'uses a resolver to load data from a global variable', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;

				registry.select( CORE_USER ).getConnectURL();
				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'getConnectURL' )
				);

				const connectURL = registry.select( CORE_USER ).getConnectURL();
				expect( connectURL ).toBe( userData.connectURL );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );
				const connectURL = registry.select( CORE_USER ).getConnectURL();

				expect( connectURL ).toEqual( initialState.connectURL );

				await untilResolved( registry, CORE_USER ).getConnectURL();
				expect( console ).toHaveErrored();
			} );

			it( 'accepts an optional list of additional scopes to add as a query parameter', () => {
				registry
					.dispatch( CORE_USER )
					.receiveConnectURL( userData.connectURL );
				const additionalScopes = [
					'http://example.com/test/scope/a',
					'http://example.com/test/scope/b',
				];
				const connectURL = registry
					.select( CORE_USER )
					.getConnectURL( { additionalScopes } );

				// Note: scopes that are in the form of a URL are rewritten to start with gttp.
				expect( connectURL ).toMatchQueryParameters( {
					'additional_scopes[0]': 'gttp://example.com/test/scope/a',
					'additional_scopes[1]': 'gttp://example.com/test/scope/b',
				} );
			} );

			it( 'only rewrites additional scopes that are URLs', () => {
				registry
					.dispatch( CORE_USER )
					.receiveConnectURL( userData.connectURL );
				const additionalScopes = [
					'http://example.com/test/scope/a',
					'https://example.com/test/scope/b',
					'openid',
					'http',
					'example.com/test/scope/a',
				];
				const connectURL = registry
					.select( CORE_USER )
					.getConnectURL( { additionalScopes } );

				// Note: scopes that are in the form of a URL are rewritten to start with gttp.
				expect( connectURL ).toMatchQueryParameters( {
					'additional_scopes[0]': 'gttp://example.com/test/scope/a',
					'additional_scopes[1]': 'gttps://example.com/test/scope/b',
					'additional_scopes[2]': 'openid',
					'additional_scopes[3]': 'http',
					'additional_scopes[4]': 'example.com/test/scope/a',
				} );
			} );

			it( 'accepts an optional redirectURL to add as a query parameter', () => {
				registry
					.dispatch( CORE_USER )
					.receiveConnectURL( userData.connectURL );
				const redirectURL = 'http://example.com/test/redirect/';
				const connectURL = registry
					.select( CORE_USER )
					.getConnectURL( { redirectURL } );

				expect( connectURL ).toMatchQueryParameters( {
					redirect: redirectURL,
				} );
			} );

			it( 'does not add query parameters when no options are passed', () => {
				registry
					.dispatch( CORE_USER )
					.receiveConnectURL( userData.connectURL );
				const connectURL = registry.select( CORE_USER ).getConnectURL();
				expect( connectURL ).not.toContain( '&additional_scopes' );
				expect( connectURL ).not.toContain( '&redirect' );
			} );
		} );

		describe( 'getUser', () => {
			it( 'uses a resolver to load user data from a global variable', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );

				registry.select( CORE_USER ).getUser();
				await subscribeUntil(
					registry,
					() =>
						registry.select( CORE_USER ).getUser() !== initialState
				);

				const userInfo = registry.select( CORE_USER ).getUser();
				expect( userInfo ).toMatchObject( userData.user );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
			} );
			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );

				const userInfo = registry.select( CORE_USER ).getUser();

				expect( userInfo ).toEqual( initialState.user );

				await untilResolved( registry, CORE_USER ).getUser();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getInitialSiteKitVersion', () => {
			it( 'uses a resolver to load data from a global variable', async () => {
				global[ userDataGlobal ] = {
					...userData,
					initialVersion: '1.2.3',
				};

				expect(
					registry.select( CORE_USER ).getInitialSiteKitVersion()
				).toBeUndefined();

				await untilResolved(
					registry,
					CORE_USER
				).getInitialSiteKitVersion();

				expect(
					registry.select( CORE_USER ).getInitialSiteKitVersion()
				).toBe( '1.2.3' );
			} );

			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toBeUndefined();
				const initialVersion = registry
					.select( CORE_USER )
					.getInitialSiteKitVersion();

				expect( initialVersion ).toEqual( initialState.initialVersion );

				await untilResolved(
					registry,
					CORE_USER
				).getInitialSiteKitVersion();
				expect( console ).toHaveErrored(
					'Could not load core/user info.'
				);
			} );
		} );

		describe( 'isVerified', () => {
			it( 'uses a resolver to load verification status from a global variable', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
				registry.select( CORE_USER ).isVerified();
				await subscribeUntil(
					registry,
					() =>
						registry.select( CORE_USER ).isVerified() !==
						initialState
				);
				const isVerified = registry.select( CORE_USER ).isVerified();
				expect( isVerified ).toEqual( userData.verified );

				// Data must not be wiped after retrieving, as it could be used by other dependants.
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
			} );
			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );

				const isVerified = registry.select( CORE_USER ).isVerified();

				const { verified } = initialState;
				expect( isVerified ).toEqual( verified );

				await untilResolved( registry, CORE_USER ).isVerified();
				expect( console ).toHaveErrored();
			} );
		} );

		describe.each( [
			[ 'getID', user.id ],
			[ 'getName', user.name ],
			[ 'getEmail', user.email ],
			[ 'getPicture', user.picture ],
			[ 'getFullName', user.full_name ],
		] )( '%s()', ( selector, expectedValue ) => {
			it( 'uses a resolver to load user info then returns the info when this specific selector is used', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;

				registry.select( CORE_USER )[ selector ]();
				await subscribeUntil(
					registry,
					() =>
						registry.select( CORE_USER )[ selector ]() !== undefined
				);

				const userInfo = registry.select( CORE_USER ).getUser();

				expect( userInfo ).toEqual( userData.user );
			} );
			it( 'will return initial state (undefined) when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );

				const result = registry.select( CORE_USER )[ selector ]();

				expect( result ).toEqual( undefined );

				await untilResolved( registry, CORE_USER ).getUser();
				expect( console ).toHaveErrored();
			} );
			it( 'will return the correct value when data is available', async () => {
				// Set up the global.
				global[ userDataGlobal ] = userData;

				registry.select( CORE_USER )[ selector ]();
				await subscribeUntil(
					registry,
					() =>
						registry.select( CORE_USER )[ selector ]() !== undefined
				);

				const result = registry.select( CORE_USER )[ selector ]();

				expect( result ).toEqual( expectedValue );
			} );
		} );
		describe( 'isUserInputCompleted', () => {
			it( 'uses a resolver to check if user input is completed from a global variable', async () => {
				// Set up the global
				global[ userDataGlobal ] = userData;

				registry.select( CORE_USER ).isUserInputCompleted(); // invariant error
				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'isUserInputCompleted' )
				);

				const isUserInputCompleted = registry
					.select( CORE_USER )
					.isUserInputCompleted();
				expect( isUserInputCompleted ).toBe(
					userData.isUserInputCompleted
				);

				// Data must not be wiped after retrieving, as it could be used by other dependents.
				expect( global[ userDataGlobal ] ).not.toEqual( undefined );
			} );
		} );

		describe( 'getAccountChooserURL', () => {
			it( 'throws an error if a destinationURL is not given', () => {
				expect( () => {
					registry.select( CORE_USER ).getAccountChooserURL();
				} ).toThrow( 'destinationURL is required' );
			} );

			it( 'returns the encoded destination url with the email appended', async () => {
				global[ userDataGlobal ] = userData;

				const testURL = 'https://analytics.google.com/dashboard/';

				registry.select( CORE_USER ).getAccountChooserURL( testURL );

				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'getUser' )
				);

				const accountChooserURL = registry
					.select( CORE_USER )
					.getAccountChooserURL( testURL );

				expect( accountChooserURL ).toMatchInlineSnapshot(
					'"https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fanalytics.google.com%2Fdashboard%2F&Email=admin%40example.com"'
				);
			} );

			it( 'should return undefined when no data is available', async () => {
				expect( global[ userDataGlobal ] ).toEqual( undefined );

				const testURL = 'https://analytics.google.com/dashboard/';

				registry.select( CORE_USER ).getAccountChooserURL( testURL );

				await subscribeUntil( registry, () =>
					registry
						.select( CORE_USER )
						.hasFinishedResolution( 'getUser' )
				);

				const accountChooserURL = registry
					.select( CORE_USER )
					.getAccountChooserURL( testURL );

				expect( accountChooserURL ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
