/**
 * AdBlockingRecoverySetupSuccessNotification component tests.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	render,
	waitFor,
} from '../../../../../../tests/js/test-utils';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '../../../../../../tests/js/mock-survey-endpoints';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '../../datastore/constants';
import * as tracking from '../../../../util/tracking';
import AdBlockingRecoverySetupSuccessNotification from './AdBlockingRecoverySetupSuccessNotification';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import { AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID } from '../../../../googlesitekit/notifications/constants';
import { ADSENSE_NOTIFICATIONS } from '../..';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

jest.mock( 'react-use', () => ( {
	...jest.requireActual( 'react-use' ),
	useIntersection: () => ( {
		isIntersecting: true,
	} ),
} ) );

describe( 'AdBlockingRecoverySetupSuccessNotification', () => {
	let registry;
	const AdBlockingRecoverySetupSuccessNotificationComponent =
		withNotificationComponentProps(
			AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID
		)( AdBlockingRecoverySetupSuccessNotification );

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: 'adsense',
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( MODULES_ADSENSE ).setSettings( {
			accountID: 'pub-123456',
		} );
	} );

	it( 'should render notification and trigger tracking events and ACR survey', async () => {
		fetchMock.getOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
			{
				authenticated: true,
			}
		);
		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/user/data/dismiss-item' ),
			{ body: {} }
		);

		mockSurveyEndpoints();

		await registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID,
				ADSENSE_NOTIFICATIONS[
					AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID
				]
			);

		await registry
			.dispatch( CORE_UI )
			.setValue(
				`notification/${ AD_BLOCKING_RECOVERY_SETUP_SUCCESS_NOTIFICATION_ID }/viewed`,
				true
			);

		registry
			.dispatch( MODULES_ADSENSE )
			.setAdBlockingRecoverySetupStatus(
				ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED
			);

		const { container, getByRole } = render(
			<AdBlockingRecoverySetupSuccessNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect( container ).toMatchSnapshot();

		// The survey trigger endpoint should be called on view.
		await waitFor( () =>
			expect( fetchMock ).toHaveFetched(
				surveyTriggerEndpoint,
				expect.objectContaining( {
					body: {
						data: { triggerID: 'abr_setup_completed' },
					},
				} )
			)
		);

		// The tracking event should fire when the notification is viewed.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_adsense-abr-success-notification',
			'view_notification',
			undefined,
			undefined
		);
		mockTrackEvent.mockClear();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByRole( 'button', { name: /Ok, got it!/i } ) );
		} );

		// The tracking event should fire when the notification is confirmed.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_adsense-abr-success-notification',
			'dismiss_notification',
			undefined,
			undefined
		);
	} );
} );
