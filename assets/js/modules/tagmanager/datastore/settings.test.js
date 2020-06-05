/**
 * modules/tagmanager data store: settings tests.
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
import { STORE_NAME, ACCOUNT_CREATE, CONTAINER_CREATE, CONTEXT_WEB, CONTEXT_AMP } from './constants';
import { STORE_NAME as CORE_SITE, AMP_MODE_SECONDARY, AMP_MODE_PRIMARY } from '../../../googlesitekit/datastore/site/constants';
import * as fixtures from './__fixtures__';
import { accountBuilder, containerBuilder } from './__factories__';
import {
	createTestRegistry,
	unsubscribeFromAll,
	muteConsole,
} from '../../../../../tests/js/utils';
import { getItem, setItem } from '../../../googlesitekit/api/cache';
import { createCacheKey } from '../../../googlesitekit/api';

describe( 'modules/tagmanager settings', () => {
	let registry;
	// selectors
	let canSubmitChanges;

	// actions
	let setSettings;
	let submitChanges;
	let receiveSettings;
	let receiveExistingTag;
	let receiveTagPermission;

	const tagWithPermission = 'GTM-G000GL3';

	const validSettings = {
		accountID: '100',
		containerID: tagWithPermission,
		internalContainerID: '300',
		ampContainerID: '',
		internalAMPContainerID: '',
		useSnippet: true,
	};
	const validSettingsAMP = {
		accountID: '100',
		containerID: '',
		internalContainerID: '',
		ampContainerID: tagWithPermission,
		internalAMPContainerID: '300',
		useSnippet: true,
	};

	const WPError = {
		code: 'internal_error',
		message: 'Something wrong happened.',
		data: { status: 500 },
	};

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
		( {
			canSubmitChanges,
		} = registry.select( STORE_NAME ) );
		( {
			receiveSettings,
			receiveExistingTag,
			receiveTagPermission,
			setSettings,
			submitChanges,
		} = registry.dispatch( STORE_NAME ) );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	function setNoAMP() {
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: false } );
	}
	function setPrimaryAMP() {
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_PRIMARY } );
	}
	function setSecondaryAMP() {
		registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );
	}

	describe( 'actions', () => {
		beforeEach( () => {
			// Receive empty settings to prevent unexpected fetch by resolver.
			receiveSettings( {} );
		} );

		describe( 'submitChanges', () => {
			describe( 'with no AMP', () => {
				it( 'dispatches createContainer if the "set up a new container" option is chosen', async () => {
					setSettings( {
						...validSettings,
						accountID: '12345',
						containerID: CONTAINER_CREATE,
					} );
					const createdContainer = {
						...fixtures.createContainer,
					};

					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/
						)
						.mockResponseOnce(
							JSON.stringify( createdContainer ),
							{ status: 200 }
						)
						.doMockOnceIf( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/settings/ )
						.mockResponseOnce( async ( req ) => {
							const { data } = await req.json();
							// Return the same settings passed to the API.
							return JSON.stringify( data );
						} )
					;

					const result = await submitChanges();
					expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ) ).toMatchObject( {
						data: { accountID: '12345' },
					} );

					expect( result.error ).toBeFalsy();
					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( createdContainer.publicId );
					expect( registry.select( STORE_NAME ).getInternalContainerID() ).toBe( createdContainer.containerId );
				} );

				it( 'handles an error if set while creating a container', async () => {
					setSettings( {
						...validSettings,
						accountID: '12345',
						containerID: CONTAINER_CREATE,
					} );

					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/
						)
						.mockResponseOnce( JSON.stringify( WPError ), { status: 500 } );

					muteConsole( 'error' );
					await submitChanges();

					expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).data ).toMatchObject(
						{ accountID: '12345' }
					);

					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( CONTAINER_CREATE );
					expect( registry.select( STORE_NAME ).getError() ).toEqual( WPError );
				} );

				it( 'dispatches saveSettings', async () => {
					setSettings( validSettings );

					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/settings/
						)
						.mockResponseOnce(
							JSON.stringify( validSettings ),
							{ status: 200 }
						);

					await submitChanges();

					expect( fetch ).toHaveBeenCalled();
					expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).data ).toEqual( validSettings );
					expect( registry.select( STORE_NAME ).haveSettingsChanged() ).toBe( false );
				} );

				it( 'returns an error if saveSettings fails', async () => {
					setSettings( validSettings );

					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/settings/
						)
						.mockResponseOnce(
							JSON.stringify( WPError ),
							{ status: 500 }
						);

					muteConsole( 'error' );
					const result = await submitChanges();

					expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).data ).toEqual( validSettings );
					expect( result.error ).toEqual( WPError );
				} );

				it( 'invalidates module cache on success', async () => {
					setSettings( validSettings );

					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/settings/
						)
						.mockResponseOnce(
							JSON.stringify( validSettings ),
							{ status: 200 }
						);

					const cacheKey = createCacheKey( 'modules', 'tagmanager', 'arbitrary-datapoint' );
					expect( await setItem( cacheKey, 'test-value' ) ).toBe( true );
					expect( ( await getItem( cacheKey ) ).value ).not.toBeFalsy();

					await submitChanges();

					expect( ( await getItem( cacheKey ) ).value ).toBeFalsy();
				} );
			} );

			describe( 'with primary AMP', () => {
				beforeAll( () => setPrimaryAMP() );
				afterAll( () => setNoAMP() );

				it( 'dispatches createContainer for both web and AMP containers when selected', async () => {
					const account = accountBuilder();
					registry.dispatch( STORE_NAME ).setSettings( {
						...validSettings,
						containerID: CONTAINER_CREATE,
						ampContainerID: CONTAINER_CREATE,
					} );
					const createdWebContainer = containerBuilder( { accountId: account.accountId, usageContext: [ CONTEXT_WEB ] } );
					const createdAMPContainer = containerBuilder( { accountId: account.accountId, usageContext: [ CONTEXT_AMP ] } );

					const createContainerHandler = async ( req ) => {
						const { data } = await req.json();
						if ( CONTEXT_WEB === data.usageContext ) {
							return JSON.stringify( createdWebContainer );
						} else if ( CONTEXT_AMP === data.usageContext ) {
							return JSON.stringify( createdAMPContainer );
						}
						return Promise.reject();
					};

					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/,
							createContainerHandler
						)
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/,
							createContainerHandler
						)
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/settings/,
							async ( req ) => {
								const { data } = await req.json();
								// Return the same settings passed to the API.
								return JSON.stringify( data );
							}
						)
					;

					const { error } = await submitChanges();

					expect( error ).toBe( undefined );
					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( createdWebContainer.publicId );
					expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( createdAMPContainer.publicId );
				} );

				it( 'dispatches createContainer if the "set up a new container" option is chosen', async () => {
					setSettings( {
						...validSettings,
						accountID: '12345',
						ampContainerID: CONTAINER_CREATE,
					} );
					const createdAMPContainer = containerBuilder( { accountId: '12345', usageContext: [ CONTEXT_AMP ] } );

					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/
						)
						.mockResponseOnce( JSON.stringify( createdAMPContainer ), { status: 200 } )
						.doMockOnceIf( /^\/google-site-kit\/v1\/modules\/tagmanager\/data\/settings/ )
						.mockResponseOnce( async ( req ) => {
							const { data } = await req.json();
							// Return the same settings passed to the API.
							return JSON.stringify( data );
						} )
					;

					await submitChanges();

					expect( JSON.parse( fetch.mock.calls[ 0 ][ 1 ].body ).data ).toMatchObject(
						{ accountID: '12345' }
					);

					expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( createdAMPContainer.publicId );
				} );
			} );

			describe( 'with secondary AMP', () => {
				beforeAll( () => setSecondaryAMP() );
				afterAll( () => setNoAMP() );
				it( 'dispatches createContainer for both web and AMP containers when selected', async () => {
					const account = accountBuilder();
					registry.dispatch( STORE_NAME ).setSettings( {
						...validSettings,
						containerID: CONTAINER_CREATE,
						ampContainerID: CONTAINER_CREATE,
					} );
					const createdWebContainer = containerBuilder( { accountId: account.accountId, usageContext: [ CONTEXT_WEB ] } );
					const createdAMPContainer = containerBuilder( { accountId: account.accountId, usageContext: [ CONTEXT_AMP ] } );

					const createContainerHandler = async ( req ) => {
						const { data } = await req.json();
						if ( CONTEXT_WEB === data.usageContext ) {
							return JSON.stringify( createdWebContainer );
						} else if ( CONTEXT_AMP === data.usageContext ) {
							return JSON.stringify( createdAMPContainer );
						}
						return Promise.reject();
					};

					fetch
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/,
							createContainerHandler
						)
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/create-container/,
							createContainerHandler
						)
						.doMockOnceIf(
							/^\/google-site-kit\/v1\/modules\/tagmanager\/data\/settings/,
							async ( req ) => {
								const { data } = await req.json();
								// Return the same settings passed to the API.
								return JSON.stringify( data );
							}
						)
					;

					const { error } = await submitChanges();

					expect( error ).toBe( undefined );
					expect( registry.select( STORE_NAME ).getContainerID() ).toBe( createdWebContainer.publicId );
					expect( registry.select( STORE_NAME ).getAMPContainerID() ).toBe( createdAMPContainer.publicId );
				} );
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isDoingSubmitChanges', () => {
			it( 'returns true while submitting changes', async () => {
				const { haveSettingsChanged, isDoingSubmitChanges } = registry.select( STORE_NAME );
				receiveSettings( validSettings );

				expect( haveSettingsChanged() ).toBe( false );
				expect( isDoingSubmitChanges() ).toBe( false );

				const promise = submitChanges();

				expect( isDoingSubmitChanges() ).toBe( true );

				await promise;

				expect( isDoingSubmitChanges() ).toBe( false );
			} );
		} );

		describe( 'canSubmitChanges', () => {
			it( 'requires a valid accountID', () => {
				setSettings( validSettings );
				receiveExistingTag( null );

				expect( canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setAccountID( '0' );

				expect( canSubmitChanges() ).toBe( false );
			} );

			it( 'requires a valid containerID (no AMP)', () => {
				setSettings( validSettings );
				receiveExistingTag( null );

				expect( canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setContainerID( '0' );

				expect( canSubmitChanges() ).toBe( false );
			} );

			it( 'requires a valid internal container ID (no AMP)', () => {
				setSettings( validSettings );
				receiveExistingTag( null );

				expect( canSubmitChanges() ).toBe( true );

				registry.dispatch( STORE_NAME ).setInternalContainerID( '0' );

				expect( canSubmitChanges() ).toBe( false );
			} );

			it( 'requires permissions for an existing tag when present', () => {
				setSettings( validSettings );
				receiveExistingTag( validSettings.containerID );
				receiveTagPermission( true, { tag: validSettings.containerID } );

				expect( registry.select( STORE_NAME ).canSubmitChanges() ).toBe( true );

				receiveTagPermission( false, { tag: validSettings.containerID } );

				expect( canSubmitChanges() ).toBe( false );
			} );

			it( 'supports creating a web container (no AMP)', () => {
				setSettings( validSettings );

				registry.dispatch( STORE_NAME ).setContainerID( CONTAINER_CREATE );

				expect( canSubmitChanges() ).toBe( true );
			} );

			it( 'supports creating an AMP container', () => {
				setPrimaryAMP();
				setSettings( validSettingsAMP );

				registry.dispatch( STORE_NAME ).setAMPContainerID( CONTAINER_CREATE );
				registry.dispatch( STORE_NAME ).setInternalAMPContainerID( '' );

				expect( canSubmitChanges() ).toBe( true );
			} );

			it( 'supports creating an AMP container and a web container (AMP secondary)', () => {
				setSecondaryAMP();
				setSettings( validSettings );

				registry.dispatch( STORE_NAME ).setContainerID( CONTAINER_CREATE );
				registry.dispatch( STORE_NAME ).setInternalContainerID( '' );
				registry.dispatch( STORE_NAME ).setAMPContainerID( CONTAINER_CREATE );
				registry.dispatch( STORE_NAME ).setInternalAMPContainerID( '' );

				expect( canSubmitChanges() ).toBe( true );
			} );

			it( 'does not support creating an account', () => {
				setSettings( validSettings );

				registry.dispatch( STORE_NAME ).setAccountID( ACCOUNT_CREATE );

				expect( canSubmitChanges() ).toBe( false );
			} );
		} );
	} );
} );
