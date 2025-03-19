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
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	waitFor,
	fireEvent,
	provideUserCapabilities,
	provideSiteInfo,
	provideNotifications,
} from '../../../../tests/js/test-utils';
import EnableAutoUpdateBannerNotification, {
	ENABLE_AUTO_UPDATES_BANNER_SLUG,
} from './EnableAutoUpdateBannerNotification';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import fetchMock from 'fetch-mock';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';

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
			await findByText( 'Keep Site Kit up-to-date' )
		).toBeInTheDocument();

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
} );
