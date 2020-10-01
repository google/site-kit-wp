/**
 * modules/tagmanager data store: accounts tests.
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
import { STORE_NAME as CORE_SITE, AMP_MODE_PRIMARY, AMP_MODE_SECONDARY } from '../../../googlesitekit/datastore/site/constants';
import { STORE_NAME, ACCOUNT_CREATE, CONTEXT_WEB, CONTEXT_AMP, CONTAINER_CREATE } from './constants';
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

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Preload default settings to prevent the resolver from making unexpected requests
		// as this is covered in settings store tests.
		registry.dispatch( STORE_NAME ).receiveGetSettings( defaultSettings );
		// Prevent fetches for existing tags.
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
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
				registry.dispatch( STORE_NAME ).setSettings( {
					accountID: '12345',
					ampContainerID: 'GTM-XYZ123',
					containerID: 'GTM-ABC123',
					internalAMPContainerID: '9876',
					internalContainerID: '8765',
					useSnippet: true,
				} );
				registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );

				registry.dispatch( STORE_NAME ).resetAccounts();

				expect( registry.select( STORE_NAME ).getAccountID() ).toStrictEqual( undefined );
				expect( registry.select( STORE_NAME ).getAMPContainerID() ).toStrictEqual( undefined );
				expect( registry.select( STORE_NAME ).getContainerID() ).toStrictEqual( undefined );
				expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toStrictEqual( undefined );

				// getAccounts() will trigger a network request as resolver is invalidated.
				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/, [] );
				expect( registry.select( STORE_NAME ).getAccounts() ).toStrictEqual( undefined );

				// Other settings are left untouched.
				expect( registry.select( STORE_NAME ).getUseSnippet() ).toStrictEqual( true );
			} );

			it( 'invalidates the resolver for getAccounts', async () => {
				registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );

				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/, [] );
				registry.select( STORE_NAME ).getAccounts();

				await untilResolved( registry, STORE_NAME ).getAccounts();

				registry.dispatch( STORE_NAME ).resetAccounts();

				expect( registry.select( STORE_NAME ).hasFinishedResolution( 'getAccounts' ) ).toStrictEqual( false );
			} );
		} );

		describe( 'selectAccount', () => {
			it( 'does nothing when called with the same accountID', async () => {
				const accountID = '123';
				const containerID = 'GTM-S1T3K1T';
				const internalID = '12345';
				registry.dispatch( STORE_NAME ).setAccountID( accountID );
				registry.dispatch( STORE_NAME ).setContainerID( containerID );
				registry.dispatch( STORE_NAME ).setInternalContainerID( internalID );

				await registry.dispatch( STORE_NAME ).selectAccount( accountID );

				expect( registry.select( STORE_NAME ).getAccountID() ).toBe( accountID );
				expect( registry.select( STORE_NAME ).getContainerID() ).toBe( containerID );
				expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( internalID );
			} );

			it( 'sets the accountID and clears all container-related selections', async () => {
				registry.dispatch( STORE_NAME ).setAccountID( '123' );
				registry.dispatch( STORE_NAME ).setContainerID( 'GTM-S1T3K1T' );
				registry.dispatch( STORE_NAME ).setInternalContainerID( '12345' );
				registry.dispatch( STORE_NAME ).setAMPContainerID( 'GTM-AMP1234' );
				registry.dispatch( STORE_NAME ).setInternalAMPContainerID( '92345' );

				// Since ACCOUNT_CREATE is a valid choice but not a valid account ID,
				// it will still be selected but subsequent container selections will be skipped.
				await registry.dispatch( STORE_NAME ).selectAccount( ACCOUNT_CREATE );

				expect( registry.select( STORE_NAME ).getAccountID() ).toBe( ACCOUNT_CREATE );
				expect( registry.select( STORE_NAME ).getContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( '' );
			} );

			it( 'supports asynchronous container resolution', async () => {
				const { account, containers } = factories.buildAccountWithContainers( {
					container: { usageContext: [ CONTEXT_WEB ] },
					count: 3,
				} );
				const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms
				const [ firstContainer ] = containers;
				let resolveResponse;
				const responsePromise = new Promise( ( resolve ) => {
					resolveResponse = () => resolve( containers );
				} );
				fetchMock.getOnce(
					/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/,
					responsePromise
				);

				const promise = registry.dispatch( STORE_NAME ).selectAccount( accountID );

				expect( fetchMock ).toHaveFetched( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/ );
				expect( registry.select( STORE_NAME ).getAccountID() ).toBe( accountID );
				expect( registry.select( STORE_NAME ).getContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getWebContainers( accountID ) ).toBe( undefined );
				expect( registry.select( STORE_NAME ).getAMPContainers( accountID ) ).toBe( undefined );

				resolveResponse();
				await promise;

				expect( registry.select( STORE_NAME ).getAccountID() ).toBe( accountID );
				expect( registry.select( STORE_NAME ).getContainerID() ).toBe( firstContainer.publicId ); // eslint-disable-line sitekit/camelcase-acronyms
				expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( firstContainer.containerId ); // eslint-disable-line sitekit/camelcase-acronyms
				expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( '' );
				expect( registry.select( STORE_NAME ).getWebContainers( accountID ) ).toEqual( containers );
				expect( registry.select( STORE_NAME ).getAMPContainers( accountID ) ).toEqual( [] );
			} );

			describe( 'with no AMP', () => {
				it( 'selects the first web container for the selected account', async () => {
					const { account, containers } = factories.buildAccountWithContainers( {
						container: { usageContext: [ CONTEXT_WEB ] },
						count: 3,
					} );
					const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms
					const [ firstContainer ] = containers;
					registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );

					await registry.dispatch( STORE_NAME ).selectAccount( accountID );

					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( firstContainer.publicId ); // eslint-disable-line sitekit/camelcase-acronyms
					expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( firstContainer.containerId ); // eslint-disable-line sitekit/camelcase-acronyms
					expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( '' );
					expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( '' );
				} );

				it( 'selects "set up a new container" if there are none', async () => {
					const accountID = '123';
					registry.dispatch( STORE_NAME ).receiveGetContainers( [], { accountID } );

					await registry.dispatch( STORE_NAME ).selectAccount( accountID );

					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( CONTAINER_CREATE );
					expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( '' );
					expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( '' );
					expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( '' );
				} );
			} );

			describe( 'with primary AMP', () => {
				beforeEach( () => registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_PRIMARY } ) );

				it( 'selects the first AMP container for the selected account', async () => {
					const { account, containers } = factories.buildAccountWithContainers( {
						container: { usageContext: [ CONTEXT_AMP ] },
						count: 3,
					} );
					const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms
					const [ firstContainer ] = containers;
					registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );

					await registry.dispatch( STORE_NAME ).selectAccount( accountID );

					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( '' );
					expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( '' );
					expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( firstContainer.publicId ); // eslint-disable-line sitekit/camelcase-acronyms
					expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( firstContainer.containerId ); // eslint-disable-line sitekit/camelcase-acronyms
				} );

				it( 'selects "set up a new container" if there are none', async () => {
					const accountID = '123';
					registry.dispatch( STORE_NAME ).receiveGetContainers( [], { accountID } );

					await registry.dispatch( STORE_NAME ).selectAccount( accountID );

					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( '' );
					expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( '' );
					expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( CONTAINER_CREATE );
					expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( '' );
				} );
			} );

			describe( 'with secondary AMP', () => {
				beforeEach( () => registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } ) );

				it( 'selects both first containers for the selected account', async () => {
					const { accountId } = factories.accountBuilder(); // eslint-disable-line sitekit/camelcase-acronyms
					const accountID = accountId; // eslint-disable-line sitekit/camelcase-acronyms
					const webContainers = factories.buildContainers( 3, { accountId, usageContext: [ CONTEXT_WEB ] } ); // eslint-disable-line sitekit/camelcase-acronyms
					const ampContainers = factories.buildContainers( 3, { accountId, usageContext: [ CONTEXT_AMP ] } ); // eslint-disable-line sitekit/camelcase-acronyms
					const containers = [ ...webContainers, ...ampContainers ];
					registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );

					await registry.dispatch( STORE_NAME ).selectAccount( accountID );

					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( webContainers[ 0 ].publicId ); // eslint-disable-line sitekit/camelcase-acronyms
					expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( webContainers[ 0 ].containerId ); // eslint-disable-line sitekit/camelcase-acronyms
					expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( ampContainers[ 0 ].publicId ); // eslint-disable-line sitekit/camelcase-acronyms
					expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( ampContainers[ 0 ].containerId ); // eslint-disable-line sitekit/camelcase-acronyms
				} );

				it( 'selects "set up a new container" if there are none', async () => {
					const accountID = '123';
					registry.dispatch( STORE_NAME ).receiveGetContainers( [], { accountID } );

					await registry.dispatch( STORE_NAME ).selectAccount( accountID );

					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( CONTAINER_CREATE );
					expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( '' );
					expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( CONTAINER_CREATE );
					expect( registry.select( STORE_NAME ).getInternalAMPContainerID() ).toBe( '' );
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
				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/, [] );
				const initialAccounts = registry.select( STORE_NAME ).getAccounts();

				expect( initialAccounts ).toEqual( undefined );
				await untilResolved( registry, STORE_NAME ).getAccounts();

				const accounts = registry.select( STORE_NAME ).getAccounts();
				expect( fetchMock ).toHaveFetchedTimes( 1, /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/ );
				expect( accounts ).toEqual( fixtures.accounts );
			} );

			it( 'does not make a network request if accounts are already present', async () => {
				registry.dispatch( STORE_NAME ).receiveGetAccounts( fixtures.accounts );

				// Mute fetch for containers request triggered in the resolver from auto-selecting first account.
				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/containers/, [] );
				const accounts = registry.select( STORE_NAME ).getAccounts();

				await untilResolved( registry, STORE_NAME ).getAccounts();

				expect( accounts ).toEqual( fixtures.accounts );
				expect( fetchMock ).not.toHaveFetched( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/ );
			} );

			it( 'does not make a network request if accounts exist but are empty (this is a valid state)', async () => {
				registry.dispatch( STORE_NAME ).receiveGetAccounts( [] );

				const accounts = registry.select( STORE_NAME ).getAccounts();

				await untilResolved( registry, STORE_NAME ).getAccounts();

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

				registry.select( STORE_NAME ).getAccounts();

				await untilResolved( registry, STORE_NAME ).getAccounts();

				expect( fetchMock ).toHaveFetchedTimes( 1 );

				const accounts = registry.select( STORE_NAME ).getAccounts();
				expect( accounts ).toEqual( undefined );
				expect( console ).toHaveErrored();
			} );
		} );

		describe( 'isDoingGetAccounts', () => {
			it( 'returns true while the request is in progress', async () => {
				muteFetch( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/accounts/, [] );
				expect( registry.select( STORE_NAME ).isDoingGetAccounts() ).toBe( false );

				registry.select( STORE_NAME ).getAccounts();

				expect( registry.select( STORE_NAME ).isDoingGetAccounts() ).toBe( true );

				await untilResolved( registry, STORE_NAME ).getAccounts();

				expect( registry.select( STORE_NAME ).isDoingGetAccounts() ).toBe( false );
			} );
		} );
	} );
} );
