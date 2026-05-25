/**
 * `useWelcomeTour` hook tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { getWelcomeTour } from '@/js/feature-tours/welcome';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
} from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	CORE_USER,
	PERMISSION_AUTHENTICATE,
	PERMISSION_READ_SHARED_MODULE_DATA,
} from '@/js/googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '@/js/googlesitekit/datastore/util/permissions';
import { NOTIFICATION_GROUPS } from '@/js/googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import {
	createTestRegistry,
	provideModules,
	provideUserAuthentication,
	provideUserCapabilities,
	renderHook,
} from '../../../../tests/js/test-utils';
import { useWelcomeTour } from './useWelcomeTour';

describe( 'useWelcomeTour', () => {
	let registry: WPDataRegistry;

	function setupQueuedNotifications( notifications: { id: string }[] ) {
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.receiveQueuedNotifications(
				notifications,
				NOTIFICATION_GROUPS.DEFAULT
			);

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.finishResolution( 'getQueuedNotifications', [
				VIEW_CONTEXT_MAIN_DASHBOARD,
				NOTIFICATION_GROUPS.DEFAULT,
			] );
	}

	function expectMatchesWelcomeTour(
		welcomeTour: ReturnType< typeof useWelcomeTour >,
		expectedWelcomeTourParams: Parameters< typeof getWelcomeTour >[ 0 ]
	) {
		const expectedWelcomeTour = getWelcomeTour( expectedWelcomeTourParams );

		expect( welcomeTour ).toEqual( {
			...expectedWelcomeTour,
			gaEventCategory: expect.any( Function ),
		} );

		expect(
			welcomeTour.gaEventCategory( VIEW_CONTEXT_MAIN_DASHBOARD )
		).toBe(
			expectedWelcomeTour.gaEventCategory( VIEW_CONTEXT_MAIN_DASHBOARD )
		);
	}

	beforeEach( () => {
		registry = createTestRegistry();

		provideUserAuthentication( registry );
		provideUserCapabilities( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
		] );

		setupQueuedNotifications( [] );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAudienceSettings( {} );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {} );
		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {} );
	} );

	it( 'should return the Analytics-connected tour when Analytics is connected and viewable', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: false,
			canAuthenticate: true,
			isAnalyticsConnected: true,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should return the Search Console only tour when Analytics is not connected', async () => {
		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: false,
			canAuthenticate: true,
			isAnalyticsConnected: false,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should return the Search Console only tour when Analytics is connected but not viewable by a view-only user', async () => {
		provideUserAuthentication( registry, { authenticated: false } );
		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: false,
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_SEARCH_CONSOLE
			) ]: true,
		} );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
				shareable: true,
			},
		] );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: true,
			canAuthenticate: false,
			isAnalyticsConnected: false,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should return the Analytics-connected tour for a view-only user with access to the Analytics module', async () => {
		provideUserAuthentication( registry, { authenticated: false } );
		provideUserCapabilities( registry, {
			[ getMetaCapabilityPropertyName(
				PERMISSION_READ_SHARED_MODULE_DATA,
				MODULE_SLUG_ANALYTICS_4
			) ]: true,
		} );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
				shareable: true,
			},
		] );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: true,
			canAuthenticate: true,
			isAnalyticsConnected: true,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should include the Activate Analytics step when the notification is the first queued notification', async () => {
		setupQueuedNotifications( [
			{ id: 'activate-analytics-notification' },
		] );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: false,
			canAuthenticate: true,
			isAnalyticsConnected: false,
			isActivateAnalyticsNotificationPresent: true,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should not include the Activate Analytics step when the notification is not the first queued notification', async () => {
		setupQueuedNotifications( [
			{ id: 'some-other-notification' },
			{ id: 'activate-analytics-notification' },
		] );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: false,
			canAuthenticate: true,
			isAnalyticsConnected: false,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should return the correct tour for view-only users who can authenticate', async () => {
		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: true,
			canAuthenticate: true,
			isAnalyticsConnected: false,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should return the correct tour for view-only users who cannot authenticate', async () => {
		provideUserCapabilities( registry, {
			[ PERMISSION_AUTHENTICATE ]: false,
		} );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD_VIEW_ONLY,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: true,
			canAuthenticate: false,
			isAnalyticsConnected: false,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should include the key metrics step if they have been set up', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			keyMetricsSetupCompletedBy: 1,
		} );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: false,
			canAuthenticate: true,
			isAnalyticsConnected: true,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: true,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should not include the key metrics step if they have been set up but their widget is hidden', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			keyMetricsSetupCompletedBy: 1,
		} );

		registry.dispatch( CORE_USER ).receiveGetKeyMetricsSettings( {
			isWidgetHidden: true,
		} );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: false,
			canAuthenticate: true,
			isAnalyticsConnected: true,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should include the audience segmentation step if it has been set up', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			audienceSegmentationSetupCompletedBy: 1,
		} );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: false,
			canAuthenticate: true,
			isAnalyticsConnected: true,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: true,
		} );
	} );

	it( 'should not include the audience segmentation step if it has been set up but its widget is hidden', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			audienceSegmentationSetupCompletedBy: 1,
		} );

		registry.dispatch( CORE_USER ).receiveGetUserAudienceSettings( {
			isAudienceSegmentationWidgetHidden: true,
		} );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: false,
			canAuthenticate: true,
			isAnalyticsConnected: true,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: false,
			isAudienceSegmentationWidgetPresent: false,
		} );
	} );

	it( 'should not include the top search queries step if both key metrics and audience segmentation are set up', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAudienceSettings( {
			audienceSegmentationSetupCompletedBy: 1,
		} );

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			keyMetricsSetupCompletedBy: 1,
		} );

		const { result } = await renderHook( () => useWelcomeTour(), {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expectMatchesWelcomeTour( result.current, {
			isViewOnly: false,
			canAuthenticate: true,
			isAnalyticsConnected: true,
			isActivateAnalyticsNotificationPresent: false,
			isKeyMetricsWidgetPresent: true,
			isAudienceSegmentationWidgetPresent: true,
		} );
	} );
} );
