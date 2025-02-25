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
	screen,
	waitFor,
	fireEvent,
	provideUserCapabilities,
	provideSiteInfo,
} from '../../../../tests/js/test-utils';
import EnableAutoUpdateBannerNotification, {
	ENABLE_AUTO_UPDATES_BANNER_SLUG,
} from './EnableAutoUpdateBannerNotification';
import useQueryArg from '../../hooks/useQueryArg';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import * as apiCache from '../../googlesitekit/api/cache';
import fetchMock from 'fetch-mock';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';

jest.mock( '../../hooks/useQueryArg' );

// Set up mockImplementation for `useQueryArg` used in this component,
// so we can set the query params used to check whether this is a new Site Kit
// setup.
function stubMockUseQueryArg( isNewPluginInstall = false ) {
	useQueryArg.mockImplementation( ( queryArg ) => {
		if ( isNewPluginInstall && queryArg === 'notification' ) {
			return [ 'authentication_success' ];
		}
		return [ false ];
	} );
}

const notification = DEFAULT_NOTIFICATIONS[ ENABLE_AUTO_UPDATES_BANNER_SLUG ];

describe( 'EnableAutoUpdateBannerNotification', () => {
	const registry = createTestRegistry();

	beforeEach( () => {
		stubMockUseQueryArg();

		registry
			.dispatch( CORE_USER )
			.receiveGetNonces( { updates: '751b9198d2' } );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		useQueryArg.mockClear();
		delete global.ajaxurl;
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
	} );

	it( 'should not show the notification when user can not update plugins', () => {
		provideSiteInfo( registry, {
			changePluginAutoUpdatesCapacity: true,
			siteKitAutoUpdatesEnabled: false,
		} );

		provideUserCapabilities( registry, {
			googlesitekit_update_plugins: false,
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not show the notification if plugin auto updates can not be enabled', () => {
		provideSiteInfo( registry, {
			changePluginAutoUpdatesCapacity: false,
		} );

		provideUserCapabilities( registry, {
			googlesitekit_update_plugins: false,
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should send enable-auto-updates post request to admin-ajax on CTA click.', async () => {
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

		render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect(
			await screen.findByText( 'Keep Site Kit up-to-date' )
		).toBeInTheDocument();

		fireEvent.click( screen.getByText( 'Enable auto-updates' ) );

		await waitFor( () => expect( fetchMock ).toHaveFetchedTimes( 1 ) );
	} );

	it( 'should not show the notification directly after Site Kit initial setup', async () => {
		stubMockUseQueryArg( true );

		provideSiteInfo( registry, {
			changePluginAutoUpdatesCapacity: true,
		} );

		provideUserCapabilities( registry, {
			googlesitekit_update_plugins: true,
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		await waitFor( () =>
			// When the component is rendered after the initial
			// Site Kit setup, we hide the notification and prevent
			// it from being displayed for ten minutes.
			//
			// Wait until that `setItem` call delaying the
			// notification is called before checking the output
			// of the component.
			expect( apiCache.setItem ).toHaveBeenCalledTimes( 1 )
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
