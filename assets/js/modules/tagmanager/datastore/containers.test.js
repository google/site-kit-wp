/**
 * `modules/tagmanager` data store: containers tests.
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
import { MODULES_TAGMANAGER, CONTEXT_WEB, CONTEXT_AMP } from './constants';
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
} from '../../../../../tests/js/utils';
import * as factories from './__factories__';
import * as fixtures from './__fixtures__';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';

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
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetSettings( defaultSettings );
	} );

	afterEach( () => {} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	describe( 'actions', () => {
		describe( 'createContainer', () => {
			it( 'creates a container and adds it to the store ', async () => {
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = fixtures.createContainer.accountId;
				const usageContext = fixtures.createContainer.usageContext[ 0 ];
				const containerName = 'sitekit';

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/create-container'
					),
					{ body: fixtures.createContainer, status: 200 }
				);

				await registry
					.dispatch( MODULES_TAGMANAGER )
					.createContainer( accountID, usageContext, {
						containerName,
					} );
				// Ensure the proper parameters were passed.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/create-container'
					),
					{
						method: 'POST',
						body: {
							data: {
								accountID,
								usageContext,
								name: containerName,
							},
						},
					}
				);

				const containers = registry
					.select( MODULES_TAGMANAGER )
					.getContainers( accountID );
				expect( containers ).toMatchObject( [
					fixtures.createContainer,
				] );
			} );

			it( 'sets isDoingCreateContainer ', async () => {
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = fixtures.createContainer.accountId;
				const usageContext = fixtures.createContainer.usageContext[ 0 ];

				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/create-container'
					)
				);
				const promise = registry
					.dispatch( MODULES_TAGMANAGER )
					.createContainer( accountID, usageContext, {
						containerName: 'sitekit',
					} );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.isDoingCreateContainer( accountID )
				).toEqual( true );

				await promise;

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.isDoingCreateContainer( accountID )
				).toEqual( false );
			} );

			it( 'dispatches an error if the request fails ', async () => {
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = fixtures.createContainer.accountId;
				const usageContext = fixtures.createContainer.usageContext[ 0 ];
				const containerName = 'sitekit';
				const errorResponse = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};

				fetchMock.postOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/create-container'
					),
					{ body: errorResponse, status: 500 }
				);

				const { error } = await registry
					.dispatch( MODULES_TAGMANAGER )
					.createContainer( accountID, usageContext, {
						containerName,
					} );

				expect( error ).toEqual( errorResponse );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getErrorForAction( 'createContainer', [
							accountID,
							usageContext,
							{ containerName },
						] )
				).toEqual( errorResponse );

				// Ignore the request fired by the `getContainers` selector.
				muteFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/containers'
					),
					[]
				);
				const containers = registry
					.select( MODULES_TAGMANAGER )
					.getContainers( accountID );
				// No properties should have been added yet, as the container creation failed.
				expect( containers ).toEqual( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getContainers( accountID );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'selectContainerByID', () => {
			it( 'sets the containerID and internalContainerID for a web container', async () => {
				const { account, containers } =
					factories.buildAccountWithContainers( {
						container: { usageContext: [ CONTEXT_WEB ] },
					} );
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = account.accountId;

				const [ container ] = containers;
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAccountID( accountID );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetContainers( containers, { accountID } );

				expect(
					registry.select( MODULES_TAGMANAGER ).getContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalContainerID()
				).toBe( '' );

				await registry
					.dispatch( MODULES_TAGMANAGER )
					// eslint-disable-next-line sitekit/acronym-case
					.selectContainerByID( container.publicId );

				expect(
					registry.select( MODULES_TAGMANAGER ).getContainerID()
					// eslint-disable-next-line sitekit/acronym-case
				).toBe( container.publicId );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalContainerID()
					// eslint-disable-next-line sitekit/acronym-case
				).toBe( container.containerId );
			} );

			it( 'sets the ampContainerID and internalAMPContainerID for an AMP container', async () => {
				const { account, containers } =
					factories.buildAccountWithContainers( {
						container: { usageContext: [ CONTEXT_AMP ] },
					} );
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = account.accountId;

				const [ container ] = containers;
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAccountID( accountID );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetContainers( containers, { accountID } );

				expect(
					registry.select( MODULES_TAGMANAGER ).getAMPContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalAMPContainerID()
				).toBe( '' );

				await registry
					.dispatch( MODULES_TAGMANAGER )
					// eslint-disable-next-line sitekit/acronym-case
					.selectContainerByID( container.publicId );

				expect(
					registry.select( MODULES_TAGMANAGER ).getAMPContainerID()
					// eslint-disable-next-line sitekit/acronym-case
				).toBe( container.publicId );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalAMPContainerID()
					// eslint-disable-next-line sitekit/acronym-case
				).toBe( container.containerId );
			} );

			it( 'does nothing for a containerID that does not exist in state', async () => {
				registry.dispatch( MODULES_TAGMANAGER ).setAccountID( '12345' );
				expect(
					registry.select( MODULES_TAGMANAGER ).getContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalContainerID()
				).toBe( '' );
				expect(
					registry.select( MODULES_TAGMANAGER ).getAMPContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalAMPContainerID()
				).toBe( '' );

				muteFetch(
					'path:/google-site-kit/v1/modules/tagmanager/data/containers',
					[]
				);
				await registry
					.dispatch( MODULES_TAGMANAGER )
					.selectContainerByID( 'GTM-GXXXXGL3' );

				expect(
					registry.select( MODULES_TAGMANAGER ).getContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalContainerID()
				).toBe( '' );
				expect(
					registry.select( MODULES_TAGMANAGER ).getAMPContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalAMPContainerID()
				).toBe( '' );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getContainerByID', () => {
			it( 'returns undefined for a container ID that does not belong to a container in state', async () => {
				muteFetch(
					'path:/google-site-kit/v1/modules/tagmanager/data/containers',
					[]
				);
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getContainerByID( '12345', 'GTM-GXXXXGL3' )
				).toBe( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getContainers( '12345' );
			} );

			it( 'returns the full container object for a container in state with a matching publicId', () => {
				const { account, containers } =
					factories.buildAccountWithContainers( { count: 5 } );
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = account.accountId;
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetContainers( containers, { accountID } );
				const container = containers[ 2 ];

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						// eslint-disable-next-line sitekit/acronym-case
						.getContainerByID( accountID, container.publicId )
				).toEqual( container );
			} );
		} );

		describe( 'getContainers', () => {
			it( 'uses a resolver to make a network request', async () => {
				const { account, containers } =
					factories.buildAccountWithContainers();
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = account.accountId;

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/containers'
					),
					{ body: containers, status: 200 }
				);

				const initialContainers = registry
					.select( MODULES_TAGMANAGER )
					.getContainers( accountID );

				expect( initialContainers ).toEqual( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getContainers( accountID );

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/containers'
					),
					{
						query: { accountID },
					}
				);

				const resolvedContainers = registry
					.select( MODULES_TAGMANAGER )
					.getContainers( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect( resolvedContainers ).toEqual( containers );
			} );

			it( 'does not make a network request if containers for this account are already present', async () => {
				const { account, containers } =
					factories.buildAccountWithContainers();
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = account.accountId;

				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetContainers( containers, { accountID } );

				const resolvedContainers = registry
					.select( MODULES_TAGMANAGER )
					.getContainers( accountID );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getContainers( accountID );

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
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/containers'
					),
					{ body: errorResponse, status: 500 }
				);

				registry
					.select( MODULES_TAGMANAGER )
					.getContainers( accountID );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getContainers( accountID );

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				const containers = registry
					.select( MODULES_TAGMANAGER )
					.getContainers( accountID );
				expect( containers ).toEqual( undefined );
				const error = registry
					.select( MODULES_TAGMANAGER )
					.getErrorForSelector( 'getContainers', [ accountID ] );
				expect( error ).toEqual( errorResponse );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'getWebContainers', () => {
			it( 'uses the getContainers resolver to make a network request', async () => {
				const account = factories.accountBuilder();
				const containers = factories.buildContainers( 3, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_WEB ],
				} );
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = account.accountId;

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/containers'
					),
					{ body: containers, status: 200 }
				);

				const initialContainers = registry
					.select( MODULES_TAGMANAGER )
					.getWebContainers( accountID );

				expect( initialContainers ).toEqual( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getContainers( accountID );

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/containers'
					),
					{
						query: { accountID },
					}
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getWebContainers( accountID )
				).toEqual( containers );
			} );

			it( 'returns only containers with a web usageContext', () => {
				const account = factories.accountBuilder();
				const webContainers = factories.buildContainers( 3, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_WEB ],
				} );
				const ampContainers = factories.buildContainers( 3, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_AMP ],
				} );
				const containers = [ ...webContainers, ...ampContainers ];
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = account.accountId;

				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetContainers( containers, { accountID } );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getWebContainers( accountID )
				).toEqual( webContainers );
			} );
		} );

		describe( 'getAMPContainers', () => {
			it( 'uses the getContainers resolver to make a network request', async () => {
				const account = factories.accountBuilder();
				const containers = factories.buildContainers( 3, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_AMP ],
				} );
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = account.accountId;

				fetchMock.getOnce(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/containers'
					),
					{ body: containers, status: 200 }
				);

				const initialContainers = registry
					.select( MODULES_TAGMANAGER )
					.getAMPContainers( accountID );

				expect( initialContainers ).toEqual( undefined );

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getContainers( accountID );

				// Ensure the proper parameters were sent.
				expect( fetchMock ).toHaveFetched(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/containers'
					),
					{
						query: { accountID },
					}
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getAMPContainers( accountID )
				).toEqual( containers );
			} );

			it( 'returns only containers with an AMP usageContext', () => {
				const account = factories.accountBuilder();
				const webContainers = factories.buildContainers( 3, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_WEB ],
				} );
				const ampContainers = factories.buildContainers( 3, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_AMP ],
				} );
				const containers = [ ...webContainers, ...ampContainers ];
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = account.accountId;

				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetContainers( containers, { accountID } );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getAMPContainers( accountID )
				).toEqual( ampContainers );
			} );
		} );

		describe( 'getPrimaryContainerID', () => {
			it( 'returns undefined when isPrimaryAMP is not loaded', () => {
				const account = factories.accountBuilder();
				const [ webContainer ] = factories.buildContainers( 1, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_WEB ],
				} );
				const [ ampContainer ] = factories.buildContainers( 1, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_AMP ],
				} );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.setContainerID( webContainer );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAMPContainerID( ampContainer );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getPrimaryContainerID()
				).toBeUndefined();
			} );
			it( 'returns webContainer when isPrimaryAMP is false', () => {
				const account = factories.accountBuilder();
				const [ webContainer ] = factories.buildContainers( 1, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_WEB ],
				} );
				const [ ampContainer ] = factories.buildContainers( 1, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_AMP ],
				} );

				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					ampMode: 'reader',
				} );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.setContainerID( webContainer );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAMPContainerID( ampContainer );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getPrimaryContainerID()
				).toEqual( webContainer );
			} );
			it( 'returns ampContainer when isPrimaryAMP is true', () => {
				const account = factories.accountBuilder();
				const [ webContainer ] = factories.buildContainers( 1, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_WEB ],
				} );
				const [ ampContainer ] = factories.buildContainers( 1, {
					// eslint-disable-next-line sitekit/acronym-case
					accountId: account.accountId,
					usageContext: [ CONTEXT_AMP ],
				} );

				registry.dispatch( CORE_SITE ).receiveSiteInfo( {
					ampMode: 'primary',
				} );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.setContainerID( webContainer );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAMPContainerID( ampContainer );

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getPrimaryContainerID()
				).toEqual( ampContainer );
			} );
		} );
	} );
} );
