/**
 * Analytics module data store: tags tests.
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
import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	subscribeUntil,
	unsubscribeFromAll,
	untilResolved,
} from 'tests/js/utils';
import * as fixtures from './__fixtures__';
import * as factories from './__factories__';

describe( 'modules/analytics tags', () => {
	let registry;
	const homeURL = 'http://example.com/';

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL } );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'getExistingTag', () => {
			it( 'gets the correct analytics tag', async () => {
				const expectedTag = 'UA-12345678-1';

				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{ body: factories.generateHTMLWithTag( expectedTag ), status: 200 }
				);

				registry.select( STORE_NAME ).getExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				const existingTag = registry.select( STORE_NAME ).getExistingTag();
				expect( existingTag ).toEqual( expectedTag );
			} );
		} );

		describe( 'getTagPermission', () => {
			it( 'returns true if a user has access to this tag', async () => {
				fetchMock.getOnce(
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
				fetchMock.getOnce(
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
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{ body: response, status: 500 }
				);

				const propertyID = fixtures.getTagPermissionsAccess.propertyID;

				registry.select( STORE_NAME ).getTagPermission( propertyID );
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).isFetchingGetTagPermission( propertyID ) === false,
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const permissionForTag = registry.select( STORE_NAME ).getTagPermission( propertyID );
				expect( permissionForTag ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'hasExistingTag', () => {
			it( 'returns true if an existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'UA-12345678-1' );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( hasExistingTag ).toEqual( true );
			} );

			it( 'returns false if no existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				// Ensure the proper parameters were sent.
				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( hasExistingTag ).toEqual( false );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns undefined if existing tag has not been loaded yet', async () => {
				fetchMock.get( { query: { tagverify: '1' } }, { status: 200 } );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				expect( hasExistingTag ).toEqual( undefined );

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( fetchMock ).toHaveFetchedTimes( 1 );
			} );
		} );

		describe( 'hasTagPermission', () => {
			it( 'makes a request via the getTagPermission selector if no tag has been loaded ', async () => {
				fetchMock.getOnce(
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

				registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
					accountID,
					permission,
				}, { propertyID } );

				const hasPermission = registry.select( STORE_NAME ).hasTagPermission( propertyID );

				// Ensure the proper parameters were sent.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getTagPermission', [ propertyID ] )
				);

				expect( hasPermission ).toEqual( true );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns false if no existing tag exists', async () => {
				const { accountID, permission, propertyID } = fixtures.getTagPermissionsNoAccess;

				registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
					accountID,
					permission,
				}, { propertyID } );

				const hasPermission = registry.select( STORE_NAME ).hasTagPermission( propertyID );

				// Ensure the proper parameters were sent.
				await subscribeUntil( registry, () => registry
					.select( STORE_NAME )
					.hasFinishedResolution( 'getTagPermission', [ propertyID ] )
				);

				expect( hasPermission ).toEqual( false );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'returns undefined if existing tag has not been loaded yet', async () => {
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/analytics\/data\/tag-permission/,
					{ body: fixtures.getTagPermissionsAccess, status: 200 }
				);

				const hasPermission = registry.select( STORE_NAME ).hasTagPermission( fixtures.getTagPermissionsNoAccess.propertyID );
				expect( hasPermission ).toEqual( undefined );
			} );
		} );

		describe( 'hasExistingTagPermission', () => {
			it( 'returns true if an existing tag exists and the user has permission for it', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'UA-12345678-1' );
				registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
					accountID: '12345678',
					permission: true,
				}, { propertyID: 'UA-12345678-1' } );

				const hasPermission = registry.select( STORE_NAME ).hasExistingTagPermission();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( hasPermission ).toEqual( true );
			} );

			it( 'returns false if an existing tag exists and the user does not have permission for it', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'UA-12345678-1' );
				registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
					accountID: '12345678',
					permission: false,
				}, { propertyID: 'UA-12345678-1' } );

				const hasPermission = registry.select( STORE_NAME ).hasExistingTagPermission();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( hasPermission ).toEqual( false );
			} );

			it( 'returns null if no existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );

				const hasPermission = registry.select( STORE_NAME ).hasExistingTagPermission();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( hasPermission ).toEqual( null );
				expect( fetchMock ).not.toHaveFetched();
			} );
		} );
	} );
} );
