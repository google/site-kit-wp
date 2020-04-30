/**
 * modules/tagmanager data store: containers tests.
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
import * as fixtures from './__fixtures__';

describe( 'modules/tagmanager containers', () => {
	let registry;

	const defaultSettings = {
		accountID: '',
		ampContainerID: '',
		containerID: '',
		internalAMPContainerID: '',
		internalContainerID: '',
		useSnippet: true,
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Preload default settings to prevent the resolver from making unexpected requests
		// as this is covered in settings store tests.
		registry.dispatch( STORE_NAME ).receiveSettings( defaultSettings );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'createContainer', () => {
			it( 'creates a container and adds it to the store ', async () => {
				const accountID = fixtures.createContainer.accountId; // Capitalization rule exception: `accountId`
				const usageContext = fixtures.createContainer.usageContext[ 0 ];
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/
					)
					.mockResponse(
						JSON.stringify( fixtures.createContainer ),
						{ status: 200 }
					);

				await registry.dispatch( STORE_NAME ).createContainer( accountID, usageContext );
				// Ensure the proper parameters were passed.
				expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).data ).toEqual(
					{ accountID, usageContext }
				);

				const containers = registry.select( STORE_NAME ).getContainers( accountID );
				expect( containers ).toMatchObject( [ fixtures.createContainer ] );
			} );

			it( 'sets isDoingCreateContainer ', async () => {
				const accountID = fixtures.createContainer.accountId; // Capitalization rule exception: `accountId`
				const usageContext = fixtures.createContainer.usageContext[ 0 ];
				fetch
					.doMockIf(
						/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/
					)
					.mockResponse(
						JSON.stringify( fixtures.createContainer ),
						{ status: 200 }
					);

				const promise = registry.dispatch( STORE_NAME ).createContainer( accountID, usageContext );
				expect( registry.select( STORE_NAME ).isDoingCreateContainer( accountID ) ).toEqual( true );

				await promise;

				expect( registry.select( STORE_NAME ).isDoingCreateContainer( accountID ) ).toEqual( false );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const accountID = fixtures.createContainer.accountId; // Capitalization rule exception: `accountId`
				const usageContext = fixtures.createContainer.usageContext[ 0 ];
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetch
					.doMockIf( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/ )
					.mockResponse(
						JSON.stringify( response ),
						{ status: 500 }
					);

				muteConsole( 'error' );
				registry.dispatch( STORE_NAME ).createContainer( accountID, usageContext );

				await subscribeUntil( registry, () => registry.select( STORE_NAME ).getError() );

				expect( registry.select( STORE_NAME ).getError() ).toMatchObject( response );

				// Ignore the request fired by the `getContainers` selector.
				muteConsole( 'error' );
				const containers = registry.select( STORE_NAME ).getContainers( accountID );
				// No properties should have been added yet, as the container creation failed.
				expect( containers ).toEqual( undefined );
			} );
		} );
	} );

	describe( 'selectors', () => {

	} );
} );
