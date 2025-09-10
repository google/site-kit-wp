/**
 * WooCommerce modal (WooCommerceRedirectModal) E2E tests.
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
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	setupSiteKit,
	useRequestInterception,
	enableFeature,
} from '../../../utils';

// Selectors
const WOO_MODAL_SELECTOR = '.googlesitekit-dialog-woocommerce-redirect';

// CTA texts
const CTA_SETUP_ADS = /set up ads/i;
const CTA_START_SETUP = /start setup/i;
const CTA_CREATE_NEW_ACCOUNT = /create new account/i;
const CTA_KEEP_EXISTING_ACCOUNT = /keep existing account/i;

describe( 'Ads WooCommerce Redirect Modal', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();
			if (
				url.match(
					'/google-site-kit/v1/modules/search-console/data/searchanalytics'
				)
			) {
				request.respond( { status: 200, body: JSON.stringify( [] ) } );
			} else if (
				url.match(
					'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
				)
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else if (
				url.match( 'google-site-kit/v1/core/user/data/dismiss-prompt' )
			) {
				// Override the real dismissed prompts to avoid interference with the tests.
				// Otherwise the Ads Setup Banner will be dismissed already after the first test case
				// and it won't show up anymore.
				request.respond( {
					status: 200,
					body: JSON.stringify( {
						status: 200,
						body: {},
					} ),
				} );
			} else if (
				url.match( 'google-site-kit/v1/core/user/data/dismiss-item' )
			) {
				// Override the real dismissed item to avoid interference with the tests.
				// Otherwise the AccountLinkedViaGoogleForWooCommerceSubtleNotification notification
				// will be dismissed already after the first test case and it won't show up anymore.
				request.respond( {
					status: 200,
					body: JSON.stringify( [] ),
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await setupSiteKit();
		await enableFeature( 'adsPax' );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'shows WooCommerce modal when WooCommerce is active, but Google for WooCommerce is not', async () => {
		await activatePlugin( 'e2e-tests-mock-woocommerce-active' );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		// Wait for the Ads setup CTA banner to appear and click primary CTA.
		await Promise.all( [
			page.waitForSelector( '.googlesitekit-banner--setup-cta' ),
			expect( page ).toClick( '.googlesitekit-banner__cta', {
				text: CTA_SETUP_ADS,
			} ),
		] );

		await expect( page ).toMatchElement( WOO_MODAL_SELECTOR );
	} );

	it( 'shows WooCommerce modal when both WooCommerce and Google for WooCommerce are active, but Ads account is not set', async () => {
		await activatePlugin( 'e2e-tests-mock-woocommerce-active' );
		await activatePlugin( 'e2e-tests-mock-google-for-woocommerce-active' );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await page.waitForSelector( '.googlesitekit-banner--setup-cta' );
		await expect( page ).toClick( '.googlesitekit-banner__cta', {
			text: CTA_SETUP_ADS,
		} );

		await expect( page ).toMatchElement( WOO_MODAL_SELECTOR );
	} );

	it( 'dismisses the WooCommerce modal when "Create new account" CTA is clicked in AccountLinkedViaGoogleForWooCommerceSubtleNotification', async () => {
		await activatePlugin( 'e2e-tests-mock-woocommerce-active' );
		await activatePlugin( 'e2e-tests-mock-google-for-woocommerce-active' );
		await activatePlugin(
			'e2e-tests-mock-google-for-woocommerce-ads-connected'
		);
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		// Wait for the subtle notification to appear
		await page.waitForSelector( '.googlesitekit-notice', {
			timeout: 10000,
		} );

		// Verify the notification contains the expected text
		await expect( page ).toMatchElement( '.googlesitekit-notice', {
			text: /detected an existing Ads account/,
		} );

		// Click the "Create new account" CTA
		await expect( page ).toClick( '.mdc-button', {
			text: CTA_CREATE_NEW_ACCOUNT,
		} );

		// Wait for navigation to complete
		await page.waitForNavigation( { waitUntil: 'networkidle0' } );

		// Verify we're on the Ads setup page
		await page.waitForSelector( '.googlesitekit-setup-module--ads', {
			timeout: 10000,
		} );

		// Click "Start setup" button to trigger the modal check.
		await expect( page ).toClick( '.mdc-button', {
			text: CTA_START_SETUP,
		} );

		// Verify the modal is not present (it should be dismissed by the notification CTA).
		// Oauth flow being triggered verifies that the modal was dismissed.
		await page.waitForRequest( ( req ) =>
			req.url().includes( 'sitekit.withgoogle.com/o/oauth2/auth' )
		);
	} );

	it( 'dismisses the WooCommerce modal when "Keep existing account" CTA is clicked in AccountLinkedViaGoogleForWooCommerceSubtleNotification', async () => {
		await activatePlugin( 'e2e-tests-mock-woocommerce-active' );
		await activatePlugin( 'e2e-tests-mock-google-for-woocommerce-active' );
		await activatePlugin(
			'e2e-tests-mock-google-for-woocommerce-ads-connected'
		);

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		// Wait for the subtle notification to appear, then click the CTA.
		await Promise.all( [
			page.waitForSelector( '.googlesitekit-notice' ),
			expect( page ).toClick( '.mdc-button', {
				text: CTA_KEEP_EXISTING_ACCOUNT,
			} ),
		] );

		await expect( page ).not.toMatchElement( WOO_MODAL_SELECTOR );
	} );
} );
