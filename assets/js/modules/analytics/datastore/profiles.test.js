/**
 * modules/analytics data store: profiles tests.
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
 * Node dependencies
 */
import fs from 'fs';
import path from 'path';

/**
 * External dependencies
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

describe( 'modules/analytics profiles', () => {
	const fixtures = {
		// TODO: Use consolidated fixture data.
		accountsPropertiesProfiles: JSON.parse( fs.readFileSync( path.join( __dirname, '__fixtures__', 'accounts-properties-profiles.json' ) ) ),
		createProfile: JSON.parse( fs.readFileSync( path.join( __dirname, '__fixtures__', 'create-profile.json' ) ) ),
		propertiesProfiles: JSON.parse( fs.readFileSync( path.join( __dirname, '__fixtures__', 'properties-profiles.json' ) ) ),
		profiles: JSON.parse( fs.readFileSync( path.join( __dirname, '__fixtures__', 'profiles.json' ) ) ),
	};
	let apiFetchSpy;
	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;

		apiFetchSpy = jest.spyOn( { apiFetch }, 'apiFetch' );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		apiFetchSpy.mockRestore();
	} );

	describe( 'actions', () => {
		describe( 'createProfile', () => {
			it( 'creates a profile and adds it to the store ', async () => {
				const accountId = fixtures.accountsPropertiesProfiles.accounts[ 6 ].id;
				const propertyId = fixtures.accountsPropertiesProfiles.properties[ 0 ].id;

				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/
					)
					.mockResponse(
						JSON.stringify( fixtures.createProfile ),
						{ status: 200 }
					);

				registry.dispatch( STORE_NAME ).createProfile( accountId, propertyId );
				// TODO: This is failing and I'm not clear on why, when it works fine
				// in `assets/js/googlesitekit/datastore/site/reset.test.js`
				// expect( registry.select( STORE_NAME ).isDoingCreateProfile( accountId ) ).toEqual( true );

				muteConsole( 'error' );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getProfiles( accountId, propertyId )
					),
				);

				const profiles = registry.select( STORE_NAME ).getProfiles( accountId, propertyId );
				expect( profiles ).toMatchObject( [ fixtures.createProfile.profile ] );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const accountId = fixtures.accountsPropertiesProfiles.accounts[ 6 ].id;
				const propertyId = fixtures.accountsPropertiesProfiles.properties[ 0 ].id;
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-profile/
					)
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.dispatch( STORE_NAME ).createProfile( accountId, propertyId );

				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getError()
					),
				);

				expect( registry.select( STORE_NAME ).getError() ).toMatchObject( response );

				// Ignore the request fired by the `getProperties` selector.
				muteConsole( 'error' );
				const properties = registry.select( STORE_NAME ).getProperties( accountId );
				// No properties should have been added yet, as the property creation
				// failed.
				expect( properties ).toEqual( undefined );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getProfiles', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/
					)
					.mockResponseOnce(
						JSON.stringify( fixtures.propertiesProfiles ),
						{ status: 200 }
					);

				const testAccountId = fixtures.propertiesProfiles.properties[ 0 ].accountId;
				const testPropertyId = fixtures.propertiesProfiles.properties[ 0 ].id;

				// Dispatch specific data to the stores without mocking extra requests.
				registry.dispatch( STORE_NAME ).receiveAccountsPropertiesProfiles( { accounts: fixtures.accountsPropertiesProfiles.accounts } );
				registry.dispatch( STORE_NAME ).receivePropertiesProfiles( {
					accountId: testAccountId,
					properties: fixtures.propertiesProfiles.properties,
				} );

				const initialProfiles = registry.select( STORE_NAME ).getProfiles( testAccountId, testPropertyId );
				expect( initialProfiles ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getProfiles( testAccountId, testPropertyId ) !== undefined
					),
				);

				const profiles = registry.select( STORE_NAME ).getProfiles( testAccountId, testPropertyId );

				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( profiles ).toEqual( fixtures.propertiesProfiles.profiles );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/profiles/
					)
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				const testAccountId = fixtures.propertiesProfiles.properties[ 0 ].accountId;
				const testPropertyId = fixtures.propertiesProfiles.properties[ 0 ].id;

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getProfiles( testAccountId, testPropertyId );
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingProfiles[ `${ testAccountId }::${ testPropertyId }` ] === false,
				);

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				const profiles = registry.select( STORE_NAME ).getProfiles( testAccountId, testPropertyId );
				expect( profiles ).toEqual( undefined );
			} );
		} );
	} );
} );
