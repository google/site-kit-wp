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

describe( 'modules/analytics properties', () => {
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
				const accountID = fixtures.createProperty.accountId; // Capitalization rule exception: `accountId` is a property of an API returned value.

				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/
					)
					.mockResponse(
						JSON.stringify( fixtures.createProperty ),
						{ status: 200 }
					);

				registry.dispatch( STORE_NAME ).createProperty( accountID );
				// Ensure the proper parameters were passed.
				expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ) ).toMatchObject(
					{ accountID }
				);

				muteConsole( 'error' );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getProperties( accountID )
					),
				);

				const properties = registry.select( STORE_NAME ).getProperties( accountID );
				expect( properties ).toMatchObject( [ fixtures.createProperty ] );
			} );

			it( 'sets isDoingCreateProperty ', async () => {
				const accountID = fixtures.createProperty.accountId; // Capitalization rule exception: `accountId` is a property of an API returned value.

				registry.dispatch( STORE_NAME ).fetchCreateProperty( accountID );
				expect( registry.select( STORE_NAME ).isDoingCreateProperty( accountID ) ).toEqual( true );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const accountID = fixtures.createProperty.accountId; // Capitalization rule exception: `accountId` is a property of an API returned value.
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
				registry.dispatch( STORE_NAME ).createProperty( accountID );

				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getError()
					),
				);

				expect( registry.select( STORE_NAME ).getError() ).toMatchObject( response );

				// Ignore the request fired by the `getProperties` selector.
				muteConsole( 'error' );
				const properties = registry.select( STORE_NAME ).getProperties( accountID );
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

				const accountID = fixtures.propertiesProfiles.properties[ 0 ].accountId; // Capitalization rule exception: `accountId` is a property of an API returned value.
				const propertyID = fixtures.propertiesProfiles.profiles[ 0 ].webPropertyId; // Capitalization rule exception: `webPropertyId` is a property of an API returned value.

				const initialProperties = registry.select( STORE_NAME ).getProperties( accountID );

				// Ensure the proper parameters were passed.
				expect( fetch.mock.calls[ 0 ][ 0 ] ).toMatchQueryParameters(
					{ accountID }
				);

				expect( initialProperties ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getProperties( accountID ) !== undefined
					),
				);

				const properties = registry.select( STORE_NAME ).getProperties( accountID );

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				// Profiles should also have been received by this action.
				muteConsole( 'error' );
				const profiles = registry.select( STORE_NAME ).getProfiles( accountID, propertyID );

				expect( properties ).toEqual( fixtures.propertiesProfiles.properties );
				expect( properties ).toHaveLength( 17 );
				expect( profiles ).toEqual( fixtures.propertiesProfiles.profiles );
			} );

			it( 'does not make a network request if properties for this account are already present', async () => {
				const testAccountID = fixtures.profiles[ 0 ].accountId; // Capitalization rule exception: `accountId` is a property of an API returned value.

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveProperties( fixtures.propertiesProfiles.properties );

				const properties = registry.select( STORE_NAME ).getProperties( testAccountID );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getProperties', [ testAccountID ] )
				);

				expect( fetch ).not.toHaveBeenCalled();
				expect( properties ).toEqual( fixtures.propertiesProfiles.properties );
				expect( properties ).toHaveLength( 17 );
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

				const fakeAccountID = '777888999';
				muteConsole( 'error' );
				registry.select( STORE_NAME ).getProperties( fakeAccountID );
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingPropertiesProfiles[ fakeAccountID ] === false,
				);

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				const properties = registry.select( STORE_NAME ).getProperties( fakeAccountID );
				expect( properties ).toEqual( undefined );
			} );
		} );
	} );
} );
