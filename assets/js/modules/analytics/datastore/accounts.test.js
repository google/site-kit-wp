/**
 * modules/analytics data store: accounts tests.
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
import { STORE_NAME } from './index';
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics accounts', () => {
	let apiFetchSpy;
	let locationAssignSpy;
	let registry;
	let store;
	let redirect;

	const accountName = fixtures.accountTicket.account.name;
	const propertyName = fixtures.accountTicket.webproperty.name;
	const profileName = fixtures.accountTicket.profile.name;
	const timezone = fixtures.accountTicket.profile.timezone;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
		locationAssignSpy = jest.spyOn( location, 'assign' );

		locationAssignSpy.mockImplementation( ( location ) => {
			redirect = location;
		} );
		redirect = '';
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
		locationAssignSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'createAccount', () => {
			it( 'creates an account ticket and redirects to the Terms of Service', async () => {
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-account-ticket/
					)
					.mockResponse(
						JSON.stringify( fixtures.accountTicket ),
						{ status: 200 }
					);

				muteConsole( 'error' );

				registry.dispatch( STORE_NAME ).createAccount( { accountName, propertyName, profileName, timezone } );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).isDoingCreateAccount() !== true
					),
				);

				// Ensure the proper body parameters were sent.
				expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).data ).toMatchObject(
					{ accountName, propertyName, profileName, timezone }
				);

				expect( redirect ).toEqual( `https://analytics.google.com/analytics/web/?provisioningSignup=false#management/TermsOfService/&api.accountTicketId=${ fixtures.accountTicket.id }` );
			} );

			it( 'sets isDoingCreateAccount ', async () => {
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-account-ticket/
					)
					.mockResponse(
						JSON.stringify( fixtures.accountTicket ),
						{ status: 200 }
					);

				registry.dispatch( STORE_NAME ).fetchCreateAccount( { accountName, propertyName, profileName, timezone } );
				expect( registry.select( STORE_NAME ).isDoingCreateAccount() ).toEqual( true );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-account-ticket/
					)
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );

				registry.dispatch( STORE_NAME ).createAccount( { accountName, propertyName, profileName, timezone } );

				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).isDoingCreateAccount() === false
					),
				);

				expect( registry.select( STORE_NAME ).getError() ).toMatchObject( response );

				expect( redirect ).toEqual( '' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAccounts', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/
					)
					.mockResponseOnce(
						JSON.stringify( fixtures.accountsPropertiesProfiles ),
						{ status: 200 }
					);

				const accountID = fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId; // Capitalization rule exception: `accountId` is a property of an API returned value.
				const propertyID = fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId; // Capitalization rule exception: `webPropertyId` is a property of an API returned value.

				const initialAccounts = registry.select( STORE_NAME ).getAccounts();
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialAccounts ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getAccounts() !== undefined
					),
				);

				const accounts = registry.select( STORE_NAME ).getAccounts();
				expect( fetch ).toHaveBeenCalledTimes( 1 );

				// Properties and profiles should also have been received by
				// this action.
				muteConsole( 'error', 2 );
				const properties = registry.select( STORE_NAME ).getProperties( accountID );
				const profiles = registry.select( STORE_NAME ).getProfiles( accountID, propertyID );

				expect( accounts ).toEqual( fixtures.accountsPropertiesProfiles.accounts );
				expect( properties ).toEqual( fixtures.accountsPropertiesProfiles.properties );
				expect( profiles ).toEqual( fixtures.accountsPropertiesProfiles.profiles );
			} );

			it( 'does not make a network request if accounts are already present', async () => {
				registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accountsPropertiesProfiles.accounts );

				const accounts = registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getAccounts' )
				);

				expect( accounts ).toEqual( fixtures.accountsPropertiesProfiles.accounts );
				expect( fetch ).not.toHaveBeenCalled();
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/
					)
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getAccounts();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingAccountsPropertiesProfiles === false,
				);

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				const accounts = registry.select( STORE_NAME ).getAccounts();
				expect( accounts ).toEqual( undefined );
			} );
		} );
	} );
} );
