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
	createTestRegistry,
	provideSiteInfo,
	provideNotifications,
} from '../../../../tests/js/test-utils';
import { VIEW_CONTEXT_SPLASH } from '../../googlesitekit/constants';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
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
