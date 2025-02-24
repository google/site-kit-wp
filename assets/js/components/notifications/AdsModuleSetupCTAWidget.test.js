/**
 * AdsModuleSetupCTAWidget component tests.
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
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import { mockLocation } from '../../../../tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
	render,
} from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_NOTIFICATIONS } from '../../googlesitekit/notifications/datastore/constants';
import { ADS_NOTIFICATIONS } from '../../modules/ads';
import {
	ADS_WOOCOMMERCE_REDIRECT_MODAL_DISMISS_KEY,
	MODULES_ADS,
} from '../../modules/ads/datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../googlesitekit/constants';
import { withNotificationComponentProps } from '../../googlesitekit/notifications/util/component-props';
import AdsModuleSetupCTAWidget from './AdsModuleSetupCTAWidget';
import { enabledFeatures } from '../../features';

const NOTIFICATION_ID = 'ads-setup-cta';

describe( 'AdsModuleSetupCTAWidget', () => {
	let registry;

	const notification = ADS_NOTIFICATIONS[ NOTIFICATION_ID ];

	const AdsModuleSetupCTAWidgetComponent = withNotificationComponentProps(
		NOTIFICATION_ID
	)( AdsModuleSetupCTAWidget );

	const fetchDismissPrompt = new RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-prompt'
	);

	beforeEach( () => {
		enabledFeatures.add( 'adsPax' );

		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'ads',
				active: false,
				connected: false,
			},
		] );
		provideSiteInfo( registry );

		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				woocommerce: {
					active: false,
				},
				'google-listings-and-ads': {
					active: false,
					adsConnected: false,
				},
			},
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( [] );
	} );

	describe( 'Primary CTA', () => {
		mockLocation();

		beforeEach( () => {
			provideUserCapabilities( registry );

			registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification( NOTIFICATION_ID, notification );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

			registry
				.dispatch( CORE_USER )
				.finishResolution( 'getDismissedPrompts', [] );
		} );

		it( 'should trigger WooCommerce redirect modal when WooCommerce is active but Google For WooCommerce is not', async () => {
			registry.dispatch( MODULES_ADS ).receiveModuleData( {
				plugins: {
					woocommerce: {
						active: true,
					},
					'google-listings-and-ads': {
						active: false,
						adsConnected: false,
					},
				},
			} );

			fetchMock.postOnce( fetchDismissPrompt, {
				body: {
					[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
				},
			} );

			const { getByText, waitForRegistry } = render(
				<AdsModuleSetupCTAWidgetComponent />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			const primaryCTA = getByText( 'Set up Ads' );
			fireEvent.click( primaryCTA );

			await waitForRegistry();

			expect(
				document.querySelector( '.mdc-dialog' )
			).toBeInTheDocument();
			// Dismissal should be triggered when the modal is opened.
			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should trigger WooCommerce redirect modal when both WooCommerce and Google For WooCommerce are active but Ads account is not connected', async () => {
			registry.dispatch( MODULES_ADS ).receiveModuleData( {
				plugins: {
					woocommerce: {
						active: true,
					},
					'google-listings-and-ads': {
						active: true,
						adsConnected: false,
					},
				},
			} );

			fetchMock.postOnce( fetchDismissPrompt, {
				body: {
					[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
				},
			} );

			const { getByText, waitForRegistry } = render(
				<AdsModuleSetupCTAWidgetComponent />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			const primaryCTA = getByText( 'Set up Ads' );
			fireEvent.click( primaryCTA );

			await waitForRegistry();

			expect(
				document.querySelector( '.mdc-dialog' )
			).toBeInTheDocument();

			// Dismissal should be triggered when the modal is opened.
			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should start Ads module activation when WooCommerce is not active', async () => {
			provideModuleRegistrations( registry );

			fetchMock.getOnce(
				RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
				{
					body: { needsReauthentication: false },
				}
			);
			fetchMock.postOnce(
				RegExp( 'google-site-kit/v1/core/modules/data/activation' ),
				{
					body: { success: true },
				}
			);
			fetchMock.postOnce( fetchDismissPrompt, {
				body: {
					[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
				},
			} );

			const { getByText, waitForRegistry } = render(
				<AdsModuleSetupCTAWidgetComponent />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			const primaryCTA = getByText( 'Set up Ads' );
			fireEvent.click( primaryCTA );

			await waitForRegistry();

			expect(
				document.querySelector( '.mdc-dialog' )
			).not.toBeInTheDocument();

			expect(
				registry
					.select( CORE_MODULES )
					.isDoingSetModuleActivation( 'ads' )
			).toBe( true );

			// Dismissal should be triggered when the CTA is clicked.
			expect( fetchMock ).toHaveFetched( fetchDismissPrompt );
		} );

		it( 'should start Ads module activation if WooCommerce redirect modal was previously dismissed', async () => {
			provideModuleRegistrations( registry );
			registry.dispatch( MODULES_ADS ).receiveModuleData( {
				plugins: {
					woocommerce: {
						active: true,
					},
					'google-listings-and-ads': {
						active: true,
						adsConnected: false,
					},
				},
			} );

			registry
				.dispatch( CORE_USER )
				.receiveGetDismissedItems( [
					ADS_WOOCOMMERCE_REDIRECT_MODAL_DISMISS_KEY,
				] );

			fetchMock.getOnce(
				RegExp( '^/google-site-kit/v1/core/user/data/authentication' ),
				{
					body: { needsReauthentication: false },
				}
			);
			fetchMock.postOnce(
				RegExp( 'google-site-kit/v1/core/modules/data/activation' ),
				{
					body: { success: true },
				}
			);
			fetchMock.postOnce( fetchDismissPrompt, {
				body: {
					[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
				},
			} );

			const { getByText, waitForRegistry } = render(
				<AdsModuleSetupCTAWidgetComponent />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			const primaryCTA = getByText( 'Set up Ads' );
			fireEvent.click( primaryCTA );

			await waitForRegistry();

			expect(
				document.querySelector( '.mdc-dialog' )
			).not.toBeInTheDocument();

			expect(
				registry
					.select( CORE_MODULES )
					.isDoingSetModuleActivation( 'ads' )
			).toBe( true );

			// Dismissal should be triggered when the CTA is clicked.
			expect( fetchMock ).toHaveFetched( fetchDismissPrompt );
		} );
	} );

	describe( 'Tertiary CTA', () => {
		beforeEach( () => {
			provideUserCapabilities( registry );

			registry
				.dispatch( CORE_NOTIFICATIONS )
				.registerNotification( NOTIFICATION_ID, notification );

			registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
			registry
				.dispatch( CORE_USER )
				.finishResolution( 'getDismissedPrompts', [] );
		} );

		it( 'should dismiss notification', async () => {
			fetchMock.postOnce( fetchDismissPrompt, {
				body: {
					[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
				},
			} );

			const { getByText, waitForRegistry } = render(
				<div>
					<div id="adminmenu">
						<a href="http://test.test/wp-admin/admin.php?page=googlesitekit-settings">
							Settings
						</a>
					</div>
					<AdsModuleSetupCTAWidgetComponent />
				</div>,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			const tertiaryCTA = getByText( 'Maybe later' );
			fireEvent.click( tertiaryCTA );

			await waitForRegistry();

			expect( fetchMock ).toHaveFetched( fetchDismissPrompt );
			expect(
				document.querySelector( '.googlesitekit-publisher-win__title' )
			).not.toBeInTheDocument();

			// Tooltip should be visible after dismissing the notification.
			expect(
				document.querySelector( '.googlesitekit-tour-tooltip' )
			).toBeInTheDocument();
		} );
	} );

	describe( 'checkRequirements', () => {
		it( 'is not active when Ads module is already connected', async () => {
			provideModules( registry, [
				{
					slug: 'ads',
					active: true,
					connected: true,
				},
			] );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when notification was previously dismissed', async () => {
			await registry.dispatch( CORE_USER ).receiveGetDismissedPrompts( {
				[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is not active when Google for WooCommerce Ads account is linked', async () => {
			registry.dispatch( MODULES_ADS ).receiveModuleData( {
				plugins: {
					woocommerce: {
						active: true,
					},
					'google-listings-and-ads': {
						active: true,
						adsConnected: true,
					},
				},
			} );

			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( false );
		} );

		it( 'is active when Google for WooCommerce Ads account is not linked, notification was not dismissed and Ads is not active', async () => {
			const isActive = await notification.checkRequirements(
				registry,
				VIEW_CONTEXT_MAIN_DASHBOARD
			);

			expect( isActive ).toBe( true );
		} );
	} );
} );
