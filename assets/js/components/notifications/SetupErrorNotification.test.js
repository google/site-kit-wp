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
} from '../../../../tests/js/test-utils';
import {
	VIEW_CONTEXT_MAIN_DASHBOARD,
	VIEW_CONTEXT_SPLASH,
} from '../../googlesitekit/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import SetupErrorNotification from './SetupErrorNotification';

const SETUP_ERROR_NOTIFICATION = 'setup_error';

describe( 'SetupErrorNotification', () => {
	let registry;

	const NotificationWithComponentProps = withNotificationComponentProps(
		SETUP_ERROR_NOTIFICATION
	)( SetupErrorNotification );

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry, {
			setupErrorRedoURL: '#',
			setupErrorCode: 'access_denied',
			setupErrorMessage:
				'Setup was interrupted because you did not grant the necessary permissions',
		} );
	} );

	it( 'should display the notification when there is a permission error during setup', async () => {
		const { getByText, waitForRegistry } = render(
			<NotificationWithComponentProps />,
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

	// Skipped in the meantime until notifications API testing infrastructure is set in place,
	// currently this can't be tested as banner itself does not handle the checks and queue when it will be shown.
	// @TODO enbale test once notifications API is included in tests.
	// eslint-disable-next-line jest/no-disabled-tests
	it.skip( 'should not display the notification when permission error happens outside the setup screen', async () => {
		const { getByText, waitForRegistry } = render(
			<NotificationWithComponentProps />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			getByText( /oops! there was a problem during set up/i )
		).not.toBeInTheDocument();
	} );
} );
