/**
 * GoogleTagGatewayAutoEnableNotification component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { DEFAULT_NOTIFICATIONS } from '@/js/googlesitekit/notifications/register-defaults';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import { GTG_AUTO_ENABLE_NOTIFICATION } from '@/js/googlesitekit/notifications/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_ADS } from '@/js/modules/ads/constants';
import { MODULE_SLUG_TAGMANAGER } from '@/js/modules/tagmanager/constants';
import * as tracking from '@/js/util/tracking';
import { withNotificationComponentProps } from '@/js/googlesitekit/notifications/util/component-props';
import { enabledFeatures } from '@/js/features';
import { mockLocation } from '../../../../tests/js/mock-browser-utils';
import GoogleTagGatewayAutoEnableNotification from './GoogleTagGatewayAutoEnableNotification';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'GoogleTagGatewayAutoEnableNotification', () => {
	mockLocation();

	let registry;

	const notification = DEFAULT_NOTIFICATIONS[ GTG_AUTO_ENABLE_NOTIFICATION ];

	const gtgSettings = {
		isEnabled: false,
		isGTGHealthy: true,
		isScriptAccessEnabled: true,
		isGTGDefault: true,
	};

	const GTGAutoEnableNotificationComponent = withNotificationComponentProps(
		GTG_AUTO_ENABLE_NOTIFICATION
	)( GoogleTagGatewayAutoEnableNotification );

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
			{
				slug: MODULE_SLUG_TAGMANAGER,
				active: true,
				connected: true,
			},
		] );

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification( GTG_AUTO_ENABLE_NOTIFICATION, notification );

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

		it( 'is not active when GTG is already enabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
				isEnabled: true,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when isGTGDefault is false', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
				isGTGDefault: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when GTG is not healthy', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
				isGTGHealthy: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when script access is not enabled', async () => {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				...gtgSettings,
				isScriptAccessEnabled: false,
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when no GTG modules are connected', async () => {
			provideModules( registry, [
				{
					slug: MODULE_SLUG_ANALYTICS_4,
					active: true,
					connected: false,
				},
				{
					slug: MODULE_SLUG_ADS,
					active: true,
					connected: false,
				},
				{
					slug: MODULE_SLUG_TAGMANAGER,
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
	} );

	it( 'should render the notification with correct title and description', () => {
		const { getByText, container } = render(
			<GTGAutoEnableNotificationComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		expect(
			getByText( /An upgrade is coming to your site’s measurement/ )
		).toBeInTheDocument();

		expect(
			getByText(
				/Your site will begin routing measurement data \(like page views, clicks, and conversions\) through your own server/
			)
		).toBeInTheDocument();

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render "Got it" and "Edit settings" CTAs', () => {
		const { getByRole } = render( <GTGAutoEnableNotificationComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		expect(
			getByRole( 'button', { name: /got it/i } )
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: /edit settings/i } )
		).toBeInTheDocument();
	} );

	it( 'should track an event when the Learn more link is clicked', () => {
		const { getByRole } = render( <GTGAutoEnableNotificationComponent />, {
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
			'mainDashboard_gtg-auto-enable-notification',
			'click_learn_more_link'
		);
	} );

	it( 'should track an event and dismiss notification when "Got it" button is clicked', async () => {
		const { getByRole } = render( <GTGAutoEnableNotificationComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		fetchMock.post( dismissItemEndpoint, {
			body: JSON.stringify( [ GTG_AUTO_ENABLE_NOTIFICATION ] ),
			status: 200,
		} );

		const gotItButton = getByRole( 'button', { name: /got it/i } );

		fireEvent.click( gotItButton );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_gtg-auto-enable-notification',
			'dismiss_notification'
		);

		await waitFor( () => {
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
		} );
	} );

	it( 'should track an event and navigate when "Edit settings" button is clicked', () => {
		const { getByRole } = render( <GTGAutoEnableNotificationComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		const editSettingsButton = getByRole( 'button', {
			name: /edit settings/i,
		} );

		fireEvent.click( editSettingsButton );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			'mainDashboard_gtg-auto-enable-notification',
			'click_edit_settings'
		);

		expect( global.location.assign ).toHaveBeenCalledTimes( 1 );
		// The exact navigation path will depend on connected modules.
		expect( global.location.assign ).toHaveBeenCalledWith(
			expect.stringMatching( /analytics|ads|tagmanager/ )
		);
	} );

	describe( 'navigation priority', () => {
		it.each( [
			[
				'Analytics settings when Analytics is connected',
				{
					[ MODULE_SLUG_ANALYTICS_4 ]: true,
					[ MODULE_SLUG_ADS ]: false,
					[ MODULE_SLUG_TAGMANAGER ]: false,
				},
				'analytics',
			],
			[
				'Ads settings when only Ads is connected',
				{
					[ MODULE_SLUG_ANALYTICS_4 ]: false,
					[ MODULE_SLUG_ADS ]: true,
					[ MODULE_SLUG_TAGMANAGER ]: false,
				},
				'ads',
			],
			[
				'Tag Manager settings when only Tag Manager is connected',
				{
					[ MODULE_SLUG_ANALYTICS_4 ]: false,
					[ MODULE_SLUG_ADS ]: false,
					[ MODULE_SLUG_TAGMANAGER ]: true,
				},
				'tagmanager',
			],
		] )(
			'should navigate to %s',
			( testName, moduleConnections, expectedURLSubstring ) => {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
						active: true,
						connected: moduleConnections[ MODULE_SLUG_ANALYTICS_4 ],
					},
					{
						slug: MODULE_SLUG_ADS,
						active: true,
						connected: moduleConnections[ MODULE_SLUG_ADS ],
					},
					{
						slug: MODULE_SLUG_TAGMANAGER,
						active: true,
						connected: moduleConnections[ MODULE_SLUG_TAGMANAGER ],
					},
				] );

				const { getByRole } = render(
					<GTGAutoEnableNotificationComponent />,
					{
						registry,
						viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
					}
				);

				const editSettingsButton = getByRole( 'button', {
					name: /edit settings/i,
				} );

				fireEvent.click( editSettingsButton );

				expect( global.location.assign ).toHaveBeenCalledWith(
					expect.stringContaining( expectedURLSubstring )
				);
			}
		);
	} );
} );
