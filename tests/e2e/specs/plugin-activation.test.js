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

describe( 'Plugin Activation Notice', () => {
	describe( 'When Javascript is enabled', () => {
		beforeEach( async () => {
			await deactivatePlugin( 'google-site-kit' );
			await activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		} );

		afterEach( async () => {
			await deactivatePlugin( 'e2e-tests-gcp-credentials-plugin' );
			await activatePlugin( 'google-site-kit' );
		} );

		it( 'Should be displayed', async () => {
			await activatePlugin( 'google-site-kit' );

			await page.waitForSelector( '.googlesitekit-activation__title' );

			await expect( page ).toMatchElement( '.googlesitekit-activation__title', { text: /Congratulations, the Site Kit plugin is now activated./i } );

			await deactivatePlugin( 'google-site-kit' );
		} );

		it( 'Should lead you to the setup wizard', async () => {
			await activatePlugin( 'google-site-kit' );

			await page.waitForSelector( '.googlesitekit-activation' );

			await expect( page ).toMatchElement( '.googlesitekit-start-setup', { text: 'Start setup' } );

			await page.click( '.googlesitekit-start-setup' );
			await page.waitForSelector( '.googlesitekit-wizard-step__title' );

			// Ensure we're on the first step.
			await expect( page ).toMatchElement( '.googlesitekit-wizard-progress-step__number--inprogress', { text: '1' } );

			await deactivatePlugin( 'google-site-kit' );
		} );

		it( 'Should not display noscript notice', async () => {
			await activatePlugin( 'google-site-kit' );

			await expect( page ).not.toMatchElement( '.googlesitekit-noscript' );

			await deactivatePlugin( 'google-site-kit' );
		} );
	} );

	describe( 'When Javascript is disabled', () => {
		beforeEach( async () => {
			await deactivatePlugin( 'google-site-kit' );
		} );

		afterEach( async () => {
			await activatePlugin( 'google-site-kit' );
		} );

		it( 'Should not display plugin html', async () => {
			// Disabling JavaScript in `beforeEach` breaks utility functions.
			// Each test without JavaScript must use
			// `await page.setJavaScriptEnabled( false );` and
			// `await page.setJavaScriptEnabled( true );` in the test itself.
			await page.setJavaScriptEnabled( false );
			await activatePlugin( 'google-site-kit' );

			await expect( page ).toMatchElement( '[id^=js-googlesitekit-]', { visible: false } );
			await expect( page ).not.toMatchElement( '.googlesitekit-activation__title' );

			await deactivatePlugin( 'google-site-kit' );
			await page.setJavaScriptEnabled( true );
		} );

		it( 'Should display noscript notice', async () => {
			await page.setJavaScriptEnabled( false );
			await activatePlugin( 'google-site-kit' );

			await expect( page ).toMatchElement(
				'.googlesitekit-noscript__text',
				{ text: /The Site Kit by Google plugin requires JavaScript to be enabled in your browser./i },
				{ visible: true }
			);

			await deactivatePlugin( 'google-site-kit' );
			await page.setJavaScriptEnabled( true );
		} );
	} );
} );
