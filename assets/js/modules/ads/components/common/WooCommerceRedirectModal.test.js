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
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_NOTIFICATIONS } from '@/js/googlesitekit/notifications/datastore/constants';
import {
	ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY,
	MODULES_ADS,
	PLUGINS,
} from '@/js/modules/ads/datastore/constants';
import { ADS_NOTIFICATIONS } from '@/js/modules/ads/notifications';
import * as tracking from '@/js/util/tracking';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserCapabilities,
	render,
} from '@tests/js/test-utils';
import WooCommerceRedirectModal from './WooCommerceRedirectModal';

const mockTrackEvent = jest.spyOn( tracking, 'trackEvent' );
mockTrackEvent.mockImplementation( () => Promise.resolve() );

const ACCOUNT_LINKED_NOTIFICATION_ID =
	'account-linked-via-google-for-woocommerce';

describe( 'WooCommerceRedirectModal', () => {
	mockLocation();
	let registry;

	const onClose = jest.fn();
	const onContinueWithSiteKit = jest.fn();
	const onUseGoogleForWooCommerce = jest.fn();

	function ModalComponent( props ) {
		return (
			<WooCommerceRedirectModal
				onClose={ onClose }
				onContinueWithSiteKit={ onContinueWithSiteKit }
				onUseGoogleForWooCommerce={ onUseGoogleForWooCommerce }
				dialogActive
				{ ...props }
			/>
		);
	}

	const dismissItemEndpoint = RegExp(
		'^/google-site-kit/v1/core/user/data/dismiss-item'
	);

	// Sets the WooCommerce / Google for WooCommerce plugin state.
	function providePluginState( {
		wooCommerceActive = false,
		googleForWooCommerceActive = false,
		adsConnected = false,
	} = {} ) {
		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.WOOCOMMERCE ]: {
					active: wooCommerceActive,
					installed: wooCommerceActive,
				},
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: googleForWooCommerceActive,
					installed: googleForWooCommerceActive,
					adsConnected,
				},
			},
		} );
	}

	function registerAccountLinkedNotification() {
		registry
			.dispatch( CORE_NOTIFICATIONS )
			.registerNotification(
				ACCOUNT_LINKED_NOTIFICATION_ID,
				ADS_NOTIFICATIONS[ ACCOUNT_LINKED_NOTIFICATION_ID ]
			);
	}

	function getGoogleForWooCommerceCTA( container ) {
		return container.querySelector(
			'.mdc-button:not(.mdc-dialog__cancel-button)'
		);
	}

	beforeEach( () => {
		jest.clearAllMocks();

		registry = createTestRegistry();

		provideSiteInfo( registry );
		provideModules( registry );
		provideModuleRegistrations( registry );
		provideUserCapabilities( registry );
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

		providePluginState();
	} );

	it( 'does not render when the modal has already been dismissed', async () => {
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

	describe.each( [
		[ 'only WooCommerce is active', { wooCommerceActive: true }, 'wc' ],
		[
			'Google for WooCommerce is also active',
			{ wooCommerceActive: true, googleForWooCommerceActive: true },
			'gfw',
		],
		[
			'Google for WooCommerce has a connected Ads account',
			{
				wooCommerceActive: true,
				googleForWooCommerceActive: true,
				adsConnected: true,
			},
			'gfw',
		],
	] )( 'when %s', ( _label, pluginState, trackEventLabel ) => {
		beforeEach( () => {
			providePluginState( pluginState );
		} );

		it( 'tracks the view event with the correct label', async () => {
			const { waitForRegistry } = render( <ModalComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			await waitForRegistry();

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pax_wc-redirect`,
				'view_modal',
				trackEventLabel
			);
		} );

		it( 'invokes onContinueWithSiteKit and tracks the event when choosing Site Kit', async () => {
			const { container, waitForRegistry } = render( <ModalComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			await waitForRegistry();

			fireEvent.click(
				container.querySelector( '.mdc-dialog__cancel-button' )
			);

			expect( onContinueWithSiteKit ).toHaveBeenCalledTimes( 1 );
			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pax_wc-redirect`,
				'choose_sk',
				trackEventLabel
			);
		} );

		it( 'stays open with a progress indicator while the caller continues with Site Kit', async () => {
			const { container, getByRole, queryByRole, waitForRegistry } =
				render( <ModalComponent />, { registry } );

			await waitForRegistry();

			expect( queryByRole( 'progressbar' ) ).not.toBeInTheDocument();

			fireEvent.click(
				container.querySelector( '.mdc-dialog__cancel-button' )
			);

			// The modal deliberately remains mounted: callers which activate
			// the Ads module rely on it to show progress until they navigate.
			expect(
				container.querySelector( '.mdc-dialog' )
			).toBeInTheDocument();
			expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
			expect(
				container.querySelector( '.mdc-dialog__cancel-button' )
			).toBeDisabled();
			expect( getGoogleForWooCommerceCTA( container ) ).toBeDisabled();
		} );

		it( 'tracks the event and dismisses the account linked notification when choosing Google for WooCommerce', async () => {
			fetchMock.postOnce( dismissItemEndpoint, {} );
			registerAccountLinkedNotification();

			const { container, waitForRegistry } = render( <ModalComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			await waitForRegistry();

			await act( async () => {
				await fireEvent.click(
					getGoogleForWooCommerceCTA( container )
				);
			} );

			expect( mockTrackEvent ).toHaveBeenCalledWith(
				`${ VIEW_CONTEXT_MAIN_DASHBOARD }_pax_wc-redirect`,
				'choose_gfw',
				trackEventLabel
			);
			// AccountLinkedViaGoogleForWooCommerceSubtleNotification should be dismissed.
			expect( fetchMock ).toHaveFetched( dismissItemEndpoint );
			expect( onUseGoogleForWooCommerce ).toHaveBeenCalledTimes( 1 );
			expect( onClose ).toHaveBeenCalledTimes( 1 );
			// Order matters: a caller which dismisses a notification here is
			// unmounted by it, and can no longer act on the close callback.
			expect( onClose.mock.invocationCallOrder[ 0 ] ).toBeLessThan(
				onUseGoogleForWooCommerce.mock.invocationCallOrder[ 0 ]
			);
		} );
	} );

	describe( 'when WooCommerce is active and Google for WooCommerce is not', () => {
		beforeEach( () => {
			providePluginState( { wooCommerceActive: true } );
		} );

		it( 'renders the WooCommerce copy and CTA labels', async () => {
			const { getByText, waitForRegistry } = render( <ModalComponent />, {
				registry,
			} );

			await waitForRegistry();

			expect(
				getByText( /using the woocommerce plugin\?/i )
			).toBeInTheDocument();
			expect(
				getByText( /continue with site kit/i )
			).toBeInTheDocument();
			expect(
				getByText( /use google for woocommerce/i )
			).toBeInTheDocument();
		} );

		it( 'links the Google for WooCommerce CTA to the plugin install page', async () => {
			const { container, waitForRegistry } = render( <ModalComponent />, {
				registry,
			} );

			await waitForRegistry();

			expect( getGoogleForWooCommerceCTA( container ) ).toHaveAttribute(
				'href',
				`http://example.com/wp-admin/plugin-install.php?s=${ PLUGINS.GOOGLE_FOR_WOOCOMMERCE }&tab=search&type=term`
			);
		} );

		it( 'does not navigate imperatively when the CTA is a link', async () => {
			registerAccountLinkedNotification();
			fetchMock.postOnce( dismissItemEndpoint, {} );

			const { container, waitForRegistry } = render( <ModalComponent />, {
				registry,
			} );

			await waitForRegistry();

			await act( async () => {
				await fireEvent.click(
					getGoogleForWooCommerceCTA( container )
				);
			} );

			expect( global.location.assign ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when Google for WooCommerce is active without a connected Ads account', () => {
		beforeEach( () => {
			providePluginState( {
				wooCommerceActive: true,
				googleForWooCommerceActive: true,
			} );
		} );

		it( 'links the Google for WooCommerce CTA to the Google dashboard', async () => {
			const { container, waitForRegistry } = render( <ModalComponent />, {
				registry,
			} );

			await waitForRegistry();

			expect( getGoogleForWooCommerceCTA( container ) ).toHaveAttribute(
				'href',
				'http://example.com/wp-admin/admin.php?page=wc-admin&path=%2Fgoogle%2Fdashboard'
			);
		} );

		it( 'does not navigate imperatively when the CTA is a link', async () => {
			registerAccountLinkedNotification();
			fetchMock.postOnce( dismissItemEndpoint, {} );

			const { container, waitForRegistry } = render( <ModalComponent />, {
				registry,
			} );

			await waitForRegistry();

			await act( async () => {
				await fireEvent.click(
					getGoogleForWooCommerceCTA( container )
				);
			} );

			expect( global.location.assign ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'when Google for WooCommerce has a connected Ads account', () => {
		beforeEach( () => {
			providePluginState( {
				wooCommerceActive: true,
				googleForWooCommerceActive: true,
				adsConnected: true,
			} );
		} );

		it( 'renders the existing account copy and CTA labels', async () => {
			const { container, getByRole, getByText, waitForRegistry } = render(
				<ModalComponent />,
				{ registry }
			);

			await waitForRegistry();

			expect(
				getByText( /create another ads account for this site\?/i )
			).toBeInTheDocument();
			expect(
				getByRole( 'button', { name: /create another account/i } )
			).toBeInTheDocument();
			expect(
				getByRole( 'button', { name: /view current ads account/i } )
			).toBeInTheDocument();
			expect(
				container.querySelector(
					'.googlesitekit-dialog-woocommerce-redirect--ads-connected'
				)
			).toBeInTheDocument();
		} );

		it( 'navigates imperatively to the Google dashboard when viewing the current Ads account', async () => {
			registerAccountLinkedNotification();
			fetchMock.postOnce( dismissItemEndpoint, {} );

			const { container, getByRole, waitForRegistry } = render(
				<ModalComponent />,
				{ registry }
			);

			await waitForRegistry();

			// The CTA navigates imperatively, so it must not also be a link.
			expect(
				getGoogleForWooCommerceCTA( container )
			).not.toHaveAttribute( 'href' );

			await act( async () => {
				await fireEvent.click(
					getGoogleForWooCommerceCTA( container )
				);
			} );

			expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
			expect( global.location.assign ).toHaveBeenCalledWith(
				expect.stringMatching( /page=wc-admin/ )
			);
			expect( global.location.assign ).toHaveBeenCalledWith(
				expect.stringMatching( /path=%2Fgoogle%2Fdashboard/ )
			);
		} );

		it( 'invokes onContinueWithSiteKit when creating another account without an onClose callback', async () => {
			const { getByRole, waitForRegistry } = render(
				<ModalComponent onClose={ undefined } />,
				{ registry }
			);

			await waitForRegistry();

			fireEvent.click(
				getByRole( 'button', { name: /create another account/i } )
			);

			expect( onContinueWithSiteKit ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'when WooCommerce is not active', () => {
		it( 'only closes the modal when the Google for WooCommerce CTA is clicked', async () => {
			const { container, waitForRegistry } = render( <ModalComponent />, {
				registry,
				viewContext: VIEW_CONTEXT_MAIN_DASHBOARD,
			} );

			await waitForRegistry();

			mockTrackEvent.mockClear();

			await act( async () => {
				await fireEvent.click(
					getGoogleForWooCommerceCTA( container )
				);
			} );

			expect( onClose ).toHaveBeenCalledTimes( 1 );
			expect( onUseGoogleForWooCommerce ).not.toHaveBeenCalled();
			expect( mockTrackEvent ).not.toHaveBeenCalled();
			expect( global.location.assign ).not.toHaveBeenCalled();
		} );
	} );
} );
