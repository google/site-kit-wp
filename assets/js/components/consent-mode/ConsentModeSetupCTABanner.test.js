/**
 * ConsentModeSetupCTABanner component tests.
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
import {
	render,
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
	provideUserAuthentication,
} from '../../../../tests/js/test-utils';
import { mockSurveyEndpoints } from '../../../../tests/js/mock-survey-endpoints';
import ConsentModeSetupCTABanner from './ConsentModeSetupCTABanner';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from './constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';

describe( 'ConsentModeSetupCTABanner', () => {
	let registry;
	const ConsentModeSetupCTABannerComponent = withNotificationComponentProps(
		CONSENT_MODE_SETUP_CTA_WIDGET_SLUG
	)( ConsentModeSetupCTABanner );

	const notification =
		DEFAULT_NOTIFICATIONS[ CONSENT_MODE_SETUP_CTA_WIDGET_SLUG ];

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
				CONSENT_MODE_SETUP_CTA_WIDGET_SLUG,
				notification
			);
	} );

	it( 'should render the banner', async () => {
		mockSurveyEndpoints();

		registry
			.dispatch( CORE_USER )
			.finishResolution( 'getDismissedPrompts', [] );

		const { container, waitForRegistry } = render(
			<ConsentModeSetupCTABannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when consent mode is not enabled and ads is connected', async () => {
			registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
				enabled: false,
				adsConnected: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( true );
		} );

		it( 'is not active when consent mode is already enabled and ads is connected', async () => {
			registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
				enabled: true,
				adsConnected: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when consent mode is not enabled but ads is not connected', async () => {
			registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
				enabled: false,
				adsConnected: false,
			} );

			registry
				.dispatch( CORE_SITE )
				.receiveGetAdsMeasurementStatus(
					{ connected: false },
					{ useCache: true }
				);

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );

		it( 'is not active when consent mode is enabled and ads is not connected', async () => {
			registry.dispatch( CORE_SITE ).receiveGetConsentModeSettings( {
				enabled: true,
				adsConnected: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);
			expect( isActive ).toBe( false );
		} );
	} );
} );
