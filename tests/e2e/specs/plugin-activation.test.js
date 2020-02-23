/**
 * WordPress dependencies
 */
import { deactivatePlugin, activatePlugin } from '@wordpress/e2e-test-utils';

/**
 * Activation helpers are only necessary pre-1.0 release.
 * WordPress populates the `data-slug` attribute from the
 * `slug` returned by the wp.org plugin API. For plugins
 * that are not available on the .org repo, the slug will be
 * generated from the plugin's name.
 *
 * For this reason, we fallback to the title-based slug if the
 * expected "official" slug is not found.
 *
 * Once the plugin is publicly available, these helpers can be removed
 * and consuming code can use `google-site-kit` variations in their places.
 */

const activateSiteKit = async () => {
	try {
		await activatePlugin( 'google-site-kit' );
	} catch {
		await activatePlugin( 'site-kit-by-google' );
	}
};

const deactivateSiteKit = async () => {
	try {
		await deactivatePlugin( 'google-site-kit' );
	} catch {
		await deactivatePlugin( 'site-kit-by-google' );
	}
};

describe( 'Plugin Activation Notice', () => {
	describe( 'When Javascript is enabled', () => {
		beforeEach( async () => {
			await deactivateSiteKit();
			await activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		} );

		afterEach( async () => {
			await deactivatePlugin( 'e2e-tests-gcp-credentials-plugin' );
			await activateSiteKit();
		} );

		it( 'Should be displayed', async () => {
			await activateSiteKit();

			await page.waitForSelector( '.googlesitekit-activation__title' );

			await expect( page ).toMatchElement( '.googlesitekit-activation__title', { text: /Congratulations, the Site Kit plugin is now activated./i } );

			await deactivateSiteKit();
		} );

		it( 'Should lead you to the setup wizard', async () => {
			await activateSiteKit();

			await page.waitForSelector( '.googlesitekit-activation' );

			await expect( page ).toMatchElement( '.googlesitekit-start-setup', { text: 'Start setup' } );

			await page.click( '.googlesitekit-start-setup' );
			await page.waitForSelector( '.googlesitekit-wizard-step__title' );

			// Ensure we're on the first step.
			await expect( page ).toMatchElement( '.googlesitekit-wizard-progress-step__number--inprogress', { text: '1' } );

			await deactivateSiteKit();
		} );

		it( 'Should not display noscript notice', async () => {
			await activateSiteKit();

			await expect( page ).not.toMatchElement( '.googlesitekit-noscript' );

			await deactivateSiteKit();
		} );
	} );

	describe( 'When Javascript is disabled', () => {
		beforeEach( async () => {
			await deactivateSiteKit();
		} );

		afterEach( async () => {
			await activateSiteKit();
		} );

		it( 'Should not display plugin html', async () => {
			// Disabling JavaScript in `beforeEach` breaks utility functions.
			// Each test without JavaScript must use
			// `await page.setJavaScriptEnabled( false );` and
			// `await page.setJavaScriptEnabled( true );` in the test itself.
			await page.setJavaScriptEnabled( false );
			await activateSiteKit();

			await expect( page ).toMatchElement( '[id^=js-googlesitekit-]', { visible: false } );
			await expect( page ).not.toMatchElement( '.googlesitekit-activation__title' );

			await deactivateSiteKit();
			await page.setJavaScriptEnabled( true );
		} );

		it( 'Should display noscript notice', async () => {
			await page.setJavaScriptEnabled( false );
			await activateSiteKit();

			await expect( page ).toMatchElement(
				'.googlesitekit-noscript__text',
				{ text: /The Site Kit by Google plugin requires JavaScript to be enabled in your browser./i },
				{ visible: true }
			);

			await deactivateSiteKit();
			await page.setJavaScriptEnabled( true );
		} );
	} );
} );
