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
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	muteFetch,
	unsubscribeFromAll,
	untilResolved,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics profiles', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
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
		describe( 'createProfile', () => {
			it( 'creates a profile and adds it to the store ', async () => {
				const accountID = fixtures.createProfile.accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID = fixtures.createProfile.webPropertyId; // eslint-disable-line sitekit/acronym-case
				const profileName = fixtures.createProfile.name;

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/,
					{ body: fixtures.createProfile, status: 200 }
				);

				await registry.dispatch( STORE_NAME ).createProfile( accountID, propertyID, { profileName } );

				// Ensure the proper body parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/,
					{
						body: {
							data: { accountID, propertyID, profileName },
						},
					}
				);

				const profiles = registry.select( STORE_NAME ).getProfiles( accountID, propertyID );
				expect( profiles ).toMatchObject( [ fixtures.createProfile ] );
			} );

			it( 'sets isDoingCreateProfile ', async () => {
				const accountID = fixtures.createProfile.accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID = fixtures.createProfile.webPropertyId; // eslint-disable-line sitekit/acronym-case
				const profileName = fixtures.createProfile.name;

				fetchMock.post(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/,
					{ body: fixtures.createProfile, status: 200 }
				);

				registry.dispatch( STORE_NAME ).createProfile( accountID, propertyID, { profileName } );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( registry.select( STORE_NAME ).isDoingCreateProfile() ).toEqual( true );
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
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/,
					{ body: response, status: 500 }
				);

				await registry.dispatch( STORE_NAME ).createProfile( ...args );

				expect( registry.select( STORE_NAME ).getErrorForAction( 'createProfile', args ) ).toMatchObject( response );

				// Ignore the request fired by the `getProfiles` selector.
				muteFetch( /^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/, [] );
				const profiles = registry.select( STORE_NAME ).getProfiles( accountID, propertyID );

				// No profiles should have been added yet, as the profile creation failed.
				expect( profiles ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'findPropertyProfile', () => {
			const accountID = '123';
			const propertyID = 'UA-123-1';

			it( 'should return undefined if there is no profiles', async () => {
				registry.dispatch( STORE_NAME ).receiveGetProfiles( [], { accountID, propertyID } );

				const profile = await registry.dispatch( STORE_NAME ).findPropertyProfile( accountID, propertyID, '' );
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

				registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, { accountID, propertyID } );

				const profile = await registry.dispatch( STORE_NAME ).findPropertyProfile( accountID, propertyID, '1002' );
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

				registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, { accountID, propertyID } );

				const profile = await registry.dispatch( STORE_NAME ).findPropertyProfile( accountID, propertyID, '2001' );
				expect( profile ).toMatchObject( { id: '1001' } );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getProfiles', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/,
					{ body: fixtures.profiles, status: 200 }
				);

				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const testPropertyID = fixtures.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/acronym-case

				const initialProfiles = registry.select( STORE_NAME ).getProfiles( testAccountID, testPropertyID );

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/,
					{
						query: {
							accountID: testAccountID,
							propertyID: testPropertyID,
						},
					}
				);

				expect( initialProfiles ).toEqual( undefined );
				await untilResolved( registry, STORE_NAME ).getProfiles( testAccountID, testPropertyID );

				const profiles = registry.select( STORE_NAME ).getProfiles( testAccountID, testPropertyID );

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
				registry.dispatch( STORE_NAME ).receiveGetProfiles( fixtures.profiles, { accountID, propertyID } );

				const profiles = registry.select( STORE_NAME ).getProfiles( testAccountID, testPropertyID );

				await untilResolved( registry, STORE_NAME ).getProfiles( testAccountID, testPropertyID );

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
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/,
					{ body: response, status: 500 }
				);

				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const testPropertyID = fixtures.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/acronym-case

				registry.select( STORE_NAME ).getProfiles( testAccountID, testPropertyID );
				await untilResolved( registry, STORE_NAME ).getProfiles( testAccountID, testPropertyID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const profiles = registry.select( STORE_NAME ).getProfiles( testAccountID, testPropertyID );
				expect( profiles ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
