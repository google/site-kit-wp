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
	act,
	fireEvent,
} from '../../../../tests/js/test-utils';
import {
	mockSurveyEndpoints,
	surveyTimeoutsEndpoint,
	surveyTriggerEndpoint,
} from '../../../../tests/js/mock-survey-endpoints';
import ConsentModeSetupCTABanner from './ConsentModeSetupCTABanner';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CONSENT_MODE_SETUP_CTA_WIDGET_SLUG } from './constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { DEFAULT_NOTIFICATIONS } from '../../googlesitekit/notifications/register-defaults';
import { dismissPromptEndpoint } from '../../../../tests/js/mock-dismiss-prompt-endpoints';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';

describe( 'ConsentModeSetupCTABanner', () => {
	mockLocation();

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

	it( 'should  dismiss the notification when the setup CTA is clicked', async () => {
		// Not using mockSurveyEndpoints() here because it only mocks a survey trigger once.
		// But this test requires two triggers, one on view and one on CTA click.
		fetchMock.post( surveyTriggerEndpoint, {
			status: 200,
			body: {},
		} );
		fetchMock.getOnce( surveyTimeoutsEndpoint, {
			status: 200,
			body: [],
		} );

		fetchMock.postOnce(
			new RegExp( '^/google-site-kit/v1/core/site/data/consent-mode' ),
			{
				body: {
					enabled: true,
					regions: [ 'AT' ],
				},
				status: 200,
			}
		);

		fetchMock.postOnce( dismissPromptEndpoint, {
			body: {
				CONSENT_MODE_SETUP_CTA_WIDGET_SLUG: { expires: 0, count: 1 },
			},
		} );

		registry
			.dispatch( CORE_USER )
			.finishResolution( 'getDismissedPrompts', [] );

		const { container, waitForRegistry, getByRole } = render(
			<ConsentModeSetupCTABannerComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( container ).not.toBeEmptyDOMElement();

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click(
				getByRole( 'button', {
					name: /Enable consent mode/i,
				} )
			);
		} );

		expect( fetchMock ).toHaveFetched( dismissPromptEndpoint );
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
