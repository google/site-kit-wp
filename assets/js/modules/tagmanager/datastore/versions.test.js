/**
 * modules/tagmanager data store: versions tests.
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
	muteConsole,
	muteFetch,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
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
		describe( 'getLiveContainerVersion', () => {
			it( 'uses a resolver to make a network request', async () => {
				const accountID = fixtures.liveContainerVersion.accountId;
				const internalContainerID = fixtures.liveContainerVersion.containerId;

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/,
					{ body: fixtures.liveContainerVersion, status: 200 }
				);

				const initialContainerVersion = registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect( initialContainerVersion ).toEqual( undefined );
				await untilResolved( registry, STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				const liveContainerVersion = registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( liveContainerVersion ).toEqual( fixtures.liveContainerVersion );
			} );

			it( 'does not make a network request if the container version is already present', async () => {
				const accountID = fixtures.liveContainerVersion.accountId;
				const internalContainerID = fixtures.liveContainerVersion.containerId;

				registry.dispatch( STORE_NAME ).receiveGetLiveContainerVersion(
					fixtures.liveContainerVersion,
					{ accountID, internalContainerID }
				);

				const liveContainerVersion = registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );
				await untilResolved( registry, STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect( liveContainerVersion ).toEqual( fixtures.liveContainerVersion );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'dispatches an error if the request fails', async () => {
				const accountID = fixtures.liveContainerVersion.accountId;
				const internalContainerID = fixtures.liveContainerVersion.containerId;
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/,
					{ body: errorResponse, status: 500 }
				);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );
				await untilResolved( registry, STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( registry.select( STORE_NAME ).getErrorForSelector( 'getLiveContainerVersion', [ accountID, internalContainerID ] ) ).toEqual( errorResponse );
				expect( registry.select( STORE_NAME ).getLiveContainerVersion( accountID, internalContainerID ) ).toEqual( undefined );
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
