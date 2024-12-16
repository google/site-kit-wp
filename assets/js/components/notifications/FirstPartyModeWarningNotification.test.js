/**
 * FirstPartyModeWarningNotification component tests.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	provideUserInfo,
	render,
	waitFor,
} from '../../../../tests/js/test-utils';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { enabledFeatures } from '../../features';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { FPM_HEALTH_CHECK_WARNING_NOTIFICATION_ID } from '../../googlesitekit/notifications/constants';
import FirstPartyModeWarningNotification from './FirstPartyModeWarningNotification';

describe( 'FirstPartyModeWarningNotification', () => {
	let registry;

	const notification =
		DEFAULT_NOTIFICATIONS[ FPM_HEALTH_CHECK_WARNING_NOTIFICATION_ID ];

	const fpmSettings = {
		isEnabled: true,
		isFPMHealthy: false,
		isScriptAccessEnabled: false,
	};

	const FPMWarningNotificationComponent = withNotificationComponentProps(
		FPM_HEALTH_CHECK_WARNING_NOTIFICATION_ID
	)( FirstPartyModeWarningNotification );

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		enabledFeatures.add( 'firstPartyMode' );

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideModules( registry, [
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
			{
				slug: 'ads',
				active: true,
				connected: true,
			},
		] );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				FPM_HEALTH_CHECK_WARNING_NOTIFICATION_ID,
				notification
			);

		registry
			.dispatch( CORE_SITE )
			.receiveGetFirstPartyModeSettings( fpmSettings );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when all required conditions are met', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when server requirements are met and FPM is enabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetFirstPartyModeSettings( {
				...fpmSettings,
				isFPMHealthy: true,
				isScriptAccessEnabled: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when server requirements are not met, but FPM is disabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetFirstPartyModeSettings( {
				...fpmSettings,
				isEnabled: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );

	it( 'should render the notification', () => {
		const { getByText } = render( <FPMWarningNotificationComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect(
			getByText(
				/First-party mode has been disabled due to server configuration issues/i
			)
		).toBeInTheDocument();
	} );

	it( 'should dismiss the notification when dismiss button is clicked', async () => {
		const { getByRole } = render( <FPMWarningNotificationComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		const dismissButton = getByRole( 'button', { name: /got it/i } );

		expect( dismissButton ).toBeInTheDocument();

		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [
				FPM_HEALTH_CHECK_WARNING_NOTIFICATION_ID,
			] ),
			status: 200,
		} );

		fireEvent.click( dismissButton );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		} );
	} );
} );
