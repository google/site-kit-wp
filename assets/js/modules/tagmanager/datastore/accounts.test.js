/**
 * `modules/tagmanager` data store: accounts tests.
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
import {
	CORE_SITE,
	AMP_MODE_PRIMARY,
	AMP_MODE_SECONDARY,
} from '../../../googlesitekit/datastore/site/constants';
import {
	MODULES_TAGMANAGER,
	ACCOUNT_CREATE,
	CONTEXT_WEB,
	CONTEXT_AMP,
	CONTAINER_CREATE,
} from './constants';
import {
	createTestRegistry,
	muteFetch,
	untilResolved,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';
import * as factories from './__factories__';
import * as fixtures from './__fixtures__';

describe( 'modules/tagmanager accounts', () => {
	let registry;

	const defaultSettings = {
		accountID: '',
		ampContainerID: '',
		containerID: '',
		internalAMPContainerID: '',
		internalContainerID: '',
		useSnippet: true,
	};

	const containersEndpoint = /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/;

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
		// Prevent fetches for existing tags.
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
		// Prevent error loading site info.
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'actions', () => {
		describe( 'resetAccounts', () => {
			it( 'sets accounts and related values back to their initial values', async () => {
				registry.dispatch( MODULES_TAGMANAGER ).setSettings( {
					accountID: '12345',
					ampContainerID: 'GTM-XYZ123',
					containerID: 'GTM-ABC123',
					internalAMPContainerID: '9876',
					internalContainerID: '8765',
					useSnippet: true,
				} );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetAccounts( fixtures.accounts );

				registry.dispatch( MODULES_TAGMANAGER ).resetAccounts();

				expect(
					registry.select( MODULES_TAGMANAGER ).getAccountID()
				).toBeUndefined();
				expect(
					registry.select( MODULES_TAGMANAGER ).getAMPContainerID()
				).toBeUndefined();
				expect(
					registry.select( MODULES_TAGMANAGER ).getContainerID()
				).toBeUndefined();
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalAMPContainerID()
				).toBeUndefined();

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.hasFinishedResolution( 'getAccounts', [] )
				).toBe( false );
				expect(
					registry.stores[ MODULES_TAGMANAGER ].store.getState()
						.accounts
				).toBeUndefined();

				// Other settings are left untouched.
				expect(
					registry.select( MODULES_TAGMANAGER ).getUseSnippet()
				).toBe( true );
			} );

			it( 'invalidates the resolver for getAccounts', async () => {
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetAccounts( fixtures.accounts );

				muteFetch( containersEndpoint, [] );
				registry.select( MODULES_TAGMANAGER ).getAccounts();

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getAccounts();

				registry.dispatch( MODULES_TAGMANAGER ).resetAccounts();

				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.hasFinishedResolution( 'getAccounts' )
				).toStrictEqual( false );
			} );
		} );

		describe( 'selectAccount', () => {
			it( 'does nothing when called with the same accountID', async () => {
				const accountID = '123';
				const containerID = 'GTM-S1T3K1T';
				const internalID = '12345';
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAccountID( accountID );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setContainerID( containerID );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setInternalContainerID( internalID );

				await registry
					.dispatch( MODULES_TAGMANAGER )
					.selectAccount( accountID );

				expect(
					registry.select( MODULES_TAGMANAGER ).getAccountID()
				).toBe( accountID );
				expect(
					registry.select( MODULES_TAGMANAGER ).getContainerID()
				).toBe( containerID );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalContainerID()
				).toBe( internalID );
			} );

			it( 'sets the accountID and clears all container-related selections', async () => {
				registry.dispatch( MODULES_TAGMANAGER ).setAccountID( '123' );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setContainerID( 'GTM-S1T3K1T' );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setInternalContainerID( '12345' );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAMPContainerID( 'GTM-AMP1234' );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setInternalAMPContainerID( '92345' );

				// Since ACCOUNT_CREATE is a valid choice but not a valid account ID,
				// it will still be selected but subsequent container selections will be skipped.
				await registry
					.dispatch( MODULES_TAGMANAGER )
					.selectAccount( ACCOUNT_CREATE );

				expect(
					registry.select( MODULES_TAGMANAGER ).getAccountID()
				).toBe( ACCOUNT_CREATE );
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

			it( 'supports asynchronous container resolution', async () => {
				const {
					account,
					containers,
				} = factories.buildAccountWithContainers( {
					container: { usageContext: [ CONTEXT_WEB ] },
					count: 3,
				} );

				// eslint-disable-next-line sitekit/acronym-case
				const { accountId: accountID } = account;
				const [ firstContainer ] = containers;

				expect(
					registry.select( MODULES_TAGMANAGER ).getAccountID()
				).toBe( '' );
				expect(
					registry.select( MODULES_TAGMANAGER ).getContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getWebContainers( accountID )
				).toBeUndefined();
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getAMPContainers( accountID )
				).toBeUndefined();

				fetchMock.getOnce( containersEndpoint, {
					body: JSON.stringify( containers ),
				} );

				await registry
					.dispatch( MODULES_TAGMANAGER )
					.selectAccount( accountID );

				expect( fetchMock ).toHaveFetched( containersEndpoint );

				expect(
					registry.select( MODULES_TAGMANAGER ).getAccountID()
				).toBe( accountID );
				expect(
					registry.select( MODULES_TAGMANAGER ).getContainerID()
				).toBe( firstContainer.publicId ); // eslint-disable-line sitekit/acronym-case
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalContainerID()
				).toBe( firstContainer.containerId ); // eslint-disable-line sitekit/acronym-case
				expect(
					registry.select( MODULES_TAGMANAGER ).getAMPContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getInternalAMPContainerID()
				).toBe( '' );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getWebContainers( accountID )
				).toEqual( containers );
				expect(
					registry
						.select( MODULES_TAGMANAGER )
						.getAMPContainers( accountID )
				).toEqual( [] );
			} );

			describe( 'with no AMP', () => {
				it( 'selects the first web container for the selected account', async () => {
					const {
						account,
						containers,
					} = factories.buildAccountWithContainers( {
						container: { usageContext: [ CONTEXT_WEB ] },
						count: 3,
					} );
					const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
					const [ firstContainer ] = containers;
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetContainers( containers, { accountID } );

					await registry
						.dispatch( MODULES_TAGMANAGER )
						.selectAccount( accountID );

					expect(
						registry.select( MODULES_TAGMANAGER ).getContainerID()
					).toBe( firstContainer.publicId ); // eslint-disable-line sitekit/acronym-case
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalContainerID()
					).toBe( firstContainer.containerId ); // eslint-disable-line sitekit/acronym-case
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getAMPContainerID()
					).toBe( '' );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalAMPContainerID()
					).toBe( '' );
				} );

				it( 'selects "set up a new container" if there are none', async () => {
					const accountID = '123';
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetContainers( [], { accountID } );

					await registry
						.dispatch( MODULES_TAGMANAGER )
						.selectAccount( accountID );

					expect(
						registry.select( MODULES_TAGMANAGER ).getContainerID()
					).toBe( CONTAINER_CREATE );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalContainerID()
					).toBe( '' );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getAMPContainerID()
					).toBe( '' );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalAMPContainerID()
					).toBe( '' );
				} );
			} );

			describe( 'with primary AMP', () => {
				beforeEach( () =>
					registry
						.dispatch( CORE_SITE )
						.receiveSiteInfo( { ampMode: AMP_MODE_PRIMARY } )
				);

				it( 'selects the first AMP container for the selected account', async () => {
					const {
						account,
						containers,
					} = factories.buildAccountWithContainers( {
						container: { usageContext: [ CONTEXT_AMP ] },
						count: 3,
					} );
					const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case
					const [ firstContainer ] = containers;
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetContainers( containers, { accountID } );

					await registry
						.dispatch( MODULES_TAGMANAGER )
						.selectAccount( accountID );

					expect(
						registry.select( MODULES_TAGMANAGER ).getContainerID()
					).toBe( '' );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalContainerID()
					).toBe( '' );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getAMPContainerID()
					).toBe( firstContainer.publicId ); // eslint-disable-line sitekit/acronym-case
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalAMPContainerID()
					).toBe( firstContainer.containerId ); // eslint-disable-line sitekit/acronym-case
				} );

				it( 'selects "set up a new container" if there are none', async () => {
					const accountID = '123';
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetContainers( [], { accountID } );

					await registry
						.dispatch( MODULES_TAGMANAGER )
						.selectAccount( accountID );

					expect(
						registry.select( MODULES_TAGMANAGER ).getContainerID()
					).toBe( '' );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalContainerID()
					).toBe( '' );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getAMPContainerID()
					).toBe( CONTAINER_CREATE );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalAMPContainerID()
					).toBe( '' );
				} );
			} );

			describe( 'with secondary AMP', () => {
				beforeEach( () =>
					registry
						.dispatch( CORE_SITE )
						.receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } )
				);

				it( 'selects both first containers for the selected account', async () => {
					// eslint-disable-next-line sitekit/acronym-case
					const { accountId } = factories.accountBuilder();
					// eslint-disable-next-line sitekit/acronym-case
					const accountID = accountId;
					const webContainers = factories.buildContainers( 3, {
						// eslint-disable-next-line sitekit/acronym-case
						accountId,
						usageContext: [ CONTEXT_WEB ],
					} );
					const ampContainers = factories.buildContainers( 3, {
						// eslint-disable-next-line sitekit/acronym-case
						accountId,
						usageContext: [ CONTEXT_AMP ],
					} );
					const containers = [ ...webContainers, ...ampContainers ];
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetContainers( containers, { accountID } );

					await registry
						.dispatch( MODULES_TAGMANAGER )
						.selectAccount( accountID );

					expect(
						registry.select( MODULES_TAGMANAGER ).getContainerID()
					).toBe( webContainers[ 0 ].publicId ); // eslint-disable-line sitekit/acronym-case
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalContainerID()
					).toBe( webContainers[ 0 ].containerId ); // eslint-disable-line sitekit/acronym-case
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getAMPContainerID()
					).toBe( ampContainers[ 0 ].publicId ); // eslint-disable-line sitekit/acronym-case
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalAMPContainerID()
					).toBe( ampContainers[ 0 ].containerId ); // eslint-disable-line sitekit/acronym-case
				} );

				it( 'selects "set up a new container" if there are none', async () => {
					const accountID = '123';
					registry
						.dispatch( MODULES_TAGMANAGER )
						.receiveGetContainers( [], { accountID } );

					await registry
						.dispatch( MODULES_TAGMANAGER )
						.selectAccount( accountID );

					expect(
						registry.select( MODULES_TAGMANAGER ).getContainerID()
					).toBe( CONTAINER_CREATE );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalContainerID()
					).toBe( '' );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getAMPContainerID()
					).toBe( CONTAINER_CREATE );
					expect(
						registry
							.select( MODULES_TAGMANAGER )
							.getInternalAMPContainerID()
					).toBe( '' );
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'getAccounts', () => {
			it( 'uses a resolver to make a network request', async () => {
				fetchMock.get(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/,
					{ body: fixtures.accounts, status: 200 }
				);
				// Mute fetch for containers request triggered in the resolver from auto-selecting first account.
				muteFetch( containersEndpoint, [] );
				const initialAccounts = registry
					.select( MODULES_TAGMANAGER )
					.getAccounts();

				expect( initialAccounts ).toBeUndefined();
				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getAccounts();

				const accounts = registry
					.select( MODULES_TAGMANAGER )
					.getAccounts();
				expect( fetchMock ).toHaveFetchedTimes(
					1,
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/
				);
				expect( accounts ).toEqual( fixtures.accounts );
			} );

			it( 'does not make a network request if accounts are already present', async () => {
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetAccounts( fixtures.accounts );

				// Mute fetch for containers request triggered in the resolver from auto-selecting first account.
				muteFetch( containersEndpoint, [] );
				const accounts = registry
					.select( MODULES_TAGMANAGER )
					.getAccounts();

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getAccounts();

				expect( accounts ).toEqual( fixtures.accounts );
				expect( fetchMock ).not.toHaveFetched(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/
				);
			} );

			it( 'does not make a network request if accounts exist but are empty (this is a valid state)', async () => {
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetAccounts( [] );

				const accounts = registry
					.select( MODULES_TAGMANAGER )
					.getAccounts();

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getAccounts();

				expect( accounts ).toEqual( [] );
				expect( fetchMock ).not.toHaveFetched();
			} );

			it( 'dispatches an error if the request fails', async () => {
				const response = {
					code: 'internal_server_error',
					message: 'Internal server error',
					data: { status: 500 },
				};
				fetchMock.get(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/,
					{ body: response, status: 500 }
				);

				registry.select( MODULES_TAGMANAGER ).getAccounts();

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getAccounts();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const accounts = registry
					.select( MODULES_TAGMANAGER )
					.getAccounts();
				expect( accounts ).toBeUndefined();
				expect( console ).toHaveErrored();
			} );
		} );
	} );
} );
