/**
 * modules/tagmanager data store: existing-tag tests.
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
	muteConsole,
	muteFetch,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as factories from './__factories__';

describe( 'modules/tagmanager existing-tag', () => {
	let registry;
	const homeURL = 'http://example.com/';

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { homeURL } );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'selectors', () => {
		describe( 'getExistingTag', () => {
			it( 'gets the correct tagmanager tag', async () => {
				const expectedTag = 'GTM-S1T3K1T';

				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{ body: factories.generateHTMLWithTag( expectedTag ), status: 200 }
				);

				registry.select( STORE_NAME ).getExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				const existingTag = registry.select( STORE_NAME ).getExistingTag();
				expect( existingTag ).toEqual( expectedTag );
			} );

			it( 'does not make a network request if existingTag is present', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'GTM-S1T3K1T' );

				const existingTag = registry.select( STORE_NAME ).getExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( existingTag ).toEqual( 'GTM-S1T3K1T' );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'does not make a network request if existingTag is null', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );

				const existingTag = registry.select( STORE_NAME ).getExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( existingTag ).toEqual( null );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'receives null for the tag if the request fails', async () => {
				// This is a limitation of the current underlying `getExistingTag` function.
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					{ query: { tagverify: '1' } },
					{ body: errorResponse, status: 500 }
				);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const existingTag = registry.select( STORE_NAME ).getExistingTag();
				expect( existingTag ).toEqual( null );
			} );
		} );

		describe( 'getTagPermission', () => {
			it( 'uses a resolver to make a network request', async () => {
				// eslint-disable-next-line sitekit/camelcase-acronyms
				const { accountId: accountID, publicId: containerID } = factories.containerBuilder();
				const permission = true;
				const permissionResponse = { accountID, containerID, permission };
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/tag-permission/,
					{ body: permissionResponse, status: 200 }
				);

				// The value will be undefined until the response is received.
				expect( registry.select( STORE_NAME ).getTagPermission( containerID ) ).toEqual( undefined );

				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/tag-permission/,
					{
						query: { containerID },
					}
				);

				await untilResolved( registry, STORE_NAME ).getTagPermission( containerID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				// The value will be undefined until the response is received.
				expect( registry.select( STORE_NAME ).getTagPermission( containerID ) ).toEqual(
					{ accountID, permission }
				);
			} );

			it( 'dispatches an error if the request fails', async () => {
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/tag-permission/,
					{ body: errorResponse, status: 500 }
				);

				const containerID = 'GTM-ABC1234';

				muteConsole( 'error' ); // 500 response expected.
				registry.select( STORE_NAME ).hasTagPermission( containerID );

				await untilResolved( registry, STORE_NAME ).getTagPermission( containerID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( registry.select( STORE_NAME ).getTagPermission( containerID ) ).toEqual( undefined );
				expect( registry.select( STORE_NAME ).getErrorForSelector( 'getTagPermission', [ containerID ] ) ).toEqual( errorResponse );
			} );
		} );

		describe( 'hasExistingTag', () => {
			it( 'returns true if an existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( 'GTM-G000GL3' );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( hasExistingTag ).toEqual( true );
			} );

			it( 'returns false if no existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( hasExistingTag ).toEqual( false );
			} );

			it( 'returns undefined if existing tag has not been loaded yet', async () => {
				muteFetch();
				expect( registry.select( STORE_NAME ).hasExistingTag() ).toEqual( undefined );

				await untilResolved( registry, STORE_NAME ).getExistingTag();

				expect( registry.select( STORE_NAME ).hasExistingTag() ).not.toEqual( undefined );
			} );
		} );

		describe( 'hasTagPermission', () => {
			it( 'returns true if a user has access to this tag', async () => {
				const container = factories.containerBuilder();
				const permissionResponse = {
					// eslint-disable-next-line sitekit/camelcase-acronyms
					accountID: container.accountId,
					// eslint-disable-next-line sitekit/camelcase-acronyms
					containerID: container.publicId,
					permission: true,
				};
				// eslint-disable-next-line sitekit/camelcase-acronyms
				const containerID = container.publicId;
				registry.dispatch( STORE_NAME ).receiveGetTagPermission( permissionResponse, { containerID } );

				expect( registry.select( STORE_NAME ).hasTagPermission( containerID ) ).toEqual( true );
			} );

			it( 'returns false if a user cannot access the requested tag', async () => {
				const container = factories.containerBuilder();
				const permissionResponse = {
					// eslint-disable-next-line sitekit/camelcase-acronyms
					accountID: container.accountId,
					// eslint-disable-next-line sitekit/camelcase-acronyms
					containerID: container.publicId,
					permission: false,
				};
				// eslint-disable-next-line sitekit/camelcase-acronyms
				const containerID = container.publicId;
				registry.dispatch( STORE_NAME ).receiveGetTagPermission( permissionResponse, { containerID } );

				expect( registry.select( STORE_NAME ).hasTagPermission( containerID ) ).toEqual( false );
			} );

			it( 'returns undefined if the tag permission is not loaded yet', async () => {
				// eslint-disable-next-line sitekit/camelcase-acronyms
				const { publicId: containerID } = factories.containerBuilder();

				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/tag-permission/ );
				expect( registry.select( STORE_NAME ).hasTagPermission( containerID ) ).toEqual( undefined );

				await untilResolved( registry, STORE_NAME ).getTagPermission( containerID );
			} );
		} );
	} );
} );
