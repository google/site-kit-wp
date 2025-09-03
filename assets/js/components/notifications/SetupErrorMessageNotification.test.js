/**
 * SetupErrorMessageNotification component tests.
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
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '../../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_SPLASH,
} from '@/js/googlesitekit/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import SetupErrorMessageNotification from './SetupErrorMessageNotification';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { FORM_TEMPORARY_PERSIST_PERMISSION_ERROR } from '@/js/googlesitekit/datastore/user/constants';
import { snapshotAllStores } from '@/js/googlesitekit/data/create-snapshot-store';

jest.mock( '../../googlesitekit/data/create-snapshot-store', () => ( {
	...jest.requireActual( '../../googlesitekit/data/create-snapshot-store' ),
	snapshotAllStores: jest.fn(),
} ) );

const SETUP_ERROR_NOTIFICATION = 'setup_plugin_error';

const NotificationWithComponentProps = withNotificationComponentProps(
	'authentication-error'
)( SetupErrorMessageNotification );

describe( 'SetupErrorMessageNotification', () => {
	let registry;

	const notification = DEFAULT_NOTIFICATIONS[ SETUP_ERROR_NOTIFICATION ];

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'renders `Get help` link', async () => {
		provideUserAuthentication( registry, {
			unsatisfiedScopes: [
				'https://www.googleapis.com/auth/analytics.readonly',
			],
		} );
		provideSiteInfo( registry, {
			proxySupportLinkURL: 'https://test.com',
			setupErrorCode: 'error_code',
			setupErrorMessage: 'An error occurred',
		} );

		const { container, getByRole, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Get help' );
		expect( getByRole( 'link', { name: /get help/i } ) ).toHaveAttribute(
			'href',
			registry.select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
				code: registry.select( CORE_SITE ).getSetupErrorCode(),
			} )
		);
	} );

	it( 'does not render the redo setup CTA if it is not due to the interruption of plugin setup and no permission is temporarily persisted', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );
		provideUserAuthentication( registry );
		provideSiteInfo( registry, {
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
			setupErrorRedoURL: '#',
		} );

		const { container, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Setup was interrupted' );
		expect( container ).not.toHaveTextContent( 'Redo the plugin setup' );
	} );

	it( 'does render the grant permission CTA if additional permissions were not granted and permission is temporarily persisted', async () => {
		provideUserAuthentication( registry );
		provideSiteInfo( registry, {
			isAuthenticated: true,
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
			setupErrorRedoURL: '#',
		} );

		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_TEMPORARY_PERSIST_PERMISSION_ERROR, {
				permissionsError: {
					status: 403,
					message: 'Generic scope',
					data: {
						scopes: [
							'https://www.googleapis.com/auth/analytics.edit',
						],
					},
				},
			} );

		const { container, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		expect( container ).toHaveTextContent( 'Setup was interrupted' );
		expect( container ).toHaveTextContent( 'Grant permission' );
	} );

	it( 'calls snapshotAllStores when CTA button is clicked with persisted permissions error', async () => {
		snapshotAllStores.mockClear();

		provideUserAuthentication( registry );
		provideSiteInfo( registry, {
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
			setupErrorRedoURL: '#',
		} );

		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_TEMPORARY_PERSIST_PERMISSION_ERROR, {
				permissionsError: {
					status: 403,
					message: 'Generic scope',
					data: {
						scopes: [
							'https://www.googleapis.com/auth/analytics.edit',
						],
					},
				},
			} );

		const { getByRole, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);
		await waitForRegistry();

		const ctaButton = getByRole( 'button', { name: /grant permission/i } );
		expect( ctaButton ).toBeInTheDocument();

		// Prevent navigation by intercepting the click.
		// This is to prevent the leaking after the test cleanup.
		const handleClick = jest.fn( ( event ) => {
			event.preventDefault();
		} );
		ctaButton.addEventListener( 'click', handleClick );

		ctaButton.click();

		expect( snapshotAllStores ).toHaveBeenCalledWith( registry );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active on the splash screen when permissions are not granted', async () => {
			provideSiteInfo( registry, {
				setupErrorRedoURL: '#',
				setupErrorCode: 'access_denied',
				setupErrorMessage:
					'Setup was interrupted because you did not grant the necessary permissions',
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_SPLASH
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when there is no setup error', async () => {
			provideSiteInfo( registry );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_SPLASH
			);

			expect( isActive ).toBe( false );
		} );
	} );
} );
