/**
 * `modules/analytics` data store: profiles tests.
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
import { MODULES_ANALYTICS } from './constants';
import {
	createTestRegistry,
	muteFetch,
	unsubscribeFromAll,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics profiles', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
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
		describe( 'createProfile', () => {
			it( 'creates a profile and adds it to the store ', async () => {
				const accountID = fixtures.createProfile.accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID = fixtures.createProfile.webPropertyId; // eslint-disable-line sitekit/acronym-case
				const profileName = fixtures.createProfile.name;

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					),
					{ body: fixtures.createProfile, status: 200 }
				);

				await registry
					.dispatch( MODULES_ANALYTICS )
					.createProfile( accountID, propertyID, { profileName } );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					),
					{
						body: {
							data: { accountID, propertyID, profileName },
						},
					}
				);

				const profiles = registry
					.select( MODULES_ANALYTICS )
					.getProfiles( accountID, propertyID );
				expect( profiles ).toMatchObject( [ fixtures.createProfile ] );
			} );

			it( 'sets isDoingCreateProfile ', () => {
				const accountID = fixtures.createProfile.accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID = fixtures.createProfile.webPropertyId; // eslint-disable-line sitekit/acronym-case
				const profileName = fixtures.createProfile.name;

				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					),
					{ body: fixtures.createProfile, status: 200 }
				);

				registry
					.dispatch( MODULES_ANALYTICS )
					.createProfile( accountID, propertyID, { profileName } );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry.select( MODULES_ANALYTICS ).isDoingCreateProfile()
				).toEqual( true );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const accountID = fixtures.createProfile.accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID = fixtures.createProfile.webPropertyId; // eslint-disable-line sitekit/acronym-case
				const profileName = fixtures.createProfile.name;

				const args = [ accountID, propertyID, { profileName } ];

				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-profile'
					),
					{ body: response, status: 500 }
				);

				await registry
					.dispatch( MODULES_ANALYTICS )
					.createProfile( ...args );

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getErrorForAction( 'createProfile', args )
				).toMatchObject( response );

				// Ignore the request fired by the `getProfiles` selector.
				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/profiles'
					),
					[]
				);
				const profiles = registry
					.select( MODULES_ANALYTICS )
					.getProfiles( accountID, propertyID );

				// No profiles should have been added yet, as the profile creation failed.
				expect( profiles ).toEqual( undefined );

				await untilResolved( registry, MODULES_ANALYTICS ).getProfiles(
					accountID,
					propertyID
				);
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'findPropertyProfile', () => {
			const accountID = '123';
			const propertyID = 'UA-123-1';

			it( 'should return undefined if there is no profiles', async () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles( [], { accountID, propertyID } );

				const profile = await registry
					.dispatch( MODULES_ANALYTICS )
					.findPropertyProfile( accountID, propertyID, '' );
				expect( profile ).toBeUndefined();
			} );

			it( 'should return a profile that matches provided defaultProfileID', async () => {
				const profiles = [
					{
						id: '1001',
					},
					{
						id: '1002',
					},
				];

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles( profiles, { accountID, propertyID } );

				const profile = await registry
					.dispatch( MODULES_ANALYTICS )
					.findPropertyProfile( accountID, propertyID, '1002' );
				expect( profile ).toMatchObject( { id: '1002' } );
			} );

			it( 'should return return the first profile if there is no profile matching provided defaultProfileID', async () => {
				const profiles = [
					{
						id: '1001',
					},
					{
						id: '1002',
					},
				];

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles( profiles, { accountID, propertyID } );

				const profile = await registry
					.dispatch( MODULES_ANALYTICS )
					.findPropertyProfile( accountID, propertyID, '2001' );
				expect( profile ).toMatchObject( { id: '1001' } );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getProfiles', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/profiles'
					),
					{ body: fixtures.profiles, status: 200 }
				);

				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const testPropertyID = fixtures.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/acronym-case

				const initialProfiles = registry
					.select( MODULES_ANALYTICS )
					.getProfiles( testAccountID, testPropertyID );

				expect( initialProfiles ).toEqual( undefined );

				await untilResolved( registry, MODULES_ANALYTICS ).getProfiles(
					testAccountID,
					testPropertyID
				);

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/profiles'
					),
					{
						query: {
							accountID: testAccountID,
							propertyID: testPropertyID,
						},
					}
				);

				const profiles = registry
					.select( MODULES_ANALYTICS )
					.getProfiles( testAccountID, testPropertyID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( profiles ).toEqual( fixtures.profiles );
				expect( profiles ).toHaveLength( 1 );
			} );

			it( 'does not make a network request if profiles for this account + property are already present', async () => {
				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const testPropertyID = fixtures.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/acronym-case
				const accountID = testAccountID;
				const propertyID = testPropertyID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles( fixtures.profiles, {
						accountID,
						propertyID,
					} );

				const profiles = registry
					.select( MODULES_ANALYTICS )
					.getProfiles( testAccountID, testPropertyID );

				await untilResolved( registry, MODULES_ANALYTICS ).getProfiles(
					testAccountID,
					testPropertyID
				);

				expect( fetchMock ).not.toHaveFetched();
				expect( profiles ).toEqual( fixtures.profiles );
				expect( profiles ).toHaveLength( 1 );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.get(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/profiles'
					),
					{ body: response, status: 500 }
				);

				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const testPropertyID = fixtures.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/acronym-case

				registry
					.select( MODULES_ANALYTICS )
					.getProfiles( testAccountID, testPropertyID );
				await untilResolved( registry, MODULES_ANALYTICS ).getProfiles(
					testAccountID,
					testPropertyID
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const profiles = registry
					.select( MODULES_ANALYTICS )
					.getProfiles( testAccountID, testPropertyID );
				expect( profiles ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
