/**
 * `modules/analytics` data store: accounts tests.
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
	STORE_NAME,
	FORM_ACCOUNT_CREATE,
	ACCOUNT_CREATE,
	PROPERTY_CREATE,
	PROFILE_CREATE,
	PROPERTY_TYPE_UA,
	PROPERTY_TYPE_GA4,
} from './constants';
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
	untilResolved,
	provideSiteInfo,
	provideModules,
} from '../../../../../tests/js/utils';
import { enabledFeatures } from '../../../features';
import * as factories from './__factories__';
import * as fixtures from './__fixtures__';
import * as ga4Fixtures from '../../analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';

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
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
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
				await registry.dispatch( STORE_NAME ).createAccount();

				expect( registry.select( STORE_NAME ).getErrorForAction( 'createAccount' ) ).toMatchObject( response );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'resetAccounts', () => {
			it( 'sets accounts and related values back to their initial values', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
				registry.dispatch( STORE_NAME ).setSettings( {
					accountID: '12345',
					propertyID: 'UA-12345-1',
					internalWebPropertyID: '23245',
					profileID: '54321',
					useSnippet: true,
					trackingDisabled: [],
					anonymizeIP: true,
				} );
				const propertyID = fixtures.accountsPropertiesProfiles.properties[ 0 ].id;
				const accountID = fixtures.accountsPropertiesProfiles.accounts[ 0 ].id;
				registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
				registry.dispatch( STORE_NAME ).receiveGetProperties( fixtures.accountsPropertiesProfiles.properties, { accountID } );
				registry.dispatch( STORE_NAME ).receiveGetProfiles( fixtures.accountsPropertiesProfiles.profiles, { accountID, propertyID } );

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

				expect( registry.select( STORE_NAME ).getAccounts() ).toStrictEqual( undefined );
				// Other settings are left untouched.
				expect( registry.select( STORE_NAME ).getUseSnippet() ).toStrictEqual( true );
				expect( registry.select( STORE_NAME ).getTrackingDisabled() ).toStrictEqual( [] );
				expect( registry.select( STORE_NAME ).getAnonymizeIP() ).toStrictEqual( true );
				// Wait until selector is resolved to prevent unmatched fetch error.
				await subscribeUntil( registry, () => registry.select( STORE_NAME )
					.hasFinishedResolution( 'getAccounts' ) );
			} );

			it( 'invalidates the resolver for getAccounts', async () => {
				registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
				registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil(
					registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getAccounts' )
				);

				registry.dispatch( STORE_NAME ).resetAccounts();

				expect( registry.select( STORE_NAME ).hasFinishedResolution( 'getAccounts' ) ).toStrictEqual( false );
			} );
		} );

		describe( 'selectAccount', () => {
			beforeEach( () => {
				provideSiteInfo( registry, {
					referenceSiteURL: fixtures.propertiesProfiles.properties[ 0 ].websiteUrl, // eslint-disable-line sitekit/acronym-case
				} );
			} );

			it( 'should throw an error if accountID is invalid', () => {
				expect( () => registry.dispatch( STORE_NAME ).selectAccount( false ) ).toThrow();
			} );

			it( 'should property reset propertyID and profileID when selecting ACCOUNT_CREATE option', () => {
				registry.dispatch( STORE_NAME ).selectAccount( ACCOUNT_CREATE );
				expect( registry.select( STORE_NAME ).getAccountID() ).toBe( ACCOUNT_CREATE );
				expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getProfileID() ).toBe( '' );
			} );

			it( 'should correctly select property and profile IDs', async () => {
				fetchMock.get(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/,
					{ body: fixtures.propertiesProfiles, status: 200 }
				);

				const accountID = fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case

				await registry.dispatch( STORE_NAME ).selectAccount( accountID );

				expect( registry.select( STORE_NAME ).getAccountID() ).toBe( accountID );
				expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( fixtures.propertiesProfiles.profiles[ 0 ].webPropertyId ); // eslint-disable-line sitekit/acronym-case
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toBe( fixtures.propertiesProfiles.profiles[ 0 ].internalWebPropertyId ); // eslint-disable-line sitekit/acronym-case
				expect( registry.select( STORE_NAME ).getProfileID() ).toBe( fixtures.propertiesProfiles.profiles[ 0 ].id );
			} );

			it( 'should correctly select PROPERTY_CREATE and PROFILE_CREATE when account has no properties', async () => {
				fetchMock.get(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/,
					{ body: { properties: [], profiles: [] }, status: 200 }
				);

				const accountID = fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case

				await registry.dispatch( STORE_NAME ).selectAccount( accountID );

				expect( registry.select( STORE_NAME ).getAccountID() ).toBe( accountID );
				expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( PROPERTY_CREATE );
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getProfileID() ).toBe( PROFILE_CREATE );
			} );

			describe( 'analytics-4', () => {
				const accountID = fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case

				beforeEach( () => {
					enabledFeatures.add( 'ga4setup' );

					[
						[ /^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/, fixtures.propertiesProfiles ],
						[ /^\/google-site-kit\/v1\/modules\/analytics-4\/data\/properties/, ga4Fixtures.properties ],
						[ /^\/google-site-kit\/v1\/modules\/analytics-4\/data\/webdatastreams-batch/, ga4Fixtures.webDataStreamsBatch ],
					].forEach( ( [ endpoint, body ] ) => {
						fetchMock.get( endpoint, { body } );
					} );

					provideSiteInfo( registry );
				} );

				it( 'should select the correct GA4 property', async () => {
					await registry.dispatch( STORE_NAME ).selectAccount( accountID );
					expect( registry.select( MODULES_ANALYTICS_4 ).getPropertyID() ).toBe( ga4Fixtures.properties[ 0 ]._id );
				} );

				it( 'should select the correct UA property', async () => {
					provideSiteInfo( registry, { referenceSiteURL: fixtures.propertiesProfiles.properties[ 0 ].websiteUrl } ); // eslint-disable-line sitekit/acronym-case
					await registry.dispatch( STORE_NAME ).selectAccount( accountID );
					expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( fixtures.propertiesProfiles.properties[ 0 ].id );
				} );

				it( 'should set primary property type to UA when there is a matching UA property', async () => {
					provideSiteInfo( registry, { referenceSiteURL: fixtures.propertiesProfiles.properties[ 0 ].websiteUrl } ); // eslint-disable-line sitekit/acronym-case
					await registry.dispatch( STORE_NAME ).selectAccount( accountID );
					expect( registry.select( STORE_NAME ).getPrimaryPropertyType() ).toBe( PROPERTY_TYPE_UA );
				} );

				it( 'should set primary property type to GA4 when there is no matching UA property', async () => {
					await registry.dispatch( STORE_NAME ).selectAccount( accountID );
					expect( registry.select( STORE_NAME ).getPrimaryPropertyType() ).toBe( PROPERTY_TYPE_GA4 );
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAccounts', () => {
			it( 'uses a resolver to make a network request', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);

				const accountID = fixtures.accountsPropertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID = fixtures.accountsPropertiesProfiles.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/acronym-case

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
				const profiles = registry.select( STORE_NAME ).getProfiles( accountID, propertyID );

				expect( accounts ).toEqual( fixtures.accountsPropertiesProfiles.accounts );
				expect( properties ).toEqual( fixtures.accountsPropertiesProfiles.properties );
				expect( profiles ).toEqual( fixtures.accountsPropertiesProfiles.profiles );
			} );

			it( 'does not make a network request if accounts are already present', async () => {
				registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );

				const accounts = registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getAccounts' )
				);

				expect( accounts ).toEqual( fixtures.accountsPropertiesProfiles.accounts );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'does not make a network request if accounts exist but are empty (this is a valid state)', async () => {
				registry.dispatch( STORE_NAME ).receiveGetAccounts( [] );

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

				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );

				registry.select( STORE_NAME ).getAccounts();
				await untilResolved( registry, STORE_NAME ).getAccounts();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const accounts = registry.select( STORE_NAME ).getAccounts();
				expect( accounts ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'passes existing tag ID when fetching accounts', async () => {
				const existingPropertyID = 'UA-1234567-1';

				registry.dispatch( STORE_NAME ).receiveGetExistingTag( existingPropertyID );
				registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
					accountID: '1234567',
					permission: true,
				}, { propertyID: existingPropertyID } );

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);

				registry.select( STORE_NAME ).getAccounts();

				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).getAccounts() !== undefined ||
					registry.select( STORE_NAME ).getErrorForSelector( 'getAccounts' )
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

			it( 'supports asynchronous tag resolution before fetching accounts', async () => {
				const existingPropertyID = 'UA-1234567-1';
				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{ body: factories.generateHTMLWithTag( existingPropertyID ), status: 200 }
				);
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{ body: { accountID: '1234567', permission: true }, status: 200 }
				);
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);
				registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL: 'http://example.com/' } );

				registry.select( STORE_NAME ).getAccounts();

				await untilResolved( registry, STORE_NAME ).getAccounts();

				expect( fetchMock ).toHaveFetched( true, { query: { tagverify: '1' } } );
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{ query: { propertyID: existingPropertyID } }
				);
				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
					{
						query: { existingPropertyID },
					}
				);
				expect( fetchMock ).toHaveFetchedTimes( 3 );
			} );

			it( 'sets account, property, and profile IDs in the store, if a matchedProperty is received and an account is not selected yet', async () => {
				const { accounts, properties, profiles, matchedProperty } = fixtures.accountsPropertiesProfiles;
				const matchedProfile = {
					...fixtures.profiles[ 0 ],
					id: '123456',
					webPropertyId: matchedProperty.id, // eslint-disable-line sitekit/acronym-case
					accountId: matchedProperty.accountId, // eslint-disable-line sitekit/acronym-case
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

				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );

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

				await untilResolved( registry, STORE_NAME ).getAccounts();

				expect( store.getState().matchedProperty ).toMatchObject( matchedProperty );
				expect( registry.select( STORE_NAME ).getAccountID() ).toBe( matchedProperty.accountId ); // eslint-disable-line sitekit/acronym-case
				expect( registry.select( STORE_NAME ).getPropertyID() ).toBe( matchedProperty.id );
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toBe( matchedProperty.internalWebPropertyId ); // eslint-disable-line sitekit/acronym-case
				expect( registry.select( STORE_NAME ).getProfileID() ).toBe( matchedProperty.defaultProfileId ); // eslint-disable-line sitekit/acronym-case
			} );

			describe( 'analytics-4', () => {
				beforeEach( () => {
					enabledFeatures.add( 'ga4setup' );

					[
						[ /^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/, fixtures.accountsPropertiesProfiles ],
						[ /^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/, fixtures.propertiesProfiles ],
						[ /^\/google-site-kit\/v1\/modules\/analytics-4\/data\/properties/, ga4Fixtures.properties ],
						[ /^\/google-site-kit\/v1\/modules\/analytics-4\/data\/webdatastreams-batch/, ga4Fixtures.webDataStreamsBatch ],
					].forEach( ( [ endpoint, body ] ) => {
						fetchMock.get( endpoint, { body } );
					} );

					provideSiteInfo( registry );
					provideModules( registry, [
						{
							slug: 'analytics',
							active: true,
							connected: false,
						},
						{
							slug: 'analytics-4',
							active: true,
							connected: false,
						},
					] );

					registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
					registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
				} );

				it( 'should select correct GA4 property', async () => {
					await registry.__experimentalResolveSelect( STORE_NAME ).getAccounts();
					expect( registry.select( MODULES_ANALYTICS_4 ).getPropertyID() ).toBe( ga4Fixtures.properties[ 0 ]._id );
				} );
			} );
		} );

		describe( 'getAccountTicketTermsOfServiceURL', () => {
			it( 'requires the accountTicketID from createAccount', () => {
				registry.dispatch( CORE_USER ).receiveUserInfo( { email: 'test@gmail.com' } );

				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toEqual( undefined );

				registry.dispatch( STORE_NAME ).receiveCreateAccount( { id: 'test-account-ticket-id' }, { data: {} } );

				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toEqual( 'https://analytics.google.com/analytics/web/?provisioningSignup=false&authuser=test%40gmail.com#/termsofservice/test-account-ticket-id' );
			} );

			it( 'requires the user’s email', () => {
				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toEqual( undefined );

				registry.dispatch( STORE_NAME ).receiveCreateAccount( { id: 'test-account-ticket-id' }, { data: {} } );

				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toEqual( undefined );

				registry.dispatch( CORE_USER ).receiveUserInfo( { email: 'test@gmail.com' } );

				expect( registry.select( STORE_NAME ).getAccountTicketTermsOfServiceURL() ).toEqual( 'https://analytics.google.com/analytics/web/?provisioningSignup=false&authuser=test%40gmail.com#/termsofservice/test-account-ticket-id' );
			} );
		} );
	} );
} );
