/**
 * `modules/analytics-4` data store: tagmanager tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
	createTestRegistry,
	unsubscribeFromAll,
	untilResolved,
	freezeFetch,
} from '../../../../../tests/js/utils';
import { CORE_MODULES } from '../../../googlesitekit/modules/datastore/constants';
import { MODULES_TAGMANAGER } from '../../tagmanager/datastore/constants';
import { MODULES_ANALYTICS_4 } from './constants';
import { parseLiveContainerVersionIDs } from '../../tagmanager/datastore/__factories__/utils';
import * as gtmFixtures from '../../tagmanager/datastore/__fixtures__';

describe( 'modules/analytics-4 tagmanager', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		// Receive empty settings to prevent unexpected fetch by resolver.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	describe( 'selectors', () => {
		describe( 'hasFinishedLoadingGTMContainers', () => {
			it( 'should return TRUE when the Google Tag Manager module is not connected', () => {
				// Set the Tag Manager module to not be connected.
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'analytics-4',
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
					.select( MODULES_ANALYTICS_4 )
					.hasFinishedLoadingGTMContainers();

				expect( hasFinishedLoading ).toBe( true );
			} );

			it( 'should return TRUE when the Google Tag Manager module is connected and the web containers are loaded', async () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'analytics-4',
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
					.select( MODULES_ANALYTICS_4 )
					.hasFinishedLoadingGTMContainers();

				expect( hasFinishedLoading ).toBe( true );
			} );

			it( 'should return TRUE when the Google Tag Manager module is available and the AMP containers are loaded', async () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'analytics-4',
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
					.select( MODULES_ANALYTICS_4 )
					.hasFinishedLoadingGTMContainers();

				expect( hasFinishedLoading ).toBe( true );
			} );

			it( 'should return FALSE when the selector is not resolved yet', () => {
				registry.dispatch( CORE_MODULES ).receiveGetModules( [
					{
						slug: 'analytics-4',
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
					.select( MODULES_ANALYTICS_4 )
					.hasFinishedLoadingGTMContainers();

				expect( hasFinishedLoading ).toBe( false );
			} );
		} );
	} );
} );
