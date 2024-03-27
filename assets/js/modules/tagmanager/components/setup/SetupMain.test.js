/**
 * Tag Manager Setup Main component tests.
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
import {
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import {
	render,
	createTestRegistry,
} from '../../../../../../tests/js/test-utils';
import {
	AMP_MODE_PRIMARY,
	AMP_MODE_SECONDARY,
} from '../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { withActive } from '../../../../googlesitekit/modules/datastore/__fixtures__';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_TAGMANAGER,
	CONTEXT_WEB,
	CONTAINER_CREATE,
	FORM_SETUP,
	CONTEXT_AMP,
} from '../../datastore/constants';
import { buildAccountWithContainers } from '../../datastore/__factories__';
import SetupMain from './SetupMain';

describe( 'SetupMain', () => {
	const siteName = 'Test Site';

	let registry;
	let allContainers;

	beforeEach( () => {
		const args = {
			container: { usageContext: [ CONTEXT_WEB, CONTEXT_AMP ] },
			count: 5,
		};

		const { account, containers } = buildAccountWithContainers( args );
		const accountID = account.accountId; // eslint-disable-line sitekit/acronym-case

		registry = createTestRegistry();

		fetchMock.getOnce( new RegExp( 'tagmanager/data/accounts' ), {
			body: [ account ],
			status: 200,
		} );
		fetchMock.getOnce( new RegExp( 'analytics-4/data/settings' ), {
			body: {},
			status: 200,
		} );

		provideSiteInfo( registry, { siteName } );
		provideUserAuthentication( registry );

		registry
			.dispatch( CORE_MODULES )
			.receiveGetModules( withActive( 'tagmanager' ) );

		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).receiveGetExistingTag( null );
		registry.dispatch( MODULES_TAGMANAGER ).setAccountID( accountID );
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetContainers( containers, { accountID } );

		allContainers = containers;
	} );

	describe( 'new containers', () => {
		describe( 'with no AMP', () => {
			beforeEach( () => {
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setContainerID( CONTAINER_CREATE );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setInternalContainerID( '' );
			} );

			it( 'should display a default container name when nothing is entered yet', async () => {
				const { container, waitForRegistry } = render( <SetupMain />, {
					registry,
				} );
				await waitForRegistry();
				expect(
					container.querySelector( '#containerName' )
				).toHaveValue( siteName );
			} );

			it( 'should use a domain name as a default value when siteName is empty', async () => {
				provideSiteInfo( registry, { siteName: '' } );
				const { container, waitForRegistry } = render( <SetupMain />, {
					registry,
				} );
				await waitForRegistry();
				expect(
					container.querySelector( '#containerName' )
				).toHaveValue( 'example.com' );
			} );

			it( 'should display an error when a non-unique container name is used', async () => {
				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
					containerName: allContainers[ 0 ].name,
				} );
				const { container, waitForRegistry } = render( <SetupMain />, {
					registry,
				} );
				await waitForRegistry();
				expect(
					container.querySelector( '#containerName' )
				).toHaveValue( allContainers[ 0 ].name );
				expect(
					container.querySelector(
						'.googlesitekit-tagmanager-containername > .mdc-text-field'
					)
				).toHaveClass( 'mdc-text-field--error' );
			} );
		} );

		describe( 'with primary AMP', () => {
			beforeEach( () => {
				provideSiteInfo( registry, {
					siteName,
					ampMode: AMP_MODE_PRIMARY,
				} );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAMPContainerID( CONTAINER_CREATE );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setInternalAMPContainerID( '' );
			} );

			it( 'should display a default container name when nothing is entered yet', async () => {
				const { container, waitForRegistry } = render( <SetupMain />, {
					registry,
				} );
				await waitForRegistry();
				expect(
					container.querySelector( '#ampContainerName' )
				).toHaveValue( `${ siteName } AMP` );
			} );

			it( 'should use a domain name as a default value when siteName is empty', async () => {
				provideSiteInfo( registry, { siteName: '' } );
				const { container, waitForRegistry } = render( <SetupMain />, {
					registry,
				} );
				await waitForRegistry();
				expect(
					container.querySelector( '#ampContainerName' )
				).toHaveValue( 'example.com AMP' );
			} );

			it( 'should display an error when a non-unique container name is used', async () => {
				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
					ampContainerName: allContainers[ 0 ].name,
				} );
				const { container, waitForRegistry } = render( <SetupMain />, {
					registry,
				} );
				await waitForRegistry();
				expect(
					container.querySelector( '#ampContainerName' )
				).toHaveValue( allContainers[ 0 ].name );
				expect(
					container.querySelector(
						'.googlesitekit-tagmanager-containername > .mdc-text-field'
					)
				).toHaveClass( 'mdc-text-field--error' );
			} );
		} );

		describe( 'with secondary AMP', () => {
			beforeEach( () => {
				provideSiteInfo( registry, {
					siteName,
					ampMode: AMP_MODE_SECONDARY,
				} );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.setContainerID( CONTAINER_CREATE );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setInternalContainerID( '' );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAMPContainerID( CONTAINER_CREATE );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setInternalAMPContainerID( '' );
			} );

			it( 'should display default container names when nothing is entered yet', async () => {
				const { container, waitForRegistry } = render( <SetupMain />, {
					registry,
				} );
				await waitForRegistry();
				expect(
					container.querySelector( '#containerName' )
				).toHaveValue( siteName );
				expect(
					container.querySelector( '#ampContainerName' )
				).toHaveValue( `${ siteName } AMP` );
			} );

			it( 'should use domain name as default values when siteName is empty', async () => {
				provideSiteInfo( registry, { siteName: '' } );
				const { container, waitForRegistry } = render( <SetupMain />, {
					registry,
				} );
				await waitForRegistry();
				expect(
					container.querySelector( '#containerName' )
				).toHaveValue( 'example.com' );
				expect(
					container.querySelector( '#ampContainerName' )
				).toHaveValue( 'example.com AMP' );
			} );

			it( 'should display errors when non-unique container names are used', async () => {
				registry.dispatch( CORE_FORMS ).setValues( FORM_SETUP, {
					containerName: allContainers[ 0 ].name,
					ampContainerName: allContainers[ 1 ].name,
				} );
				const { container, waitForRegistry } = render( <SetupMain />, {
					registry,
				} );
				await waitForRegistry();
				expect(
					container.querySelector( '#containerName' )
				).toHaveValue( allContainers[ 0 ].name );
				expect(
					container.querySelector(
						'.googlesitekit-tagmanager-containerName > .mdc-text-field'
					)
				).toHaveClass( 'mdc-text-field--error' );

				expect(
					container.querySelector( '#ampContainerName' )
				).toHaveValue( allContainers[ 1 ].name );
				expect(
					container.querySelector(
						'.googlesitekit-tagmanager-ampContainerName > .mdc-text-field'
					)
				).toHaveClass( 'mdc-text-field--error' );
			} );
		} );
	} );
} );
