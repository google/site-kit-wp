/**
 * modules/analytics data store: properties tests.
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

describe( 'modules/analytics properties', () => {
	const fixtures = {
		// TODO: Use consolidated fixture data.
		accountsPropertiesProfiles: JSON.parse( fs.readFileSync( path.join( __dirname, '__fixtures__', 'accounts-properties-profiles.json' ) ) ),
		createProperty: JSON.parse( fs.readFileSync( path.join( __dirname, '__fixtures__', 'create-property.json' ) ) ),
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
		describe( 'createProperty', () => {
			it( 'creates a property and adds it to the store ', async () => {
				const accountId = fixtures.accountsPropertiesProfiles.accounts[ 0 ].id;

				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/
					)
					.mockResponse(
						JSON.stringify( fixtures.createProperty ),
						{ status: 200 }
					);

				registry.dispatch( STORE_NAME ).createProperty( accountId );

				muteConsole( 'error' );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getProperties( accountId )
					),
				);

				const properties = registry.select( STORE_NAME ).getProperties( accountId );
				expect( properties ).toMatchObject( [ fixtures.createProperty.property ] );
			} );

			it( 'sets isDoingCreateProperty ', async () => {
				const accountId = fixtures.accountsPropertiesProfiles.accounts[ 0 ].id;

				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/
					)
					.mockResponse(
						JSON.stringify( fixtures.createProperty ),
						{ status: 200 }
					);

				registry.dispatch( STORE_NAME ).fetchCreateProperty( accountId );
				expect( registry.select( STORE_NAME ).isDoingCreateProperty( accountId ) ).toEqual( true );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const accountId = fixtures.accountsPropertiesProfiles.accounts[ 0 ].id;
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/
					)
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.dispatch( STORE_NAME ).createProperty( accountId );

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
		describe( 'getProperties', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetch
					.doMockOnceIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/
					)
					.mockResponseOnce(
						JSON.stringify( fixtures.propertiesProfiles ),
						{ status: 200 }
					);

				const accountIdWithProperties = fixtures.propertiesProfiles.properties[ 5 ].accountId;

				const initialProperties = registry.select( STORE_NAME ).getProperties( accountIdWithProperties );
				expect( initialProperties ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getProperties( accountIdWithProperties ) !== undefined
					),
				);

				const properties = registry.select( STORE_NAME ).getProperties( accountIdWithProperties );

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				// Profiles should also have been received by this action.
				muteConsole( 'error' );
				const profiles = registry.select( STORE_NAME ).getProfiles( accountIdWithProperties, properties[ 0 ].id );

				expect( properties ).toEqual( fixtures.propertiesProfiles.properties );
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
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/
					)
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				const fakeAccountId = '777888999';
				muteConsole( 'error' );
				registry.select( STORE_NAME ).getProperties( fakeAccountId );
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingPropertiesProfiles[ fakeAccountId ] === false,
				);

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				const properties = registry.select( STORE_NAME ).getProperties( fakeAccountId );
				expect( properties ).toEqual( undefined );
			} );
		} );
	} );
} );
