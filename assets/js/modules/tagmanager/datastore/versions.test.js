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
	createTestRegistry,
	muteFetch,
	untilResolved,
	waitForDefaultTimeouts,
} from '../../../../../tests/js/utils';
import { parseLiveContainerVersionIDs as parseIDs } from './__factories__/utils';
import * as factories from './__factories__';
import * as fixtures from './__fixtures__';

describe( 'modules/tagmanager versions', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {} );

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

				await waitForDefaultTimeouts();
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

			it( 'dispatches an error if the request fails when access is denied', async () => {
				const { accountID, internalContainerID } = parseIDs(
					factories.buildLiveContainerVersionWeb()
				);
				const permissionDeniedResponse = {
					code: 404,
					message: 'Not found or permission denied.',
					data: {
						status: 404,
						reason: 'notFound',
					},
				};
				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					),
					{ body: permissionDeniedResponse, status: 404 }
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
				).toEqual( permissionDeniedResponse );
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

		describe( 'getLiveContainerGoogleTagID', () => {
			it( 'gets the googleTagID associated with the Google tag when provided directly', () => {
				const liveContainerVersion =
					fixtures.liveContainerVersions.web.googleTag;
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const googleTagID = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerGoogleTagID(
						accountID,
						internalContainerID
					);

				expect( googleTagID ).toBe( 'G-ABC12DE34F' );
			} );

			it( 'returns null if no Google tag exists in the container', () => {
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

				const googleTagID = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerGoogleTagID(
						accountID,
						internalContainerID
					);

				expect( googleTagID ).toStrictEqual( null );
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
				const googleTagID = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerGoogleTagID(
						accountID,
						internalContainerID
					);

				expect( googleTagID ).toStrictEqual( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( accountID, internalContainerID );
			} );

			it( 'gets the googleTagID associated with a constant variable', () => {
				const liveContainerVersion =
					fixtures.liveContainerVersions.web.googleTagWithVariable;
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const googleTagID = registry
					.select( MODULES_TAGMANAGER )
					.getLiveContainerGoogleTagID(
						accountID,
						internalContainerID
					);

				expect( googleTagID ).toBe( 'G-ABC12DE34F' );
			} );
		} );

		describe( 'getCurrentGTMGoogleTagID', () => {
			it( 'gets the googleTagID associated with the currently selected GTM account and container', () => {
				const liveContainerVersion =
					fixtures.liveContainerVersions.web.googleTag;
				const { accountID, internalContainerID } =
					parseIDs( liveContainerVersion );
				registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {
					accountID,
					internalContainerID,
				} );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetLiveContainerVersion( liveContainerVersion, {
						accountID,
						internalContainerID,
					} );

				const googleTagID = registry
					.select( MODULES_TAGMANAGER )
					.getCurrentGTMGoogleTagID( accountID, internalContainerID );

				expect( googleTagID ).toBe( 'G-ABC12DE34F' );
			} );
		} );
	} );
} );
