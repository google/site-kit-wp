/**
 * modules/tagmanager data store: accounts tests.
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
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
	muteFetch,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/tagmanager accounts', () => {
	let registry;

	const defaultSettings = {
		accountID: '',
		ampContainerID: '',
		containerID: '',
		internalAMPContainerID: '',
		internalContainerID: '',
		useSnippet: true,
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Preload default settings to prevent the resolver from making unexpected requests
		// as this is covered in settings store tests.
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'resetAccounts', () => {
			it( 'sets accounts and related values back to their initial values', async () => {
				registry.dispatch( STORE_NAME ).setSettings( {
					accountID: '12345',
					ampContainerID: 'GTM-XYZ123',
					containerID: 'GTM-ABC123',
					internalAMPContainerID: '9876',
					internalContainerID: '8765',
					useSnippet: true,
				} );
				registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );

				registry.dispatch( STORE_NAME ).resetAccounts();

				expect( registry.select( STORE_NAME ).getAccountID() ).toStrictEqual( undefined );
				expect( registry.select( STORE_NAME ).getAMPContainerID() ).toStrictEqual( undefined );
				expect( registry.select( STORE_NAME ).getContainerID() ).toStrictEqual( undefined );
				expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toStrictEqual( undefined );

				muteConsole( 'error' ); // getAccounts() will trigger a network request as resolver is invalidated.
				expect( registry.select( STORE_NAME ).getAccounts() ).toStrictEqual( undefined );

				// Other settings are left untouched.
				expect( registry.select( STORE_NAME ).getUseSnippet() ).toStrictEqual( true );
			} );

			it( 'invalidates the resolver for getAccounts', async () => {
				registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );
				registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil(
					registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getAccounts' )
				);

				registry.dispatch( STORE_NAME ).resetAccounts();

				expect( registry.select( STORE_NAME ).hasFinishedResolution( 'getAccounts' ) ).toStrictEqual( false );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAccounts', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.get(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/,
					{ body: fixtures.accounts, status: 200 }
				);

				const initialAccounts = registry.select( STORE_NAME ).getAccounts();

				expect( initialAccounts ).toEqual( undefined );
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getAccounts' )
				);

				const accounts = registry.select( STORE_NAME ).getAccounts();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( accounts ).toEqual( fixtures.accounts );
			} );

			it( 'does not make a network request if accounts are already present', async () => {
				registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accounts );

				const accounts = registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getAccounts' )
				);

				expect( accounts ).toEqual( fixtures.accounts );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'does not make a network request if accounts exist but are empty (this is a valid state)', async () => {
				registry.dispatch( STORE_NAME ).receiveAccounts( [] );

				const accounts = registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getAccounts' )
				);

				expect( accounts ).toEqual( [] );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.get(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/,
					{ body: response, status: 500 }
				);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getAccounts' )
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const accounts = registry.select( STORE_NAME ).getAccounts();
				expect( accounts ).toEqual( undefined );
			} );
		} );

		describe( 'isDoingGetAccounts', () => {
			it( 'returns true while the request is in progress', async () => {
				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/, [] );
				expect( registry.select( STORE_NAME ).isDoingGetAccounts() ).toBe( false );

				registry.select( STORE_NAME ).getAccounts();

				expect( registry.select( STORE_NAME ).isDoingGetAccounts() ).toBe( true );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getAccounts' )
				);

				expect( registry.select( STORE_NAME ).isDoingGetAccounts() ).toBe( false );
			} );
		} );
	} );
} );
