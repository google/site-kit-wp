/**
 * WooCommerceRedirectModal tests.
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
 * Internal dependencies
 */
import { ADS_NOTIFICATIONS } from '../..';
import { mockLocation } from '../../../../../../tests/js/mock-browser-utils';
import {
	render,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideModules,
	provideUserCapabilities,
	provideModuleRegistrations,
	act,
} from '../../../../../../tests/js/test-utils';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import {
	ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY,
	MODULES_ADS,
	PLUGINS,
} from '../../datastore/constants';
import WooCommerceRedirectModal from './WooCommerceRedirectModal';
import * as tracking from '../../../../util/tracking';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

describe( 'WooCommerceRedirectModal', () => {
	mockLocation();
	let registry;

	const onClose = jest.fn();
	const onDismiss = jest.fn();

	function ModalComponent() {
		return (
			<WooCommerceRedirectModal
				dialogActive
				onDismiss={ onDismiss }
				onClose={ onClose }
			/>
		);
	}

	const moduleActivationEndpoint = RegExp(
		'google-site-kit/v1/core/modules/data/activation'
	);
	const userAuthenticationEndpoint = RegExp(
		'^/google-site-kit/v1/core/user/data/authentication'
	);
	const dismissItemEndpoint = RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	beforeEach( () => {
		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry );
		provideModuleRegistrations( registry );
		provideUserCapabilities( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

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
	} );

	it( 'tracks the correct event when viewed with only WooCommerce active', async () => {
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

		const { waitForRegistry } = render( <ModalComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pax_wc-redirect`,
			'view_modal',
			'wc'
		);
	} );

	it( 'tracks the correct event when viewed with Google for WooCommerce active', async () => {
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

		const { waitForRegistry } = render( <ModalComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pax_wc-redirect`,
			'view_modal',
			'gfw'
		);
	} );

	it( 'does not render when dismissed', async () => {
		await registry
			.dispatch( CORE_SITE )
			.setCacheItem( ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY, true );

		const { queryByText, waitForRegistry } = render( <ModalComponent />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			queryByText( /continue with site kit/i )
		).not.toBeInTheDocument();
	} );

	it( 'should trigger ads module activation and invoke the onDismiss callback when clicking "Continue with Site Kit"', async () => {
		fetchMock.postOnce( moduleActivationEndpoint, {
			body: { success: true },
		} );
		fetchMock.getOnce( userAuthenticationEndpoint, {
			body: { needsReauthentication: false },
		} );

		const { getByText, waitForRegistry } = render( <ModalComponent />, {
			registry,
		} );

		await waitForRegistry();

		const continueWithSiteKitButton = getByText(
			/continue with site kit/i
		);

		fireEvent.click( continueWithSiteKitButton );

		expect( onDismiss ).toHaveBeenCalled();

		expect(
			registry.select( CORE_MODULES ).isDoingSetModuleActivation( 'ads' )
		).toBe( true );
	} );

	it( 'should invoke onBeforeSetupCallback if passed when clicking "Continue with Site Kit"', async () => {
		fetchMock.postOnce( moduleActivationEndpoint, {
			body: { success: true },
		} );
		fetchMock.getOnce( userAuthenticationEndpoint, {
			body: { needsReauthentication: false },
		} );

		const onBeforeSetupCallback = jest.fn();

		const { getByText, waitForRegistry } = render(
			<WooCommerceRedirectModal
				dialogActive
				onDismiss={ onDismiss }
				onClose={ onClose }
				onBeforeSetupCallback={ onBeforeSetupCallback }
			/>,
			{
				registry,
			}
		);
		await waitForRegistry();

		const continueWithSiteKitButton = getByText(
			/continue with site kit/i
		);

		fireEvent.click( continueWithSiteKitButton );

		expect( onDismiss ).toHaveBeenCalled();
		expect( onBeforeSetupCallback ).toHaveBeenCalled();
	} );

	it( 'should trigger the correct internal tracking event when only WooCommerce is active and "Continue with Site Kit" is clicked', async () => {
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

		fetchMock.postOnce( moduleActivationEndpoint, {
			body: { success: true },
		} );
		fetchMock.getOnce( userAuthenticationEndpoint, {
			body: { needsReauthentication: false },
		} );

		const { getByText, waitForRegistry } = render( <ModalComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		const continueWithSiteKitButton = getByText(
			/continue with site kit/i
		);

		fireEvent.click( continueWithSiteKitButton );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pax_wc-redirect`,
			'choose_sk',
			'wc'
		);
	} );

	it( 'should trigger the correct internal tracking event when Google for WooCommerce is active and "Continue with Site Kit" is clicked', async () => {
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

		fetchMock.postOnce( moduleActivationEndpoint, {
			body: { success: true },
		} );
		fetchMock.getOnce( userAuthenticationEndpoint, {
			body: { needsReauthentication: false },
		} );

		const { getByText, waitForRegistry } = render( <ModalComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		const continueWithSiteKitButton = getByText(
			/continue with site kit/i
		);

		fireEvent.click( continueWithSiteKitButton );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pax_wc-redirect`,
			'choose_sk',
			'gfw'
		);
	} );

	it( 'should link to the install plugin page with Google for WooCommerce search term when Google for WooCommerce is not active and "Use Google for WooCommerce" is clicked', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {} );

		const notification =
			ADS_NOTIFICATIONS[ 'account-linked-via-google-for-woocommerce' ];

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				'account-linked-via-google-for-woocommerce',
				notification
			);

		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.WOOCOMMERCE ]: {
					active: true,
					installed: true,
				},
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: false,
					installed: false,
				},
			},
		} );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { container, waitForRegistry } = render( <ModalComponent />, {
			registry,
		} );

		await waitForRegistry();

		expect(
			container.querySelector(
				'.mdc-button:not(.mdc-dialog__cancel-button)'
			)
		).toHaveAttribute(
			'href',
			`http://example.com/wp-admin/plugin-install.php?s=${ PLUGINS.GOOGLE_FOR_WOOCOMMERCE }&tab=search&type=term`
		);
		expect( onDismiss ).toHaveBeenCalled();
	} );

	it( 'should link to the google dashboard of the Google for WooCommerce when Google for WooCommerce is active and "Use Google for WooCommerce" is clicked', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {} );
		const dismissNotificationSpy = jest.spyOn(
			registry.dispatch( CORE_NOTIFICATIONS ),
			'dismissNotification'
		);

		const notification =
			ADS_NOTIFICATIONS[ 'account-linked-via-google-for-woocommerce' ];

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				'account-linked-via-google-for-woocommerce',
				notification
			);

		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.WOOCOMMERCE ]: {
					active: true,
					installed: true,
				},
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: true,
					installed: true,
				},
			},
		} );
		const { container, waitForRegistry, getByText } = render(
			<ModalComponent />,
			{
				registry,
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector(
				'.mdc-button:not(.mdc-dialog__cancel-button)'
			)
		).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=wc-admin&path=%2Fgoogle%2Fdashboard'
		);

		const useGoogleForWooCommerceButton = getByText(
			/Use Google for WooCommerce/i
		);

		await act( async () => {
			await fireEvent.click( useGoogleForWooCommerceButton );
		} );

		expect( dismissNotificationSpy ).toHaveBeenCalled();

		// AccountLinkedViaGoogleForWooCommerceSubtleNotification should be dismissed.
		expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
	} );

	it( 'should link to the google dashboard of the Google for WooCommerce when Google for WooCommerce is active and has Ads account connected when "View current Ads account" is clicked', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {} );
		const dismissNotificationSpy = jest.spyOn(
			registry.dispatch( CORE_NOTIFICATIONS ),
			'dismissNotification'
		);

		const notification =
			ADS_NOTIFICATIONS[ 'account-linked-via-google-for-woocommerce' ];

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				'account-linked-via-google-for-woocommerce',
				notification
			);

		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.WOOCOMMERCE ]: {
					active: true,
					installed: true,
				},
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: true,
					installed: true,
					adsConnected: true,
				},
			},
		} );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		const { getByText, waitForRegistry } = render( <ModalComponent />, {
			registry,
		} );

		await waitForRegistry();

		const viewCurrentAdsAccountButton = getByText(
			/view current ads account/i
		);

		await act( async () => {
			await fireEvent.click( viewCurrentAdsAccountButton );
		} );

		expect( dismissNotificationSpy ).toHaveBeenCalled();

		// AccountLinkedViaGoogleForWooCommerceSubtleNotification should be dismissed.
		expect( fetchMock ).toHaveFetched( dismissItemEndpoint );

		expect( global.location.assign ).toHaveBeenCalledWith(
			expect.stringMatching( /page=wc-admin/ )
		);
		expect( global.location.assign ).toHaveBeenCalledWith(
			expect.stringMatching( /path=%2Fgoogle%2Fdashboard/ )
		);
		expect( onDismiss ).toHaveBeenCalled();
	} );

	it( 'should trigger ads module activation and dismiss the modal when "Create another account" is clicked', async () => {
		fetchMock.postOnce( moduleActivationEndpoint, {
			body: { success: true },
		} );
		fetchMock.getOnce( userAuthenticationEndpoint, {
			body: { needsReauthentication: false },
		} );

		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.WOOCOMMERCE ]: {
					active: true,
					installed: true,
				},
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: true,
					installed: true,
					adsConnected: true,
				},
			},
		} );

		const { getByRole, waitForRegistry } = render( <ModalComponent />, {
			registry,
		} );

		await waitForRegistry();

		const createAnotherAccountButton = getByRole( 'button', {
			name: /create another account/i,
		} );

		fireEvent.click( createAnotherAccountButton );

		expect(
			registry.select( CORE_MODULES ).isDoingSetModuleActivation( 'ads' )
		).toBe( true );
		expect( onDismiss ).toHaveBeenCalled();
	} );

	it( 'should trigger the correct internal tracking event when Google for WooCommerce is active with no Ads account linked when "Continue with Google for WooCommerce" is clicked', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {} );

		const notification =
			ADS_NOTIFICATIONS[ 'account-linked-via-google-for-woocommerce' ];

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				'account-linked-via-google-for-woocommerce',
				notification
			);

		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.WOOCOMMERCE ]: {
					active: true,
					installed: true,
				},
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: true,
					installed: true,
					adsConnected: false,
				},
			},
		} );
		const { container, waitForRegistry, getByText } = render(
			<ModalComponent />,
			{
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			}
		);

		await waitForRegistry();

		expect(
			container.querySelector(
				'.mdc-button:not(.mdc-dialog__cancel-button)'
			)
		).toHaveAttribute(
			'href',
			'http://example.com/wp-admin/admin.php?page=wc-admin&path=%2Fgoogle%2Fdashboard'
		);

		const useGoogleForWooCommerceButton = getByText(
			/Use Google for WooCommerce/i
		);

		await act( async () => {
			await fireEvent.click( useGoogleForWooCommerceButton );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pax_wc-redirect`,
			'choose_gfw',
			'gfw'
		);
	} );

	it( 'should trigger the correct internal tracking event when Google for WooCommerce is active with Ads account linked when "Continue with Google for WooCommerce" is clicked', async () => {
		fetchMock.postOnce( dismissItemEndpoint, {} );

		const notification =
			ADS_NOTIFICATIONS[ 'account-linked-via-google-for-woocommerce' ];

		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				'account-linked-via-google-for-woocommerce',
				notification
			);

		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.WOOCOMMERCE ]: {
					active: true,
					installed: true,
				},
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: true,
					installed: true,
					adsConnected: true,
				},
			},
		} );
		const { waitForRegistry, getByText } = render( <ModalComponent />, {
			registry,
			viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
		} );

		await waitForRegistry();

		mockTrackEvent.mockClear();

		const viewCurrentAdsAccountButton = getByText(
			/View current Ads account/i
		);

		await act( async () => {
			await fireEvent.click( viewCurrentAdsAccountButton );
		} );

		expect( mockTrackEvent ).toHaveBeenCalledWith(
			`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pax_wc-redirect`,
			'choose_gfw',
			'gfw'
		);
	} );
} );
