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
import { mockLocation } from '../../../../../../tests/js/mock-browser-utils';
import {
	render,
	createTestRegistry,
	fireEvent,
	provideSiteInfo,
	provideModules,
	provideUserCapabilities,
	provideModuleRegistrations,
} from '../../../../../../tests/js/test-utils';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY } from '../../datastore/constants';
import WooCommerceRedirectModal from './WooCommerceRedirectModal';

describe( 'WooCommerceRedirectModal', () => {
	mockLocation();
	let registry;

	const moduleActivationEndpoint = RegExp(
		'google-site-kit/v1/core/modules/data/activation'
	);
	const userAuthenticationEndpoint = RegExp(
		'^/google-site-kit/v1/core/user/data/authentication'
	);

	let cacheItemSpy;

	beforeEach( () => {
		registry = createTestRegistry();

		cacheItemSpy = jest.spyOn(
			registry.dispatch( CORE_SITE ),
			'setCacheItem'
		);

		provideSiteInfo( registry );
		provideModules( registry );
		provideModuleRegistrations( registry );
		provideUserCapabilities( registry );
	} );

	afterEach( () => {
		cacheItemSpy.mockReset();
	} );

	it( 'clicking "Continue with Site Kit" should trigger ads module activation and dismiss the modal', async () => {
		fetchMock.postOnce( moduleActivationEndpoint, {
			body: { success: true },
		} );
		fetchMock.getOnce( userAuthenticationEndpoint, {
			body: { needsReauthentication: false },
		} );

		const { getByText, waitForRegistry } = render(
			<WooCommerceRedirectModal />,
			{ registry }
		);
		await waitForRegistry();

		const continueWithSiteKitButton = getByText(
			/continue with site kit/i
		);
		fireEvent.click( continueWithSiteKitButton );

		await waitForRegistry();

		expect(
			registry.select( CORE_MODULES ).isDoingSetModuleActivation( 'ads' )
		).toBe( true );

		// Modal should be dismissed.
		expect( cacheItemSpy ).toHaveBeenCalledWith(
			ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY,
			{ ttl: 0 }
		);
	} );

	it( 'clicking "Use Google for WooCommerce" should link to the install plugin page with Google for WooCommerce search term when Google for WooCommerce is not active', async () => {
		provideSiteInfo( registry, {
			plugins: {
				wooCommerce: {
					active: true,
					installed: true,
				},
				googleForWooCommerce: {
					active: false,
					installed: false,
				},
			},
		} );
		const { getByText, waitForRegistry } = render(
			<WooCommerceRedirectModal />,
			{ registry }
		);
		await waitForRegistry();

		const useGoogleForWooCommerceButton = getByText(
			/use google for woocommerce/i
		);
		fireEvent.click( useGoogleForWooCommerceButton );

		await waitForRegistry();

		expect( global.location.assign ).toHaveBeenCalledWith(
			expect.stringMatching( /plugin-install\.php/ )
		);
		expect( global.location.assign ).toHaveBeenCalledWith(
			expect.stringMatching( /s=google-listings-and-ads/ )
		);
		expect( global.location.assign ).toHaveBeenCalledWith(
			expect.stringMatching( /tab=search/ )
		);

		// Modal should be dismissed.
		expect( cacheItemSpy ).toHaveBeenCalledWith(
			ADS_WOOCOMMERCE_REDIRECT_MODAL_CACHE_KEY,
			{ ttl: 0 }
		);
	} );

	it( 'clicking "Use Google for WooCommerce" should link to the google dashboard of the Google for WooCommerce when Google for WooCommerce is active', async () => {
		provideSiteInfo( registry, {
			plugins: {
				wooCommerce: {
					active: true,
					installed: true,
				},
				googleForWooCommerce: {
					active: true,
					installed: true,
				},
			},
		} );
		const { getByText, waitForRegistry } = render(
			<WooCommerceRedirectModal />,
			{ registry }
		);
		await waitForRegistry();

		const useGoogleForWooCommerceButton = getByText(
			/use google for woocommerce/i
		);
		fireEvent.click( useGoogleForWooCommerceButton );

		await waitForRegistry();

		expect( global.location.assign ).toHaveBeenCalledWith(
			expect.stringMatching( /page=wc-admin/ )
		);
		expect( global.location.assign ).toHaveBeenCalledWith(
			expect.stringMatching( /path=%2Fgoogle%2Fdashboard/ )
		);
	} );
} );
