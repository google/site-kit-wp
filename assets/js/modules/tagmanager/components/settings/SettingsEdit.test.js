/**
 * Tag Manager Settings Edit component tests.
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
import { provideSiteInfo } from '../../../../../../tests/js/utils';
import { render, waitFor, createTestRegistry } from '../../../../../../tests/js/test-utils';
import { AMP_MODE_PRIMARY, AMP_MODE_SECONDARY } from '../../../../googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { withActive } from '../../../../googlesitekit/modules/datastore/__fixtures__';
import { STORE_NAME as CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { STORE_NAME, CONTEXT_WEB, CONTAINER_CREATE, FORM_SETUP, CONTEXT_AMP } from '../../datastore/constants';
import { buildAccountWithContainers } from '../../datastore/__factories__';
import SettingsEdit from './SettingsEdit';

describe( 'SettingsEdit', () => {
	const siteName = 'Test Site';

	let registry;
	let allContainers;

	beforeEach( () => {
		const args = {
			container: { usageContext: [ CONTEXT_WEB, CONTEXT_AMP ] },
			count: 5,
		};

		const { account, containers } = buildAccountWithContainers( args );
		const accountID = account.accountId; // eslint-disable-line sitekit/camelcase-acronyms

		registry = createTestRegistry();

		fetchMock.getOnce( /tagmanager\/data\/accounts/, { body: [ account ], status: 200 } );
		fetchMock.getOnce( /analytics\/data\/settings/, { body: {}, status: 200 } );

		provideSiteInfo( registry, { siteName } );

		registry.dispatch( CORE_MODULES ).receiveGetModules( withActive( 'tagmanager' ) );

		registry.dispatch( STORE_NAME ).setSettings( {} );
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		registry.dispatch( STORE_NAME ).setAccountID( accountID );
		registry.dispatch( STORE_NAME ).receiveGetContainers( containers, { accountID } );

		allContainers = containers;
	} );

	describe( 'new containers', () => {
		describe( 'with no AMP', () => {
			beforeEach( () => {
				registry.dispatch( STORE_NAME ).setContainerID( CONTAINER_CREATE );
				registry.dispatch( STORE_NAME ).setInternalContainerID( '' );
			} );

			it( 'should display a default container name when nothing is entered yet', async () => {
				const { container } = await waitFor( () => render( <SettingsEdit />, { registry } ) );
				expect( container.querySelector( '#containerName' ) ).toHaveValue( siteName );
			} );

			it( 'should use a domain name as a default value when siteName is empty', async () => {
				provideSiteInfo( registry, { siteName: '' } );
				const { container } = await waitFor( () => render( <SettingsEdit />, { registry } ) );
				expect( container.querySelector( '#containerName' ) ).toHaveValue( 'example.com' );
			} );

			it( 'should display an error when a non-unique container name is used', async () => {
				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, { containerName: allContainers[ 0 ].name } );

				const { container } = await waitFor( () => render( <SettingsEdit />, { registry } ) );

				expect( container.querySelector( '#containerName' ) ).toHaveValue( allContainers[ 0 ].name );
				expect( container.querySelector( '.googlesitekit-tagmanager-containername > .mdc-text-field' ) ).toHaveClass( 'mdc-text-field--error' );
			} );
		} );

		describe( 'with primary AMP', () => {
			beforeEach( () => {
				provideSiteInfo( registry, {
					siteName,
					ampMode: AMP_MODE_PRIMARY,
				} );

				registry.dispatch( STORE_NAME ).setAMPContainerID( CONTAINER_CREATE );
				registry.dispatch( STORE_NAME ).setInternalAMPContainerID( '' );
			} );

			it( 'should display a default container name when nothing is entered yet', async () => {
				const { container } = await waitFor( () => render( <SettingsEdit />, { registry } ) );
				expect( container.querySelector( '#ampContainerName' ) ).toHaveValue( `${ siteName } AMP` );
			} );

			it( 'should use a domain name as a default value when siteName is empty', async () => {
				provideSiteInfo( registry, { siteName: '' } );
				const { container } = await waitFor( () => render( <SettingsEdit />, { registry } ) );
				expect( container.querySelector( '#ampContainerName' ) ).toHaveValue( 'example.com AMP' );
			} );

			it( 'should display an error when a non-unique container name is used', async () => {
				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, { ampContainerName: allContainers[ 0 ].name } );

				const { container } = await waitFor( () => render( <SettingsEdit />, { registry } ) );

				expect( container.querySelector( '#ampContainerName' ) ).toHaveValue( allContainers[ 0 ].name );
				expect( container.querySelector( '.googlesitekit-tagmanager-containername > .mdc-text-field' ) ).toHaveClass( 'mdc-text-field--error' );
			} );
		} );

		describe( 'with secondary AMP', () => {
			beforeEach( () => {
				provideSiteInfo( registry, {
					siteName,
					ampMode: AMP_MODE_SECONDARY,
				} );

				registry.dispatch( STORE_NAME ).setContainerID( CONTAINER_CREATE );
				registry.dispatch( STORE_NAME ).setInternalContainerID( '' );

				registry.dispatch( STORE_NAME ).setAMPContainerID( CONTAINER_CREATE );
				registry.dispatch( STORE_NAME ).setInternalAMPContainerID( '' );
			} );

			it( 'should display default container names when nothing is entered yet', async () => {
				const { container } = await waitFor( () => render( <SettingsEdit />, { registry } ) );
				expect( container.querySelector( '#containerName' ) ).toHaveValue( siteName );
				expect( container.querySelector( '#ampContainerName' ) ).toHaveValue( `${ siteName } AMP` );
			} );

			it( 'should use domain name as default values when siteName is empty', async () => {
				provideSiteInfo( registry, { siteName: '' } );
				const { container } = await waitFor( () => render( <SettingsEdit />, { registry } ) );
				expect( container.querySelector( '#containerName' ) ).toHaveValue( 'example.com' );
				expect( container.querySelector( '#ampContainerName' ) ).toHaveValue( 'example.com AMP' );
			} );

			it( 'should display errors when non-unique container names are used', async () => {
				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
					containerName: allContainers[ 0 ].name,
					ampContainerName: allContainers[ 1 ].name,
				} );

				const { container } = await waitFor( () => render( <SettingsEdit />, { registry } ) );

				expect( container.querySelector( '#containerName' ) ).toHaveValue( allContainers[ 0 ].name );
				expect( container.querySelector( '.googlesitekit-tagmanager-containerName > .mdc-text-field' ) ).toHaveClass( 'mdc-text-field--error' );

				expect( container.querySelector( '#ampContainerName' ) ).toHaveValue( allContainers[ 1 ].name );
				expect( container.querySelector( '.googlesitekit-tagmanager-ampContainerName > .mdc-text-field' ) ).toHaveClass( 'mdc-text-field--error' );
			} );
		} );
	} );
} );
