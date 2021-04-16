/**
 * `modules/analytics-4` data store: properties tests.
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
import { createTestRegistry, muteFetch, unsubscribeFromAll, untilResolved } from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 properties', () => {
	let registry;

	const createPropertyEndpoint = /^\/google-site-kit\/v1\/modules\/analytics-4\/data\/create-property/;
	const propertiesEndpoint = /^\/google-site-kit\/v1\/modules\/analytics-4\/data\/properties/;

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
		describe( 'createProperty', () => {
			it( 'should create a property and add it to the store', async () => {
				const accountID = fixtures.createProperty.parent;

				fetchMock.post( createPropertyEndpoint, {
					body: fixtures.createProperty,
					status: 200,
				} );

				await registry.dispatch( STORE_NAME ).createProperty( accountID );
				expect( fetchMock ).toHaveFetched( createPropertyEndpoint, {
					body: { data: { accountID } },
				} );

				const properties = registry.select( STORE_NAME ).getProperties( accountID );
				expect( properties ).toMatchObject( [ fixtures.createProperty ] );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const accountID = fixtures.createProperty.parent;
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( createPropertyEndpoint, {
					body: response,
					status: 500,
				} );

				await registry.dispatch( STORE_NAME ).createProperty( accountID );

				const error = registry.select( STORE_NAME ).getErrorForAction( 'createProperty', [ accountID ] );
				expect( error ).toMatchObject( response );

				// The response isn't important for the test here and we intentionally don't wait for it,
				// but the fixture is used to prevent an invariant error as the received properties
				// taken from `response.properties` are required to be an array.
				muteFetch( propertiesEndpoint, fixtures.properties );

				const properties = registry.select( STORE_NAME ).getProperties( accountID );
				// No properties should have been added yet, as the property creation failed.
				expect( properties ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getProperties', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( propertiesEndpoint, {
					body: fixtures.properties,
					status: 200,
				} );

				const accountID = '12345';
				const initialProperties = registry.select( STORE_NAME ).getProperties( accountID );
				expect( initialProperties ).toBeUndefined();

				await untilResolved( registry, STORE_NAME ).getProperties( accountID );
				expect( fetchMock ).toHaveFetched( propertiesEndpoint, { query: { accountID } } );

				const properties = registry.select( STORE_NAME ).getProperties( accountID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( properties ).toEqual( fixtures.properties );
				expect( properties ).toHaveLength( fixtures.properties.length );
			} );

			it( 'should not make a network request if properties for this account are already present', async () => {
				const testAccountID = '12345';
				const accountID = testAccountID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveGetProperties( fixtures.properties, { accountID } );

				const properties = registry.select( STORE_NAME ).getProperties( testAccountID );
				await untilResolved( registry, STORE_NAME ).getProperties( testAccountID );

				expect( fetchMock ).not.toHaveFetched( propertiesEndpoint );
				expect( properties ).toEqual( fixtures.properties );
				expect( properties ).toHaveLength( fixtures.properties.length );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( propertiesEndpoint, {
					body: response,
					status: 500,
				} );

				const fakeAccountID = '777888999';
				registry.select( STORE_NAME ).getProperties( fakeAccountID );
				await untilResolved( registry, STORE_NAME ).getProperties( fakeAccountID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const properties = registry.select( STORE_NAME ).getProperties( fakeAccountID );
				expect( properties ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
