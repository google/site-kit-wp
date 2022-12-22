/**
 * `modules/analytics` data store: properties tests.
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
	freezeFetch,
	subscribeUntil,
	unsubscribeFromAll,
	provideSiteInfo,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';

describe( 'modules/analytics properties', () => {
	let registry;

	const propertiesProfilesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics/data/properties-profiles'
	);
	const ga4PropertiesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/properties'
	);

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
		describe( 'createProperty', () => {
			it( 'creates a property and adds it to the store', async () => {
				const accountID = fixtures.createProperty.accountId; // eslint-disable-line sitekit/acronym-case
				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					),
					{ body: fixtures.createProperty, status: 200 }
				);

				await registry
					.dispatch( MODULES_ANALYTICS )
					.createProperty( accountID );
				// Ensure the proper parameters were passed.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					),
					{
						body: { data: { accountID } },
					}
				);

				const properties = registry
					.select( MODULES_ANALYTICS )
					.getProperties( accountID );
				expect( properties ).toMatchObject( [
					fixtures.createProperty,
				] );
			} );

			it( 'sets isDoingCreateProperty', () => {
				const accountID = fixtures.createProperty.accountId; // eslint-disable-line sitekit/acronym-case
				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					),
					{ body: fixtures.createProperty, status: 200 }
				);

				registry
					.dispatch( MODULES_ANALYTICS )
					.createProperty( accountID );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.isDoingCreateProperty( accountID )
				).toEqual( true );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const accountID = fixtures.createProperty.accountId; // eslint-disable-line sitekit/acronym-case
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.post(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/create-property'
					),
					{ body: response, status: 500 }
				);

				await registry
					.dispatch( MODULES_ANALYTICS )
					.createProperty( accountID );

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getErrorForAction( 'createProperty', [ accountID ] )
				).toMatchObject( response );

				// The response isn't important for the test here and we intentionally don't wait for it,
				// but the fixture is used to prevent an invariant error as the received properties
				// taken from `response.properties` are required to be an array.
				muteFetch(
					propertiesProfilesEndpoint,
					fixtures.propertiesProfiles
				);
				const properties = registry
					.select( MODULES_ANALYTICS )
					.getProperties( accountID );
				// No properties should have been added yet, as the property creation failed.
				expect( properties ).toEqual( undefined );

				await untilResolved(
					registry,
					MODULES_ANALYTICS
				).getProperties( accountID );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'selectProperty', () => {
			it( 'requires a valid propertyID', () => {
				expect( () => {
					registry.dispatch( MODULES_ANALYTICS ).selectProperty();
				} ).toThrow( 'A valid propertyID selection is required.' );
			} );

			it( 'returns if the accountID is not set', () => {
				const accountID =
					fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID =
					fixtures.propertiesProfiles.properties[ 0 ].id;

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties(
						fixtures.propertiesProfiles.properties,
						{ accountID }
					);
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles( fixtures.propertiesProfiles.profiles, {
						accountID,
						propertyID,
					} );

				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBeUndefined();
				registry
					.dispatch( MODULES_ANALYTICS )
					.selectProperty( propertyID );
				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toBeUndefined();
			} );

			it( 'preserves the current profile ID when selecting the current property', async () => {
				const accountID =
					fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID =
					fixtures.propertiesProfiles.properties[ 0 ].id;
				const internalWebPropertyID =
					fixtures.propertiesProfiles.properties[ 0 ]
						.internalWebPropertyId; // eslint-disable-line sitekit/acronym-case
				// Note: we're using the second profile in the list to differentiate between the default of selecting the first.
				const profileID = fixtures.propertiesProfiles.profiles[ 1 ].id;
				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
					accountID,
					propertyID,
					internalWebPropertyID,
					profileID,
				} );
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties(
						fixtures.propertiesProfiles.properties,
						{ accountID }
					);
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles( fixtures.propertiesProfiles.profiles, {
						accountID,
						propertyID,
					} );

				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toEqual( profileID );

				await registry
					.dispatch( MODULES_ANALYTICS )
					.selectProperty( propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toMatch( propertyID );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getInternalWebPropertyID()
				).toEqual( internalWebPropertyID );
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toEqual( profileID );
			} );

			it( 'selects the property and its default profile when set', async () => {
				const accountID =
					fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID =
					fixtures.propertiesProfiles.properties[ 0 ].id;

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties(
						fixtures.propertiesProfiles.properties,
						{ accountID }
					);
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles( fixtures.propertiesProfiles.profiles, {
						accountID,
						propertyID,
					} );
				await registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( accountID );
				await registry
					.dispatch( MODULES_ANALYTICS )
					.selectProperty( propertyID );

				expect(
					registry.select( MODULES_ANALYTICS ).getPropertyID()
				).toMatch( propertyID );
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getInternalWebPropertyID()
				).toEqual(
					/* eslint-disable sitekit/acronym-case */
					fixtures.propertiesProfiles.properties[ 0 ]
						.internalWebPropertyId
					/* eslint-enable sitekit/acronym-case */
				);
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).toEqual(
					// eslint-disable-next-line sitekit/acronym-case
					fixtures.propertiesProfiles.properties[ 0 ].defaultProfileId
				);
			} );

			it( 'does not set the profileID if property has defaultProfileId that is not in state', async () => {
				const nonExistentProfileID = '1234567890';
				const propertiesProfiles = {
					...fixtures.propertiesProfiles,
					properties: fixtures.propertiesProfiles.properties.map(
						( property ) => {
							return {
								...property,
								// eslint-disable-next-line sitekit/acronym-case
								defaultProfileId: nonExistentProfileID,
							};
						}
					),
				};

				const accountID = propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID = propertiesProfiles.properties[ 0 ].id;

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties(
						fixtures.propertiesProfiles.properties,
						{ accountID }
					);
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProfiles( fixtures.propertiesProfiles.profiles, {
						accountID,
						propertyID,
					} );

				await registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( accountID );
				await registry
					.dispatch( MODULES_ANALYTICS )
					.selectProperty( propertyID );

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getProfiles( accountID, propertyID )
						.some( ( { id } ) => id === nonExistentProfileID )
				).toBe( false );
				expect(
					registry.select( MODULES_ANALYTICS ).getProfileID()
				).not.toBe( nonExistentProfileID );
			} );
		} );

		describe( 'setPrimaryPropertyType', () => {
			it.each( [ [ 'ua' ], [ 'ga4' ] ] )(
				'should not throw when %s is passed',
				( type ) => {
					expect( () => {
						registry
							.dispatch( MODULES_ANALYTICS )
							.setPrimaryPropertyType( type );
					} ).not.toThrow();
				}
			);

			it( 'should throw an error when invalid type is passed', () => {
				expect( () => {
					registry
						.dispatch( MODULES_ANALYTICS )
						.setPrimaryPropertyType( 'foo-bar' );
				} ).toThrow( 'type must be "ua" or "ga4"' );
			} );

			it.each( [ [ 'ua' ], [ 'ga4' ] ] )(
				'should set and read when %s is passed',
				( type ) => {
					registry
						.dispatch( MODULES_ANALYTICS )
						.setPrimaryPropertyType( type );

					expect(
						registry.stores[ MODULES_ANALYTICS ].store.getState()
							.primaryPropertyType
					).toBe( type );
				}
			);
		} );

		describe( 'findMatchedProperty', () => {
			const accountID = '123';

			beforeEach( () => {
				provideSiteInfo( registry );
			} );

			it( 'should return the correct property matching the current reference site URL', async () => {
				registry.dispatch( MODULES_ANALYTICS ).receiveGetProperties(
					[
						{
							id: 'UA-151753095-1',
							websiteUrl: 'http://example.net', // eslint-disable-line sitekit/acronym-case
						},
						{
							id: 'UA-151753095-2',
							websiteUrl: 'http://example.com', // eslint-disable-line sitekit/acronym-case
						},
					],
					{
						accountID,
					}
				);

				const property = await registry
					.dispatch( MODULES_ANALYTICS )
					.findMatchedProperty( accountID );
				expect( property ).toMatchObject( { id: 'UA-151753095-2' } );
			} );

			it( 'should return NULL if there is no matching property', async () => {
				registry.dispatch( MODULES_ANALYTICS ).receiveGetProperties(
					[
						{
							id: 'UA-151753095-1',
							websiteUrl: 'http://example.net', // eslint-disable-line sitekit/acronym-case
						},
					],
					{
						accountID,
					}
				);

				const property = await registry
					.dispatch( MODULES_ANALYTICS )
					.findMatchedProperty( accountID );
				expect( property ).toBeNull();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getProperties', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.get( propertiesProfilesEndpoint, {
					body: fixtures.propertiesProfiles,
				} );

				const accountID =
					fixtures.propertiesProfiles.properties[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const propertyID =
					fixtures.propertiesProfiles.profiles[ 0 ].webPropertyId; // eslint-disable-line sitekit/acronym-case

				const initialProperties = registry
					.select( MODULES_ANALYTICS )
					.getProperties( accountID );

				expect( initialProperties ).toEqual( undefined );

				await untilResolved(
					registry,
					MODULES_ANALYTICS
				).getProperties( accountID );

				// Ensure the proper parameters were passed.
				expect( fetchMock ).toHaveFetched( propertiesProfilesEndpoint, {
					query: { accountID },
				} );

				const properties = registry
					.select( MODULES_ANALYTICS )
					.getProperties( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				// Profiles should also have been received by this action.
				const profiles = registry
					.select( MODULES_ANALYTICS )
					.getProfiles( accountID, propertyID );

				expect( properties ).toEqual(
					fixtures.propertiesProfiles.properties
				);
				expect( properties ).toHaveLength( 17 );
				expect( profiles ).toEqual(
					fixtures.propertiesProfiles.profiles
				);
			} );

			it( 'does not make a network request if properties for this account are already present', async () => {
				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const accountID = testAccountID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties(
						fixtures.propertiesProfiles.properties,
						{ accountID }
					);

				const properties = registry
					.select( MODULES_ANALYTICS )
					.getProperties( testAccountID );

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS )
						.hasFinishedResolution( 'getProperties', [
							testAccountID,
						] )
				);

				// It _may_ make a request for profiles internally if not loaded,
				// so we only care that it did not fetch properties here.
				expect( fetchMock ).not.toHaveFetched(
					propertiesProfilesEndpoint
				);
				expect( properties ).toEqual(
					fixtures.propertiesProfiles.properties
				);
				expect( properties ).toHaveLength( 17 );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce( propertiesProfilesEndpoint, {
					body: response,
					status: 500,
				} );

				const fakeAccountID = '777888999';
				registry
					.select( MODULES_ANALYTICS )
					.getProperties( fakeAccountID );
				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ANALYTICS )
							.isDoingGetProperties( fakeAccountID ) === false
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const properties = registry
					.select( MODULES_ANALYTICS )
					.getProperties( fakeAccountID );
				expect( properties ).toEqual( undefined );

				await untilResolved(
					registry,
					MODULES_ANALYTICS
				).getProperties( fakeAccountID );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getPropertiesIncludingGA4', () => {
			it( 'returns undefined if UA properties are loading', async () => {
				const accountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case

				freezeFetch( propertiesProfilesEndpoint );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties(
					[
						{
							_id: '151753095-3',
							_accountID: '151753095',
							displayName: 'www.elasticpress.io',
						},
						{
							_id: '151753095-4',
							_accountID: '151753095',
							displayName: 'troubled-tipped.example.com',
						},
					],
					{ accountID }
				);

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getPropertiesIncludingGA4( accountID )
				).toBeUndefined();

				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ANALYTICS )
							.isDoingGetProperties() === false
				);
			} );

			it( 'returns undefined if GA4 properties are loading', async () => {
				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const accountID = testAccountID;

				registry.dispatch( MODULES_ANALYTICS ).receiveGetProperties(
					[
						{
							// eslint-disable-next-line sitekit/acronym-case
							accountId: '151753095',
							id: 'UA-151753095-1',
							name: 'rwh',
						},
						{
							// eslint-disable-next-line sitekit/acronym-case
							accountId: '151753095',
							id: 'UA-151753095-1',
							name: 'troubled-tipped.example.com',
						},
					],
					{ accountID }
				);

				freezeFetch( ga4PropertiesEndpoint );

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getPropertiesIncludingGA4( testAccountID )
				).toBeUndefined();

				// Wait for resolvers to run.
				await waitForDefaultTimeouts();
			} );

			it( 'returns undefined if both UA and GA4 properties are loading', async () => {
				freezeFetch( propertiesProfilesEndpoint );
				freezeFetch( ga4PropertiesEndpoint );

				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getPropertiesIncludingGA4( testAccountID )
				).toBeUndefined();

				await subscribeUntil(
					registry,
					() =>
						registry
							.select( MODULES_ANALYTICS )
							.isDoingGetProperties() === false
				);
			} );

			it( 'returns a sorted list of ua and ga4 properties ', () => {
				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const accountID = testAccountID;

				registry.dispatch( MODULES_ANALYTICS ).receiveGetProperties(
					[
						{
							// eslint-disable-next-line sitekit/acronym-case
							accountId: '151753095',
							id: 'UA-151753095-1',
							name: 'rwh',
						},
						{
							// eslint-disable-next-line sitekit/acronym-case
							accountId: '151753095',
							id: 'UA-151753095-1',
							name: 'troubled-tipped.example.com',
						},
					],
					{ accountID }
				);

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties(
					[
						{
							_id: '151753095-3',
							_accountID: '151753095',
							displayName: 'www.elasticpress.io',
						},
						{
							_id: '151753095-4',
							_accountID: '151753095',
							displayName: 'troubled-tipped.example.com',
						},
					],
					{ accountID }
				);

				const properties = registry
					.select( MODULES_ANALYTICS )
					.getPropertiesIncludingGA4( testAccountID );

				expect( properties ).toHaveLength( 4 );

				expect( properties[ 0 ].id ).toBe( 'UA-151753095-1' );
				expect( properties[ 1 ]._id ).toBe( '151753095-4' );
				expect( properties[ 2 ].id ).toBe( 'UA-151753095-1' );
				expect( properties[ 3 ]._id ).toBe( '151753095-3' );

				expect( properties[ 0 ].name ).toBe( 'rwh' );
				expect( properties[ 1 ].displayName ).toBe(
					'troubled-tipped.example.com'
				);
				expect( properties[ 2 ].name ).toBe(
					'troubled-tipped.example.com'
				);
				expect( properties[ 3 ].displayName ).toBe(
					'www.elasticpress.io'
				);
			} );
		} );

		describe( 'getPropertyByID', () => {
			it( 'returns the property object by its ID when present in the store', () => {
				const { properties } = fixtures.propertiesProfiles;
				const testAccountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case
				const accountID = testAccountID;

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties( properties, { accountID } );

				const findProperty = properties[ 1 ];
				const foundProperty = registry
					.select( MODULES_ANALYTICS )
					.getPropertyByID( findProperty.id );

				expect( foundProperty ).toEqual( findProperty );
			} );

			it( 'returns undefined when the property is not present in the store', () => {
				const { properties } = fixtures.propertiesProfiles;
				const accountID = fixtures.profiles[ 0 ].accountId; // eslint-disable-line sitekit/acronym-case

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties( [], { accountID } );

				const findProperty = properties[ 1 ];
				const foundProperty = registry
					.select( MODULES_ANALYTICS )
					.getPropertyByID( findProperty.id );

				expect( foundProperty ).toEqual( undefined );
			} );
		} );
		describe( 'getPrimaryPropertyType', () => {
			it( 'should correctly return the default value', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getPrimaryPropertyType()
				).toBe( 'ua' );
			} );

			it( 'should return the new state when it has been changed', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setPrimaryPropertyType( 'ga4' );

				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getPrimaryPropertyType()
				).toBe( 'ga4' );
			} );
		} );
	} );
} );
