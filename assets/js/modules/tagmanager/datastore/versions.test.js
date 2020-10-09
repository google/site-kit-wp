/**
 * `modules/tagmanager` data store: versions tests.
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
import { STORE_NAME as CORE_SITE, AMP_MODE_PRIMARY, AMP_MODE_SECONDARY } from '../../../googlesitekit/datastore/site/constants';
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
				expect(
					() => registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion()
				).toThrow( 'response is required.' );
			} );

			it( 'requires params', () => {
				expect(
					() => registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( validContainerVersion )
				).toThrow( 'params is required.' );
			} );

			it( 'does not throw with valid input', () => {
				expect( () => {
					registry.dispatch( STORE_NAME )
						.receiveGetLiveContainerVersion( validContainerVersion, {
							accountID: validAccountID,
							internalContainerID: validInternalContainerID,
						} );
				} ).not.toThrow();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAnalyticsPropertyIDs', () => {
			describe( 'no AMP', () => {
				beforeEach( () => registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: false } ) );

				it( 'returns an array including the property ID found in the current web container', () => {
					const liveContainerVersion = factories.buildLiveContainerVersionWeb( { propertyID: 'UA-12345-1' } );
					const { accountID, containerID, internalContainerID } = parseIDs( liveContainerVersion );
					registry.dispatch( STORE_NAME ).setAccountID( accountID );
					registry.dispatch( STORE_NAME ).setContainerID( containerID );
					registry.dispatch( STORE_NAME ).setInternalContainerID( internalContainerID );
					registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ 'UA-12345-1' ] );
				} );

				it( 'returns an array of `null` if the selected container has no Analytics property tags', () => {
					const liveContainerVersion = factories.buildLiveContainerVersionWeb();
					const { accountID, containerID, internalContainerID } = parseIDs( liveContainerVersion );
					registry.dispatch( STORE_NAME ).setAccountID( accountID );
					registry.dispatch( STORE_NAME ).setContainerID( containerID );
					registry.dispatch( STORE_NAME ).setInternalContainerID( internalContainerID );
					registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );
					expect( registry.select( STORE_NAME ).getLiveContainerAnalyticsTag( accountID, internalContainerID ) ).toEqual( null );

					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ null ] );
				} );

				it( 'returns undefined if the live container data is not loaded yet', () => {
					registry.dispatch( STORE_NAME ).setAccountID( '12345' );
					registry.dispatch( STORE_NAME ).setContainerID( 'GTM-G000GL3' );
					registry.dispatch( STORE_NAME ).setInternalContainerID( '9876' );

					muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/ );
					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toStrictEqual( undefined );
				} );
			} );

			describe( 'Primary AMP', () => {
				beforeEach( () => registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_PRIMARY } ) );

				it( 'returns an array including the property ID found in the current AMP container', () => {
					const liveContainerVersion = factories.buildLiveContainerVersionAMP( { propertyID: 'UA-12345-1' } );
					const { accountID, containerID, internalContainerID } = parseIDs( liveContainerVersion );
					registry.dispatch( STORE_NAME ).setAccountID( accountID );
					registry.dispatch( STORE_NAME ).setAMPContainerID( containerID );
					registry.dispatch( STORE_NAME ).setInternalAMPContainerID( internalContainerID );
					registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ 'UA-12345-1' ] );
				} );

				it( 'returns an array of `null` if the selected container has no Analytics property tags', () => {
					const liveContainerVersion = factories.buildLiveContainerVersionAMP();
					const { accountID, containerID, internalContainerID } = parseIDs( liveContainerVersion );
					registry.dispatch( STORE_NAME ).setAccountID( accountID );
					registry.dispatch( STORE_NAME ).setAMPContainerID( containerID );
					registry.dispatch( STORE_NAME ).setInternalAMPContainerID( internalContainerID );
					registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );
					expect( registry.select( STORE_NAME ).getLiveContainerAnalyticsTag( accountID, internalContainerID ) ).toEqual( null );

					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ null ] );
				} );

				it( 'returns undefined if the live container data is not loaded yet', () => {
					registry.dispatch( STORE_NAME ).setAccountID( '12345' );
					registry.dispatch( STORE_NAME ).setAMPContainerID( 'GTM-G000GL3' );
					registry.dispatch( STORE_NAME ).setInternalAMPContainerID( '9876' );

					muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/ );
					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toStrictEqual( undefined );
				} );
			} );

			describe( 'Secondary AMP', () => {
				beforeEach( () => registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } ) );

				it( 'returns an array including property IDs found in both the web and AMP containers', () => {
					buildAndReceiveWebAndAMP( {
						webPropertyID: 'UA-123456789-1',
						ampPropertyID: 'UA-9999999-9',
					} );
					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ 'UA-123456789-1', 'UA-9999999-9' ] );
				} );

				it( 'returns an array of unique property IDs of both the web and AMP containers', () => {
					buildAndReceiveWebAndAMP( {
						webPropertyID: 'UA-123456789-1',
						ampPropertyID: 'UA-123456789-1',
					} );

					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ 'UA-123456789-1' ] );
				} );

				it( 'returns an array of `null` if the selected containers have no Analytics property tags', () => {
					buildAndReceiveWebAndAMP();

					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toEqual( [ null ] );
				} );

				it( 'returns undefined if the live container data is not loaded yet for either container', () => {
					const liveContainerVersionWeb = factories.buildLiveContainerVersionWeb();
					const { accountID, containerID, internalContainerID } = parseIDs( liveContainerVersionWeb );
					registry.dispatch( STORE_NAME ).setAccountID( accountID );
					registry.dispatch( STORE_NAME ).setContainerID( containerID );
					registry.dispatch( STORE_NAME ).setInternalContainerID( internalContainerID );
					registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersionWeb, { accountID, internalContainerID } );
					const liveContainerVersionAMP = factories.buildLiveContainerVersionWeb();
					const { ampContainerID, internalAMPContainerID } = parseIDs( liveContainerVersionAMP );
					registry.dispatch( STORE_NAME ).setAMPContainerID( ampContainerID );
					registry.dispatch( STORE_NAME ).setInternalAMPContainerID( internalAMPContainerID );
					// Received the live container data for the web container but not the AMP container.

					muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/ );
					const propertyIDs = registry.select( STORE_NAME ).getAnalyticsPropertyIDs();

					expect( propertyIDs ).toStrictEqual( undefined );
				} );
			} );
		} );

		describe( 'getLiveContainerAnalyticsTag', () => {
			it( 'returns the Universal Analytics tag object from the live container object', () => {
				const liveContainerVersion = factories.buildLiveContainerVersionWeb( { propertyID: 'UA-12345-1' } );
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

				const tagObject = registry.select( STORE_NAME ).getLiveContainerAnalyticsTag( accountID, internalContainerID );

				expect( tagObject ).toMatchObject( { type: 'ua' } );
				expect( tagObject ).toEqual( liveContainerVersion.tag.find( ( { type } ) => type === 'ua' ) );
			} );

			it( 'returns the Universal Analytics tag object from the live container object for an AMP container', () => {
				const liveContainerVersion = factories.buildLiveContainerVersionAMP( { propertyID: 'UA-12345-1' } );
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

				const tagObject = registry.select( STORE_NAME ).getLiveContainerAnalyticsTag( accountID, internalContainerID );

				expect( tagObject ).toMatchObject( { type: 'ua_amp' } );
				expect( tagObject ).toEqual( liveContainerVersion.tag.find( ( { type } ) => type === 'ua_amp' ) );
			} );

			it( 'returns null if the live container version does not contain a Universal Analytics tag', () => {
				const liveContainerVersion = factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

				const tagObject = registry.select( STORE_NAME ).getLiveContainerAnalyticsTag( accountID, internalContainerID );

				expect( tagObject ).toStrictEqual( null );
			} );

			it( 'returns null if no live container version exists', () => {
				const accountID = '12345';
				const internalContainerID = '98765';
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( null, { accountID, internalContainerID } );

				const tagObject = registry.select( STORE_NAME ).getLiveContainerAnalyticsTag( accountID, internalContainerID );

				expect( tagObject ).toStrictEqual( null );
			} );

			it( 'returns undefined if the live container version is not loaded yet', () => {
				const accountID = '12345';
				const internalContainerID = '98765';

				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/ );
				const tagObject = registry.select( STORE_NAME ).getLiveContainerAnalyticsTag( accountID, internalContainerID );

				expect( tagObject ).toStrictEqual( undefined );
			} );
		} );

		describe( 'getLiveContainerAnalyticsPropertyID', () => {
			it( 'gets the propertyID associated with the Universal Analytics tag settings variable', () => {
				const liveContainerVersion = fixtures.liveContainerVersions.web.gaWithVariable;
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

				const propertyID = registry.select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalContainerID );

				expect( propertyID ).toBe( 'UA-123456789-1' );
			} );

			it( 'gets the propertyID associated with the Universal Analytics tag settings when provided directly', () => {
				const liveContainerVersion = fixtures.liveContainerVersions.web.gaWithOverride;
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

				const propertyID = registry.select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalContainerID );

				expect( propertyID ).toBe( 'UA-1234567-99' );
			} );

			it( 'gets the propertyID associated with the Universal Analytics tag for an AMP container', () => {
				const liveContainerVersion = factories.buildLiveContainerVersionAMP( { propertyID: 'UA-123456789-1' } );
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

				const propertyID = registry.select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalContainerID );

				expect( propertyID ).toBe( 'UA-123456789-1' );
			} );

			it( 'returns null if no Analytics tag exists in the container', () => {
				const liveContainerVersion = factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

				const propertyID = registry.select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalContainerID );

				expect( propertyID ).toStrictEqual( null );
			} );

			it( 'returns undefined if the live container version is not loaded yet', () => {
				const liveContainerVersion = factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );

				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/ );
				const propertyID = registry.select( STORE_NAME ).getLiveContainerAnalyticsPropertyID( accountID, internalContainerID );

				expect( propertyID ).toStrictEqual( undefined );
			} );
		} );

		describe( 'getLiveContainerVariable', () => {
			it( 'returns the variable object from the live container object by variable name', () => {
				const liveContainerVersion = fixtures.liveContainerVersions.web.noGAWithVariable;
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

				const variableName = 'Test Variable';
				const variableObject = registry.select( STORE_NAME ).getLiveContainerVariable( accountID, internalContainerID, variableName );

				expect( variableObject ).toEqual( liveContainerVersion.variable[ 0 ] );
			} );

			it( 'returns null if no variable exists by the given name', () => {
				const liveContainerVersion = fixtures.liveContainerVersions.web.noGAWithVariable;
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersion, { accountID, internalContainerID } );

				const variableName = 'Non-existent Variable';
				const variableObject = registry.select( STORE_NAME ).getLiveContainerVariable( accountID, internalContainerID, variableName );

				expect( variableObject ).toStrictEqual( null );
			} );

			it( 'returns null if no live container version exists', () => {
				const { accountID, internalContainerID } = parseIDs( factories.buildLiveContainerVersionWeb() );
				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( null, { accountID, internalContainerID } );

				const variableName = 'Test Variable';
				const variableObject = registry.select( STORE_NAME ).getLiveContainerVariable( accountID, internalContainerID, variableName );

				expect( variableObject ).toStrictEqual( null );
			} );

			it( 'returns undefined if the live container version is not loaded yet', () => {
				const { accountID, internalContainerID } = parseIDs( factories.buildLiveContainerVersionWeb() );
				const variableName = 'Test Variable';

				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/ );
				const variableObject = registry.select( STORE_NAME ).getLiveContainerVariable( accountID, internalContainerID, variableName );

				expect( variableObject ).toStrictEqual( undefined );
			} );
		} );

		describe( 'getLiveContainerVersion', () => {
			it( 'uses a resolver to make a network request', async () => {
				const liveContainerVersion = factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/,
					{ body: liveContainerVersion, status: 200 }
				);

				const initialContainerVersion = registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect( initialContainerVersion ).toEqual( undefined );
				await untilResolved( registry, STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID )
				).toEqual( liveContainerVersion );
			} );

			it( 'does not make a network request if the container version is already present', async () => {
				const liveContainerVersion = factories.buildLiveContainerVersionWeb();
				const { accountID, internalContainerID } = parseIDs( liveContainerVersion );

				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion(
					liveContainerVersion,
					{ accountID, internalContainerID }
				);

				expect(
					registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID )
				).toEqual( liveContainerVersion );

				await untilResolved( registry, STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'dispatches an error if the request fails', async () => {
				const { accountID, internalContainerID } = parseIDs( factories.buildLiveContainerVersionWeb() );
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/,
					{ body: errorResponse, status: 500 }
				);

				registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );
				await untilResolved( registry, STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( registry.select( STORE_NAME ).getErrorForSelector( 'getLiveContainerVersion', [ accountID, internalContainerID ] ) ).toEqual( errorResponse );
				expect( registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID ) ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );

			it( 'receives null if the container has no published version', async () => {
				const { accountID, internalContainerID } = parseIDs( factories.buildLiveContainerVersionWeb() );
				const notFoundResponse = {
					code: 404,
					message: 'Published container version not found',
					data: {
						status: 404,
						reason: 'notFound',
					},
				};

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/,
					{ body: notFoundResponse, status: 404 }
				);

				registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );
				await untilResolved( registry, STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( console ).toHaveErrored();
				expect( registry.select( STORE_NAME ).getError() ).toBeFalsy();
				expect( registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID ) ).toEqual( null );
			} );
		} );

		describe( 'getSingleAnalyticsPropertyID', () => {
			// Having multiple propertyIDs is currently only possible in secondary AMP
			// so we'll use that context for all of these tests.
			beforeEach( () => registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } ) );

			it( 'returns the single common property ID used by both containers', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-123456789-1',
					ampPropertyID: 'UA-123456789-1',
				} );

				const singleAnalyticsPropertyID = registry.select( STORE_NAME ).getSingleAnalyticsPropertyID();
				expect( singleAnalyticsPropertyID ).toBe( 'UA-123456789-1' );
			} );

			it( 'returns false if both containers don’t reference the same property ID', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-123456789-1',
					ampPropertyID: 'UA-9999999-9',
				} );

				const singleAnalyticsPropertyID = registry.select( STORE_NAME ).getSingleAnalyticsPropertyID();
				expect( singleAnalyticsPropertyID ).toBe( false );
			} );

			it( 'returns null if no Analytics property ID was found', () => {
				buildAndReceiveWebAndAMP();

				const singleAnalyticsPropertyID = registry.select( STORE_NAME ).getSingleAnalyticsPropertyID();
				expect( singleAnalyticsPropertyID ).toBe( null );
			} );
		} );

		describe( 'hasAnyAnalyticsPropertyID', () => {
			// Having multiple propertyIDs is currently only possible in secondary AMP
			// so we'll use that context for all of these tests.
			beforeEach( () => registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } ) );

			it( 'returns true if the web container has a property ID and the AMP container does not', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-12345-1',
				} );

				expect( registry.select( STORE_NAME ).hasAnyAnalyticsPropertyID() ).toBe( true );
			} );

			it( 'returns true if the AMP container has a property ID and the web container does not', () => {
				buildAndReceiveWebAndAMP( {
					ampPropertyID: 'UA-12345-1',
				} );

				expect( registry.select( STORE_NAME ).hasAnyAnalyticsPropertyID() ).toBe( true );
			} );

			it( 'returns true if both containers have a property ID, regardless of matching', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-99999-9',
					ampPropertyID: 'UA-12345-1',
				} );

				expect( registry.select( STORE_NAME ).hasAnyAnalyticsPropertyID() ).toBe( true );
			} );

			it( 'returns false if neither container has a property ID', () => {
				buildAndReceiveWebAndAMP();

				expect( registry.select( STORE_NAME ).hasAnyAnalyticsPropertyID() ).toBe( false );
			} );
		} );

		describe( 'hasMultipleAnalyticsPropertyIDs', () => {
			// Having multiple propertyIDs is currently only possible in secondary AMP
			// so we'll use that context for all of these tests.
			beforeEach( () => registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } ) );

			it( 'returns true if there are multiple IDs returned from getAnalyticsPropertyIDs', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-12345-1',
					ampPropertyID: 'UA-99999-9',
				} );

				expect( registry.select( STORE_NAME ).getAnalyticsPropertyIDs() ).toHaveLength( 2 );
				expect( registry.select( STORE_NAME ).hasMultipleAnalyticsPropertyIDs() ).toBe( true );
			} );

			it( 'returns true if one container has a property ID and the other does not', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-12345-1',
				} );

				expect( registry.select( STORE_NAME ).getAnalyticsPropertyIDs() ).toHaveLength( 2 );
				expect( registry.select( STORE_NAME ).hasMultipleAnalyticsPropertyIDs() ).toBe( true );
			} );

			it( 'returns false if both containers reference the same propertyID', () => {
				buildAndReceiveWebAndAMP( {
					webPropertyID: 'UA-12345-1',
					ampPropertyID: 'UA-12345-1',
				} );

				expect( registry.select( STORE_NAME ).getAnalyticsPropertyIDs() ).toHaveLength( 1 );
				expect( registry.select( STORE_NAME ).hasMultipleAnalyticsPropertyIDs() ).toBe( false );
			} );

			it( 'returns undefined if either container’s live container version is not loaded yet', () => {
				const accountID = '12345';
				registry.dispatch( STORE_NAME ).setAccountID( accountID );
				const liveContainerVersionWeb = factories.buildLiveContainerVersionWeb( { accountID } );
				parseIDs( liveContainerVersionWeb, ( { containerID, internalContainerID } ) => {
					registry.dispatch( STORE_NAME ).setContainerID( containerID );
					registry.dispatch( STORE_NAME ).setInternalContainerID( internalContainerID );
					registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion( liveContainerVersionWeb, { accountID, internalContainerID } );
				} );
				const liveContainerVersionAMP = factories.buildLiveContainerVersionAMP( { accountID } );
				parseIDs( liveContainerVersionAMP, ( { containerID, internalContainerID } ) => {
					registry.dispatch( STORE_NAME ).setAMPContainerID( containerID );
					registry.dispatch( STORE_NAME ).setInternalAMPContainerID( internalContainerID );
					// Live container version not received for AMP yet.
				} );

				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/ );
				expect( registry.select( STORE_NAME ).hasMultipleAnalyticsPropertyIDs() ).toStrictEqual( undefined );
			} );
		} );

		describe( 'isDoingGetLiveContainerVersion', () => {
			it( 'returns true while the live container version fetch is in progress', async () => {
				const accountID = '100';
				const internalContainerID = '200';

				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/ );
				expect(
					registry.select( STORE_NAME ).isDoingGetLiveContainerVersion( accountID, internalContainerID )
				).toBe( false );

				registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect(
					registry.select( STORE_NAME ).isDoingGetLiveContainerVersion( accountID, internalContainerID )
				).toBe( true );

				await untilResolved( registry, STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect(
					registry.select( STORE_NAME ).isDoingGetLiveContainerVersion( accountID, internalContainerID )
				).toBe( false );
			} );
		} );
	} );
} );
