/**
 * SiteKitSetupSuccessNotification component tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
	provideUserAuthentication,
	fireEvent,
	setEnabledFeatures,
} from '../../../../tests/js/test-utils';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';
import { mockSurveyEndpoints } from '../../../../tests/js/mock-survey-endpoints';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { SITE_KIT_SETUP_SUCCESS_NOTIFICATION } from '@/js/googlesitekit/notifications/constants';
import {
	GATHERING_DATA_DISMISSED_ITEM_SLUG,
	WITH_TOUR_DISMISSED_ITEM_SLUG,
} from '@/js/components/WelcomeModal';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import SiteKitSetupSuccessNotification from './SiteKitSetupSuccessNotification';

describe( 'SiteKitSetupSuccessNotification', () => {
	mockLocation();

	let registry: ReturnType< typeof createTestRegistry >;

	const SiteKitSetupSuccessNotificationComponent =
		withNotificationComponentProps( SITE_KIT_SETUP_SUCCESS_NOTIFICATION )(
			SiteKitSetupSuccessNotification
		);

	const notification =
		DEFAULT_NOTIFICATIONS[ SITE_KIT_SETUP_SUCCESS_NOTIFICATION ];

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );

		registry
			.dispatch( CORE_SITE )
			.receiveGetAdsMeasurementStatus(
				{ connected: true },
				{ useCache: true }
			);

		registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
			enabled: false,
			regions: [ 'AT', 'EU' ],
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				SITE_KIT_SETUP_SUCCESS_NOTIFICATION,
				notification
			);
	} );

	it( 'should render the banner', async () => {
		mockSurveyEndpoints();

		registry
			.dispatch( CORE_USER )
			.finishResolution( 'getDismissedPrompts', [] );

		const { container, waitForRegistry } = render(
			<SiteKitSetupSuccessNotificationComponent />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should clear the `notification` query arg when the notification is dismissed', async () => {
		global.location.href =
			'http://example.com/wp-admin/admin.php?notification=authentication_success';

		const { getByRole, waitForRegistry } = render(
			<SiteKitSetupSuccessNotificationComponent />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		await waitForRegistry();

		fireEvent.click( getByRole( 'button', { name: 'Got it!' } ) );

		expect( getQueryArg( location.href, 'notification' ) ).toBe(
			undefined
		);
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when the `notification` query arg is set to `authentication_success` and the `slug` query arg is not set', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success';

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when the `notification` query arg is not set to `authentication_success`', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=some_other_notification';

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when the `slug` query arg is set', async () => {
			global.location.href =
				'http://example.com/wp-admin/admin.php?notification=authentication_success&slug=some_other_slug';

			const isActive = await notification.checkRequirements( registry );
			expect( isActive ).toBe( false );
		} );

		describe( 'with the `setupFlowRefresh` feature flag enabled', () => {
			beforeEach( () => {
				setEnabledFeatures( [ 'setupFlowRefresh' ] );
			} );

			it( 'is active when the Welcome modal is dismissed', async () => {
				global.location.href =
					'http://example.com/wp-admin/admin.php?notification=authentication_success';

				// Dismissing the Welcome modal's dashboard tour variant also dismisses
				// the gathering data modal variant.
				registry
					.dispatch( CORE_USER )
					.receiveGetDismissedItems( [
						WITH_TOUR_DISMISSED_ITEM_SLUG,
						GATHERING_DATA_DISMISSED_ITEM_SLUG,
					] );

				const isActive = await notification.checkRequirements(
					registry
				);
				expect( isActive ).toBe( true );
			} );

			it( 'is not active when the Welcome modal is not dismissed', async () => {
				global.location.href =
					'http://example.com/wp-admin/admin.php?notification=authentication_success';

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				const isActive = await notification.checkRequirements(
					registry
				);
				expect( isActive ).toBe( false );
			} );
		} );
	} );
} );
