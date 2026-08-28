/**
 * Ads SetupMain component tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ADS, PLUGINS } from '@/js/modules/ads/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import {
	act,
	createTestRegistry,
	fireEvent,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	render,
} from '@tests/js/test-utils';
import SetupMain from './SetupMain';

describe( 'SetupMain', () => {
	mockLocation();

	let registry: ReturnType< typeof createTestRegistry >;

	const WOO_MODAL_SELECTOR = '.googlesitekit-dialog-woocommerce-redirect';

	function providePluginState( {
		wooCommerceActive = false,
		googleForWooCommerceActive = false,
		adsConnected = false,
	} = {} ) {
		registry.dispatch( MODULES_ADS ).receiveModuleData( {
			plugins: {
				[ PLUGINS.WOOCOMMERCE ]: {
					active: wooCommerceActive,
				},
				[ PLUGINS.GOOGLE_FOR_WOOCOMMERCE ]: {
					active: googleForWooCommerceActive,
					adsConnected,
				},
			},
		} );
	}

	beforeEach( () => {
		registry = createTestRegistry();

		// `usingProxy: false` prevents survey triggers from making requests.
		provideSiteInfo( registry, { usingProxy: false } );
		provideModules( registry );
		provideModuleRegistrations( registry );
		// Without the Ads scope, continuing with Site Kit navigates to the
		// OAuth URL, which is the observable side effect asserted below.
		provideUserAuthentication( registry );
		registry.dispatch( CORE_USER ).receiveIsAdBlockerActive( false );
		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
		registry.dispatch( MODULES_ADS ).receiveGetSettings( {} );

		providePluginState();
	} );

	it( 'does not open the WooCommerce modal when WooCommerce is not active', async () => {
		const { container, getByRole, waitForRegistry } = render(
			<SetupMain />,
			{ registry }
		);

		await waitForRegistry();

		await act( async () => {
			await fireEvent.click(
				getByRole( 'button', { name: /start setup/i } )
			);
		} );

		expect(
			container.querySelector( WOO_MODAL_SELECTOR )
		).not.toBeInTheDocument();
		expect( global.location.assign ).toHaveBeenCalled();
	} );

	it( 'opens the WooCommerce modal when WooCommerce is active', async () => {
		providePluginState( { wooCommerceActive: true } );

		const { container, getByRole, waitForRegistry } = render(
			<SetupMain />,
			{ registry }
		);

		await waitForRegistry();

		await act( async () => {
			await fireEvent.click(
				getByRole( 'button', { name: /start setup/i } )
			);
		} );

		expect(
			container.querySelector( WOO_MODAL_SELECTOR )
		).toBeInTheDocument();
		expect( global.location.assign ).not.toHaveBeenCalled();
	} );

	it( 'closes the modal and continues account creation when "Continue with Site Kit" is clicked', async () => {
		providePluginState( { wooCommerceActive: true } );

		const { container, getByRole, waitForRegistry } = render(
			<SetupMain />,
			{ registry }
		);

		await waitForRegistry();

		await act( async () => {
			await fireEvent.click(
				getByRole( 'button', { name: /start setup/i } )
			);
		} );

		await act( async () => {
			await fireEvent.click(
				getByRole( 'button', { name: /continue with site kit/i } )
			);
		} );

		expect(
			container.querySelector( WOO_MODAL_SELECTOR )
		).not.toBeInTheDocument();
		expect( global.location.assign ).toHaveBeenCalled();
	} );

	it( 'closes the modal and continues account creation when "Create another account" is clicked', async () => {
		providePluginState( {
			wooCommerceActive: true,
			googleForWooCommerceActive: true,
			adsConnected: true,
		} );

		const { container, getByRole, waitForRegistry } = render(
			<SetupMain />,
			{ registry }
		);

		await waitForRegistry();

		await act( async () => {
			await fireEvent.click(
				getByRole( 'button', { name: /start setup/i } )
			);
		} );

		await act( async () => {
			await fireEvent.click(
				getByRole( 'button', { name: /create another account/i } )
			);
		} );

		expect(
			container.querySelector( WOO_MODAL_SELECTOR )
		).not.toBeInTheDocument();
		expect( global.location.assign ).toHaveBeenCalled();
	} );
} );
