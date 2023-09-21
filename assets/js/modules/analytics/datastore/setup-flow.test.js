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
import { MODULES_ANALYTICS_4 } from '../../analytics-4/datastore/constants';
import {
	MODULES_ANALYTICS,
	SETUP_FLOW_MODE_GA4,
	FORM_SETUP,
} from './constants';
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

const accountID = 'pub-12345678';

const populateAnalyticsDatastore = ( registry ) => {
	registry.dispatch( MODULES_ANALYTICS ).receiveGetProperties(
		[
			{
				// eslint-disable-next-line sitekit/acronym-case
				accountId: accountID,
				id: 'UA-151753095-1',
				name: 'rwh',
			},
			{
				// eslint-disable-next-line sitekit/acronym-case
				accountId: accountID,
				id: 'UA-151753095-1',
				name: 'troubled-tipped.example.com',
			},
		],
		{ accountID }
	);
};

const populateAnalytics4Datastore = ( registry ) => {
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties(
		[
			{
				_id: '1000',
				_accountID: '100',
				name: 'properties/1000',
				createTime: '2014-10-02T15:01:23Z',
				updateTime: '2014-10-02T15:01:23Z',
				parent: 'accounts/100',
				displayName: 'Test GA4 Property',
				industryCategory: 'TECHNOLOGY',
				timeZone: 'America/Los_Angeles',
				currencyCode: 'USD',
				deleted: false,
			},
		],
		{ accountID }
	);
	registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams(
		[
			{
				_id: '2000',
				_propertyID: '1000',
				name: 'properties/1000/dataStreams/2000',
				webStreamData: {
					measurementId: '1A2BCD345E', // eslint-disable-line sitekit/acronym-case
					defaultUri: 'http://example.com', // eslint-disable-line sitekit/acronym-case
				},
				createTime: '2014-10-02T15:01:23Z',
				updateTime: '2014-10-02T15:01:23Z',
				displayName: 'Test GA4 WebDataStream',
			},
		],
		{ propertyID: '12345' }
	);
};

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
		describe( 'getSetupFlowMode', () => {
			it( 'should return undefined if settings are still loading', async () => {
				fetchMock.get(
					new RegExp(
						'^/google-site-kit/v1/modules/analytics/data/settings'
					),
					{
						body: {
							accountID: 'pub-12345678',
							clientID: 'ca-pub-12345678',
							useSnippet: true,
						},
						status: 200,
					}
				);

				registry = createTestRegistry();
				populateAnalytics4Datastore( registry );

				expect(
					registry.select( MODULES_ANALYTICS ).getSettings()
				).toBeUndefined();
				expect(
					registry.select( MODULES_ANALYTICS ).getSetupFlowMode()
				).toBe( 'ga4' );

				await untilResolved(
					registry,
					MODULES_ANALYTICS
				).getSettings();
			} );

			it( 'should return "ga4" if there is no account selected', () => {
				expect(
					registry
						.select( MODULES_ANALYTICS )
						.getAccountID( accountID )
				).toBeUndefined();

				populateAnalytics4Datastore( registry );

				expect(
					registry.select( MODULES_ANALYTICS ).getSetupFlowMode()
				).toBe( SETUP_FLOW_MODE_GA4 );
			} );

			it( 'should return "ga4" if selected account returns undefined from GA4 getProperties selector', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( accountID );
				populateAnalyticsDatastore( registry );

				expect(
					registry.select( MODULES_ANALYTICS ).getProperties()
				).toBeUndefined();
				expect(
					registry.select( MODULES_ANALYTICS ).getSetupFlowMode()
				).toBe( SETUP_FLOW_MODE_GA4 );
			} );

			it( 'should return "ga4" if selected account returns an empty array from GA4 getProperties selector', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( accountID );
				populateAnalyticsDatastore( registry );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties(
					[
						{
							_id: '1000',
							_accountID: '100',
							name: 'properties/1000',
							createTime: '2014-10-02T15:01:23Z',
							updateTime: '2014-10-02T15:01:23Z',
							parent: 'accounts/100',
							displayName: 'Test GA4 Property',
							industryCategory: 'TECHNOLOGY',
							timeZone: 'America/Los_Angeles',
							currencyCode: 'USD',
							deleted: false,
						},
					],
					// This is a different accountID
					{ accountID: 'bar-1234567' }
				);

				//  Receive empty properties list to prevent unexpected fetch by resolver.
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperties( [], { accountID } );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams(
						[
							{
								_id: '2000',
								_propertyID: '1000',
								name: 'properties/1000/dataStreams/2000',
								webStreamData: {
									measurementId: '1A2BCD345E', // eslint-disable-line sitekit/acronym-case
									defaultUri: 'http://example.com', // eslint-disable-line sitekit/acronym-case
								},
								createTime: '2014-10-02T15:01:23Z',
								updateTime: '2014-10-02T15:01:23Z',
								displayName: 'Test GA4 WebDataStream',
							},
						],
						{ propertyID: '12345' }
					);

				expect(
					registry.select( MODULES_ANALYTICS ).getSetupFlowMode()
				).toBe( SETUP_FLOW_MODE_GA4 );
			} );

			it( 'should return "ga4" if selected account returns undefined from UA getProperties selector', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( accountID );

				populateAnalytics4Datastore( registry );

				expect(
					registry.select( MODULES_ANALYTICS ).getSetupFlowMode()
				).toBe( SETUP_FLOW_MODE_GA4 );
			} );

			it( 'should return "ga4" for setup flow mode', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( accountID );
				populateAnalytics4Datastore( registry );

				expect(
					registry.select( MODULES_ANALYTICS ).getSetupFlowMode()
				).toBe( SETUP_FLOW_MODE_GA4 );
			} );

			it( 'should return "ga4" if selected account returns an empty array from UA getProperties selector', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( accountID );
				populateAnalytics4Datastore( registry );

				registry
					.dispatch( MODULES_ANALYTICS )
					.receiveGetProperties( [], { accountID } );

				expect(
					registry.select( MODULES_ANALYTICS ).getSetupFlowMode()
				).toBe( SETUP_FLOW_MODE_GA4 );
			} );

			it( 'should return "ga4" if both GA4 and UA properties are found for an account', () => {
				registry
					.dispatch( MODULES_ANALYTICS )
					.setAccountID( accountID );
				populateAnalytics4Datastore( registry );
				populateAnalyticsDatastore( registry );

				expect(
					registry.select( MODULES_ANALYTICS ).getSetupFlowMode()
				).toBe( SETUP_FLOW_MODE_GA4 );
			} );
		} );

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
