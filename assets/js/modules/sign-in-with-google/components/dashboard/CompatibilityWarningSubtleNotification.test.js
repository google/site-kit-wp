/**
 * CompatibilityWarningSubtleNotification component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
	provideModules,
	provideSiteInfo,
	render,
	fireEvent,
} from '../../../../../../tests/js/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { SIGN_IN_WITH_GOOGLE_NOTIFICATIONS } from '@/js/modules/sign-in-with-google';
import { MODULE_SLUG_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/constants';
import { MODULES_SIGN_IN_WITH_GOOGLE } from '@/js/modules/sign-in-with-google/datastore/constants';
import CompatibilityWarningSubtleNotification from './CompatibilityWarningSubtleNotification';

const NOTIFICATION_ID = 'sign-in-with-google-compatibility-warning';

const conflictingPluginsChecks = {
	checks: {
		conflicting_plugins: [
			{
				pluginName: 'Security Plugin',
			},
		],
	},
};

const wpLoginInaccessibleChecks = {
	checks: {
		wp_login_inaccessible: true,
	},
};

describe( 'CompatibilityWarningSubtleNotification', () => {
	describe( 'checkRequirements', () => {
		let registry;
		const notification =
			SIGN_IN_WITH_GOOGLE_NOTIFICATIONS[ NOTIFICATION_ID ];

		beforeEach( () => {
			registry = createTestRegistry();
			provideSiteInfo( registry );
		} );

		it( 'should return false when the module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
					active: true,
					connected: false,
				},
			] );

			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetCompatibilityChecks( conflictingPluginsChecks );

			const isActive = await notification.checkRequirements( registry );

			expect( isActive ).toBe( false );
		} );

		it( 'should return false when there are no compatibility issues', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
					active: true,
					connected: true,
				},
			] );

			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetCompatibilityChecks( { checks: {} } );

			const isActive = await notification.checkRequirements( registry );

			expect( isActive ).toBe( false );
		} );

		it( 'should return true when compatibility issues are detected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
					active: true,
					connected: true,
				},
			] );

			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetCompatibilityChecks( conflictingPluginsChecks );

			const isActive = await notification.checkRequirements( registry );

			expect( isActive ).toBe( true );
		} );
	} );

	describe( 'component', () => {
		let registry;

		const NotificationComponent = withNotificationComponentProps(
			NOTIFICATION_ID
		)( CompatibilityWarningSubtleNotification );

		beforeEach( async () => {
			registry = createTestRegistry();
			provideSiteInfo( registry );
			provideModules( registry, [
				{
					slug: MODULE_SLUG_SIGN_IN_WITH_GOOGLE,
					active: true,
					connected: true,
				},
			] );

			await registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification(
					NOTIFICATION_ID,
					SIGN_IN_WITH_GOOGLE_NOTIFICATIONS[ NOTIFICATION_ID ]
				);
		} );

		afterEach( () => {
			fetchMock.reset();
		} );

		it( 'should render the Manage plugins CTA when conflicting plugins are detected', () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetCompatibilityChecks( conflictingPluginsChecks );

			const { getByRole } = render( <NotificationComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			const managePluginsButton = getByRole( 'button', {
				name: /Manage plugins/i,
			} );

			expect( managePluginsButton ).toHaveAttribute(
				'href',
				'http://example.com/wp-admin/plugins.php'
			);
		} );

		it( 'should not render the Manage plugins CTA when conflicting plugins are not detected', () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetCompatibilityChecks( wpLoginInaccessibleChecks );

			const { queryByRole } = render( <NotificationComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			expect(
				queryByRole( 'button', { name: /Manage plugins/i } )
			).toBeNull();
		} );

		it( 'should dismiss the notification when the dismiss button is clicked', async () => {
			registry
				.dispatch( MODULES_SIGN_IN_WITH_GOOGLE )
				.receiveGetCompatibilityChecks( conflictingPluginsChecks );

			fetchMock.postOnce(
				new RegExp(
					'^/google-site-kit/v1/core/user/data/dismiss-item'
				),
				{ body: [] }
			);

			const { getByRole, waitForRegistry } = render(
				<NotificationComponent />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			fireEvent.click( getByRole( 'button', { name: /Dismiss/i } ) );

			await waitForRegistry();

			expect( fetchMock ).toHaveFetched(
				new RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' )
			);
		} );
	} );
} );
