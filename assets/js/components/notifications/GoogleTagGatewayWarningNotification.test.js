/**
 * GoogleTagGatewayWarningNotification component tests.
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
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID } from '../../googlesitekit/notifications/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import * as tracking from '../../util/tracking';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import { enabledFeatures } from '../../features';
import GoogleTagGatewayWarningNotification from './GoogleTagGatewayWarningNotification';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'GoogleTagGatewayWarningNotification', () => {
	let registry;

	const notification =
		DEFAULT_NOTIFICATIONS[ GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID ];

	const gtgSettings = {
		isEnabled: true,
		isGTGHealthy: false,
		isScriptAccessEnabled: false,
	};

	const GTGWarningNotificationComponent = withNotificationComponentProps(
		GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID
	)( GoogleTagGatewayWarningNotification );

	const dismissItemEndpoint = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		enabledFeatures.add( 'googleTagGateway' );

		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_ADS,
				active: true,
				connected: true,
			},
		] );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID,
				notification
			);

		registry
			.dispatch( CORE_SITE )
			.receiveGetGoogleTagGatewaySettings( gtgSettings );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'checkRequirements', () => {
		it( 'is active when all required conditions are met', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );

		it( 'is not active when server requirements are met and GTG is enabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when server requirements are not met, but GTG is disabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
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
		const { getByText } = render( <GTGWarningNotificationComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect(
			getByText(
				/Google tag gateway for advertisers has been disabled due to server configuration issues/i
			)
		).toBeInTheDocument();
	} );

	it( 'should track an event when the `Learn more` link is clicked', () => {
		const { getByRole } = render( <GTGWarningNotificationComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		const learnMoreLink = getByRole( 'link', {
			name: /Learn more/,
		} );

		learnMoreLink.click();

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_warning-notification-gtg',
			'click_learn_more_link'
		);
	} );

	it( 'should dismiss the notification when dismiss button is clicked', async () => {
		const { getByRole } = render( <GTGWarningNotificationComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		const dismissButton = getByRole( 'button', { name: /got it/i } );

		expect( dismissButton ).toBeInTheDocument();

		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [
				GTG_HEALTH_CHECK_WARNING_NOTIFICATION_ID,
			] ),
			status: 200,
		} );

		fireEvent.click( dismissButton );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		} );
	} );
} );
