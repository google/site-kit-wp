/**
 * FirstPartyModeSetupSuccessSubtleNotification component tests.
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

import { createTestRegistry, render } from '../../../../tests/js/test-utils';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import FirstPartyModeSetupSuccessSubtleNotification from './FirstPartyModeSetupSuccessSubtleNotification';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { FPM_SHOW_SETUP_SUCCESS_NOTIFICATION } from './FirstPartyModeSetupBanner';

const NotificationWithComponentProps = withNotificationComponentProps(
	'setup-success-notification-fpm'
)( FirstPartyModeSetupSuccessSubtleNotification );

describe( 'FirstPartyModeSetupSuccessSubtleNotification', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should render correctly', () => {
		const { container, getByText } = render(
			<NotificationWithComponentProps />,
			{ registry }
		);

		expect(
			getByText(
				'You can always disable it in Analytics or Ads settings'
			)
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	describe( 'checkRequirements', () => {
		const notification =
			DEFAULT_NOTIFICATIONS[ 'setup-success-notification-fpm' ];

		it( 'is active when FPM_SHOW_SETUP_SUCCESS_NOTIFICATION is true', () => {
			registry
				.dispatch( CORE_UI )
				.setValue( FPM_SHOW_SETUP_SUCCESS_NOTIFICATION, true );

			const isActive = notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when FPM_SHOW_SETUP_SUCCESS_NOTIFICATION is false', () => {
			registry
				.dispatch( CORE_UI )
				.setValue( FPM_SHOW_SETUP_SUCCESS_NOTIFICATION, false );

			const isActive = notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );
} );
