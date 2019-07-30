/**
 * WordPress dependencies
 */
import { deactivatePlugin, activatePlugin } from '@wordpress/e2e-test-utils';

describe( 'Plugin Activation Notice', () => {
	beforeEach( async() => {
		await deactivatePlugin( 'google-site-kit' );
	} );

	afterEach( async() => {
		await activatePlugin( 'google-site-kit' );
	} );

	it( 'Should be displayed', async() => {
		await activatePlugin( 'google-site-kit' );

		await page.waitForSelector( '.googlesitekit-activation' );

		await expect( page ).toMatchElement( 'h3.googlesitekit-activation__title', { text: 'Congratulations, the Site Kit plugin is now activated.' } );

		await deactivatePlugin( 'google-site-kit' );
	} );

	it( 'Should lead you to the setup wizard', async() => {
		await activatePlugin( 'google-site-kit' );

		await page.waitForSelector( '.googlesitekit-activation' );

		await expect( page ).toMatchElement( '.googlesitekit-activation__button', { text: 'Start Setup' } );

		await page.click( '.googlesitekit-activation__button' );
		await page.waitForSelector( '.googlesitekit-wizard-step__title' );

		await expect( page ).toMatchElement( 'h2.googlesitekit-wizard-step__title', { text: 'Welcome to Site Kit beta for developers.' } );

		await deactivatePlugin( 'google-site-kit' );
	} );
} );
