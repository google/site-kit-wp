/**
 * AdsModuleSetupCTABanner component tests.
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
const mockShowTooltip = jest.fn();
jest.mock( '../../../../components/AdminMenuTooltip', () => ( {
	__esModule: true,
	default: jest.fn(),
	useShowTooltip: jest.fn( () => mockShowTooltip ),
} ) );

import { mockLocation } from '../../../../../../tests/js/mock-browser-utils';
import {
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserCapabilities,
	render,
} from '../../../../../../tests/js/test-utils';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import { ADS_NOTIFICATIONS } from '../..';
import { MODULES_ADS, PLUGINS } from '../../datastore/constants';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';
import { withNotificationComponentProps } from '../../../../googlesitekit/notifications/util/component-props';
import AdsModuleSetupCTABanner from './AdsModuleSetupCTABanner';
import { enabledFeatures } from '../../../../features';
import { dismissPromptEndpoint } from '../../../../../../tests/js/mock-dismiss-prompt-endpoints';

const NOTIFICATION_ID = 'ads-setup-cta';

describe( 'AdsModuleSetupCTABanner', () => {
	let registry;

	const notification = ADS_NOTIFICATIONS[ NOTIFICATION_ID ];

	const AdsModuleSetupCTABannerComponent = withNotificationComponentProps(
		NOTIFICATION_ID
	)( AdsModuleSetupCTABanner );

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
				[ PLUGINS.WOOCOMMERCE ]: {
					active: false,
				},
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
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
					[ PLUGINS.WOOCOMMERCE ]: {
						active: true,
					},
					[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
						active: false,
						adsConnected: false,
					},
				},
			} );

			fetchMock.postOnce( dismissPromptEndpoint, {
				body: {
					[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
				},
			} );

			const { getByText, waitForRegistry } = render(
				<AdsModuleSetupCTABannerComponent />,
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
					[ PLUGINS.WOOCOMMERCE ]: {
						active: true,
					},
					[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
						active: true,
						adsConnected: false,
					},
				},
			} );

			fetchMock.postOnce( dismissPromptEndpoint, {
				body: {
					[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
				},
			} );

			const { getByText, waitForRegistry } = render(
				<AdsModuleSetupCTABannerComponent />,
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
			fetchMock.postOnce( dismissPromptEndpoint, {
				body: {
					[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
				},
			} );

			const { getByText, waitForRegistry } = render(
				<AdsModuleSetupCTABannerComponent />,
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
			expect( fetchMock ).toHaveFetched( dismissPromptEndpoint );
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
			fetchMock.postOnce( dismissPromptEndpoint, {
				body: {
					[ NOTIFICATION_ID ]: { expires: 0, count: 1 },
				},
			} );

			const { getByText, waitForRegistry } = render(
				<AdsModuleSetupCTABannerComponent />,
				{ registry, viewContext: VIEW_CONTEXT_MAIN_DASHBOARD }
			);

			const tertiaryCTA = getByText( 'Maybe later' );
			fireEvent.click( tertiaryCTA );

			await waitForRegistry();

			expect( mockShowTooltip ).toHaveBeenCalled();
			expect( fetchMock ).toHaveFetched( dismissPromptEndpoint );
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
					[ PLUGINS.WOOCOMMERCE ]: {
						active: true,
					},
					[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
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
