/**
 * `modules/tagmanager` data store: versions tests.
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
import { MODULES_TAGMANAGER } from './constants';
import {
	CORE_SITE,
	AMP_MODE_PRIMARY,
	AMP_MODE_SECONDARY,
} from '../../../googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import {
	createBuildAndReceivers,
	parseLiveContainerVersionIDs as parseIDs,
} from './__factories__/utils';
import * as factories from './__factories__';
import * as fixtures from './__fixtures__';

describe( 'modules/tagmanager versions', () => {
	let registry;
	let buildAndReceiveWebAndAMP;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		( { buildAndReceiveWebAndAMP } = createBuildAndReceivers( registry ) );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveGetLiveContainerVersion', () => {
			const validContainerVersion = {};
			const validAccountID = '100';
			const validInternalContainerID = '200';

			it( 'requires a liveContainerVersion object', () => {
				expect( () =>
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion()
				).toThrow( 'response is required.' );
			} );

			it( 'requires params', () => {
				expect( () =>
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( validContainerVersion )
				).toThrow( 'params is required.' );
			} );

			it( 'does not throw with valid input', () => {
				expect( () => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion(
							validContainerVersion,
							{
								accountID: validAccountID,
								internalContainerID: validInternalContainerID,
							}
						);
				} ).not.toThrow();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAnalyticsPropertyIDs', () => {
			describe( 'no AMP', () => {
				beforeEach( () =>
					registry
						.dispatch( CORE_SITE )
						.receiveSiteInfo( { ampMode: false } )
				);

				it( 'returns an array including the property ID found in the current web container', () => {
					const liveContainerVersion =
						factories.buildLiveContainerVersionWeb( {
							propertyID: 'UA-12345-1',
						} );
					const { accountID, containerID, internalContainerID } =
						parseIDs( liveContainerVersion );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAccountID( accountID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setContainerID( containerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalContainerID( internalContainerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( liveContainerVersion, {
							accountID,
							internalContainerID,
						} );

					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ 'UA-12345-1' ] );
				} );

				it( 'returns an array of `null` if the selected container has no Analytics property tags', () => {
					const liveContainerVersion =
						factories.buildLiveContainerVersionWeb();
					const { accountID, containerID, internalContainerID } =
						parseIDs( liveContainerVersion );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAccountID( accountID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setContainerID( containerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalContainerID( internalContainerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( liveContainerVersion, {
							accountID,
							internalContainerID,
						} );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getLiveContainerAnalyticsTag(
								accountID,
								internalContainerID
							)
					).toEqual( null );

					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ null ] );
				} );

				it( 'returns undefined if the live container data is not loaded yet', async () => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAccountID( '12345' );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setContainerID( 'GTM-G000GL3' );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalContainerID( '9876' );

					muteFetch(
						new RegExp(
							'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
						)
					);
					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toStrictEqual( undefined );

					await untilResolved(
						registry,
						MODULES_TAGMANAGER
					).getLiveContainerVersion( '12345', '9876' );
				} );
			} );

			describe( 'Primary AMP', () => {
				beforeEach( () =>
					registry
						.dispatch( CORE_SITE )
						.receiveSiteInfo( { ampMode: AMP_MODE_PRIMARY } )
				);

				it( 'returns an array including the property ID found in the current AMP container', () => {
					const liveContainerVersion =
						factories.buildLiveContainerVersionAMP( {
							propertyID: 'UA-12345-1',
						} );
					const { accountID, containerID, internalContainerID } =
						parseIDs( liveContainerVersion );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAccountID( accountID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAMPContainerID( containerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalAMPContainerID( internalContainerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( liveContainerVersion, {
							accountID,
							internalContainerID,
						} );

					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ 'UA-12345-1' ] );
				} );

				it( 'returns an array of `null` if the selected container has no Analytics property tags', () => {
					const liveContainerVersion =
						factories.buildLiveContainerVersionAMP();
					const { accountID, containerID, internalContainerID } =
						parseIDs( liveContainerVersion );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAccountID( accountID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAMPContainerID( containerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalAMPContainerID( internalContainerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion( liveContainerVersion, {
							accountID,
							internalContainerID,
						} );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getLiveContainerAnalyticsTag(
								accountID,
								internalContainerID
							)
					).toEqual( null );

					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ null ] );
				} );

				it( 'returns undefined if the live container data is not loaded yet', async () => {
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAccountID( '12345' );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAMPContainerID( 'GTM-G000GL3' );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalAMPContainerID( '9876' );

					muteFetch(
						new RegExp(
							'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
						)
					);
					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toStrictEqual( undefined );

					await untilResolved(
						registry,
						MODULES_TAGMANAGER
					).getLiveContainerVersion( '12345', '9876' );
				} );
			} );

			describe( 'Secondary AMP', () => {
				beforeEach( () =>
					registry
						.dispatch( CORE_SITE )
						.receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } )
				);

				it( 'returns an array including property IDs found in both the web and AMP containers', () => {
					buildAndReceiveWebAndAMP( {
						webPropertyID: 'UA-123456789-1',
						ampPropertyID: 'UA-9999999-9',
					} );
					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [
						'UA-123456789-1',
						'UA-9999999-9',
					] );
				} );

				it( 'returns an array of unique property IDs of both the web and AMP containers', () => {
					buildAndReceiveWebAndAMP( {
						webPropertyID: 'UA-123456789-1',
						ampPropertyID: 'UA-123456789-1',
					} );

					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ 'UA-123456789-1' ] );
				} );

				it( 'returns an array of `null` if the selected containers have no Analytics property tags', () => {
					buildAndReceiveWebAndAMP();

					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ null ] );
				} );

				it( 'returns undefined if the live container data is not loaded yet for either container', async () => {
					const liveContainerVersionWeb =
						factories.buildLiveContainerVersionWeb();
					const { accountID, containerID, internalContainerID } =
						parseIDs( liveContainerVersionWeb );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAccountID( accountID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setContainerID( containerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalContainerID( internalContainerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetLiveContainerVersion(
							liveContainerVersionWeb,
							{ accountID, internalContainerID }
						);
					const liveContainerVersionAMP =
						factories.buildLiveContainerVersionWeb();
					const { ampContainerID, internalAMPContainerID } = parseIDs(
						liveContainerVersionAMP
					);
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setAMPContainerID( ampContainerID );
					registry
						.dispatch( MODULES_TAGMANAGER )
						.setInternalAMPContainerID( internalAMPContainerID );
					// Received the live container data for the web container but not the AMP container.

					muteFetch(
						new RegExp(
							'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
						)
					);
					const propertyIDs = registry
						.select( MODULES_TAGMANAGER )
						.getAnalyticsPropertyIDs();

					expect( propertyIDs ).toStrictEqual( undefined );

					await untilResolved(
						registry,
						MODULES_TAGMANAGER
					).getLiveContainerVersion( '100', '223' );
				} );
			} );
		} );

		describe( 'getLiveContainerAnalyticsTag', () => {
			it( 'returns the Universal Analytics tag object from the live container object', () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersionWeb( {
						propertyID: 'UA-12345-1',
					} );
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const tagObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsTag(
						accountID,
						internalContainerID
					);

				expect( tagObject ).toMatchObject( { type: 'ua' } );
				expect( tagObject ).toEqual(
					liveContainerVersion.tag.find(
						( { type } ) => type === 'ua'
					)
				);
			} );

			it( 'returns the Universal Analytics tag object from the live container object for an AMP container', () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersionAMP( {
						propertyID: 'UA-12345-1',
					} );
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const tagObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsTag(
						accountID,
						internalContainerID
					);

				expect( tagObject ).toMatchObject( { type: 'ua_amp' } );
				expect( tagObject ).toEqual(
					liveContainerVersion.tag.find(
						( { type } ) => type === 'ua_amp'
					)
				);
			} );

			it( 'returns null if the live container version does not contain a Universal Analytics tag', () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const tagObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsTag(
						accountID,
						internalContainerID
					);

				expect( tagObject ).toStrictEqual( null );
			} );

			it( 'returns null if no live container version exists', () => {
				const accountID = '12345';
				const internalContainerID = '98765';
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( null, {
						accountID,
						internalContainerID,
					} );

				const tagObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsTag(
						accountID,
						internalContainerID
					);

				expect( tagObject ).toStrictEqual( null );
			} );

			it( 'returns undefined if the live container version is not loaded yet', async () => {
				const accountID = '12345';
				const internalContainerID = '98765';

				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					)
				);
				const tagObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsTag(
						accountID,
						internalContainerID
					);

				expect( tagObject ).toStrictEqual( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( '12345', '98765' );
			} );
		} );

		describe( 'getLiveContainerAnalyticsPropertyID', () => {
			it( 'gets the propertyID associated with the Universal Analytics tag settings variable', () => {
				const liveContainerVersion =
					fixtures.liveContainerVersions.web.gaWithVariable;
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const propertyID = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsPropertyID(
						accountID,
						internalContainerID
					);

				expect( propertyID ).toBe( 'UA-123456789-1' );
			} );

			it( 'gets the propertyID associated with the Universal Analytics tag settings when provided directly', () => {
				const liveContainerVersion =
					fixtures.liveContainerVersions.web.gaWithOverride;
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const propertyID = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsPropertyID(
						accountID,
						internalContainerID
					);

				expect( propertyID ).toBe( 'UA-1234567-99' );
			} );

			it( 'gets the propertyID associated with the Universal Analytics tag for an AMP container', () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersionAMP( {
						propertyID: 'UA-123456789-1',
					} );
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const propertyID = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsPropertyID(
						accountID,
						internalContainerID
					);

				expect( propertyID ).toBe( 'UA-123456789-1' );
			} );

			it( 'returns null if no Analytics tag exists in the container', () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const propertyID = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsPropertyID(
						accountID,
						internalContainerID
					);

				expect( propertyID ).toStrictEqual( null );
			} );

			it( 'returns undefined if the live container version is not loaded yet', async () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );

				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					)
				);
				const propertyID = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerAnalyticsPropertyID(
						accountID,
						internalContainerID
					);

				expect( propertyID ).toStrictEqual( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( '100', '235' );
			} );
		} );

		describe( 'getLiveContainerVariable', () => {
			it( 'returns the variable object from the live container object by variable name', () => {
				const liveContainerVersion =
					fixtures.liveContainerVersions.web.noGAWithVariable;
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const variableName = 'Test Variable';
				const variableObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerVariable(
						accountID,
						internalContainerID,
						variableName
					);

				expect( variableObject ).toEqual(
					liveContainerVersion.variable[ 0 ]
				);
			} );

			it( 'returns null if no variable exists by the given name', () => {
				const liveContainerVersion =
					fixtures.liveContainerVersions.web.noGAWithVariable;
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const variableName = 'Non-existent Variable';
				const variableObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerVariable(
						accountID,
						internalContainerID,
						variableName
					);

				expect( variableObject ).toStrictEqual( null );
			} );

			it( 'returns null if no live container version exists', () => {
				const { accountID, internalContainerID } = parseIDs(
					factories.buildLiveContainerVersionWeb()
				);
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( null, {
						accountID,
						internalContainerID,
					} );

				const variableName = 'Test Variable';
				const variableObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerVariable(
						accountID,
						internalContainerID,
						variableName
					);

				expect( variableObject ).toStrictEqual( null );
			} );

			it( 'returns undefined if the live container version is not loaded yet', async () => {
				const { accountID, internalContainerID } = parseIDs(
					factories.buildLiveContainerVersionWeb()
				);
				const variableName = 'Test Variable';

				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					)
				);
				const variableObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerVariable(
						accountID,
						internalContainerID,
						variableName
					);

				expect( variableObject ).toStrictEqual( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( '100', '239' );
			} );
		} );

		describe( 'getLiveContainerVersion', () => {
			it( 'uses a resolver to make a network request', async () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					),
					{ body: liveContainerVersion, status: 200 }
				);

				const initialContainerVersion = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerVersion( accountID, internalContainerID );

				expect( initialContainerVersion ).toEqual( undefined );
				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( accountID, internalContainerID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerVersion(
							accountID,
							internalContainerID
						)
				).toEqual( liveContainerVersion );
			} );

			it( 'does not make a network request if the container version is already present', async () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerVersion(
							accountID,
							internalContainerID
						)
				).toEqual( liveContainerVersion );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( accountID, internalContainerID );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'dispatches an error if the request fails', async () => {
				const { accountID, internalContainerID } = parseIDs(
					factories.buildLiveContainerVersionWeb()
				);
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					),
					{ body: errorResponse, status: 500 }
				);

				registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerVersion( accountID, internalContainerID );
				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( accountID, internalContainerID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getErrorForSelector( 'getLiveContainerVersion', [
							accountID,
							internalContainerID,
						] )
				).toEqual( errorResponse );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerVersion(
							accountID,
							internalContainerID
						)
				).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'receives null if the container has no published version', async () => {
				const { accountID, internalContainerID } = parseIDs(
					factories.buildLiveContainerVersionWeb()
				);
				const notFoundResponse = {
					code: 404,
					message: 'Published container version not found',
					data: {
						status: 404,
						reason: 'notFound',
					},
				};

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					),
					{ body: notFoundResponse, status: 404 }
				);

				registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerVersion( accountID, internalContainerID );
				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( accountID, internalContainerID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( console ).toHaveErrored();

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getError( 'getLiveContainerVersion', [
							accountID,
							internalContainerID,
						] )
				).toBeUndefined();

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getLiveContainerVersion(
							accountID,
							internalContainerID
						)
				).toEqual( null );
			} );
		} );

		describe( 'getSingleAnalyticsPropertyID', () => {
			// Having multiple propertyIDs is currently only possible in secondary AMP
			// so we'll use that context for all of these tests.
			beforeEach( () =>
				registry
					.dispatch( CORE_SITE )
					.receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } )
			);

			it( 'returns the single common property ID used by both containers', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-123456789-1',
					ampPropertyID: 'UA-123456789-1',
				} );

				const singleAnalyticsPropertyID = registry
					.select( MODULES_TAGMANAGER )
					.getSingleAnalyticsPropertyID();
				expect( singleAnalyticsPropertyID ).toBe( 'UA-123456789-1' );
			} );

			it( 'returns false if both containers don’t reference the same property ID', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-123456789-1',
					ampPropertyID: 'UA-9999999-9',
				} );

				const singleAnalyticsPropertyID = registry
					.select( MODULES_TAGMANAGER )
					.getSingleAnalyticsPropertyID();
				expect( singleAnalyticsPropertyID ).toBe( false );
			} );

			it( 'returns null if no Analytics property ID was found', () => {
				buildAndReceiveWebAndAMP();

				const singleAnalyticsPropertyID = registry
					.select( MODULES_TAGMANAGER )
					.getSingleAnalyticsPropertyID();
				expect( singleAnalyticsPropertyID ).toBe( null );
			} );
		} );

		describe( 'hasAnyAnalyticsPropertyID', () => {
			// Having multiple propertyIDs is currently only possible in secondary AMP
			// so we'll use that context for all of these tests.
			beforeEach( () =>
				registry
					.dispatch( CORE_SITE )
					.receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } )
			);

			it( 'returns true if the web container has a property ID and the AMP container does not', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-12345-1',
				} );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.hasAnyAnalyticsPropertyID()
				).toBe( true );
			} );

			it( 'returns true if the AMP container has a property ID and the web container does not', () => {
				buildAndReceiveWebAndAMP( {
					ampPropertyID: 'UA-12345-1',
				} );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.hasAnyAnalyticsPropertyID()
				).toBe( true );
			} );

			it( 'returns true if both containers have a property ID, regardless of matching', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-99999-9',
					ampPropertyID: 'UA-12345-1',
				} );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.hasAnyAnalyticsPropertyID()
				).toBe( true );
			} );

			it( 'returns false if neither container has a property ID', () => {
				buildAndReceiveWebAndAMP();

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.hasAnyAnalyticsPropertyID()
				).toBe( false );
			} );
		} );

		describe( 'isDoingGetLiveContainerVersion', () => {
			it( 'returns true while the live container version fetch is in progress', async () => {
				jest.useFakeTimers();

				const accountID = '100';
				const internalContainerID = '200';

				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					)
				);
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.isDoingGetLiveContainerVersion(
							accountID,
							internalContainerID
						)
				).toBe( false );

				registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerVersion( accountID, internalContainerID );

				jest.runAllTimers();

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.isDoingGetLiveContainerVersion(
							accountID,
							internalContainerID
						)
				).toBe( true );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( accountID, internalContainerID );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.isDoingGetLiveContainerVersion(
							accountID,
							internalContainerID
						)
				).toBe( false );
			} );
		} );

		describe( 'getLiveContainerGoogleTag', () => {
			it( 'returns the Google tag object from the live container object', () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersion( {
						googleTagID: 'GT-123456789',
					} );
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const tagObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerGoogleTag(
						accountID,
						internalContainerID
					);

				expect( tagObject ).toMatchObject( { type: 'googtag' } );
				expect( tagObject ).toEqual(
					liveContainerVersion.tag.find(
						( { type } ) => type === 'googtag'
					)
				);
			} );

			it( 'returns null if the live container version does not contain a Google tag', () => {
				const liveContainerVersion =
					factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const tagObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerGoogleTag(
						accountID,
						internalContainerID
					);

				expect( tagObject ).toStrictEqual( null );
			} );

			it( 'returns null if no live container version exists', () => {
				const accountID = '12345';
				const internalContainerID = '98765';
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( null, {
						accountID,
						internalContainerID,
					} );

				const tagObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerGoogleTag(
						accountID,
						internalContainerID
					);

				expect( tagObject ).toStrictEqual( null );
			} );

			it( 'returns undefined if the live container version is not loaded yet', async () => {
				const accountID = '12345';
				const internalContainerID = '98765';

				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					)
				);
				const tagObject = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerGoogleTag(
						accountID,
						internalContainerID
					);

				expect( tagObject ).toStrictEqual( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( '12345', '98765' );
			} );
		} );
	} );
} );
