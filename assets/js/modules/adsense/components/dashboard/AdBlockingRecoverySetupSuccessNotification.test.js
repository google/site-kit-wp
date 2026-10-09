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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { MODULE_SLUG_ADSENSE } from '@/js/modules/adsense/constants';
import {
	ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS,
	MODULES_ADSENSE,
} from '@/js/modules/adsense/datastore/constants';
import { ADSENSE_NOTIFICATIONS } from '@/js/modules/adsense/notifications';
import * as tracking from '@/js/util/tracking';
import {
	mockSurveyEndpoints,
	surveyTriggerEndpoint,
} from '@tests/js/mock-survey-endpoints';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModules,
	provideSiteInfo,
	render,
	waitFor,
} from '@tests/js/test-utils';
import AdBlockingRecoverySetupSuccessNotification from './AdBlockingRecoverySetupSuccessNotification';

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
		withNotificationComponentProps( 'adsense-abr-success-notification' )(
			AdBlockingRecoverySetupSuccessNotification
		);

	beforeEach( () => {
		mockTrackEvent.mockClear();
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ADSENSE,
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
				'adsense-abr-success-notification',
				ADSENSE_NOTIFICATIONS[ 'adsense-abr-success-notification' ]
			);

		await registry
			.dispatch( CORE_UI )
			.setValue(
				'notification/adsense-abr-success-notification/viewed',
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
			fireEvent.click( getByRole( 'button', { name: /Got it/i } ) );
		} );

		// The tracking event should fire when the notification is confirmed.
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_adsense-abr-success-notification',
			'dismiss_notification',
			undefined,
			undefined
		);
	} );

	describe( 'checkRequirements', () => {
		const notification =
			ADSENSE_NOTIFICATIONS[ 'adsense-abr-success-notification' ];
		let oldLocation;

		beforeAll( () => {
			oldLocation = global.location;
			delete global.location;
			global.location = { href: 'http://example.com/wp-admin/admin.php' };
		} );

		afterAll( () => {
			global.location = oldLocation;
		} );

		beforeEach( () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=ad_blocking_recovery_setup_success';

			registry.dispatch( MODULES_ADSENSE ).receiveGetSettings( {
				adBlockingRecoverySetupStatus:
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.SETUP_CONFIRMED,
			} );
		} );

		it( 'should be active when all the conditions are met', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'should not be active when the notification query argument is absent', async () => {
			global.location.href = 'http://example.com/wp-admin/admin.php';

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'should not be active when the notification query argument has a different value', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success';

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'should not be active when the AdSense module is not connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ADSENSE,
					active: true,
					connected: false,
				},
			] );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'should not be active when the ad blocking recovery setup is not confirmed', async () => {
			registry
				.dispatch( MODULES_ADSENSE )
				.setAdBlockingRecoverySetupStatus(
					ENUM_AD_BLOCKING_RECOVERY_SETUP_STATUS.TAG_PLACED
				);

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );
} );
