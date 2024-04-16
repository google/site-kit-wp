/**
 * Ads setup with no previous Ads conversion ID saved e2e tests.
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
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	enableFeature,
	resetSiteKit,
	setupSiteKit,
	step,
	useRequestInterception,
} from '../../../utils';

describe( 'Ads setup (with no Conversion Tracking ID present)', () => {
	async function setUpAdsModule() {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', {
			text: /connect more services/i,
		} );

		await Promise.all( [
			page.waitForSelector(
				'.googlesitekit-setup-module__action .mdc-button'
			),
			expect( page ).toClick( '.googlesitekit-cta-link', {
				text: /set up ads/i,
			} ),
		] );
	}

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
				request
					.url()
					.match(
						'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
					)
			) {
				request.respond( { status: 200, body: JSON.stringify( {} ) } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await enableFeature( 'adsModule' );
		await setupSiteKit();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'shows error message if an invalid Conversion Tracking ID is entered', async () => {
		await setUpAdsModule();

		const adsConversionIDField = await page.$( '.mdc-text-field' );
		// Enter valid value in order to remove error message due to the field being empty.
		await expect( adsConversionIDField ).toFill( 'input', '12345' );

		// Enter invalid value to trigger error message.
		await expect( adsConversionIDField ).toFill( 'input', 'bbb' );

		await expect( page ).toMatchElement( '.mdc-text-field-helper-text', {
			text: /tracking for your ads campaigns won’t work until you insert a valid id/i,
		} );
	} );

	it( 'connects the module when a valid Conversion Tracking ID is saved', async () => {
		await setUpAdsModule();

		const adsConversionIDField = await page.$( '.mdc-text-field' );
		await expect( adsConversionIDField ).toFill( 'input', 'AW-12345' );

		await step(
			'wait for settings submission',
			Promise.all( [
				expect( page ).toClick( '.mdc-button', {
					text: /complete setup/i,
				} ),
				page.waitForNavigation(),
			] )
		);

		await page.waitForSelector( '.googlesitekit-subtle-notification' );
		await expect( page ).toMatchElement(
			'.googlesitekit-subtle-notification',
			{
				text: /success! your conversion tracking id was added to your site/i,
			}
		);

		await step(
			'visit site kit settings',
			visitAdminPage( 'admin.php', 'page=googlesitekit-settings' )
		);

		// Ads module should be in the active modules list.
		await expect( page ).toMatchElement(
			'#googlesitekit-settings-module__header--ads'
		);

		// It should be connected - complete setup CTA should not be present.
		await expect( page ).not.toMatchElement(
			'#googlesitekit-settings-module__header--ads .mdc-button',
			{
				text: /complete setup for ads/i,
			}
		);

		// Verify the Ads tag is present on the output of the WordPress website.
		await expect( '/' ).toHaveAdsTag();
	} );
} );
