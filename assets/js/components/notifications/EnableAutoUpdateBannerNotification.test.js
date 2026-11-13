/**
 * EnableAutoUpdateBannerNotification component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	VIEW_CONTEXT_FEATURE_DISCOVERY,
	VIEW_CONTEXT_MAIN_DASHBOARD,
} from '@/js/googlesitekit/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { useHasBeenViewed } from '@/js/googlesitekit/notifications/hooks/useHasBeenViewed';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideNotifications,
	provideSiteInfo,
	provideUserCapabilities,
	render,
	waitFor,
} from '@tests/js/test-utils';
import EnableAutoUpdateBannerNotification, {
	ENABLE_AUTO_UPDATES_BANNER_SLUG,
	FEATURE_DISCOVERY_AUTO_UPDATES_BANNER_SLUG,
} from './EnableAutoUpdateBannerNotification';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );

mockTrackEvent.mockImplementation( () => Promise.resolve() );

const EnableAutoUpdateBannerNotificationComponent =
	withNotificationComponentProps( ENABLE_AUTO_UPDATES_BANNER_SLUG )(
		EnableAutoUpdateBannerNotification
	);

const notification = DEFAULT_NOTIFICATIONS[ ENABLE_AUTO_UPDATES_BANNER_SLUG ];

describe( 'EnableAutoUpdateBannerNotification', () => {
	mockLocation();
	const registry = createTestRegistry();

	beforeEach( () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetNonces( { updates: '751b9198d2' } );
	} );

	afterEach( () => {
		delete global.ajaxurl;
		mockTrackEvent.mockClear();
	} );

	it( 'should render banner and send enable-auto-updates post request to admin-ajax on CTA click.', async () => {
		provideSiteInfo( registry, {
			changePluginAutoUpdatesCapacity: true,
			pluginBasename: 'google-site-kit/google-site-kit.php',
		} );

		registry.dispatch( CORE_USER ).receiveGetNonces( {
			updates: '751b9198d2',
		} );

		provideUserCapabilities( registry, {
			googlesitekit_update_plugins: true,
		} );

		global.ajaxurl = 'admin-ajax.php';

		fetchMock.postOnce( /^\/admin-ajax.php/, {
			body: { success: true },
			status: 200,
		} );

		const { getByText, findByText } = render(
			<EnableAutoUpdateBannerNotificationComponent />,
			{
				registry,
			}
		);

		expect(
			await findByText( 'Unlock the latest Site Kit features!' )
		).toBeInTheDocument();

		expect(
			getByText(
				"We regularly release new features and improvements to help you track your site's success. Enable auto-updates for Site Kit so you never miss the latest enhancements."
			)
		).toBeInTheDocument();

		expect( getByText( 'Learn more' ).closest( 'a' ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'doc=auto-updates' )
		);

		fireEvent.click( getByText( 'Enable auto-updates' ) );

		await waitFor( () => expect( fetchMock ).toHaveFetchedTimes( 1 ) );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when Site Kit was not recently set up and user can update plugins', async () => {
			provideSiteInfo( registry, {
				changePluginAutoUpdatesCapacity: true,
				siteKitAutoUpdatesEnabled: false,
			} );
			provideUserCapabilities( registry, {
				googlesitekit_update_plugins: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when auto updates are already enabled for Site Kit', async () => {
			provideSiteInfo( registry, {
				changePluginAutoUpdatesCapacity: true,
				siteKitAutoUpdatesEnabled: true,
			} );

			provideUserCapabilities( registry, {
				googlesitekit_update_plugins: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when user can not update plugins', async () => {
			provideSiteInfo( registry, {
				changePluginAutoUpdatesCapacity: true,
				siteKitAutoUpdatesEnabled: false,
			} );

			provideUserCapabilities( registry, {
				googlesitekit_update_plugins: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when plugin auto updates can not be enabled', async () => {
			provideSiteInfo( registry, {
				changePluginAutoUpdatesCapacity: false,
				siteKitAutoUpdatesEnabled: false,
			} );

			provideUserCapabilities( registry, {
				googlesitekit_update_plugins: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active and dismisses the notification temporarily when Site Kit is set up', async () => {
			const dismissItemEndpoint = new RegExp(
				'^/google-site-kit/v1/core/user/data/dismiss-item'
			);
			fetchMock.post( dismissItemEndpoint, {
				body: JSON.stringify( [ ENABLE_AUTO_UPDATES_BANNER_SLUG ] ),
				status: 200,
			} );

			provideSiteInfo( registry, {
				changePluginAutoUpdatesCapacity: true,
				siteKitAutoUpdatesEnabled: false,
			} );

			provideUserCapabilities( registry, {
				googlesitekit_update_plugins: true,
			} );

			provideNotifications( registry );

			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success';

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );
	} );

	describe( 'Feature Discovery hub variant', () => {
		const FeatureDiscoveryAutoUpdatesBannerComponent =
			withNotificationComponentProps(
				FEATURE_DISCOVERY_AUTO_UPDATES_BANNER_SLUG
			)( EnableAutoUpdateBannerNotification );

		const eventCategory = `${ VIEW_CONTEXT_FEATURE_DISCOVERY }_${ FEATURE_DISCOVERY_AUTO_UPDATES_BANNER_SLUG }`;

		// Use a registry of the hub tests' own, as the file-level one has the
		// default notifications registered by earlier tests.
		let hubRegistry;

		beforeEach( () => {
			hubRegistry = createTestRegistry();

			hubRegistry
				.dispatch( CORE_USER )
				.receiveGetNonces( { updates: '751b9198d2' } );

			provideSiteInfo( hubRegistry, {
				changePluginAutoUpdatesCapacity: true,
				siteKitAutoUpdatesEnabled: false,
				pluginBasename: 'google-site-kit/google-site-kit.php',
			} );

			provideUserCapabilities( hubRegistry, {
				googlesitekit_update_plugins: true,
			} );

			hubRegistry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification(
					FEATURE_DISCOVERY_AUTO_UPDATES_BANNER_SLUG,
					DEFAULT_NOTIFICATIONS[
						FEATURE_DISCOVERY_AUTO_UPDATES_BANNER_SLUG
					]
				);
		} );

		it( 'should track view_notification when shown', async () => {
			const { findByText } = render(
				<FeatureDiscoveryAutoUpdatesBannerComponent />,
				{
					registry: hubRegistry,
					viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
				}
			);

			await findByText( 'Unlock the latest Site Kit features!' );

			expect( mockTrackEvent ).not.toHaveBeenCalled();

			act( () => {
				hubRegistry
					.dispatch( CORE_UI )
					.setValue(
						useHasBeenViewed.getKey(
							FEATURE_DISCOVERY_AUTO_UPDATES_BANNER_SLUG
						),
						true
					);
			} );

			expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				eventCategory,
				'view_notification',
				undefined,
				undefined
			);
		} );

		it( 'should track confirm_notification when Enable auto-updates is clicked', async () => {
			global.ajaxurl = 'admin-ajax.php';

			fetchMock.postOnce( /^\/admin-ajax.php/, {
				body: { success: true },
				status: 200,
			} );

			const { findByText, getByText } = render(
				<FeatureDiscoveryAutoUpdatesBannerComponent />,
				{
					registry: hubRegistry,
					viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
				}
			);

			await findByText( 'Unlock the latest Site Kit features!' );

			fireEvent.click( getByText( 'Enable auto-updates' ) );

			await waitFor( () => expect( fetchMock ).toHaveFetchedTimes( 1 ) );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				eventCategory,
				'confirm_notification',
				undefined,
				undefined
			);
		} );

		it( 'should track dismiss_notification when No thanks is clicked', async () => {
			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/dismiss-item'
				),
				{
					body: JSON.stringify( [
						FEATURE_DISCOVERY_AUTO_UPDATES_BANNER_SLUG,
					] ),
					status: 200,
				}
			);

			const { findByText, getByText, waitForRegistry } = render(
				<FeatureDiscoveryAutoUpdatesBannerComponent />,
				{
					registry: hubRegistry,
					viewContext: VIEW_CONTEXT_FEATURE_DISCOVERY,
				}
			);

			await findByText( 'Unlock the latest Site Kit features!' );

			fireEvent.click( getByText( 'No thanks' ) );

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				eventCategory,
				'dismiss_notification',
				undefined,
				undefined
			);
		} );
	} );
} );
