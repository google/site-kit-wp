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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME, FORM_ACCOUNT_CREATE } from './constants';
import { STORE_NAME as CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { STORE_NAME as CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';
import fetchMock from 'fetch-mock';

describe( 'modules/analytics accounts', () => {
	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( STORE_NAME ).receiveSettings( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'createAccount', () => {
			const accountName = fixtures.createAccount.account.name;
			const propertyName = fixtures.createAccount.webproperty.name;
			const profileName = fixtures.createAccount.profile.name;
			const timezone = fixtures.createAccount.profile.timezone;

			it( 'creates an account ticket and sets the account ticket ID', async () => {
				fetchMock.post(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-account-ticket/,
					{
						body: fixtures.createAccount,
						status: 200,
					}
				);

				registry.dispatch( CORE_FORMS ).setValues( FORM_ACCOUNT_CREATE, { accountName, propertyName, profileName, timezone } );

				// Silence expected API errors.
				muteConsole( 'error' ); // Request will log an error.
				await registry.dispatch( STORE_NAME ).createAccount();

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-account-ticket/,
					{
						body: {
							data: { accountName, propertyName, profileName, timezone },
						},
					}
				);

				expect( store.getState().accountTicketID ).toEqual( fixtures.createAccount.id );
			} );

			it( 'sets isDoingCreateAccount ', async () => {
				fetchMock.post(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-account-ticket/,
					{ body: fixtures.createAccount, status: 200 }
				);

				registry.dispatch( STORE_NAME ).createAccount();
				expect( registry.select( STORE_NAME ).isDoingCreateAccount() ).toEqual( true );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.post(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-account-ticket/,
					{ body: response, status: 500 }
				);

				registry.dispatch( CORE_FORMS ).setValues( FORM_ACCOUNT_CREATE, { accountName, propertyName, profileName, timezone } );
				muteConsole( 'error' ); // Request will log an error.
				await registry.dispatch( STORE_NAME ).createAccount();

				expect( registry.select( STORE_NAME ).getError() ).toMatchObject( response );
			} );
		} );

		describe( 'resetAccounts', () => {
			it( 'sets accounts and related values back to their initial values', () => {
				fetchMock.get( { query: { tagverify: '1' } }, { body: {}, status: 200 } );
				registry.dispatch( STORE_NAME ).setSettings( {
					accountID: '12345',
					propertyID: 'UA-12345-1',
					internalWebPropertyID: '23245',
					profileID: '54321',
					useSnippet: true,
					trackingDisabled: [],
					anonymizeIP: true,
				} );
				const propertyID = fixtures.accountsPropertiesProfiles.properties[ 0 ].internalWebPropertyId;
				const accountID = fixtures.accountsPropertiesProfiles.accounts[ 0 ].id;
				registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accountsPropertiesProfiles.accounts );
				registry.dispatch( STORE_NAME ).receiveProperties( fixtures.accountsPropertiesProfiles.properties, { accountID } );
				registry.dispatch( STORE_NAME ).receiveProfiles( fixtures.accountsPropertiesProfiles.profiles, { propertyID } );

				registry.dispatch( STORE_NAME ).resetAccounts();

				// getAccounts() will trigger a request again.
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);
				expect( registry.select( STORE_NAME ).getAccountID() ).toStrictEqual( undefined );
				expect( registry.select( STORE_NAME ).getPropertyID() ).toStrictEqual( undefined );
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toStrictEqual( undefined );
				expect( registry.select( STORE_NAME ).getProfileID() ).toStrictEqual( undefined );
				// TODO Prevent unmatched GET by getAccounts().
				expect( registry.select( STORE_NAME ).getAccounts() ).toStrictEqual( undefined );
				// Other settings are left untouched.
				expect( registry.select( STORE_NAME ).getUseSnippet() ).toStrictEqual( true );
				expect( registry.select( STORE_NAME ).getTrackingDisabled() ).toStrictEqual( [] );
				expect( registry.select( STORE_NAME ).getAnonymizeIP() ).toStrictEqual( true );
			} );

			it( 'invalidates the resolver for getAccounts', async () => {
				registry.dispatch( STORE_NAME ).receiveAccounts( fixtures.accountsPropertiesProfiles.accounts );
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
				registry.dispatch( STORE_NAME ).receiveExistingTag( null );
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);

				const accountID = fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId; // Capitalization rule exception: `accountId` is a property of an API returned value.
				const propertyID = fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId; // Capitalization rule exception: `webPropertyId` is a property of an API returned value.

				const initialAccounts = registry.select( STORE_NAME ).getAccounts();

				expect( initialAccounts ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getAccounts() !== undefined
					),
				);

				const accounts = registry.select( STORE_NAME ).getAccounts();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// Properties and profiles should also have been received by
				// this action.
				const properties = registry.select( STORE_NAME ).getProperties( accountID );
				const profiles = registry.select( STORE_NAME ).getProfiles( propertyID );

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
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{ body: response, status: 500 }
				);

				registry.dispatch( STORE_NAME ).receiveExistingTag( null );

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getAccounts();
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingAccountsPropertiesProfiles === false,
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const accounts = registry.select( STORE_NAME ).getAccounts();
				expect( accounts ).toEqual( undefined );
			} );

			it( 'passes existing tag ID when fetching accounts', async () => {
				const existingPropertyID = 'UA-12345-1';

				registry.dispatch( STORE_NAME ).receiveExistingTag( existingPropertyID );
				registry.dispatch( STORE_NAME ).receiveTagPermission( {
					accountID: '12345',
					propertyID: existingPropertyID,
					permission: true,
				} );

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);

				registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).getAccounts() !== undefined ||
					registry.select( STORE_NAME ).getError()
				);

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{
						query: { existingPropertyID },
					}
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'sets account, property, and profile IDs in the store, if a matchedProperty is received and an account is not selected yet', async () => {
				const { accounts, properties, profiles, matchedProperty } = fixtures.accountsPropertiesProfiles;
				const matchedProfile = {
					...fixtures.profiles[ 0 ],
					id: '123456',
					webPropertyId: matchedProperty.id,
					accountId: matchedProperty.accountId,
				};
				const response = {
					accounts,
					properties,
					profiles: [
						matchedProfile,
						...profiles,
					],
					matchedProperty,
				};

				registry.dispatch( STORE_NAME ).receiveExistingTag( null );

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{ body: response, status: 200 }
				);

				expect( store.getState().matchedProperty ).toBeFalsy();
				expect( registry.select( STORE_NAME ).getAccountID() ).toBeFalsy();
				expect( registry.select( STORE_NAME ).getPropertyID() ).toBeFalsy();
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toBeFalsy();
				expect( registry.select( STORE_NAME ).getProfileID() ).toBeFalsy();

				registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getAccounts() !== undefined
					),
				);

				expect( store.getState().matchedProperty ).toMatchObject( matchedProperty );
				expect( registry.select( STORE_NAME ).getAccountID() ).toBe( matchedProperty.accountId );
				expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( matchedProperty.id );
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toBe( matchedProperty.internalWebPropertyId );
				expect( registry.select( STORE_NAME ).getProfileID() ).toBe( matchedProperty.defaultProfileId );
			} );
		} );

		describe( 'getAccountTicketTermsOfServiceURL', () => {
			it( 'requires the accountTicketID from createAccount', () => {
				registry.dispatch( CORE_USER ).receiveUserInfo( { email: 'test@gmail.com' } );

				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toEqual( undefined );

				registry.dispatch( STORE_NAME ).receiveCreateAccount( { id: 'test-account-ticket-id' } );

				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toContain( 'api.accountTicketId=test-account-ticket-id' );
			} );

			it( 'requires the user’s email', () => {
				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toEqual( undefined );

				registry.dispatch( STORE_NAME ).receiveCreateAccount( { id: 'test-account-ticket-id' } );

				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toEqual( undefined );

				registry.dispatch( CORE_USER ).receiveUserInfo( { email: 'test@gmail.com' } );

				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toMatchQueryParameters( {
					authuser: 'test@gmail.com',
					provisioningSignup: 'false',
				} );
				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toContain( 'api.accountTicketId=test-account-ticket-id' );
			} );
		} );
	} );
} );
