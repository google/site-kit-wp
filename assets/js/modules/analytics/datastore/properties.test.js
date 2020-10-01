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
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	muteFetch,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics properties', () => {
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
		describe( 'createProperty', () => {
			it( 'creates a property and adds it to the store', async () => {
				const accountID = fixtures.createProperty.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				fetchMock.post(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/,
					{ body: fixtures.createProperty, status: 200 }
				);

				await registry.dispatch( STORE_NAME ).createProperty( accountID );
				// Ensure the proper parameters were passed.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/,
					{
						body: { data: { accountID } },
					}
				);

				const properties = registry.select( STORE_NAME ).getProperties( accountID );
				expect( properties ).toMatchObject( [ fixtures.createProperty ] );
			} );

			it( 'sets isDoingCreateProperty', async () => {
				const accountID = fixtures.createProperty.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				fetchMock.post(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/,
					{ body: fixtures.createProperty, status: 200 }
				);

				registry.dispatch( STORE_NAME ).createProperty( accountID );
				expect( registry.select( STORE_NAME ).isDoingCreateProperty( accountID ) ).toEqual( true );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const accountID = fixtures.createProperty.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.post(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/create-property/,
					{ body: response, status: 500 }
				);

				await registry.dispatch( STORE_NAME ).createProperty( accountID );

				expect( registry.select( STORE_NAME ).getErrorForAction( 'createProperty', [ accountID ] ) ).toMatchObject( response );

				// The response isn't important for the test here and we intentionally don't wait for it,
				// but the fixture is used to prevent an invariant error as the received properties
				// taken from `response.properties` are required to be an array.
				muteFetch( /^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/, fixtures.propertiesProfiles );
				const properties = registry.select( STORE_NAME ).getProperties( accountID );
				// No properties should have been added yet, as the property creation failed.
				expect( properties ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'selectProperty', () => {
			it( 'requires a valid propertyID', () => {
				expect( () => {
					registry.dispatch( STORE_NAME ).selectProperty();
				} ).toThrow( 'A valid propertyID selection is required.' );
			} );

			it( 'returns if the accountID is not set', () => {
				const accountID = fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const propertyID = fixtures.propertiesProfiles.properties[ 0 ].id;

				registry.dispatch( STORE_NAME ).receiveGetProperties( fixtures.propertiesProfiles.properties, { accountID } );
				registry.dispatch( STORE_NAME ).receiveGetProfiles( fixtures.propertiesProfiles.profiles, { accountID, propertyID } );

				expect( registry.select( STORE_NAME ).getPropertyID() ).toBeUndefined();
				registry.dispatch( STORE_NAME ).selectProperty( propertyID );
				expect( registry.select( STORE_NAME ).getPropertyID() ).toBeUndefined();
			} );

			it( 'selects the property and its default profile when set', async () => {
				const accountID = fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const propertyID = fixtures.propertiesProfiles.properties[ 0 ].id;

				registry.dispatch( STORE_NAME ).receiveGetProperties( fixtures.propertiesProfiles.properties, { accountID } );
				registry.dispatch( STORE_NAME ).receiveGetProfiles( fixtures.propertiesProfiles.profiles, { accountID, propertyID } );
				await registry.dispatch( STORE_NAME ).setAccountID( accountID );
				await registry.dispatch( STORE_NAME ).selectProperty( propertyID );

				expect( registry.select( STORE_NAME ).getPropertyID() ).toMatch( propertyID );
				expect( registry.select( STORE_NAME ).getInternalWebPropertyID() ).toEqual( fixtures.propertiesProfiles.properties[ 0 ].internalWebPropertyId ); // eslint-disable-line sitekit/camelcase-acronyms
				expect( registry.select( STORE_NAME ).getProfileID() ).toEqual( fixtures.propertiesProfiles.properties[ 0 ].defaultProfileId ); // eslint-disable-line sitekit/camelcase-acronyms
			} );

			it( 'does not set the profileID if property has defaultProfileId that is not in state', async () => {
				const nonExistentProfileID = '1234567890';
				const propertiesProfiles = {
					...fixtures.propertiesProfiles,
					properties: fixtures.propertiesProfiles.properties.map( ( property ) => {
						return { ...property, defaultProfileId: nonExistentProfileID }; // eslint-disable-line sitekit/camelcase-acronyms
					} ),
				};

				const accountID = propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const propertyID = propertiesProfiles.properties[ 0 ].id;

				registry.dispatch( STORE_NAME ).receiveGetProperties( fixtures.propertiesProfiles.properties, { accountID } );
				registry.dispatch( STORE_NAME ).receiveGetProfiles( fixtures.propertiesProfiles.profiles, { accountID, propertyID } );

				await registry.dispatch( STORE_NAME ).setAccountID( accountID );
				await registry.dispatch( STORE_NAME ).selectProperty( propertyID );

				expect( registry.select( STORE_NAME ).getProfiles( accountID, propertyID ).some( ( { id } ) => id === nonExistentProfileID ) ).toBe( false );
				expect( registry.select( STORE_NAME ).getProfileID() ).not.toBe( nonExistentProfileID );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getProperties', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.get(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/,
					{ body: fixtures.propertiesProfiles, status: 200 }
				);

				const accountID = fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const propertyID = fixtures.propertiesProfiles.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/camelcase-acronyms

				const initialProperties = registry.select( STORE_NAME ).getProperties( accountID );

				// Ensure the proper parameters were passed.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/,
					{
						query: { accountID },
					}
				);

				expect( initialProperties ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getProperties( accountID ) !== undefined
					),
				);

				const properties = registry.select( STORE_NAME ).getProperties( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// Profiles should also have been received by this action.
				const profiles = registry.select( STORE_NAME ).getProfiles( accountID, propertyID );

				expect( properties ).toEqual( fixtures.propertiesProfiles.properties );
				expect( properties ).toHaveLength( 17 );
				expect( profiles ).toEqual( fixtures.propertiesProfiles.profiles );
			} );

			it( 'does not make a network request if properties for this account are already present', async () => {
				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const accountID = testAccountID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry.dispatch( STORE_NAME ).receiveGetProperties( fixtures.propertiesProfiles.properties, { accountID } );

				const properties = registry.select( STORE_NAME ).getProperties( testAccountID );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getProperties', [ testAccountID ] )
				);

				// It _may_ make a request for profiles internally if not loaded,
				// so we only care that it did not fetch properties here.
				expect( fetchMock ).not.toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/,
				);
				expect( properties ).toEqual( fixtures.propertiesProfiles.properties );
				expect( properties ).toHaveLength( 17 );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/properties-profiles/,
					{ body: response, status: 500 }
				);

				const fakeAccountID = '777888999';
				registry.select( STORE_NAME ).getProperties( fakeAccountID );
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).isDoingGetProperties( fakeAccountID ) === false,
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const properties = registry.select( STORE_NAME ).getProperties( fakeAccountID );
				expect( properties ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );
		describe( 'getPropertyByID', () => {
			it( 'returns the property object by its ID when present in the store', () => {
				const { properties } = fixtures.propertiesProfiles;
				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const accountID = testAccountID;

				registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID } );

				const findProperty = properties[ 1 ];
				const foundProperty = registry.select( STORE_NAME ).getPropertyByID( findProperty.id );

				expect( foundProperty ).toEqual( findProperty );
			} );

			it( 'returns undefined when the property is not present in the store', () => {
				const { properties } = fixtures.propertiesProfiles;
				const accountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/camelcase-acronyms

				registry.dispatch( STORE_NAME ).receiveGetProperties( [], { accountID } );

				const findProperty = properties[ 1 ];
				const foundProperty = registry.select( STORE_NAME ).getPropertyByID( findProperty.id );

				expect( foundProperty ).toEqual( undefined );
			} );
		} );
	} );
} );
