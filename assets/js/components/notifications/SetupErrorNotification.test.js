/**
 * SetupErrorNotification component tests.
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
	render,
	createTestRegistry,
	provideSiteInfo,
	provideNotifications,
} from '../../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_SPLASH,
} from '../../googlesitekit/constants';
import { NOTIFICATION_AREAS } from '../../googlesitekit/notifications/datastore/constants';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import Notifications from './Notifications';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

const SETUP_ERROR_NOTIFICATION = 'setup_error';

describe( 'SetupErrorNotification', () => {
	let registry;

	const notification = DEFAULT_NOTIFICATIONS[ SETUP_ERROR_NOTIFICATION ];

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry, {
			setupErrorRedoURL: '#',
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
		} );

		provideNotifications(
			registry,
			{
				[ SETUP_ERROR_NOTIFICATION ]: notification,
			},
			true
		);
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'should display the notification when there is a permission error during setup', async () => {
		const { getByText, waitForRegistry } = render(
			<Notifications areaSlug={ NOTIFICATION_AREAS.ERRORS } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SPLASH,
			}
		);

		await waitForRegistry();

		expect(
			getByText( /oops! there was a problem during set up/i )
		).toBeInTheDocument();
	} );

	it( 'should not display the notification when permission error happens outside the setup screen', async () => {
		const { queryByText, waitForRegistry } = render(
			<Notifications areaSlug={ NOTIFICATION_AREAS.ERRORS } />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			queryByText( /oops! there was a problem during set up/i )
		).not.toBeInTheDocument();
	} );

	describe( 'checkRequirements', () => {
		it( 'is active', async () => {
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
