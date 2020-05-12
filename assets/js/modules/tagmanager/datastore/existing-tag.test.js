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
import {
	createTestRegistry,
	muteConsole,
	subscribeUntil,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as factories from './__factories__';

describe( 'modules/tagmanager existing-tag', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		// No non-fetch actions to test yet.
		// Fetch actions are tested implicitly by their selectors.
	} );

	describe( 'selectors', () => {
		describe( 'getExistingTag', () => {
			it( 'uses a resolver to make a network request', async () => {
				const expectedTag = 'GTM-ABC0123';
				fetch
					.doMockOnceIf( /tagverify=1/ )
					.mockResponse(
						factories.generateHTMLWithTag( expectedTag ),
						{ status: 200 }
					);

				const initialExistingTag = registry.select( STORE_NAME ).getExistingTag();

				expect( initialExistingTag ).toEqual( undefined );
				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).getExistingTag() !== undefined
				);

				expect( registry.select( STORE_NAME ).getError() ).toBeFalsy();
				const existingTag = registry.select( STORE_NAME ).getExistingTag();
				expect( fetch ).toHaveBeenCalledTimes( 1 );
				expect( existingTag ).toEqual( expectedTag );
			} );

			it( 'does not make a network request if existingTag is present', async () => {
				registry.dispatch( STORE_NAME ).receiveExistingTag( 'GTM-ABC0123' );

				const existingTag = registry.select( STORE_NAME ).getExistingTag();

				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getExistingTag' )
				);

				expect( existingTag ).toEqual( 'GTM-ABC0123' );
				expect( fetch ).not.toHaveBeenCalled();
			} );

			it( 'does not make a network request if existingTag is null', async () => {
				registry.dispatch( STORE_NAME ).receiveExistingTag( null );

				const existingTag = registry.select( STORE_NAME ).getExistingTag();

				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getExistingTag' )
				);

				expect( existingTag ).toEqual( null );
				expect( fetch ).not.toHaveBeenCalled();
			} );

			it( 'receives null for the tag if the request fails', async () => {
				// This is a limitation of the current underlying `getExistingTag` function.
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetch
					.doMockOnceIf( /tagverify=1/ )
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.select( STORE_NAME ).getExistingTag();

				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getExistingTag' )
				);

				expect( fetch ).toHaveBeenCalledTimes( 1 );

				const existingTag = registry.select( STORE_NAME ).getExistingTag();
				expect( existingTag ).toEqual( null );
			} );
		} );

		describe( 'hasExistingTag', () => {
			it( 'returns true if an existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveExistingTag( 'GTM-G000GL3' );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				await subscribeUntil( registry,
					() => registry.select( STORE_NAME ).hasFinishedResolution( 'getExistingTag' )
				);

				expect( hasExistingTag ).toEqual( true );
			} );

			it( 'returns false if no existing tag exists', async () => {
				registry.dispatch( STORE_NAME ).receiveExistingTag( null );

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				// Ensure the proper parameters were sent.
				await subscribeUntil( registry, () =>
					registry.select( STORE_NAME ).hasFinishedResolution( 'getExistingTag' )
				);

				expect( hasExistingTag ).toEqual( false );
			} );

			it( 'returns undefined if existing tag has not been loaded yet', async () => {
				fetch
					.doMockOnceIf( /tagverify=1/ )
					.mockResponse(
						factories.generateHTMLWithTag(),
						{ status: 200 }
					);

				const hasExistingTag = registry.select( STORE_NAME ).hasExistingTag();

				expect( hasExistingTag ).toEqual( undefined );

				await subscribeUntil( registry, () =>
					registry.select( STORE_NAME ).hasFinishedResolution( 'getExistingTag' )
				);

				expect( fetch ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( 'hasTagPermission', () => {
		it( 'returns true if a user has access to this tag', async () => {
			const { account, containers } = factories.buildAccountWithContainers();
			const container = containers[ 0 ];
			fetch
				.doMockOnceIf(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/tag-permission/
				)
				.mockResponseOnce(
					JSON.stringify( { account, container } ),
					{ status: 200 }
				);

			const tag = container.publicId;
			const initialSelect = registry.select( STORE_NAME ).hasTagPermission( tag );

			// Ensure the proper parameters were sent.
			expect( fetch.mock.calls[ 0 ][ 0 ] ).toMatchQueryParameters(
				{
					tag,
				}
			);

			// The value will be undefined until the response is received.
			expect( initialSelect ).toEqual( undefined );
			await subscribeUntil( registry,
				() => registry.select( STORE_NAME ).hasFinishedResolution( 'hasTagPermission', [ tag ] ),
			);

			expect( fetch ).toHaveBeenCalledTimes( 1 );
			expect( registry.select( STORE_NAME ).hasTagPermission( tag ) ).toEqual( true );
		} );

		it( 'returns false if a user cannot access the requested tag', async () => {
			const response = {
				code: 'tag_manager_existing_tag_permission',
				message: 'no tag for you', // Real message is irrelevant :)
				data: { status: 403 },
			};
			fetch
				.doMockOnceIf(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/tag-permission/
				)
				.mockResponseOnce(
					JSON.stringify( response ),
					{ status: 403 }
				);

			const tag = 'GTM-ABC1234';

			muteConsole( 'error' ); // 403 response is expected.
			const initialSelect = registry.select( STORE_NAME ).hasTagPermission( tag );

			expect( initialSelect ).toEqual( undefined );
			await subscribeUntil( registry,
				() => registry.select( STORE_NAME ).hasFinishedResolution( 'hasTagPermission', [ tag ] ),
			);

			expect( fetch ).toHaveBeenCalledTimes( 1 );
			expect( registry.select( STORE_NAME ).hasTagPermission( tag ) ).toEqual( false );
		} );

		it( 'dispatches an error if the request fails', async () => {
			const response = {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			};
			fetch
				.doMockIf(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/tag-permission/
				)
				.mockResponse(
					JSON.stringify( response ),
					{ status: 500 }
				);

			const tag = 'GTM-ABC1234';

			muteConsole( 'error' ); // 500 response expected.
			registry.select( STORE_NAME ).hasTagPermission( tag );

			await subscribeUntil( registry,
				() => registry.select( STORE_NAME ).hasFinishedResolution( 'hasTagPermission', [ tag ] ),
			);

			expect( fetch ).toHaveBeenCalledTimes( 1 );
			expect( registry.select( STORE_NAME ).hasTagPermission( tag ) ).toEqual( undefined );
		} );
	} );
} );
