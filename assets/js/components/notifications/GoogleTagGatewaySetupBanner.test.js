/**
 * GoogleTagGatewaySetupBanner component tests.
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

import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import GoogleTagGatewaySetupBanner from './GoogleTagGatewaySetupBanner';
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
import {
	GTG_SETUP_CTA_BANNER_NOTIFICATION,
	NOTIFICATION_GROUPS,
} from '../../googlesitekit/notifications/constants';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import * as tracking from '../../util/tracking';
import { enabledFeatures } from '../../features';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'GoogleTagGatewaySetupBanner', () => {
	let registry;

	const notification =
		DEFAULT_NOTIFICATIONS[ GTG_SETUP_CTA_BANNER_NOTIFICATION ];

	const GTGBannerComponent = withNotificationComponentProps(
		GTG_SETUP_CTA_BANNER_NOTIFICATION
	)( GoogleTagGatewaySetupBanner );

	const gtgSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/core/site/data/gtg-settings'
	);

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

		registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
			isEnabled: false,
			isGTGHealthy: true,
			isScriptAccessEnabled: true,
		} );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				GTG_SETUP_CTA_BANNER_NOTIFICATION,
				notification
			);

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
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

		it( 'is not active when GTG is enabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: true,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when GTG is not healthy', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: false,
				isScriptAccessEnabled: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when script access is not enabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: false,
				isGTGHealthy: true,
				isScriptAccessEnabled: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );
	} );

	it( 'should render the banner', async () => {
		const { getByRole, getByText, waitForRegistry } = render(
			<GTGBannerComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			getByText(
				'Get more comprehensive stats by collecting metrics via your own site'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', {
				name: 'Enable Google tag gateway for advertisers',
			} )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Maybe later' } )
		).toBeInTheDocument();
	} );

	it( 'should call onCTAClick when the CTA button is clicked', async () => {
		fetchMock.postOnce( gtgSettingsEndpoint, {
			body: JSON.stringify( {
				isEnabled: true,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} ),
			status: 200,
		} );

		const { getByRole, waitForRegistry } = render( <GTGBannerComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		expect(
			registry.select( CORE_SITE ).getGoogleTagGatewaySettings().isEnabled
		).toBe( false );

		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ GTG_SETUP_CTA_BANNER_NOTIFICATION ] ),
			status: 200,
		} );

		fireEvent.click(
			getByRole( 'button', {
				name: 'Enable Google tag gateway for advertisers',
			} )
		);

		await waitFor( () => {
			expect(
				registry.select( CORE_SITE ).getGoogleTagGatewaySettings()
					.isEnabled
			).toBe( true );

			expect( fetchMock ).toHaveFetched( gtgSettingsEndpoint );
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		} );
	} );

	it( 'should display the error message when the CTA button is clicked and the request fails', async () => {
		fetchMock.postOnce( gtgSettingsEndpoint, {
			body: JSON.stringify( {
				code: 'test_error',
				message: 'Test Error',
				data: {
					reason: 'test_reason',
				},
			} ),
			status: 500,
		} );

		const { getByRole, waitForRegistry } = render( <GTGBannerComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ GTG_SETUP_CTA_BANNER_NOTIFICATION ] ),
			status: 200,
		} );

		fireEvent.click(
			getByRole( 'button', {
				name: 'Enable Google tag gateway for advertisers',
			} )
		);

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( gtgSettingsEndpoint );
			expect( fetchMock ).not.toHaveFetched( dismissItemEndpoint );
		} );

		expect(
			document.querySelector(
				'.googlesitekit-notice--error .googlesitekit-notice__content p.googlesitekit-notice__description'
			).textContent
		).toContain( 'Test Error' );
	} );

	it( 'should register the GTG setup success notification when the CTA button is clicked', async () => {
		const { getByRole, waitForRegistry } = render( <GTGBannerComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			features: [ 'googleTagGateway' ],
		} );

		await waitForRegistry();

		fetchMock.postOnce( gtgSettingsEndpoint, {
			body: JSON.stringify( {
				isEnabled: true,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} ),
			status: 200,
		} );

		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ GTG_SETUP_CTA_BANNER_NOTIFICATION ] ),
			status: 200,
		} );

		await registry
			.dispatch( CORE_NOTIFICATIONS )
			.receiveQueuedNotifications( [], NOTIFICATION_GROUPS.DEFAULT );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.finishResolution( 'getQueuedNotifications', [
				VIEW_CONTEXT_MAIN_DASHBOARD,
				NOTIFICATION_GROUPS.DEFAULT,
			] );

		fireEvent.click(
			getByRole( 'button', {
				name: 'Enable Google tag gateway for advertisers',
			} )
		);

		await waitForRegistry();

		await waitFor( () => {
			expect(
				registry.select( CORE_SITE ).getGoogleTagGatewaySettings()
					.isEnabled
			).toBe( true );

			expect( fetchMock ).toHaveFetched( gtgSettingsEndpoint );
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		} );

		expect(
			registry
				.select( CORE_NOTIFICATIONS )
				.getQueuedNotifications(
					VIEW_CONTEXT_MAIN_DASHBOARD,
					NOTIFICATION_GROUPS.DEFAULT
				)
				.map( ( notificationInQueue ) => notificationInQueue.id )
		).toContain( 'setup-success-notification-gtg' );
	} );

	it( 'should track events when the CTA is dismissed and the tooltip is viewed', async () => {
		const { getByRole, waitForRegistry } = render(
			<div>
				<div id="adminmenu">
					<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
						Settings
					</a>
				</div>
				<GTGBannerComponent />
			</div>,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ GTG_SETUP_CTA_BANNER_NOTIFICATION ] ),
			status: 200,
		} );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 0 );

		fireEvent.click( getByRole( 'button', { name: 'Maybe later' } ) );

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_gtg-setup-cta',
			'dismiss_notification',
			undefined,
			undefined
		);
	} );
} );
