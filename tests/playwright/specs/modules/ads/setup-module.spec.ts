/**
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { expect, test } from '../../../playwright';
import { WordPress, asUser, withPlugins } from '../../../wordpress';

const user = asUser( 'admin' );
const plugins = withPlugins( 'proxy-auth.php' );

async function setUpAdsModule( wp: WordPress ): Promise< void > {
	await wp.visitSettings();

	await wp.page
		.locator( '.mdc-tab', { hasText: /connect more services/i } )
		.click();

	await wp.page
		.locator( '.googlesitekit-settings-connect-module--ads' )
		.locator( '.googlesitekit-cta-link', { hasText: /set up ads/i } )
		.click();

	await expect(
		wp.page.locator( '.googlesitekit-setup-module__action .mdc-button', {
			hasText: /complete manual setup/i,
		} )
	).toBeVisible();
}

test.describe( 'Ads module setup', { annotation: [ user, plugins ] }, () => {
	test( 'should show an error message if an invalid Conversion Tracking ID is entered', async ( {
		wp,
	} ) => {
		await setUpAdsModule( wp );

		const conversionIDInput = wp.page.locator( '.mdc-text-field input' );

		await conversionIDInput.fill( 'bbb' );
		await expect(
			wp.page.locator( '.mdc-text-field-helper-text' )
		).toHaveText(
			/tracking for your ads campaigns won’t work until you insert a valid id/i
		);
	} );

	test( 'should connect the module when a valid Conversion Tracking ID is saved', async ( {
		wp,
	} ) => {
		await setUpAdsModule( wp );

		await wp.step( 'Submit settings', async () => {
			await wp.page.locator( '.mdc-text-field input' ).fill( 'AW-12345' );

			await wp.page
				.locator( '.mdc-button', {
					hasText: /complete manual setup/i,
				} )
				.click();

			await expect(
				wp.page.locator( '.googlesitekit-notice__title', {
					hasText:
						/success! your conversion id was added to your site/i,
				} )
			).toBeVisible();
		} );

		await wp.step( 'Verify the module is connected', async () => {
			await wp.visitSettings();

			const adsModuleHeader = wp.page.locator(
				'#googlesitekit-settings-module__header--ads'
			);

			// Ads module should be in the active modules list.
			await expect( adsModuleHeader ).toBeVisible();

			// It should be connected - complete setup CTA should not be present.
			await expect(
				adsModuleHeader.locator( '.mdc-button', {
					hasText: /complete setup for ads/i,
				} )
			).toHaveCount( 0 );
		} );

		await wp.step( 'Verify the Ads tag on the frontend', async () => {
			await wp.visitFrontend( '/' );

			expect( await wp.page.content() ).toMatch(
				/\("config",\s*"AW-12345"\)/
			);
		} );
	} );
} );
