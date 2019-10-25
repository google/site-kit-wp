/**
 * WordPress dependencies
 */
import { deactivatePlugin, activatePlugin } from '@wordpress/e2e-test-utils';

describe( 'Plugin Activation Notice', () => {
	beforeEach( async () => {
		await deactivatePlugin( 'site-kit-by-google' );
		await activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
	} );

	afterEach( async () => {
		await deactivatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		await activatePlugin( 'site-kit-by-google' );
	} );

	it( 'Should be displayed', async () => {
		await activatePlugin( 'site-kit-by-google' );

		await page.waitForSelector( '.googlesitekit-activation' );

		await expect( page ).toMatchElement( 'h3.googlesitekit-activation__title', { text: 'Congratulations, the Site Kit plugin is now activated.' } );

		await deactivatePlugin( 'site-kit-by-google' );
	} );

	it( 'Should lead you to the setup wizard', async () => {
		await activatePlugin( 'site-kit-by-google' );

		await page.waitForSelector( '.googlesitekit-activation' );

		await expect( page ).toMatchElement( '.googlesitekit-activation__button', { text: 'Start Setup' } );

		await page.click( '.googlesitekit-activation__button' );
		await page.waitForSelector( '.googlesitekit-wizard-step__title' );

		// Ensure we're on the first step.
		await expect( page ).toMatchElement( '.googlesitekit-wizard-progress-step__number--inprogress', { text: '1' } );
	} );
} );
