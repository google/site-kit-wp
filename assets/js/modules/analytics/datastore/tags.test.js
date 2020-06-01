/**
 * modules/analytics data store: tags tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock-jest';

/**
 * Internal dependencies
 */
import API from 'googlesitekit-api';
import { STORE_NAME } from './constants';
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';

describe( 'modules/analytics tags', () => {
	let registry;
	let store;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		store = registry.stores[ STORE_NAME ].store;
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
		fetchMock.restore();
		fetchMock.mockClear();
	} );

	describe( 'actions', () => {

	} );

	describe( 'selectors', () => {
		describe( 'getTagPermission', () => {
			it( 'returns true if a user has access to this tag', async () => {
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{ body: fixtures.getTagPermissionsAccess, status: 200 }
				);

				const propertyID = fixtures.getTagPermissionsAccess.propertyID;
				const accountID = fixtures.getTagPermissionsAccess.accountID;
				const permission = fixtures.getTagPermissionsAccess.permission;

				const initialSelect = registry.select( STORE_NAME ).getTagPermission( propertyID );

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{
						query: { propertyID },
					}
				);

				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialSelect ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getTagPermission( propertyID ) !== undefined
					),
				);

				const permissionForTag = registry.select( STORE_NAME ).getTagPermission( propertyID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( permissionForTag ).toEqual( {
					accountID,
					permission,
				} );
			} );

			it( 'returns false if a user cannot access the requested tag', async () => {
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{ body: fixtures.getTagPermissionsNoAccess, status: 200 }
				);

				const propertyID = fixtures.getTagPermissionsNoAccess.propertyID;
				const accountID = fixtures.getTagPermissionsNoAccess.accountID;
				const permission = fixtures.getTagPermissionsNoAccess.permission;

				const initialSelect = registry.select( STORE_NAME ).getTagPermission( propertyID );
				// The connection info will be its initial value while the connection
				// info is fetched.
				expect( initialSelect ).toEqual( undefined );
				await subscribeUntil( registry,
					() => (
						registry.select( STORE_NAME ).getTagPermission( propertyID ) !== undefined
					),
				);

				const permissionForTag = registry.select( STORE_NAME ).getTagPermission( propertyID );
				expect( fetchMock ).toHaveFetchedTimes( 1 );

				expect( permissionForTag ).toEqual( {
					accountID,
					permission,
				} );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{ body: response, status: 500 }
				);

				const propertyID = fixtures.getTagPermissionsAccess.propertyID;

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getTagPermission( propertyID );
				await subscribeUntil( registry,
					// TODO: We may want a selector for this, but for now this is fine
					// because it's internal-only.
					() => store.getState().isFetchingTagPermission[ propertyID ] === false,
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const permissionForTag = registry.select( STORE_NAME ).getTagPermission( propertyID );
				expect( permissionForTag ).toEqual( undefined );
			} );
		} );

		describe( 'hasExistingTag', () => {
			it( 'returns true if an existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveExistingTag( 'UA-12345678-1' );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getExistingTag' )
				);

				expect( hasExistingTag ).toEqual( true );
			} );

			it( 'returns false if no existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveExistingTag( null );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				// Ensure the proper parameters were sent.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getExistingTag' )
				);

				expect( hasExistingTag ).toEqual( false );
				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );

			it( 'returns undefined if existing tag has not been loaded yet', async () => {
				fetchMock.get( { query: { tagverify: '1' } }, { status: 200 } );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				expect( hasExistingTag ).toEqual( undefined );

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getExistingTag' )
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );

		describe( 'hasTagPermission', () => {
			it( 'makes a request via the getTagPermission selector if no tag has been loaded ', async () => {
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{ body: fixtures.getTagPermissionsAccess, status: 200 }
				);

				const { propertyID } = fixtures.getTagPermissionsAccess;

				registry.select( STORE_NAME ).hasTagPermission( propertyID );
				// Ensure the proper parameters were sent.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getTagPermission', [ propertyID ] )
				);

				const hasPermission = registry.select( STORE_NAME ).hasTagPermission( propertyID );

				expect( hasPermission ).toEqual( true );
				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );

			it( "returns true if this user has permission to access this property's tag", async () => {
				const { accountID, permission, propertyID } = fixtures.getTagPermissionsAccess;

				registry.dispatch( STORE_NAME ).receiveTagPermission( {
					accountID,
					propertyID,
					permission,
				} );

				const hasPermission = registry.select( STORE_NAME ).hasTagPermission( propertyID );

				// Ensure the proper parameters were sent.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getTagPermission', [ propertyID ] )
				);

				expect( hasPermission ).toEqual( true );
				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );

			it( 'returns false if no existing tag exists', async () => {
				const { accountID, permission, propertyID } = fixtures.getTagPermissionsNoAccess;

				registry.dispatch( STORE_NAME ).receiveTagPermission( {
					accountID,
					propertyID,
					permission,
				} );

				const hasPermission = registry.select( STORE_NAME ).hasTagPermission( propertyID );

				// Ensure the proper parameters were sent.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getTagPermission', [ propertyID ] )
				);

				expect( hasPermission ).toEqual( false );
				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );

			it( 'returns undefined if existing tag has not been loaded yet', async () => {
				fetchMock.once(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{ body: fixtures.getTagPermissionsAccess, status: 200 }
				);

				const hasPermission = registry.select( STORE_NAME ).hasTagPermission( fixtures.getTagPermissionsNoAccess.propertyID );
				expect( hasPermission ).toEqual( undefined );
			} );
		} );

		describe( 'hasExistingTagPermission', () => {
			it( 'returns true if an existing tag exists and the user has permission for it', async () => {
				registry.dispatch( STORE_NAME ).receiveExistingTag( 'UA-12345678-1' );
				registry.dispatch( STORE_NAME ).receiveTagPermission( {
					accountID: '12345678',
					propertyID: 'UA-12345678-1',
					permission: true,
				} );

				const hasPermission = registry.select( STORE_NAME ).hasExistingTagPermission();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getExistingTag' )
				);

				expect( hasPermission ).toEqual( true );
			} );

			it( 'returns false if an existing tag exists and the user does not have permission for it', async () => {
				registry.dispatch( STORE_NAME ).receiveExistingTag( 'UA-12345678-1' );
				registry.dispatch( STORE_NAME ).receiveTagPermission( {
					accountID: '12345678',
					propertyID: 'UA-12345678-1',
					permission: false,
				} );

				const hasPermission = registry.select( STORE_NAME ).hasExistingTagPermission();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getExistingTag' )
				);

				expect( hasPermission ).toEqual( false );
			} );

			it( 'returns null if no existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveExistingTag( null );

				const hasPermission = registry.select( STORE_NAME ).hasExistingTagPermission();

				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getExistingTag' )
				);

				expect( hasPermission ).toEqual( null );
				expect( fetchMock ).toHaveFetchedTimes( 0 );
			} );
		} );
	} );
} );
