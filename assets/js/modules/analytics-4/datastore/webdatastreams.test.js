/**
 * `modules/analytics-4` data store: webdatastreams tests.
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
import { pick } from 'lodash';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import {
	createTestRegistry,
	freezeFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	unsubscribeFromAll,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4 } from './constants';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics-4 webdatastreams', () => {
	let registry;

	const createWebDataStreamsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-webdatastream'
	);
	const webDataStreamsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams'
	);
	const webDataStreamsBatchEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/webdatastreams-batch'
	);

	const webDataStreamDotCom = {
		name: 'properties/1000/dataStreams/2000',
		webStreamData: {
			measurementId: '1A2BCD345E', // eslint-disable-line sitekit/acronym-case
			defaultUri: 'http://example.com', // eslint-disable-line sitekit/acronym-case
		},
		createTime: '2014-10-02T15:01:23Z',
		updateTime: '2014-10-02T15:01:23Z',
		displayName: 'Test GA4 WebDataStream',
	};

	const webDataStreamDotOrg = {
		name: 'properties/1000/dataStreams/2001',
		webStreamData: {
			measurementId: '1A2BCD346E', // eslint-disable-line sitekit/acronym-case
			defaultUri: 'http://example.org', // eslint-disable-line sitekit/acronym-case
		},
		createTime: '2014-10-03T15:01:23Z',
		updateTime: '2014-10-03T15:01:23Z',
		displayName: 'Another datastream',
	};

	const webDataStreamDotCom2 = {
		name: 'properties/1000/dataStreams/2002',
		webStreamData: {
			measurementId: '1A2BCD347E', // eslint-disable-line sitekit/acronym-case
			defaultUri: 'http://example.com', // eslint-disable-line sitekit/acronym-case
		},
		createTime: '2014-10-02T15:02:23Z',
		updateTime: '2014-10-02T15:02:23Z',
		displayName: 'Test GA4 WebDataStream',
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
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
		describe( 'createWebDataStream', () => {
			it( 'should create a web datastream and add it to the store', async () => {
				const propertyID = '12345';
				const displayName = 'New GA4 WebDataStream';

				fetchMock.post( createWebDataStreamsEndpoint, {
					body: fixtures.createWebDataStream,
					status: 200,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.createWebDataStream( propertyID, displayName );
				expect( fetchMock ).toHaveFetched(
					createWebDataStreamsEndpoint,
					{
						body: {
							data: {
								propertyID,
								displayName,
							},
						},
					}
				);

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( propertyID );
				expect( webdatastreams ).toMatchObject( [
					fixtures.createWebDataStream,
				] );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				jest.useFakeTimers();

				const propertyID = '12345';
				const displayName = 'New GA4 WebDataStream';
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.post( createWebDataStreamsEndpoint, {
					body: response,
					status: 500,
				} );

				await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.createWebDataStream( propertyID, displayName );

				const error = registry
					.select( MODULES_ANALYTICS_4 )
					.getErrorForAction( 'createWebDataStream', [
						propertyID,
						displayName,
					] );
				expect( error ).toMatchObject( response );

				// The response isn't important for the test here and we intentionally don't wait for it,
				// but the fixture is used to prevent an invariant error as the received webdatastreams
				// taken from `response.webDataStreams` are required to be an array.
				freezeFetch( webDataStreamsEndpoint );

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( propertyID );
				// No webdatastreams should have been added yet, as the property creation failed.
				expect( webdatastreams ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'matchWebDataStream', () => {
			const propertyID = '1234';

			beforeEach( () => {
				provideSiteInfo( registry );
			} );

			it( 'should return NULL if no matching web data stream is found', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( [ webDataStreamDotOrg ], {
						propertyID,
					} );

				const webDataStream = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchWebDataStream( propertyID );
				expect( webDataStream ).toBeNull();
			} );

			it( 'should return a web data stream if we find a matching one', async () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams(
						[ webDataStreamDotCom, webDataStreamDotOrg ],
						{ propertyID }
					);

				const webDataStream = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.matchWebDataStream( propertyID );
				expect( webDataStream ).toMatchObject( webDataStreamDotCom );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getWebDataStreams', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( webDataStreamsEndpoint, {
					body: fixtures.webDataStreams,
					status: 200,
				} );

				const propertyID = '12345';
				const initialDataStreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( propertyID );
				expect( initialDataStreams ).toBeUndefined();

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreams( propertyID );
				expect( fetchMock ).toHaveFetched( webDataStreamsEndpoint, {
					query: { propertyID },
				} );

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( propertyID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( webdatastreams ).toEqual( fixtures.webDataStreams );
				expect( webdatastreams ).toHaveLength(
					fixtures.webDataStreams.length
				);
			} );

			it( 'should not make a network request if webdatastreams for this account are already present', () => {
				const testPropertyID = '12345';
				const propertyID = testPropertyID;

				// Load data into this store so there are matches for the data we're about to select,
				// even though the selector hasn't fulfilled yet.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( fixtures.webDataStreams, {
						propertyID,
					} );

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( testPropertyID );
				expect( webdatastreams ).toEqual( fixtures.webDataStreams );
				expect( webdatastreams ).toHaveLength(
					fixtures.webDataStreams.length
				);
				expect( fetchMock ).not.toHaveFetched( webDataStreamsEndpoint );
			} );

			it( 'should dispatch an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.getOnce( webDataStreamsEndpoint, {
					body: response,
					status: 500,
				} );

				const fakePropertyID = '777888999';
				registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( fakePropertyID );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreams( fakePropertyID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreams( fakePropertyID );
				expect( webdatastreams ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getMatchingWebDataStream', () => {
			const webDataStreams = [ webDataStreamDotCom, webDataStreamDotOrg ];

			it( 'should return NULL when no datastreams are matched', () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.net',
				} );

				const datastream = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchingWebDataStream( webDataStreams );

				expect( datastream ).toBeNull();
			} );

			it( 'should return the correct datastream when reference site URL matches exactly', () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.com',
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStream( webDataStreams )
				).toEqual( webDataStreamDotCom );

				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.org',
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStream( webDataStreams )
				).toEqual( webDataStreamDotOrg );
			} );

			it.each( [
				[ 'protocol differences', 'https://example.org' ],
				[ '"www." prefix', 'http://www.example.org' ],
				[ 'trailing slash', 'https://www.example.org/' ],
			] )(
				'should return the correct datastream ignoring %s',
				( _, referenceSiteURL ) => {
					provideSiteInfo( registry, { referenceSiteURL } );

					const datastream = registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStream( webDataStreams );

					expect( datastream ).toEqual( webDataStreamDotOrg );
				}
			);
		} );

		describe( 'getMatchingWebDataStreams', () => {
			const webDataStreams = [ webDataStreamDotCom, webDataStreamDotOrg ];

			it( 'should return an empty array when no datastreams are matched', () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.net',
				} );

				const datastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchingWebDataStreams( webDataStreams );

				expect( datastreams.length ).toBe( 0 );
			} );

			it( 'should return the correct datastreams when reference site URL matches exactly', () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.com',
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStreams( [
							webDataStreamDotCom,
							webDataStreamDotOrg,
							webDataStreamDotCom2,
						] )
				).toEqual( [ webDataStreamDotCom, webDataStreamDotCom2 ] );

				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.org',
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStreams( webDataStreams )
				).toEqual( [ webDataStreamDotOrg ] );
			} );

			it.each( [
				[ 'protocol differences', 'https://example.org' ],
				[ '"www." prefix', 'http://www.example.org' ],
				[ 'trailing slash', 'https://www.example.org/' ],
			] )(
				'should return the correct datastream ignoring %s',
				( _, referenceSiteURL ) => {
					provideSiteInfo( registry, { referenceSiteURL } );

					const datastreams = registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStreams( webDataStreams );

					expect( datastreams ).toEqual( [ webDataStreamDotOrg ] );
				}
			);
		} );

		describe( 'getMatchingWebDataStreamByPropertyID', () => {
			const webDataStreams = [ webDataStreamDotCom, webDataStreamDotOrg ];
			const propertyID = '12345';

			it( 'should return undefined if web data streams arent loaded yet', () => {
				jest.useFakeTimers();

				freezeFetch( webDataStreamsEndpoint );

				const datastream = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchingWebDataStreamByPropertyID( propertyID );
				expect( datastream ).toBeUndefined();
			} );

			it( 'should return NULL when no datastreams are matched', () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.net',
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( webDataStreams, { propertyID } );

				const datastream = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchingWebDataStreamByPropertyID( propertyID );
				expect( datastream ).toBeNull();
			} );

			it( 'should return the correct datastream when reference site URL matches exactly', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( webDataStreams, { propertyID } );

				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.com',
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStreamByPropertyID( propertyID )
				).toEqual( webDataStreamDotCom );

				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.org',
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStreamByPropertyID( propertyID )
				).toEqual( webDataStreamDotOrg );
			} );

			it.each( [
				[ 'protocol differences', 'https://example.org' ],
				[ '"www." prefix', 'http://www.example.org' ],
				[ 'trailing slash', 'https://www.example.org/' ],
			] )(
				'should return the correct datastream ignoring %s',
				( _, referenceSiteURL ) => {
					provideSiteInfo( registry, { referenceSiteURL } );
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetWebDataStreams( webDataStreams, {
							propertyID,
						} );

					const datastream = registry
						.select( MODULES_ANALYTICS_4 )
						.getMatchingWebDataStreamByPropertyID( propertyID );
					expect( datastream ).toEqual( webDataStreamDotOrg );
				}
			);
		} );

		describe( 'getWebDataStreamsBatch', () => {
			it( 'should use a resolver to make a network request', async () => {
				fetchMock.get( webDataStreamsBatchEndpoint, {
					body: fixtures.webDataStreamsBatch,
					status: 200,
				} );

				const propertyIDs = Object.keys( fixtures.webDataStreamsBatch );
				const initialDataStreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( initialDataStreams ).toEqual( {} );

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreamsBatch( propertyIDs );
				expect( fetchMock ).toHaveFetched(
					webDataStreamsBatchEndpoint
				);

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( webdatastreams ).toEqual(
					fixtures.webDataStreamsBatch
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should make a network request with property IDs that are not loaded yet', async () => {
				const propertyIDs = Object.keys( fixtures.webDataStreamsBatch );

				fetchMock.get( webDataStreamsBatchEndpoint, {
					body: pick(
						fixtures.webDataStreamsBatch,
						propertyIDs.slice( 1 )
					),
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams(
						fixtures.webDataStreamsBatch[ propertyIDs[ 0 ] ],
						{
							propertyID: propertyIDs[ 0 ],
						}
					);

				const initialDataStreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( initialDataStreams ).toEqual(
					pick(
						fixtures.webDataStreamsBatch,
						propertyIDs.slice( 0, 1 )
					)
				);

				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreamsBatch( propertyIDs );
				expect( fetchMock ).toHaveFetched(
					webDataStreamsBatchEndpoint
				);

				const webdatastreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( webdatastreams ).toEqual(
					fixtures.webDataStreamsBatch
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( 'should not make a network request if webdatastreams for the selected properties are already present', () => {
				for ( const [ propertyID, webdatastreams ] of Object.entries(
					fixtures.webDataStreamsBatch
				) ) {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.receiveGetWebDataStreams( webdatastreams, {
							propertyID,
						} );
				}

				const propertyIDs = Object.keys( fixtures.webDataStreamsBatch );
				const initialDataStreams = registry
					.select( MODULES_ANALYTICS_4 )
					.getWebDataStreamsBatch( propertyIDs );
				expect( initialDataStreams ).toEqual(
					fixtures.webDataStreamsBatch
				);
				expect( fetchMock ).not.toHaveFetched(
					webDataStreamsBatchEndpoint
				);
			} );

			it( 'should send multiple request if propertyIDs array has more than 10 items', async () => {
				const propertyIDs = [];
				const allDataStreams = {};
				const firstBatch = {};
				const secondBatch = {};

				for ( let i = 0; i < 15; i++ ) {
					const propertyID = `${ 1000 + i }`;
					const datastream = {
						_id: `${ 2000 + i }`,
						_propertyID: propertyID,
					};

					propertyIDs.push( propertyID );

					allDataStreams[ propertyID ] = datastream;
					if ( i < 10 ) {
						firstBatch[ propertyID ] = datastream;
					} else {
						secondBatch[ propertyID ] = datastream;
					}
				}

				const responses = [ firstBatch, secondBatch ];
				fetchMock.get( webDataStreamsBatchEndpoint, () => {
					return { body: responses.pop() };
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getWebDataStreamsBatch( propertyIDs )
				).toEqual( {} );
				await untilResolved(
					registry,
					MODULES_ANALYTICS_4
				).getWebDataStreamsBatch( propertyIDs );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getWebDataStreamsBatch( propertyIDs )
				).toEqual( allDataStreams );

				expect( fetchMock ).toHaveFetched(
					webDataStreamsBatchEndpoint
				);
				expect( fetchMock ).toHaveFetchedTimes( 2 );
			} );
		} );

		describe( 'getMatchedMeasurementIDsByPropertyIDs', () => {
			const propertyIDs = fixtures.properties.map( ( { _id } ) => _id );

			it( 'should return an empty object if the properties are not matched', async () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.com',
				} );

				fetchMock.get( webDataStreamsBatchEndpoint, {
					body: [],
					status: 200,
				} );

				const matchedProperties = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchedMeasurementIDsByPropertyIDs( [ '1100' ] );

				// Wait for resolvers to run.
				await waitForDefaultTimeouts();

				expect( fetchMock ).toHaveFetched(
					webDataStreamsBatchEndpoint
				);

				expect( matchedProperties ).toEqual( {} );
			} );

			it( 'should return an object with matched property id as the key and measurement id as the value', () => {
				provideSiteInfo( registry, {
					referenceSiteURL: 'http://example.com',
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch(
						fixtures.webDataStreamsBatch,
						{ propertyIDs }
					);

				const matchedProperties = registry
					.select( MODULES_ANALYTICS_4 )
					.getMatchedMeasurementIDsByPropertyIDs( propertyIDs );

				expect( matchedProperties ).toEqual( {
					1000: '1A2BCD345E',
				} );
			} );
		} );

		describe( 'getAnalyticsConfigByMeasurementIDs', () => {
			const accountSummaries = [
				{
					_id: '123456',
					propertySummaries: [
						{ _id: '1122334455' },
						{ _id: '1122334456' },
						{ _id: '1122334457' },
					],
				},
				{
					_id: '123457',
					propertySummaries: [
						{ _id: '1122334465' },
						{ _id: '1122334466' },
					],
				},
				{
					_id: '123458',
					propertySummaries: [ { _id: '1122334475' } ],
				},
			];

			const propertyIDs = accountSummaries
				.map( ( { propertySummaries } ) =>
					propertySummaries.map( ( { _id } ) => _id )
				)
				.reduce( ( acc, propIDs ) => [ ...acc, ...propIDs ], [] );

			const datastreams = {
				1122334455: [
					{
						_id: '110',
						webStreamData: {
							defaultUri: 'http://example-1.test',
							measurementId: 'G-1101', // eslint-disable-line sitekit/acronym-case
						},
					},
					{
						_id: '111',
						webStreamData: {
							defaultUri: 'http://example-2.test',
							measurementId: 'G-1102', // eslint-disable-line sitekit/acronym-case
						},
					},
				],
				1122334465: [
					{
						_id: '112',
						webStreamData: {
							defaultUri: 'http://example-3.test',
							measurementId: 'G-1103', // eslint-disable-line sitekit/acronym-case
						},
					},
					{
						_id: '113',
						webStreamData: {
							defaultUri: 'http://example-4.test',
							measurementId: 'G-1104', // eslint-disable-line sitekit/acronym-case
						},
					},
				],
				1122334475: [
					{
						_id: '114',
						webStreamData: {
							defaultUri: 'http://example-5.test',
							measurementId: 'G-1105', // eslint-disable-line sitekit/acronym-case
						},
					},
					{
						_id: '115',
						webStreamData: {
							defaultUri: 'http://example.com',
							measurementId: 'G-1106', // eslint-disable-line sitekit/acronym-case
						},
					},
					{
						_id: '116',
						webStreamData: {
							defaultUri: 'http://example-7.test',
							measurementId: 'G-1107', // eslint-disable-line sitekit/acronym-case
						},
					},
				],
				1122334456: [],
				1122334457: [],
				1122334466: [],
			};

			beforeEach( () => {
				provideSiteInfo( registry );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID: 'UA-abcd',
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetSettings( {} );
			} );

			it( 'should return NULL when no summaries are returned from the endpoint', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( [] );

				const config = registry
					.select( MODULES_ANALYTICS_4 )
					.getAnalyticsConfigByMeasurementIDs( 'G-012345' );

				expect( config ).toBeNull();
			} );

			it( 'should return the first config when found configs dont match the current site URL', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accountSummaries );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch( datastreams, {
						propertyIDs,
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getWebDataStreamsBatch', [
						propertyIDs,
					] );

				const config = registry
					.select( MODULES_ANALYTICS_4 )
					.getAnalyticsConfigByMeasurementIDs( [
						'G-1107',
						'G-1103',
					] );

				expect( config ).toEqual( {
					accountID: '123457',
					measurementID: 'G-1103',
					propertyID: '1122334465',
					webDataStreamID: '112',
				} );
			} );

			it( 'should return the correct config when there is a config that matches the current site URL', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accountSummaries );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch( datastreams, {
						propertyIDs,
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getWebDataStreamsBatch', [
						propertyIDs,
					] );

				const config = registry
					.select( MODULES_ANALYTICS_4 )
					.getAnalyticsConfigByMeasurementIDs( [
						'G-1101',
						'G-1106',
					] );

				expect( config ).toEqual( {
					accountID: '123458',
					measurementID: 'G-1106',
					propertyID: '1122334475',
					webDataStreamID: '115',
				} );
			} );

			it( 'should return NULL when there are no matching configs', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accountSummaries );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch( datastreams, {
						propertyIDs,
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getWebDataStreamsBatch', [
						propertyIDs,
					] );

				const config = registry
					.select( MODULES_ANALYTICS_4 )
					.getAnalyticsConfigByMeasurementIDs( [
						'G-12345',
						'G-12346',
					] );

				expect( config ).toBeNull();
			} );

			it( 'should return the correct config even if it doesnt match the site URL when only one measurement ID is requested', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accountSummaries );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch( datastreams, {
						propertyIDs,
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getWebDataStreamsBatch', [
						propertyIDs,
					] );

				const config = registry
					.select( MODULES_ANALYTICS_4 )
					.getAnalyticsConfigByMeasurementIDs( 'G-1103' );

				expect( config ).toEqual( {
					accountID: '123457',
					measurementID: 'G-1103',
					propertyID: '1122334465',
					webDataStreamID: '112',
				} );
			} );
		} );

		describe( 'isLoadingWebDataStreams', () => {
			const accounts = fixtures.accountSummaries;
			const properties = accounts[ 1 ].propertySummaries;
			const accountID = accounts[ 1 ]._id;
			const propertyID = properties[ 0 ]._id;
			const hasModuleAccess = true;

			beforeEach( () => {
				provideSiteInfo( registry );
				provideUserAuthentication( registry );
				provideModules( registry );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID,
					propertyID,
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( fixtures.webDataStreams, {
						propertyID,
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getWebDataStreams', [ propertyID ] );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accounts );
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
						.isLoadingWebDataStreams( {
							hasModuleAccess,
						} )
				).toBe( false );
			} );

			it( 'should return true while matching the account property', () => {
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
						.isLoadingWebDataStreams( {
							hasModuleAccess,
						} )
				).toBe( true );
			} );

			it( 'should return true if accounts are not yet loaded', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.startResolution( 'getAccountSummaries', [] );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isLoadingWebDataStreams( {
							hasModuleAccess,
						} )
				).toBe( true );
			} );

			describe( 'while loading web data streams', () => {
				beforeEach( () => {
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.startResolution( 'getWebDataStreams', [ propertyID ] );
				} );

				it( 'should return false when hasModuleAccess is false', () => {
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.isLoadingWebDataStreams( {
								hasModuleAccess: false,
							} )
					).toBe( false );
				} );

				it( 'should return true when hasModuleAccess is not false', () => {
					expect(
						registry
							.select( MODULES_ANALYTICS_4 )
							.isLoadingWebDataStreams( {
								hasModuleAccess,
							} )
					).toBe( true );
				} );
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

				// Verify that the selector returns false after the prelude.
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
