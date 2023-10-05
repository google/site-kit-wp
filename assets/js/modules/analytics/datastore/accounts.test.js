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
	MODULES_ANALYTICS,
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
	provideUserAuthentication,
} from '../../../../../tests/js/utils';
import * as factories from './__factories__';
import * as fixtures from './__fixtures__';
import * as ga4Fixtures from '../../analytics-4/datastore/__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';

describe( 'modules/analytics accounts', () => {
	let registry;
	let store;

	const propertiesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics/data/accounts-properties-profiles'
	);

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ MODULES_ANALYTICS ].store;
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
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
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-account-ticket'
					),
					{
						body: fixtures.createAccount,
						status: 200,
					}
				);

				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_ACCOUNT_CREATE, {
						accountName,
						propertyName,
						profileName,
						timezone,
					} );

				await registry.dispatch( MODULES_ANALYTICS ).createAccount();

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-account-ticket'
					),
					{
						body: {
							data: {
								accountName,
								propertyName,
								profileName,
								timezone,
							},
						},
					}
				);

				expect( store.getState().accountTicketID ).toEqual(
					fixtures.createAccount.id
				);
			} );

			it( 'sets isDoingCreateAccount ', () => {
				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-account-ticket'
					),
					{ body: fixtures.createAccount, status: 200 }
				);

				registry.dispatch( MODULES_ANALYTICS ).createAccount();
				expect(
					registry.select( MODULES_ANALYTICS ).isDoingCreateAccount()
				).toEqual( true );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-account-ticket'
					),
					{ body: response, status: 500 }
				);

				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_ACCOUNT_CREATE, {
						accountName,
						propertyName,
						profileName,
						timezone,
					} );
				await registry.dispatch( MODULES_ANALYTICS ).createAccount();

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getErrorForAction( 'createAccount' )
				).toMatchObject( response );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'resetAccounts', () => {
			it( 'sets accounts and related values back to their initial values', async () => {
				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {
					accountID: '12345',
					propertyID: 'UA-12345-1',
					internalWebPropertyID: '23245',
					profileID: '54321',
					useSnippet: true,
					trackingDisabled: [],
					anonymizeIP: true,
				} );
				const propertyID =
					fixtures.accountsPropertiesProfiles.properties[ 0 ].id;
				const accountID =
					fixtures.accountsPropertiesProfiles.accounts[ 0 ].id;
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetAccounts(
						fixtures.accountsPropertiesProfiles.accounts
					);
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties(
						fixtures.accountsPropertiesProfiles.properties,
						{ accountID }
					);
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles(
						fixtures.accountsPropertiesProfiles.profiles,
						{ accountID, propertyID }
					);

				registry.dispatch( MODULES_ANALYTICS ).resetAccounts();

				// getAccounts() will trigger a request again.
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/accounts-properties-profiles'
					),
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/properties'
					),
					{ body: [] }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/settings'
					),
					{ body: [] }
				);
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: [] }
				);

				expect(
					registry.select( MODULES_ANALYTICS ).getAccountID()
				).toStrictEqual( undefined );
				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toStrictEqual( undefined );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getInternalWebPropertyID()
				).toStrictEqual( undefined );
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toStrictEqual( undefined );

				expect(
					registry.select( MODULES_ANALYTICS ).getAccounts()
				).toStrictEqual( undefined );
				// Other settings are left untouched.
				expect(
					registry.select( MODULES_ANALYTICS ).getUseSnippet()
				).toStrictEqual( true );
				expect(
					registry.select( MODULES_ANALYTICS ).getTrackingDisabled()
				).toStrictEqual( [] );
				expect(
					registry.select( MODULES_ANALYTICS ).getAnonymizeIP()
				).toStrictEqual( true );
				// Wait until selector is resolved to prevent unmatched fetch error.
				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS )
						.hasFinishedResolution( 'getAccounts' )
				);
			} );

			it( 'invalidates the resolver for getAccounts', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/accounts-properties-profiles'
					),
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/properties'
					),
					{ body: [] }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/settings'
					),
					{ body: [] }
				);
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: [] }
				);
				fetchMock.get(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/account-summaries'
					),
					{
						body: ga4Fixtures.accountSummaries,
						status: 200,
					}
				);
				fetchMock.get(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams-batch'
					),
					{
						body: ga4Fixtures.webDataStreamsBatch,
						status: 200,
					}
				);

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetAccounts(
						fixtures.accountsPropertiesProfiles.accounts
					);
				registry.select( MODULES_ANALYTICS ).getAccounts();

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS )
						.hasFinishedResolution( 'getAccounts' )
				);

				registry.dispatch( MODULES_ANALYTICS ).resetAccounts();

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.hasFinishedResolution( 'getAccounts' )
				).toStrictEqual( false );

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSettings();
			} );
		} );

		describe( 'selectAccount', () => {
			beforeEach( () => {
				provideSiteInfo( registry, {
					referenceSiteURL:
						fixtures.propertiesProfiles.properties[ 0 ].websiteUrl, // eslint-disable-line sitekit/acronym-case
				} );
			} );

			it( 'should throw an error if accountID is invalid', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS )
						.selectAccount( false )
				).toThrow();
			} );

			it( 'should property reset propertyID and profileID when selecting ACCOUNT_CREATE option', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.selectAccount( ACCOUNT_CREATE );
				expect(
					registry.select( MODULES_ANALYTICS ).getAccountID()
				).toBe( ACCOUNT_CREATE );
				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getInternalWebPropertyID()
				).toBe( '' );
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toBe( '' );
			} );

			it( 'should correctly select property and profile IDs', async () => {
				fetchMock.get(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
					),
					{ body: fixtures.propertiesProfiles, status: 200 }
				);
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: [] }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/properties'
					),
					{ body: [] }
				);

				const accountID =
					fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case

				provideUserAuthentication( registry );

				await registry
					.dispatch( MODULES_ANALYTICS )
					.selectAccount( accountID );

				expect(
					registry.select( MODULES_ANALYTICS ).getAccountID()
				).toBe( accountID );
				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBe(
					// eslint-disable-next-line sitekit/acronym-case
					fixtures.propertiesProfiles.profiles[ 0 ].webPropertyId
				);
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getInternalWebPropertyID()
				).toBe(
					/* eslint-disable sitekit/acronym-case */
					fixtures.propertiesProfiles.profiles[ 0 ]
						.internalWebPropertyId
					/* eslint-enable sitekit/acronym-case */
				);
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toBe( fixtures.propertiesProfiles.profiles[ 0 ].id );
			} );

			it( 'should correctly select PROPERTY_CREATE and PROFILE_CREATE when account has no properties', async () => {
				fetchMock.get(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
					),
					{ body: { properties: [], profiles: [] }, status: 200 }
				);
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: [] }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/properties'
					),
					{ body: [] }
				);

				const accountID =
					fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case

				provideUserAuthentication( registry );

				await registry
					.dispatch( MODULES_ANALYTICS )
					.selectAccount( accountID );

				expect(
					registry.select( MODULES_ANALYTICS ).getAccountID()
				).toBe( accountID );
				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBe( PROPERTY_CREATE );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getInternalWebPropertyID()
				).toBe( '' );
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toBe( PROFILE_CREATE );
			} );

			describe( 'analytics-4', () => {
				const accountID =
					fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case

				beforeEach( () => {
					[
						[
							new RegExp(
								'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
							),
							fixtures.propertiesProfiles,
						],
						[
							new RegExp(
								'^/google-site-kit/v1/modules/analytics-4/data/properties'
							),
							ga4Fixtures.properties,
						],
						[
							new RegExp(
								'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams-batch'
							),
							ga4Fixtures.webDataStreamsBatch,
						],
					].forEach( ( [ endpoint, body ] ) => {
						fetchMock.get( endpoint, { body } );
					} );

					provideSiteInfo( registry );
					provideUserAuthentication( registry );
					provideModules( registry, [
						{
							slug: 'analytics',
							active: true,
							connected: true,
						},
						{
							slug: 'analytics-4',
							active: true,
							connected: true,
						},
					] );
				} );

				it( 'should select the correct GA4 property', async () => {
					await registry
						.dispatch( MODULES_ANALYTICS )
						.selectAccount( accountID );
					expect(
						registry.select( MODULES_ANALYTICS_4 ).getPropertyID()
					).toBe( ga4Fixtures.properties[ 0 ]._id );
				} );

				it( 'should select the correct UA property', async () => {
					provideSiteInfo( registry, {
						referenceSiteURL:
							/* eslint-disable sitekit/acronym-case */
							fixtures.propertiesProfiles.properties[ 0 ]
								.websiteUrl,
						/* eslint-enable sitekit/acronym-case */
					} );
					await registry
						.dispatch( MODULES_ANALYTICS )
						.selectAccount( accountID );
					expect(
						registry.select( MODULES_ANALYTICS ).getPropertyID()
					).toBe( fixtures.propertiesProfiles.properties[ 0 ].id );
				} );

				it( 'should set primary property type to UA when there is a matching UA property', async () => {
					provideSiteInfo( registry, {
						referenceSiteURL:
							/* eslint-disable sitekit/acronym-case */
							fixtures.propertiesProfiles.properties[ 0 ]
								.websiteUrl,
						/* eslint-enable sitekit/acronym-case */
					} );
					await registry
						.dispatch( MODULES_ANALYTICS )
						.selectAccount( accountID );
					expect(
						registry
							.select( MODULES_ANALYTICS )
							.getPrimaryPropertyType()
					).toBe( PROPERTY_TYPE_UA );
				} );

				it( 'should set primary property type to GA4 when there is no matching UA property', async () => {
					await registry
						.dispatch( MODULES_ANALYTICS )
						.selectAccount( accountID );
					expect(
						registry
							.select( MODULES_ANALYTICS )
							.getPrimaryPropertyType()
					).toBe( PROPERTY_TYPE_GA4 );
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAccounts', () => {
			beforeEach( () => {
				fetchMock.getOnce(
					new RegExp( '^/google-site-kit/v1/core/modules/data/list' ),
					{ body: [] }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/settings'
					),
					{ body: [] }
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/properties'
					),
					{ body: [] }
				);
				fetchMock.get(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/account-summaries'
					),
					{
						body: ga4Fixtures.accountSummaries,
						status: 200,
					}
				);
				fetchMock.get(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams-batch'
					),
					{
						body: ga4Fixtures.webDataStreamsBatch,
						status: 200,
					}
				);

				provideUserAuthentication( registry );
			} );

			it( 'uses a resolver to make a network request', async () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/accounts-properties-profiles'
					),
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);

				const accountID =
					fixtures.accountsPropertiesProfiles.properties[ 0 ]
						.accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID =
					fixtures.accountsPropertiesProfiles.profiles[ 0 ]
						.webPropertyId; // eslint-disable-line sitekit/acronym-case

				const initialAccounts = registry
					.select( MODULES_ANALYTICS )
					.getAccounts();

				expect( initialAccounts ).toEqual( undefined );
				await subscribeUntil(
					registry,
					() =>
						registry.select( MODULES_ANALYTICS ).getAccounts() !==
						undefined
				);

				const accounts = registry
					.select( MODULES_ANALYTICS )
					.getAccounts();
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched( propertiesEndpoint );

				// Properties and profiles should also have been received by
				// this action.
				const properties = registry
					.select( MODULES_ANALYTICS )
					.getProperties( accountID );
				const profiles = registry
					.select( MODULES_ANALYTICS )
					.getProfiles( accountID, propertyID );

				expect( accounts ).toEqual(
					fixtures.accountsPropertiesProfiles.accounts
				);
				expect( properties ).toEqual(
					fixtures.accountsPropertiesProfiles.properties
				);
				expect( profiles ).toEqual(
					fixtures.accountsPropertiesProfiles.profiles
				);

				await untilResolved(
					registry,
					MODULES_ANALYTICS
				).getAccounts();
			} );

			it( 'does not fetch from UA properties endpoint if accounts are already present', async () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetAccounts(
						fixtures.accountsPropertiesProfiles.accounts
					);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( ga4Fixtures.accountSummaries );

				const accounts = registry
					.select( MODULES_ANALYTICS )
					.getAccounts();

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS )
						.hasFinishedResolution( 'getAccounts' )
				);

				expect( accounts ).toEqual(
					fixtures.accountsPropertiesProfiles.accounts
				);

				expect( fetchMock ).not.toHaveFetched( propertiesEndpoint );

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSettings();
			} );

			it( 'does not fetch from UA properties endpoint if accounts exist but are empty (this is a valid state)', async () => {
				registry.dispatch( MODULES_ANALYTICS ).receiveGetAccounts( [] );

				const accounts = registry
					.select( MODULES_ANALYTICS )
					.getAccounts();

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS )
						.hasFinishedResolution( 'getAccounts' )
				);

				expect( accounts ).toEqual( [] );
				expect( fetchMock ).not.toHaveFetched( propertiesEndpoint );

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSettings();
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/accounts-properties-profiles'
					),
					{ body: response, status: 500 }
				);

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );

				registry.select( MODULES_ANALYTICS ).getAccounts();
				await untilResolved(
					registry,
					MODULES_ANALYTICS
				).getAccounts();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getSettings();

				expect( fetchMock ).toHaveFetchedTimes( 5 );

				const accounts = registry
					.select( MODULES_ANALYTICS )
					.getAccounts();
				expect( accounts ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'supports asynchronous tag resolution before fetching accounts', async () => {
				const existingPropertyID = 'UA-1234567-1';
				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{
						body: factories.generateHTMLWithTag(
							existingPropertyID
						),
						status: 200,
					}
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/accounts-properties-profiles'
					),
					{ body: fixtures.accountsPropertiesProfiles, status: 200 }
				);
				registry
					.dispatch( CORE_SITE )
					.receiveSiteInfo( { homeURL: 'http://example.com/' } );

				registry.select( MODULES_ANALYTICS ).getAccounts();

				await untilResolved(
					registry,
					MODULES_ANALYTICS
				).getAccounts();

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/accounts-properties-profiles'
					)
				);
				expect( fetchMock ).toHaveFetchedTimes( 4 );
			} );

			it( 'sets account, property, and profile IDs in the store, if a matchedProperty is received and an account is not selected yet', async () => {
				const { accounts, properties, profiles, matchedProperty } =
					fixtures.accountsPropertiesProfiles;
				const matchedProfile = {
					...fixtures.profiles[ 0 ],
					id: '123456',
					webPropertyId: matchedProperty.id, // eslint-disable-line sitekit/acronym-case
					accountId: matchedProperty.accountId, // eslint-disable-line sitekit/acronym-case
				};
				const response = {
					accounts,
					properties,
					profiles: [ matchedProfile, ...profiles ],
					matchedProperty,
				};

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/accounts-properties-profiles'
					),
					{ body: response, status: 200 }
				);

				expect( store.getState().matchedProperty ).toBeFalsy();
				expect(
					registry.select( MODULES_ANALYTICS ).getAccountID()
				).toBeFalsy();
				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBeFalsy();
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getInternalWebPropertyID()
				).toBeFalsy();
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toBeFalsy();

				registry.select( MODULES_ANALYTICS ).getAccounts();

				await untilResolved(
					registry,
					MODULES_ANALYTICS
				).getAccounts();

				expect( store.getState().matchedProperty ).toMatchObject(
					matchedProperty
				);
				expect(
					registry.select( MODULES_ANALYTICS ).getAccountID()
				).toBe( matchedProperty.accountId ); // eslint-disable-line sitekit/acronym-case
				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBe( matchedProperty.id );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getInternalWebPropertyID()
				).toBe( matchedProperty.internalWebPropertyId ); // eslint-disable-line sitekit/acronym-case
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toBe( matchedProperty.defaultProfileId ); // eslint-disable-line sitekit/acronym-case
			} );
		} );
		describe( 'getAccounts - analytics-4', () => {
			beforeEach( () => {
				[
					[
						new RegExp(
							'^/google-site-kit/v1/modules/analytics/data/accounts-properties-profiles'
						),
						fixtures.accountsPropertiesProfiles,
					],
					[
						new RegExp(
							'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
						),
						fixtures.propertiesProfiles,
					],
					[
						new RegExp(
							'^/google-site-kit/v1/modules/analytics-4/data/properties'
						),
						ga4Fixtures.properties,
					],
					[
						new RegExp(
							'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams-batch'
						),
						ga4Fixtures.webDataStreamsBatch,
					],
				].forEach( ( [ endpoint, body ] ) => {
					fetchMock.get( endpoint, { body } );
				} );

				provideSiteInfo( registry );
				provideUserAuthentication( registry );
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

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetExistingTag( null );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );
			} );

			// instead is "property create"
			it( 'should select correct GA4 property', async () => {
				await registry
					.__experimentalResolveSelect( MODULES_ANALYTICS )
					.getAccounts();
				expect(
					registry.select( MODULES_ANALYTICS_4 ).getPropertyID()
				).toBe( ga4Fixtures.properties[ 0 ]._id );
			} );
		} );

		describe( 'getAccountTicketTermsOfServiceURL', () => {
			it( 'requires the accountTicketID from createAccount', () => {
				registry
					.dispatch( CORE_USER )
					.receiveUserInfo( { email: 'test@gmail.com' } );

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getAccountTicketTermsOfServiceURL()
				).toEqual( undefined );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveCreateAccount(
						{ id: 'test-account-ticket-id' },
						{ data: {} }
					);

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getAccountTicketTermsOfServiceURL()
				).toEqual(
					'https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fanalytics.google.com%2Fanalytics%2Fweb%2F%3FprovisioningSignup%3Dfalse%23%2Ftermsofservice%2Ftest-account-ticket-id&Email=test%40gmail.com'
				);
			} );

			it( 'requires the user’s email', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getAccountTicketTermsOfServiceURL()
				).toEqual( undefined );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveCreateAccount(
						{ id: 'test-account-ticket-id' },
						{ data: {} }
					);

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getAccountTicketTermsOfServiceURL()
				).toEqual( undefined );

				registry
					.dispatch( CORE_USER )
					.receiveUserInfo( { email: 'test@gmail.com' } );

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getAccountTicketTermsOfServiceURL()
				).toEqual(
					'https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fanalytics.google.com%2Fanalytics%2Fweb%2F%3FprovisioningSignup%3Dfalse%23%2Ftermsofservice%2Ftest-account-ticket-id&Email=test%40gmail.com'
				);
			} );
		} );
	} );
} );
