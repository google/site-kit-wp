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
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/tagmanager versions', () => {
	let registry;
	// Selectors
	let getError;
	let getLiveContainerVersion;
	let isDoingGetLiveContainerVersion;
	let hasFinishedResolution;
	// Actions
	let receiveLiveContainerVersion;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		( {
			getError,
			getLiveContainerVersion,
			isDoingGetLiveContainerVersion,
			hasFinishedResolution,
		} = registry.select( STORE_NAME ) );
		( {
			receiveLiveContainerVersion,
		} = registry.dispatch( STORE_NAME ) );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'receiveLiveContainerVersion', () => {
			const validContainerVersion = {};
			const validAccountID = '100';
			const invalidAccountID = '0000';
			const validInternalContainerID = '200';
			const invalidInternalContainerID = '00';

			it( 'requires a liveContainerVersion object', () => {
				expect( receiveLiveContainerVersion ).toThrow( 'a valid live container version is required to receive.' );
			} );

			it( 'requires a valid accountID', () => {
				expect( () => {
					receiveLiveContainerVersion( validContainerVersion, {
						accountID: invalidAccountID,
						internalContainerID: validInternalContainerID,
					} );
				} ).toThrow( 'a valid accountID is required to receive live container version.' );
			} );

			it( 'requires a valid internalContainerID', () => {
				expect( () => {
					receiveLiveContainerVersion( validContainerVersion, {
						accountID: validAccountID,
						internalContainerID: invalidInternalContainerID,
					} );
				} ).toThrow( 'a valid internalContainerID is required to receive live container version.' );
			} );

			it( 'does not throw with valid input', () => {
				expect( () => {
					receiveLiveContainerVersion( validContainerVersion, {
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

				const initialContainerVersion = getLiveContainerVersion( accountID, internalContainerID );

				expect( initialContainerVersion ).toEqual( undefined );
				await subscribeUntil( registry,
					() => hasFinishedResolution( 'getLiveContainerVersion', [ accountID, internalContainerID ] )
				);

				const liveContainerVersion = getLiveContainerVersion( accountID, internalContainerID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( liveContainerVersion ).toEqual( fixtures.liveContainerVersion );
			} );

			it( 'does not make a network request if the container version is already present', async () => {
				const accountID = fixtures.liveContainerVersion.accountId;
				const internalContainerID = fixtures.liveContainerVersion.containerId;

				receiveLiveContainerVersion( fixtures.liveContainerVersion, { accountID, internalContainerID } );

				const liveContainerVersion = getLiveContainerVersion( accountID, internalContainerID );
				await subscribeUntil( registry,
					() => hasFinishedResolution( 'getLiveContainerVersion', [ accountID, internalContainerID ] )
				);

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
				getLiveContainerVersion( accountID, internalContainerID );
				await subscribeUntil( registry,
					() => hasFinishedResolution( 'getLiveContainerVersion', [ accountID, internalContainerID ] )
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( getError() ).toEqual( errorResponse );
				expect( getLiveContainerVersion( accountID, internalContainerID ) ).toEqual( undefined );
			} );
		} );
		describe( 'isDoingGetLiveContainerVersion', () => {
			it( 'returns true while the live container version fetch is in progress', async () => {
				const accountID = '100';
				const internalContainerID = '200';

				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/live-container-version/ );
				expect( isDoingGetLiveContainerVersion( accountID, internalContainerID ) ).toBe( false );

				getLiveContainerVersion( accountID, internalContainerID );

				expect( isDoingGetLiveContainerVersion( accountID, internalContainerID ) ).toBe( true );

				await subscribeUntil( registry,
					() => hasFinishedResolution( 'getLiveContainerVersion', [ accountID, internalContainerID ] )
				);

				expect( isDoingGetLiveContainerVersion( accountID, internalContainerID ) ).toBe( false );
			} );
		} );
	} );
} );
