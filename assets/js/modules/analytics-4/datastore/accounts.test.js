/**
 * `modules/analytics-4` data store: accounts tests.
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
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { FORM_ACCOUNT_CREATE, MODULES_ANALYTICS_4 } from './constants';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { caseInsensitiveListSort } from '../../../util/case-insensitive-sort';

describe( 'modules/analytics-4 accounts', () => {
	let registry;
	let store;

	const accountSummariesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/account-summaries'
	);

	const accountName = 'Test Account';
	const propertyName = 'Test Property';
	const dataStreamName = 'Test Web Data Stream';
	const timezone = 'America/Los Angeles';
	const countryCode = 'US';

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ MODULES_ANALYTICS_4 ].store;
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'createAccount', () => {
			const accountTicketID = 'abc123';

			it( 'creates an account ticket and sets the account ticket ID', async () => {
				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/create-account-ticket'
					),
					{
						// eslint-disable-next-line sitekit/acronym-case
						body: { accountTicketId: accountTicketID },
						status: 200,
					}
				);

				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_ACCOUNT_CREATE, {
						accountName,
						propertyName,
						dataStreamName,
						timezone,
						countryCode,
					} );

				await registry.dispatch( MODULES_ANALYTICS_4 ).createAccount();

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/create-account-ticket'
					),
					{
						body: {
							data: {
								displayName: accountName,
								propertyName,
								dataStreamName,
								timezone,
								regionCode: countryCode,
							},
						},
					}
				);

				expect( store.getState().accountTicketID ).toEqual(
					accountTicketID
				);
			} );

			it( 'sets isDoingCreateAccount ', () => {
				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/create-account-ticket'
					),
					// eslint-disable-next-line sitekit/acronym-case
					{ body: { accountTicketId: accountTicketID }, status: 200 }
				);

				registry.dispatch( MODULES_ANALYTICS_4 ).createAccount();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isDoingCreateAccount()
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
						'^/google-site-kit/v1/modules/analytics-4/data/create-account-ticket'
					),
					{ body: response, status: 500 }
				);

				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_ACCOUNT_CREATE, {
						accountName,
						propertyName,
						dataStreamName,
						timezone,
						countryCode,
					} );

				await registry.dispatch( MODULES_ANALYTICS_4 ).createAccount();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getErrorForAction( 'createAccount' )
				).toMatchObject( response );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'selectAccount', () => {
			const accountID =
				fixtures.accountSummaries.accountSummaries[ 1 ]._id;

			beforeEach( () => {
				[
					[
						new RegExp(
							'^/google-site-kit/v1/modules/analytics-4/data/account-summaries'
						),
						fixtures.accountSummaries,
					],
					[
						new RegExp(
							'^/google-site-kit/v1/modules/analytics-4/data/property?'
						),
						fixtures.accountSummaries.accountSummaries[ 1 ]
							.propertySummaries[ 0 ],
					],
					[
						new RegExp(
							'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams-batch'
						),
						fixtures.webDataStreamsBatch,
					],
				].forEach( ( [ endpoint, body ] ) => {
					fetchMock.get( endpoint, { body } );
				} );

				provideSiteInfo( registry );
				provideUserAuthentication( registry );
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties(
						fixtures.accountSummaries.accountSummaries[ 1 ]
							.propertySummaries,
						{
							accountID,
						}
					);
			} );

			it( 'should set accountID', async () => {
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectAccount( accountID );

				expect( store.getState().settings.accountID ).toEqual(
					accountID
				);
			} );

			it( 'should throw an error if accountID is invalid', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.selectAccount( false )
				).toThrow();
			} );

			it( 'should select the correct property', async () => {
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectAccount( accountID );
				expect( store.getState().settings.propertyID ).toBe(
					fixtures.accountSummaries.accountSummaries[ 1 ]
						.propertySummaries[ 0 ]._id
				);
			} );
		} );

		describe( 'fetchGetAccountSummaries', () => {
			it( 'supports when no account summaries returned', async () => {
				fetchMock.get( accountSummariesEndpoint, {
					body: { nextPageToken: null },
					status: 200,
				} );
				const { fetchGetAccountSummaries } =
					registry.dispatch( MODULES_ANALYTICS_4 );

				await fetchGetAccountSummaries();

				expect( store.getState().accountSummaries ).toEqual( [] );
			} );
		} );

		describe( 'transformAndSortAccountSummaries', () => {
			it( 'should create an action to transform and sort account summaries', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( fixtures.accountSummaries );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.transformAndSortAccountSummaries();

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getAccountSummaries()
				).toEqual(
					caseInsensitiveListSort(
						fixtures.accountSummaries.accountSummaries,
						'displayName'
					)
				);
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAccountSummaries', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( accountSummariesEndpoint, {
					body: fixtures.accountSummaries,
					status: 200,
				} );

				const initialAccountSummaries = registry
					.select( MODULES_ANALYTICS_4 )
					.getAccountSummaries();
				expect( initialAccountSummaries ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAccountSummaries();
				expect( fetchMock ).toHaveFetched( accountSummariesEndpoint );

				const accountSummaries = registry
					.select( MODULES_ANALYTICS_4 )
					.getAccountSummaries();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( accountSummaries ).toHaveLength(
					fixtures.accountSummaries.accountSummaries.length
				);
			} );

			it( 'should not make a network request if properties for this account are already present', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( {
						accountSummaries:
							fixtures.accountSummaries.accountSummaries,
						nextPageToken: null,
					} );

				const accountSummaries = registry
					.select( MODULES_ANALYTICS_4 )
					.getAccountSummaries();
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAccountSummaries();

				expect( fetchMock ).not.toHaveFetched(
					accountSummariesEndpoint
				);
				expect( accountSummaries ).toEqual(
					fixtures.accountSummaries.accountSummaries
				);
				expect( accountSummaries ).toHaveLength(
					fixtures.accountSummaries.accountSummaries.length
				);
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( accountSummariesEndpoint, {
					body: response,
					status: 500,
				} );

				registry.select( MODULES_ANALYTICS_4 ).getAccountSummaries();
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAccountSummaries();
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const accountSummaries = registry
					.select( MODULES_ANALYTICS_4 )
					.getAccountSummaries();
				expect( accountSummaries ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );

			it( 'should make 3 requests to the account summaries endpoint when nextPageToken is not null twice, then null for the third time', async () => {
				// Simulate the first two responses with nextPageToken and the third with null
				const firstResponse = {
					accountSummaries: [
						fixtures.accountSummaries.accountSummaries[ 0 ],
					], // Pick only the first element
					nextPageToken: 'token1',
				};
				const secondResponse = {
					accountSummaries: [
						fixtures.accountSummaries.accountSummaries[ 1 ],
					], // Pick the second element
					nextPageToken: 'token2',
				};
				const thirdResponse = {
					accountSummaries: [
						fixtures.accountSummaries.accountSummaries[ 2 ],
					], // Pick the third element
					nextPageToken: null, // Third time, nextPageToken is null
				};

				// Mock fetch for each call
				fetchMock.getOnce( accountSummariesEndpoint, {
					body: firstResponse,
					status: 200,
				} );
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/account-summaries\\?pageToken=token1.*'
					),
					{
						body: secondResponse,
						status: 200,
					}
				);
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/account-summaries\\?pageToken=token2.*'
					),
					{
						body: thirdResponse,
						status: 200,
					}
				);

				// Initial state
				const initialAccountSummaries = registry
					.select( MODULES_ANALYTICS_4 )
					.getAccountSummaries();
				expect( initialAccountSummaries ).toBeUndefined();

				// Resolve the action
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getAccountSummaries();

				// Check that the endpoint was fetched 3 times
				expect( fetchMock ).toHaveFetchedTimes( 3 );

				// Check that the final result is the concatenation of all summaries
				const accountSummaries = registry
					.select( MODULES_ANALYTICS_4 )
					.getAccountSummaries();

				expect( accountSummaries ).toHaveLength( 3 ); // Total length from all responses (3 elements)
			} );
		} );

		describe( 'getAccountTicketTermsOfServiceURL', () => {
			it( 'requires the accountTicketID from createAccount', () => {
				registry
					.dispatch( CORE_USER )
					.receiveUserInfo( { email: 'test@gmail.com' } );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAccountTicketTermsOfServiceURL()
				).toEqual( undefined );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveCreateAccount(
					// eslint-disable-next-line sitekit/acronym-case
					{ accountTicketId: 'test-account-ticket-id' },
					{ data: {} }
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAccountTicketTermsOfServiceURL()
				).toEqual(
					'https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fanalytics.google.com%2Fanalytics%2Fweb%2F%3FprovisioningSignup%3Dfalse%23%2Ftermsofservice%2Ftest-account-ticket-id&Email=test%40gmail.com'
				);
			} );

			it( 'requires the user’s email', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAccountTicketTermsOfServiceURL()
				).toEqual( undefined );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveCreateAccount(
					// eslint-disable-next-line sitekit/acronym-case
					{ accountTicketId: 'test-account-ticket-id' },
					{ data: {} }
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAccountTicketTermsOfServiceURL()
				).toEqual( undefined );

				registry
					.dispatch( CORE_USER )
					.receiveUserInfo( { email: 'test@gmail.com' } );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAccountTicketTermsOfServiceURL()
				).toEqual(
					'https://accounts.google.com/accountchooser?continue=https%3A%2F%2Fanalytics.google.com%2Fanalytics%2Fweb%2F%3FprovisioningSignup%3Dfalse%23%2Ftermsofservice%2Ftest-account-ticket-id&Email=test%40gmail.com'
				);
			} );
		} );

		describe( 'canSubmitAccountCreate', () => {
			beforeEach( () => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_ACCOUNT_CREATE, {
						accountName,
						propertyName,
						dataStreamName,
						timezone,
						countryCode,
					} );
			} );

			it( 'should return true if all values exist', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.canSubmitAccountCreate()
				).toEqual( true );
			} );

			it.each( [
				'accountName',
				'propertyName',
				'dataStreamName',
				'timezone',
				'countryCode',
			] )( "should return false if %s doesn't exist", ( value ) => {
				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_ACCOUNT_CREATE, {
						[ value ]: '',
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.canSubmitAccountCreate()
				).toEqual( false );
			} );
		} );
	} );
} );
