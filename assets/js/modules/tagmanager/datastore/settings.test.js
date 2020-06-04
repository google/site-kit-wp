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
import { STORE_NAME, ACCOUNT_CREATE, CONTAINER_CREATE } from './constants';
import { STORE_NAME as CORE_SITE, AMP_MODE_SECONDARY, AMP_MODE_PRIMARY } from '../../../googlesitekit/datastore/site/constants';
import {
	createTestRegistry,
	unsubscribeFromAll,
} from '../../../../../tests/js/utils';

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

	describe( 'actions', () => {

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
			function setPrimaryAMP() {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_PRIMARY } );
			}
			function setSecondaryAMP() {
				registry.dispatch( CORE_SITE ).receiveSiteInfo( { ampMode: AMP_MODE_SECONDARY } );
			}

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
