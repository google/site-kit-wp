/**
 * `modules/analytics` data store: setup-flow tests.
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
import { CORE_FORMS } from '../../../googlesitekit/datastore/forms/constants';
import { MODULES_ANALYTICS, FORM_SETUP } from './constants';
import {
	createTestRegistry,
	unsubscribeFromAll,
	provideModules,
	untilResolved,
	freezeFetch,
} from '../../../../../tests/js/utils';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
import { parseLiveContainerVersionIDs } from '../../tagmanager/datastore/__factories__/utils';
import * as gtmFixtures from '../../tagmanager/datastore/__fixtures__';

describe( 'modules/analytics setup-flow', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {} );
	} );

	afterAll( () => {
		API.setUsingCache( true );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'canUseGA4Controls', () => {
			const bothConnected = [
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			];

			const oneIsConnected = [
				{
					slug: 'analytics',
					active: true,
					connected: true,
				},
				{
					slug: 'analytics-4',
					active: true,
					connected: false,
				},
			];

			it( 'should return TRUE if both modules are connected', () => {
				provideModules( registry, bothConnected );

				const canUseControls = registry
					.select( MODULES_ANALYTICS )
					.canUseGA4Controls();

				expect( canUseControls ).toBe( true );
			} );

			it( 'should return FALSE when one of the modules is not connected', () => {
				provideModules( registry, oneIsConnected );

				const canUseControls = registry
					.select( MODULES_ANALYTICS )
					.canUseGA4Controls();

				expect( canUseControls ).toBe( false );
			} );

			it( 'should return TRUE when "enableGA4" is set to true even if one of the modules is not connected', () => {
				provideModules( registry, oneIsConnected );

				registry
					.dispatch( CORE_FORMS )
					.setValues( FORM_SETUP, { enableGA4: true } );

				const canUseControls = registry
					.select( MODULES_ANALYTICS )
					.canUseGA4Controls();

				expect( canUseControls ).toBe( true );
			} );
		} );

		describe( 'hasFinishedLoadingGTMContainers', () => {
			it( 'should return TRUE when the Google Tag Manager module is not connected', () => {
				// Set the Tag Manager module to not be connected.
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'analytics',
						name: 'Analytics',
						active: true,
					},
					{
						slug: 'tagmanager',
						name: 'Tag Manager',
						active: false,
						connected: false,
					},
				] );

				const hasFinishedLoading = registry
					.select( MODULES_ANALYTICS )
					.hasFinishedLoadingGTMContainers();

				expect( hasFinishedLoading ).toBe( true );
			} );

			it( 'should return TRUE when the Google Tag Manager module is connected and the web containers are loaded', async () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'analytics',
						name: 'Analytics',
						active: true,
					},
					{
						slug: 'tagmanager',
						name: 'Tag Manager',
						active: true,
						connected: true,
					},
				] );

				const webContainerVersion =
					gtmFixtures.liveContainerVersions.web.gaWithVariable;
				const gtmAccountID = webContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
				const gtmContainerID = webContainerVersion.containerId; // eslint-disable-line sitekit/acronym-case

				parseLiveContainerVersionIDs(
					webContainerVersion,
					( { internalContainerID, containerID } ) => {
						registry.dispatch( MODULES_TAGMANAGER ).setSettings( {
							accountID: gtmAccountID,
							containerID,
							internalContainerID,
							useSnippet: true,
						} );
						registry
							.dispatch( MODULES_TAGMANAGER )
							.receiveGetLiveContainerVersion(
								webContainerVersion,
								{
									accountID: gtmAccountID,
									internalContainerID,
								}
							);
						registry
							.select( MODULES_TAGMANAGER )
							.getLiveContainerVersion(
								gtmAccountID,
								internalContainerID
							);
					}
				);

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( gtmAccountID, gtmContainerID );
				const hasFinishedLoading = registry
					.select( MODULES_ANALYTICS )
					.hasFinishedLoadingGTMContainers();

				expect( hasFinishedLoading ).toBe( true );
			} );

			it( 'should return TRUE when the Google Tag Manager module is available and the AMP containers are loaded', async () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'analytics',
						name: 'Analytics',
						active: true,
					},
					{
						slug: 'tagmanager',
						name: 'Tag Manager',
						active: true,
						connected: true,
					},
				] );

				const ampContainerVersion =
					gtmFixtures.liveContainerVersions.amp.ga;
				const gtmAccountID = ampContainerVersion.accountId; // eslint-disable-line sitekit/acronym-case
				const gtmAMPContainerID = ampContainerVersion.containerId; // eslint-disable-line sitekit/acronym-case

				parseLiveContainerVersionIDs(
					ampContainerVersion,
					( { internalAMPContainerID, containerID } ) => {
						registry.dispatch( MODULES_TAGMANAGER ).setSettings( {
							accountID: gtmAccountID,
							containerID,
							internalContainerID: internalAMPContainerID,
							useSnippet: true,
						} );
						registry
							.dispatch( MODULES_TAGMANAGER )
							.setInternalAMPContainerID(
								internalAMPContainerID
							);
						registry
							.dispatch( MODULES_TAGMANAGER )
							.receiveGetLiveContainerVersion(
								ampContainerVersion,
								{
									accountID: gtmAccountID,
									internalContainerID: internalAMPContainerID,
								}
							);
						registry
							.select( MODULES_TAGMANAGER )
							.getLiveContainerVersion(
								gtmAccountID,
								internalAMPContainerID
							);
					}
				);

				await untilResolved(
					registry,
					MODULES_TAGMANAGER
				).getLiveContainerVersion( gtmAccountID, gtmAMPContainerID );
				const hasFinishedLoading = registry
					.select( MODULES_ANALYTICS )
					.hasFinishedLoadingGTMContainers();

				expect( hasFinishedLoading ).toBe( true );
			} );

			it( 'should return FALSE when the selector is not resolved yet', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'analytics',
						name: 'Analytics',
						active: true,
					},
					{
						slug: 'tagmanager',
						name: 'Tag Manager',
						active: true,
						connected: true,
					},
				] );
				registry.dispatch( MODULES_TAGMANAGER ).setSettings( {
					accountID: 100,
					containerID: 200,
					internalContainerID: 200,
					useSnippet: true,
				} );

				freezeFetch(
					new RegExp(
						'^/google-site-kit/v1/modules/tagmanager/data/live-container-version'
					)
				);

				const hasFinishedLoading = registry
					.select( MODULES_ANALYTICS )
					.hasFinishedLoadingGTMContainers();

				expect( hasFinishedLoading ).toBe( false );
			} );
		} );
	} );
} );
