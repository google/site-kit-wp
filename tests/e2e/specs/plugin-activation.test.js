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

		await page.waitForSelector( '.googlesitekit-activation' );

		await expect( page ).toMatchElement( 'h3.googlesitekit-activation__title', { text: 'Congratulations, the Site Kit plugin is now activated.' } );

		await deactivateSiteKit();
	} );

	it( 'Should lead you to the setup wizard', async () => {
		await activateSiteKit();

		await page.waitForSelector( '.googlesitekit-activation' );

		await expect( page ).toMatchElement( '.googlesitekit-activation__button', { text: 'Start setup' } );

		await page.click( '.googlesitekit-activation__button' );
		await page.waitForSelector( '.googlesitekit-wizard-step__title' );

		// Ensure we're on the first step.
		await expect( page ).toMatchElement( '.googlesitekit-wizard-progress-step__number--inprogress', { text: '1' } );
	} );
} );
