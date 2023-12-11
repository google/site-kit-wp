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
import { MODULES_ANALYTICS_4 } from './constants';
import { FORM_ACCOUNT_CREATE } from '../../analytics/datastore/constants';
import {
	createTestRegistry,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

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

	afterEach( () => {
		unsubscribeFromAll( registry );
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
				expect( accountSummaries ).toEqual( fixtures.accountSummaries );
				expect( accountSummaries ).toHaveLength(
					fixtures.accountSummaries.length
				);
			} );

			it( 'should not make a network request if properties for this account are already present', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( fixtures.accountSummaries );

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
				expect( accountSummaries ).toEqual( fixtures.accountSummaries );
				expect( accountSummaries ).toHaveLength(
					fixtures.accountSummaries.length
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
