/**
 * Tag Manager module data store: containers tests.
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
import { STORE_NAME, CONTEXT_WEB, CONTEXT_AMP } from './constants';
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as factories from './__factories__';
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
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'createContainer', () => {
			it( 'creates a container and adds it to the store ', async () => {
				const accountID = fixtures.createContainer.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const usageContext = fixtures.createContainer.usageContext[ 0 ];
				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/,
					{ body: fixtures.createContainer, status: 200 }
				);

				await registry.dispatch( STORE_NAME ).createContainer( accountID, usageContext );
				// Ensure the proper parameters were passed.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/,
					{
						method: 'POST',
						body: {
							data: {
								accountID,
								usageContext,
							},
						},
					}
				);

				const containers = registry.select( STORE_NAME ).getContainers( accountID );
				expect( containers ).toMatchObject( [ fixtures.createContainer ] );
			} );

			it( 'sets isDoingCreateContainer ', async () => {
				const accountID = fixtures.createContainer.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const usageContext = fixtures.createContainer.usageContext[ 0 ];

				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/ );
				const promise = registry.dispatch( STORE_NAME ).createContainer( accountID, usageContext );
				expect( registry.select( STORE_NAME ).isDoingCreateContainer( accountID ) ).toEqual( true );

				await promise;

				expect( registry.select( STORE_NAME ).isDoingCreateContainer( accountID ) ).toEqual( false );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				const accountID = fixtures.createContainer.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const usageContext = fixtures.createContainer.usageContext[ 0 ];
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/,
					{ body: errorResponse, status: 500 }
				);

				const { error } = await registry.dispatch( STORE_NAME ).createContainer( accountID, usageContext );

				expect( error ).toEqual( errorResponse );
				expect( registry.select( STORE_NAME ).getErrorForAction( 'createContainer', [ accountID, usageContext ] ) ).toEqual( errorResponse );

				// Ignore the request fired by the `getContainers` selector.
				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/, [] );
				const containers = registry.select( STORE_NAME ).getContainers( accountID );
				// No properties should have been added yet, as the container creation failed.
				expect( containers ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'selectContainerByID', () => {
			it( 'sets the containerID and internalContainerID for a web container', async () => {
				const { account, containers } = factories.buildAccountWithContainers( {
					container: { usageContext: [ CONTEXT_WEB ] },
				} );
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const [ container ] = containers;
				registry.dispatch( STORE_NAME ).setAccountID( accountID );
				registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );
				expect( registry.select( STORE_NAME ).getContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( '' );

				await registry.dispatch( STORE_NAME ).selectContainerByID( container.publicId ); // eslint-disable-line sitekit/camelcase-acronyms

				expect( registry.select( STORE_NAME ).getContainerID() ).toBe( container.publicId ); // eslint-disable-line sitekit/camelcase-acronyms
				expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( container.containerId ); // eslint-disable-line sitekit/camelcase-acronyms
			} );

			it( 'sets the ampContainerID and internalAMPContainerID for an AMP container', async () => {
				const { account, containers } = factories.buildAccountWithContainers( {
					container: { usageContext: [ CONTEXT_AMP ] },
				} );
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const [ container ] = containers;
				registry.dispatch( STORE_NAME ).setAccountID( accountID );
				registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );
				expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( '' );

				await registry.dispatch( STORE_NAME ).selectContainerByID( container.publicId ); // eslint-disable-line sitekit/camelcase-acronyms

				expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( container.publicId ); // eslint-disable-line sitekit/camelcase-acronyms
				expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( container.containerId ); // eslint-disable-line sitekit/camelcase-acronyms
			} );

			it( 'does nothing for a containerID that does not exist in state', async () => {
				registry.dispatch( STORE_NAME ).setAccountID( '12345' );
				expect( registry.select( STORE_NAME ).getContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( '' );

				muteFetch( 'path:/google-site-kit/v1/modules/tagmanager/data/containers', [] );
				await registry.dispatch( STORE_NAME ).selectContainerByID( 'GTM-GXXXXGL3' );

				expect( registry.select( STORE_NAME ).getContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( '' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getContainerByID', () => {
			it( 'returns undefined for a container ID that does not belong to a container in state', () => {
				muteFetch( 'path:/google-site-kit/v1/modules/tagmanager/data/containers', [] );
				expect( registry.select( STORE_NAME ).getContainerByID( '12345', 'GTM-GXXXXGL3' ) ).toBe( undefined );
			} );

			it( 'returns the full container object for a container in state with a matching publicId', () => {
				const { account, containers } = factories.buildAccountWithContainers( { count: 5 } );
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );
				const container = containers[ 2 ];

				expect( registry.select( STORE_NAME ).getContainerByID( accountID, container.publicId ) ).toEqual( container ); // eslint-disable-line sitekit/camelcase-acronyms
			} );
		} );

		describe( 'getContainers', () => {
			it( 'uses a resolver to make a network request', async () => {
				const { account, containers } = factories.buildAccountWithContainers();
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/,
					{ body: containers, status: 200 }
				);

				const initialContainers = registry.select( STORE_NAME ).getContainers( accountID );

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/,
					{
						query: { accountID },
					}
				);

				expect( initialContainers ).toEqual( undefined );

				await untilResolved( registry, STORE_NAME ).getContainers( accountID );

				const resolvedContainers = registry.select( STORE_NAME ).getContainers( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( resolvedContainers ).toEqual( containers );
			} );

			it( 'does not make a network request if containers for this account are already present', async () => {
				const { account, containers } = factories.buildAccountWithContainers();
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms

				registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );

				const resolvedContainers = registry.select( STORE_NAME ).getContainers( accountID );

				await untilResolved( registry, STORE_NAME ).getContainers( accountID );

				expect( fetchMock ).not.toHaveFetched();
				expect( resolvedContainers ).toEqual( containers );
				expect( resolvedContainers ).toHaveLength( 1 );
			} );

			it( 'dispatches an error if the request fails', async () => {
				const accountID = '123';
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/,
					{ body: errorResponse, status: 500 }
				);

				registry.select( STORE_NAME ).getContainers( accountID );

				await untilResolved( registry, STORE_NAME ).getContainers( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				const containers = registry.select( STORE_NAME ).getContainers( accountID );
				expect( containers ).toEqual( undefined );
				const error = registry.select( STORE_NAME ).getErrorForSelector( 'getContainers', [ accountID ] );
				expect( error ).toEqual( errorResponse );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getWebContainers', () => {
			it( 'uses the getContainers resolver to make a network request', async () => {
				const account = factories.accountBuilder();
				const containers = factories.buildContainers(
					3, { accountId: account.accountId, usageContext: [ CONTEXT_WEB ] } // eslint-disable-line sitekit/camelcase-acronyms
				);
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/,
					{ body: containers, status: 200 }
				);

				const initialContainers = registry.select( STORE_NAME ).getWebContainers( accountID );

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/,
					{
						query: { accountID },
					}
				);

				expect( initialContainers ).toEqual( undefined );

				await untilResolved( registry, STORE_NAME ).getContainers( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry.select( STORE_NAME ).getWebContainers( accountID )
				).toEqual( containers );
			} );

			it( 'returns only containers with a web usageContext', () => {
				const account = factories.accountBuilder();
				const webContainers = factories.buildContainers(
					3, { accountId: account.accountId, usageContext: [ CONTEXT_WEB ] } // eslint-disable-line sitekit/camelcase-acronyms
				);
				const ampContainers = factories.buildContainers(
					3, { accountId: account.accountId, usageContext: [ CONTEXT_AMP ] } // eslint-disable-line sitekit/camelcase-acronyms
				);
				const containers = [ ...webContainers, ...ampContainers ];
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms

				registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );

				expect(
					registry.select( STORE_NAME ).getWebContainers( accountID )
				).toEqual( webContainers );
			} );
		} );

		describe( 'getAMPContainers', () => {
			it( 'uses the getContainers resolver to make a network request', async () => {
				const account = factories.accountBuilder();
				const containers = factories.buildContainers(
					3, { accountId: account.accountId, usageContext: [ CONTEXT_AMP ] } // eslint-disable-line sitekit/camelcase-acronyms
				);
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms

				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/,
					{ body: containers, status: 200 }
				);

				const initialContainers = registry.select( STORE_NAME ).getAMPContainers( accountID );

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/,
					{
						query: { accountID },
					}
				);

				expect( initialContainers ).toEqual( undefined );

				await untilResolved( registry, STORE_NAME ).getContainers( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry.select( STORE_NAME ).getAMPContainers( accountID )
				).toEqual( containers );
			} );

			it( 'returns only containers with an AMP usageContext', () => {
				const account = factories.accountBuilder();
				const webContainers = factories.buildContainers(
					3, { accountId: account.accountId, usageContext: [ CONTEXT_WEB ] } // eslint-disable-line sitekit/camelcase-acronyms
				);
				const ampContainers = factories.buildContainers(
					3, { accountId: account.accountId, usageContext: [ CONTEXT_AMP ] } // eslint-disable-line sitekit/camelcase-acronyms
				);
				const containers = [ ...webContainers, ...ampContainers ];
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms

				registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );

				expect(
					registry.select( STORE_NAME ).getAMPContainers( accountID )
				).toEqual( ampContainers );
			} );
		} );
	} );
} );
