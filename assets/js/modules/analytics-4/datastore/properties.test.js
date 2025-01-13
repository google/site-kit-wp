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
 * External dependencies
 */
import { cloneDeep } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	untilResolved,
} from '../../../../../tests/js/utils';
import { READ_SCOPE as TAGMANAGER_READ_SCOPE } from '../../tagmanager/datastore/constants';
import {
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from './constants';
import * as fixtures from './__fixtures__';
import { getItem, setItem } from '../../../googlesitekit/api/cache';

describe( 'modules/analytics-4 properties', () => {
	let registry;
	let store;

	const createPropertyEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-property'
	);
	const propertiesEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/properties'
	);
	const propertyEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/property'
	);
	const googleTagSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/google-tag-settings'
	);
	const ga4SettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);
	const containerLookupEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/container-lookup'
	);
	const containerDestinationsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/container-destinations'
	);
	const setGoogleTagIDMismatchEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/set-google-tag-id-mismatch'
	);

	const containerDestinationsMock =
		fixtures.containerDestinations[ 6065484567 ][ 98369876 ];

	const googleTagContainerDestinationIDs = containerDestinationsMock.map(
		// eslint-disable-next-line sitekit/acronym-case
		( { destinationId } ) => destinationId
	);

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
		describe( 'createProperty', () => {
			it( 'should create a property and add it to the store', async () => {
				const accountID = fixtures.createProperty.parent;

				fetchMock.post( createPropertyEndpoint, {
					body: fixtures.createProperty,
					status: 200,
				} );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/account-summaries'
					),
					{
						body: {
							accountSummaries: [],
							nextPageToken: null,
						},
						status: 200,
					}
				);

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.createProperty( accountID );
				expect( fetchMock ).toHaveFetched( createPropertyEndpoint, {
					body: { data: { accountID } },
				} );

				const properties = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperties( accountID );
				expect( properties ).toMatchObject( [
					fixtures.createProperty,
				] );
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

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.createProperty( accountID );

				const error = registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForAction( 'createProperty', [ accountID ] );
				expect( error ).toMatchObject( response );

				// The response isn't important for the test here and we intentionally don't wait for it,
				// but the fixture is used to prevent an invariant error as the received properties
				// taken from `response.properties` are required to be an array.
				muteFetch( propertiesEndpoint, fixtures.properties );

				const properties = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperties( accountID );
				// No properties should have been added yet, as the property creation failed.
				expect( properties ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'selectProperty', () => {
			it( 'should throw if property ID is invalid', () => {
				const callback = () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.selectProperty( '' );
				expect( callback ).toThrow(
					'A valid propertyID selection is required.'
				);
			} );

			it( 'should set module settings correctly when PROPERTY_CREATE is passed', async () => {
				const settings = {
					propertyID: '12345',
					webDataStreamID: '1000',
					measurementID: 'abcd',
					propertyCreateTime: 1662715085968,
				};

				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( settings );
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectProperty( PROPERTY_CREATE );

				expect( store.getState().settings ).toMatchObject( {
					propertyID: PROPERTY_CREATE,
					webDataStreamID: WEBDATASTREAM_CREATE,
					measurementID: '',
					propertyCreateTime: 0,
				} );
			} );

			it( 'should set property ID, property create time and the first web data stream when a matching web data stream is not found', async () => {
				const propertyID = '09876';
				const settings = {
					propertyID: '12345',
					webDataStreamID: '1000',
					measurementID: 'abcd',
					propertyCreateTime: new Date(
						'2022-09-09T09:18:05.968Z'
					).getTime(),
				};

				fetchMock.get( propertyEndpoint, {
					body: fixtures.properties[ 0 ],
					status: 200,
				} );

				provideSiteInfo( registry, {
					referenceSiteURL: 'https://www.example.io',
				} );
				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( settings );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( fixtures.webDataStreams, {
						propertyID,
					} );
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectProperty( propertyID );

				const [ webDataStream ] = fixtures.webDataStreams;

				expect( store.getState().settings ).toMatchObject( {
					propertyID,
					webDataStreamID: webDataStream._id,
					// eslint-disable-next-line sitekit/acronym-case
					measurementID: webDataStream.webStreamData.measurementId,
					propertyCreateTime: new Date(
						fixtures.properties[ 0 ].createTime
					).getTime(),
				} );

				expect( fetchMock ).toHaveBeenCalledTimes( 1 );
				expect( fetchMock ).toHaveFetched( propertyEndpoint, {
					query: { propertyID },
				} );
			} );

			it( 'should set property ID and property create time and reset datastream and measurement IDs when no web data streams are available', async () => {
				const propertyID = '09876';
				const settings = {
					propertyID: '12345',
					webDataStreamID: '1000',
					measurementID: 'abcd',
					propertyCreateTime: new Date(
						'2022-09-09T09:18:05.968Z'
					).getTime(),
				};

				fetchMock.get( propertyEndpoint, {
					body: fixtures.properties[ 0 ],
					status: 200,
				} );

				provideSiteInfo( registry, {
					referenceSiteURL: 'https://www.example.io',
				} );
				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( settings );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( [], {
						// No web data streams are available for this property.
						propertyID,
					} );
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectProperty( propertyID );

				expect( store.getState().settings ).toMatchObject( {
					propertyID,
					webDataStreamID: WEBDATASTREAM_CREATE,
					measurementID: '',
					propertyCreateTime: new Date(
						fixtures.properties[ 0 ].createTime
					).getTime(),
				} );
			} );

			it( 'should set property, property create time, datastream, and measurement IDs when web data stream is found', async () => {
				const propertyID = '09876';
				const settings = {
					propertyID: '12345',
					webDataStreamID: '1000',
					measurementID: 'abcd',
					propertyCreateTime: new Date(
						'2022-09-09T09:18:05.968Z'
					).getTime(),
				};

				fetchMock.get( propertyEndpoint, {
					body: fixtures.properties[ 0 ],
					status: 200,
				} );

				provideSiteInfo( registry, {
					referenceSiteURL: 'https://www.example.org',
				} );
				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( settings );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( fixtures.webDataStreams, {
						propertyID,
					} );
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectProperty( propertyID );

				const webDataStream = fixtures.webDataStreams[ 1 ];
				expect( store.getState().settings ).toMatchObject( {
					propertyID,
					webDataStreamID: webDataStream._id,
					// eslint-disable-next-line sitekit/acronym-case
					measurementID: webDataStream.webStreamData.measurementId,
					propertyCreateTime: new Date(
						fixtures.properties[ 0 ].createTime
					).getTime(),
				} );
			} );

			it( 'supports asynchronous webdatastream resolution', async () => {
				const propertyID = '09876';
				const settings = {
					propertyID: '12345',
					webDataStreamID: '1000',
					measurementID: 'abcd',
					propertyCreateTime: new Date(
						'2022-09-09T09:18:05.968Z'
					).getTime(),
				};
				let resolveResponse;
				const responsePromise = new Promise( ( resolve ) => {
					resolveResponse = () => resolve( fixtures.webDataStreams );
				} );
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams'
					),
					responsePromise
				);
				fetchMock.get( propertyEndpoint, {
					body: fixtures.properties[ 0 ],
					status: 200,
				} );

				provideSiteInfo( registry, {
					referenceSiteURL: 'https://www.example.org',
				} );
				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( settings );

				const promise = registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectProperty( propertyID );

				expect( store.getState().settings ).toMatchObject( {
					propertyID,
					webDataStreamID: '',
					measurementID: '',
					propertyCreateTime: 0,
				} );

				resolveResponse();
				await promise;

				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams'
					)
				);

				const webDataStream = fixtures.webDataStreams[ 1 ];
				expect( store.getState().settings ).toMatchObject( {
					propertyID,
					webDataStreamID: webDataStream._id,
					// eslint-disable-next-line sitekit/acronym-case
					measurementID: webDataStream.webStreamData.measurementId,
					propertyCreateTime: new Date(
						fixtures.properties[ 0 ].createTime
					).getTime(),
				} );
			} );
		} );

		describe( 'matchAccountProperty', () => {
			const accountID =
				fixtures.accountSummaries.accountSummaries[ 1 ]._id;
			const propertyID =
				fixtures.accountSummaries.accountSummaries[ 1 ]
					.propertySummaries[ 0 ]._id;

			beforeEach( () => {
				provideSiteInfo( registry );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties(
						fixtures.accountSummaries.accountSummaries[ 1 ]
							.propertySummaries,
						{ accountID }
					);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( fixtures.accountSummaries );
			} );

			it( 'should return NULL if no property matches the current site', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						{
							1001: [],
							1002: [],
							[ propertyID ]: [],
						},
						{
							propertyIDs: [ propertyID ],
						}
					);

				const property = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchAccountProperty( accountID );
				expect( property ).toBeNull();
			} );

			it( 'should return a property object if a property matches the current site', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{
							propertyIDs: [ propertyID ],
						}
					);

				const property = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchAccountProperty( accountID );
				expect( property ).toMatchObject( { _id: propertyID } );
			} );
		} );

		describe( 'matchAndSelectProperty', () => {
			const accountID =
				fixtures.accountSummaries.accountSummaries[ 1 ]._id;
			const propertyID =
				fixtures.accountSummaries.accountSummaries[ 1 ]
					.propertySummaries[ 0 ]._id;
			const webDataStreamID = '4000';
			const measurementID = fixtures.webDataStreams.find(
				( stream ) => stream._propertyID === propertyID
				// eslint-disable-next-line sitekit/acronym-case
			).webStreamData.measurementId;

			beforeEach( () => {
				provideSiteInfo( registry );
				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties(
						fixtures.accountSummaries.accountSummaries[ 1 ]
							.propertySummaries,
						{ accountID }
					);
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( fixtures.accountSummaries );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{
							propertyIDs: [ propertyID ],
						}
					);
			} );

			it( 'should select the fallback property if the matching property is not found', async () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.net',
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchAndSelectProperty( accountID, PROPERTY_CREATE );

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getSettings()
				).toMatchObject( {
					propertyID: PROPERTY_CREATE,
					webDataStreamID: WEBDATASTREAM_CREATE,
					measurementID: '',
				} );
			} );

			it( 'should select the correct property ID if we can find a matching property', async () => {
				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchAndSelectProperty( accountID );

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getSettings()
				).toMatchObject( {
					propertyID,
					webDataStreamID,
					measurementID,
				} );
			} );

			it( 'should update the isMatchingAccountProperty property', async () => {
				const promise = registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchAndSelectProperty( accountID );

				expect( store.getState().isMatchingAccountProperty ).toBe(
					true
				);
				await promise;
				expect( store.getState().isMatchingAccountProperty ).toBe(
					false
				);
			} );
		} );

		describe( 'matchPropertyByURL', () => {
			const property = fixtures.properties[ 0 ];
			const propertyID = property._id;
			const propertyIDs = [ propertyID ];

			beforeEach( () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperty( property, { propertyID } );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{ propertyIDs }
					);
			} );

			it( 'should return a property object when a property is found', async () => {
				const url = 'https://www.example.org/';
				const matchedProperty = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchPropertyByURL( propertyIDs, url );
				expect( matchedProperty ).toEqual( property );
			} );

			it( 'should return NULL when a property is not found', async () => {
				const url = 'https://www.example.io/';
				const matchedProperty = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchPropertyByURL( propertyIDs, url );
				expect( matchedProperty ).toBeNull();
			} );
		} );

		describe( 'matchPropertyByMeasurementID', () => {
			const property = fixtures.properties[ 0 ];
			const propertyID = property._id;
			const propertyIDs = [ propertyID ];

			beforeEach( () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperty( property, { propertyID } );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{ propertyIDs }
					);
			} );

			it( 'should return a property object when a property is found', async () => {
				const measurementID = 'G-1A2BCD346E';
				const matchedProperty = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchPropertyByMeasurementID( propertyIDs, measurementID );
				expect( matchedProperty ).toEqual( property );
			} );

			it( 'should return NULL when a property is not found', async () => {
				const measurementID = '0000000000';
				const matchedProperty = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchPropertyByMeasurementID( propertyIDs, measurementID );
				expect( matchedProperty ).toBeNull();
			} );
		} );

		describe( 'updateSettingsForMeasurementID', () => {
			it( 'should update the settings with the measurement ID.', async () => {
				const measurementID = 'G-1A2BCD346E';

				provideUserAuthentication( registry );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.updateSettingsForMeasurementID( measurementID );

				expect( store.getState().settings ).toMatchObject( {
					measurementID,
				} );
			} );

			it( 'dispatches a request to get and populate Google Tag settings', async () => {
				provideUserAuthentication( registry, {
					grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				} );

				fetchMock.getOnce( googleTagSettingsEndpoint, {
					body: fixtures.googleTagSettings,
					status: 200,
				} );

				const measurementID = 'G-1A2BCD346E';

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.updateSettingsForMeasurementID( measurementID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( fetchMock ).toHaveFetched( googleTagSettingsEndpoint, {
					query: {
						measurementID,
					},
					body: fixtures.googleTagSettings,
				} );

				expect( store.getState().settings ).toMatchObject(
					fixtures.googleTagSettings
				);
			} );

			it( 'requires the GTM readonly scope to dispatch a request for Google Tag settings', async () => {
				provideUserAuthentication( registry );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.updateSettingsForMeasurementID( 'G-1A2BCD346E' );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'empties the Google Tag Settings if measurement ID is an empty string', async () => {
				provideUserAuthentication( registry, {
					grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setGoogleTagAccountID( '123456' );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setGoogleTagContainerID( '321654' );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setGoogleTagID( 'GT-123456' );

				expect( store.getState().settings ).toMatchObject( {
					googleTagAccountID: '123456',
					googleTagContainerID: '321654',
					googleTagID: 'GT-123456',
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.updateSettingsForMeasurementID( '' );

				expect( store.getState().settings ).toMatchObject( {
					googleTagAccountID: '',
					googleTagContainerID: '',
					googleTagID: '',
				} );
			} );
		} );

		describe( 'setHasMismatchedGoogleTagID', () => {
			it( 'sets the value of hasMismatchedGoogleTagID', async () => {
				fetchMock.post( setGoogleTagIDMismatchEndpoint, {
					body: true,
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveHasMismatchGoogleTagID( false );

				const hasMismatchedGoogleTagID = registry
					.select( MODULES_ANALYTICS_4 )
					.hasMismatchedGoogleTagID();

				expect( hasMismatchedGoogleTagID ).toBe( false );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setHasMismatchedGoogleTagID( true );

				const updatedHasMismatchedGoogleTagID = registry
					.select( MODULES_ANALYTICS_4 )
					.hasMismatchedGoogleTagID();

				expect( updatedHasMismatchedGoogleTagID ).toBe( true );
			} );
		} );

		describe( 'setIsWebDataStreamAvailable', () => {
			it( 'sets the value of isWebDataStreamAvailable', async () => {
				const isWebDataStreamAvailable = registry
					.select( MODULES_ANALYTICS_4 )
					.isWebDataStreamAvailable();

				// It is true by default.
				expect( isWebDataStreamAvailable ).toBe( true );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setIsWebDataStreamAvailable( false );

				const updatedIsWebDataStreamAvailable = registry
					.select( MODULES_ANALYTICS_4 )
					.isWebDataStreamAvailable();

				expect( updatedIsWebDataStreamAvailable ).toBe( false );
			} );
		} );

		describe( 'syncGoogleTagSettings', () => {
			it( 'should not execute if the Tag Manager readonly scope is not granted', async () => {
				provideUserAuthentication( registry );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					measurementID: 'G-1A2BCD346E',
					googleTagID: '',
					googleTagLastSyncedAtMs: 0,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncGoogleTagSettings();

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getGoogleTagID()
				).toEqual( '' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getGoogleTagLastSyncedAtMs()
				).toEqual( 0 );
			} );

			it( 'should not execute if GA4 is not connected', async () => {
				provideUserAuthentication( registry, {
					grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				} );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: false,
					},
				] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					measurementID: 'G-1A2BCD346E',
					googleTagID: '',
					googleTagLastSyncedAtMs: 0,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncGoogleTagSettings();

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getGoogleTagID()
				).toEqual( '' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getGoogleTagLastSyncedAtMs()
				).toEqual( 0 );
			} );

			it( 'should not execute if measurement ID is not set', async () => {
				provideUserAuthentication( registry, {
					grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				} );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					googleTagID: '',
					googleTagLastSyncedAtMs: 0,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncGoogleTagSettings();

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getGoogleTagID()
				).toEqual( '' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getGoogleTagLastSyncedAtMs()
				).toEqual( 0 );
			} );

			it( 'should not execute if settings were synced less than an hour ago', async () => {
				provideUserAuthentication( registry, {
					grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				} );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					measurementID: 'G-1A2BCD346E',
					googleTagID: '',
					googleTagLastSyncedAtMs: Date.now() - 1800000, // 30 minutes ago.
				} );

				const googleTagLastSyncedAtMs = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagLastSyncedAtMs();

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncGoogleTagSettings();

				expect(
					registry.select( MODULES_ANALYTICS_4 ).getGoogleTagID()
				).toEqual( '' );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getGoogleTagLastSyncedAtMs()
				).toEqual( googleTagLastSyncedAtMs );
			} );

			it( 'dispatches a request to get and populate Google Tag settings', async () => {
				provideUserAuthentication( registry, {
					grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				} );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				const measurementID = 'G-1A2BCD346E';

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					measurementID,
					googleTagID: '',
					googleTagLastSyncedAtMs: 0,
				} );

				fetchMock.getOnce( googleTagSettingsEndpoint, {
					body: cloneDeep( fixtures.googleTagSettings ),
					status: 200,
				} );

				fetchMock.getOnce( containerDestinationsEndpoint, {
					body: containerDestinationsMock,
					status: 200,
				} );

				const {
					googleTagAccountID,
					googleTagContainerID,
					googleTagID,
				} = fixtures.googleTagSettings;

				const ga4Settings = {
					measurementID,
					googleTagAccountID,
					googleTagContainerID,
					googleTagID,
				};

				fetchMock.postOnce( ga4SettingsEndpoint, {
					body: {
						...ga4Settings,
						googleTagLastSyncedAtMs: Date.now(),
					},
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncGoogleTagSettings();

				const googleTagLastSyncedAtMs = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagLastSyncedAtMs();

				expect( fetchMock ).toHaveFetchedTimes( 3 );
				expect( fetchMock ).toHaveFetched( googleTagSettingsEndpoint, {
					query: {
						measurementID,
					},
					body: fixtures.googleTagSettings,
				} );
				expect( fetchMock ).toHaveFetched( ga4SettingsEndpoint, {
					body: {
						data: {
							...ga4Settings,
							googleTagContainerDestinationIDs,
							googleTagLastSyncedAtMs,
						},
					},
					method: 'POST',
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getGoogleTagAccountID()
				).toEqual( googleTagAccountID );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getGoogleTagContainerID()
				).toEqual( googleTagContainerID );
				expect(
					registry.select( MODULES_ANALYTICS_4 ).getGoogleTagID()
				).toEqual( googleTagID );
			} );

			it( 'should set `isWebDataStreamAvailable` to `false` when there is no Google Tag Container available', async () => {
				global._googlesitekitModulesData = {
					'analytics-4': {
						tagIDMismatch: false,
					},
				};

				provideUserAuthentication( registry, {
					grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				} );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				const measurementID = 'G-2B7M8YQ1K6';
				const googleTagID = 'GT-NBQN9V3';
				const containerMock = JSON.stringify( null );

				const { googleTagAccountID, googleTagContainerID } =
					fixtures.googleTagSettings;

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					measurementID,
					googleTagID,
					googleTagAccountID,
					googleTagContainerID,
					googleTagLastSyncedAtMs: 1670123456789,
				} );

				fetchMock.getOnce( containerLookupEndpoint, {
					body: containerMock,
					status: 200,
				} );

				fetchMock.getOnce( containerDestinationsEndpoint, {
					body: containerDestinationsMock,
					status: 200,
				} );

				const ga4Settings = {
					measurementID,
					googleTagAccountID,
					googleTagContainerID,
					googleTagID,
				};

				fetchMock.postOnce( ga4SettingsEndpoint, {
					body: {
						...ga4Settings,
						googleTagLastSyncedAtMs: Date.now(),
					},
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncGoogleTagSettings();

				const googleTagLastSyncedAtMs = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagLastSyncedAtMs();

				expect( fetchMock ).toHaveFetchedTimes( 3 );
				expect( fetchMock ).toHaveFetched( containerLookupEndpoint, {
					query: {
						destinationID: measurementID,
					},
					body: containerMock,
				} );
				expect( fetchMock ).toHaveFetched( ga4SettingsEndpoint, {
					body: {
						data: {
							...ga4Settings,
							googleTagContainerDestinationIDs,
							googleTagLastSyncedAtMs,
						},
					},
					method: 'POST',
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isWebDataStreamAvailable()
				).toBe( false );

				// Initially undefined.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasMismatchedGoogleTagID()
				).toBe( undefined );

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).hasMismatchedGoogleTagID();

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasMismatchedGoogleTagID()
				).toBe( false );

				delete global._googlesitekitModulesData;
			} );

			it( 'should check for mismatched Google Tag ID if Google Tag settings already exist', async () => {
				provideUserAuthentication( registry, {
					grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				} );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				const measurementID = 'G-2B7M8YQ1K6';
				const googleTagID = 'GT-NBQN9V3';
				const containerMock = fixtures.container[ measurementID ];

				const { googleTagAccountID, googleTagContainerID } =
					fixtures.googleTagSettings;

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					measurementID,
					googleTagID,
					googleTagAccountID,
					googleTagContainerID,
					googleTagLastSyncedAtMs: 1670123456789,
				} );

				fetchMock.getOnce( containerLookupEndpoint, {
					body: containerMock,
					status: 200,
				} );

				fetchMock.getOnce( containerDestinationsEndpoint, {
					body: containerDestinationsMock,
					status: 200,
				} );

				const ga4Settings = {
					measurementID,
					googleTagAccountID,
					googleTagContainerID,
					googleTagID,
				};

				fetchMock.postOnce( ga4SettingsEndpoint, {
					body: {
						...ga4Settings,
						googleTagLastSyncedAtMs: Date.now(),
					},
					status: 200,
				} );

				fetchMock.postOnce( setGoogleTagIDMismatchEndpoint, {
					body: true,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncGoogleTagSettings();

				const googleTagLastSyncedAtMs = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagLastSyncedAtMs();

				expect( fetchMock ).toHaveFetchedTimes( 4 );
				expect( fetchMock ).toHaveFetched( containerLookupEndpoint, {
					query: {
						destinationID: measurementID,
					},
					body: containerMock,
				} );
				expect( fetchMock ).toHaveFetched( ga4SettingsEndpoint, {
					body: {
						data: {
							...ga4Settings,
							googleTagContainerDestinationIDs,
							googleTagLastSyncedAtMs,
						},
					},
					method: 'POST',
				} );

				// The web data stream is available.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isWebDataStreamAvailable()
				).toBe( true );

				// but the Google Tag ID is mismatched.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasMismatchedGoogleTagID()
				).toBe( true );
			} );

			it( 'should set Google Tag container destination IDs in module setting', async () => {
				provideUserAuthentication( registry, {
					grantedScopes: [ TAGMANAGER_READ_SCOPE ],
				} );

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				const measurementID = 'G-2B7M8YQ1K6';
				const containerMock = fixtures.container[ measurementID ];

				const {
					googleTagID,
					googleTagAccountID,
					googleTagContainerID,
				} = fixtures.googleTagSettings;

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					measurementID,
					googleTagID,
					googleTagAccountID,
					googleTagContainerID,
					googleTagLastSyncedAtMs: 1670123456789,
				} );

				fetchMock.getOnce( containerLookupEndpoint, {
					body: containerMock,
					status: 200,
				} );

				fetchMock.getOnce( containerDestinationsEndpoint, {
					body: containerDestinationsMock,
					status: 200,
				} );

				const ga4Settings = {
					measurementID,
					googleTagAccountID,
					googleTagContainerID,
					googleTagID,
				};

				fetchMock.postOnce( ga4SettingsEndpoint, {
					body: {
						...ga4Settings,
						googleTagLastSyncedAtMs: Date.now(), // This is set purely for illustrative purposes, the actual value will be calculated at the point of dispatch.
					},
					status: 200,
				} );

				fetchMock.postOnce( setGoogleTagIDMismatchEndpoint, {
					body: true,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.syncGoogleTagSettings();

				const googleTagLastSyncedAtMs = registry
					.select( MODULES_ANALYTICS_4 )
					.getGoogleTagLastSyncedAtMs();

				expect( fetchMock ).toHaveFetched( ga4SettingsEndpoint, {
					body: {
						data: {
							...ga4Settings,
							googleTagContainerDestinationIDs,
							googleTagLastSyncedAtMs,
						},
					},
					method: 'POST',
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getGoogleTagContainerDestinationIDs()
				).toEqual( googleTagContainerDestinationIDs );
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
				const initialProperties = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperties( accountID );
				expect( initialProperties ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getProperties( accountID );
				expect( fetchMock ).toHaveFetched( propertiesEndpoint, {
					query: { accountID },
				} );

				const properties = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperties( accountID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( properties ).toEqual( fixtures.properties );
				expect( properties ).toHaveLength( fixtures.properties.length );
			} );

			it( 'should not make a network request if properties for this account are already present', async () => {
				const testAccountID = '12345';
				const accountID = testAccountID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties( fixtures.properties, { accountID } );

				const properties = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperties( testAccountID );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getProperties( testAccountID );

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
				registry
					.select( MODULES_ANALYTICS_4 )
					.getProperties( fakeAccountID );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getProperties( fakeAccountID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const properties = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperties( fakeAccountID );
				expect( properties ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getPropertySummaries', () => {
			it( 'should return an empty array if no properties are present for the account', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( fixtures.accountSummaries );

				const propertySummaries = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertySummaries( '12345' );
				expect( propertySummaries ).toEqual( [] );
			} );

			it( 'should return an array of property summaries if present', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( fixtures.accountSummaries );

				const accountID =
					fixtures.accountSummaries.accountSummaries[ 1 ]._id;
				const propertySummaries = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertySummaries( accountID );
				expect( propertySummaries ).toEqual(
					fixtures.accountSummaries.accountSummaries[ 1 ]
						.propertySummaries
				);
			} );
		} );

		describe( 'getProperty', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( propertyEndpoint, {
					body: fixtures.properties[ 0 ],
					status: 200,
				} );

				const propertyID = '12345';
				const initialProperty = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperty( propertyID );
				expect( initialProperty ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getProperty( propertyID );
				expect( fetchMock ).toHaveFetched( propertyEndpoint, {
					query: { propertyID },
				} );

				const property = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperty( propertyID );
				expect( property ).toEqual( fixtures.properties[ 0 ] );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a network request if the property is already present', async () => {
				const propertyID = '12345';
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperty( fixtures.properties[ 0 ], {
						propertyID,
					} );

				const property = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperty( propertyID );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getProperty( propertyID );

				expect( fetchMock ).not.toHaveFetched( propertyEndpoint );
				expect( property ).toEqual( fixtures.properties[ 0 ] );
			} );

			it( 'should not make a network request if the property is already received via getProperties selector', async () => {
				fetchMock.get( propertiesEndpoint, {
					body: fixtures.properties,
					status: 200,
				} );

				const accountID = '100';
				const propertyID = fixtures.properties[ 1 ]._id;

				registry
					.select( MODULES_ANALYTICS_4 )
					.getProperties( accountID );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getProperties( accountID );
				expect( fetchMock ).toHaveFetched( propertiesEndpoint );

				const property = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperty( propertyID );
				expect( property ).toEqual( fixtures.properties[ 1 ] );
				expect( fetchMock ).not.toHaveFetched( propertyEndpoint );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( propertyEndpoint, {
					body: response,
					status: 500,
				} );

				const propertyID = '777888999';
				registry
					.select( MODULES_ANALYTICS_4 )
					.getProperty( propertyID );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getProperty( propertyID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const property = registry
					.select( MODULES_ANALYTICS_4 )
					.getProperty( propertyID );
				expect( property ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getPropertyCreateTime', () => {
			it( 'should use a resolver to fetch the current property if create time is not set yet', async () => {
				fetchMock.get( propertyEndpoint, {
					body: fixtures.properties[ 0 ],
					status: 200,
				} );

				const propertyID = '12345';
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( propertyID );

				const initalPropertyCreateTime = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertyCreateTime();

				expect( initalPropertyCreateTime ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getPropertyCreateTime();
				expect( fetchMock ).toHaveFetched( propertyEndpoint, {
					query: { propertyID },
				} );

				const propertyCreateTime = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertyCreateTime();

				expect( propertyCreateTime ).toEqual(
					new Date( fixtures.properties[ 0 ].createTime ).getTime()
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should cache the current property creation time when fetched', async () => {
				fetchMock.get( propertyEndpoint, {
					body: fixtures.properties[ 0 ],
					status: 200,
				} );

				const propertyID = '12345';
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setPropertyID( propertyID );

				const initalPropertyCreateTime = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertyCreateTime();

				expect( initalPropertyCreateTime ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getPropertyCreateTime();
				expect( fetchMock ).toHaveFetched( propertyEndpoint, {
					query: { propertyID },
				} );

				const propertyCreateTimeInCache = await getItem(
					`analytics4-properties-getPropertyCreateTime-${ propertyID }`
				);

				expect( propertyCreateTimeInCache.cacheHit ).toBe( true );
				expect( propertyCreateTimeInCache.value ).toEqual(
					fixtures.properties[ 0 ].createTime
				);
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a request to the API if the property creation time is cached', async () => {
				const propertyID = fixtures.properties[ 0 ]._id;
				const expectedPropertyCreateTime = 123456789;

				const settings = {
					propertyID,
					webDataStreamID: '1000',
					measurementID: 'abcd',
				};

				await setItem(
					`analytics4-properties-getPropertyCreateTime-${ propertyID }`,
					expectedPropertyCreateTime
				);

				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( settings );

				registry.select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getPropertyCreateTime();

				const propertyCreateTime = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertyCreateTime();
				expect( propertyCreateTime ).toBe( expectedPropertyCreateTime );
				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );

			it( 'should not fetch the property if the propertyCreateTime is already set', async () => {
				const propertyID = fixtures.properties[ 0 ]._id;

				const settings = {
					propertyID,
					webDataStreamID: '1000',
					measurementID: 'abcd',
					propertyCreateTime: 123456789,
				};

				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( settings );

				registry.select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getPropertyCreateTime();

				const propertyCreateTime = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertyCreateTime();
				expect( propertyCreateTime ).toBe(
					settings.propertyCreateTime
				);
				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );

			it( 'should not fetch the property if the current property ID is invalid', async () => {
				const settings = {
					propertyID: '',
					webDataStreamID: '',
					measurementID: '',
					propertyCreateTime: 0,
				};

				provideUserAuthentication( registry );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( settings );

				registry.select( MODULES_ANALYTICS_4 ).getPropertyCreateTime();
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getPropertyCreateTime();

				const propertyCreateTime = registry
					.select( MODULES_ANALYTICS_4 )
					.getPropertyCreateTime();
				expect( propertyCreateTime ).toBe(
					settings.propertyCreateTime
				);
				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );
		} );

		describe( 'hasMismatchedGoogleTagID', () => {
			it( 'should use a resolver to source value from global', async () => {
				global._googlesitekitModulesData = {
					'analytics-4': {
						tagIDMismatch: false,
					},
				};

				const initialHasMismatchedGoogleTagID = registry
					.select( MODULES_ANALYTICS_4 )
					.hasMismatchedGoogleTagID();

				expect( initialHasMismatchedGoogleTagID ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).hasMismatchedGoogleTagID();

				const hasMismatchedGoogleTagID = registry
					.select( MODULES_ANALYTICS_4 )
					.hasMismatchedGoogleTagID();

				expect( hasMismatchedGoogleTagID ).toEqual( false );

				delete global._googlesitekitModulesData;
			} );

			it( 'should not source data from global if the value is already present', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveHasMismatchGoogleTagID( true );

				const hasMismatchedGoogleTagID = registry
					.select( MODULES_ANALYTICS_4 )
					.hasMismatchedGoogleTagID();

				expect( hasMismatchedGoogleTagID ).toBe( true );
			} );
		} );

		describe( 'isWebDataStreamAvailable', () => {
			it( 'returns a specific key in state', () => {
				const isWebDataStreamAvailable = registry
					.select( MODULES_ANALYTICS_4 )
					.isWebDataStreamAvailable();

				// It is true by default.
				expect( isWebDataStreamAvailable ).toBe( true );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setIsWebDataStreamAvailable( false );

				const updatedIsWebDataStreamAvailable = registry
					.select( MODULES_ANALYTICS_4 )
					.isWebDataStreamAvailable();

				expect( updatedIsWebDataStreamAvailable ).toBe( false );
			} );
		} );

		describe( 'isLoadingPropertySummaries', () => {
			const accounts = fixtures.accountSummaries.accountSummaries;
			const properties = accounts[ 1 ].propertySummaries;
			const accountID = accounts[ 1 ]._id;
			const propertyID = properties[ 0 ]._id;

			beforeEach( () => {
				provideSiteInfo( registry );
				provideUserAuthentication( registry );
				provideModules( registry );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( fixtures.webDataStreams, {
						propertyID,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( {
						accountSummaries: accounts,
						nextPageToken: null,
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getAccountSummaries', [] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperty( properties[ 0 ], {
						propertyID,
					} );
			} );

			it( 'should return false if the required state is already loaded', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isLoadingPropertySummaries()
				).toBe( false );
			} );

			it( 'should return true while matching the account properties', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{
							propertyIDs: properties.map( ( { _id } ) => _id ),
						}
					);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchAndSelectProperty( accountID );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isLoadingPropertySummaries()
				).toBe( true );
			} );

			it( 'should return true if property summaries are not yet loaded', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.startResolution( 'getAccountSummaries', [] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isLoadingPropertySummaries()
				).toBe( true );
			} );

			it( 'should return true while selecting an account', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties( [], { accountID } );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getProperties', [ accountID ] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{
							propertyIDs: properties.map( ( { _id } ) => _id ),
						}
					);

				// Verify that the selector returns false before selecting an account.
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isLoadingPropertySummaries()
				).toBe( false );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.selectAccount( accountID );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isLoadingPropertySummaries()
				).toBe( true );
			} );
		} );
	} );
} );
