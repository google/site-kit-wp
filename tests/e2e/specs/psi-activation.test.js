/**
 * WordPress dependencies
 */
import { visitAdminPage, activatePlugin, deactivatePlugin } from '@wordpress/e2e-test-utils';

describe( 'PageSpeed Insights Activation', () => {
	beforeEach( async() => {
		await activatePlugin( 'e2e-tests-reset-plugin' );
		await activatePlugin( 'e2e-tests-auth-plugin' );
	} );

	afterEach( async() => {
		await deactivatePlugin( 'e2e-tests-auth-plugin' );
		await deactivatePlugin( 'e2e-tests-reset-plugin' );
	} );

	it( 'should lead you to the activation page', async() => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await expect( page ).toMatchElement( 'h3.googlesitekit-cta__title', { text: 'Activate PageSpeed Insights.' } );

		await expect( page ).toClick( '.googlesitekit-cta-link', { text: 'Activate PageSpeed Insights' } );
		await page.waitForSelector( 'h2.googlesitekit-setup-module__title' );

		await expect( page ).toMatchElement( 'h2.googlesitekit-setup-module__title', { text: 'PageSpeed Insights' } );
	} );

	it ( 'should submit and save the entered key', async() => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await expect( page ).toClick( '.googlesitekit-cta-link', { text: 'Activate PageSpeed Insights' } );
		await page.waitForSelector( 'h2.googlesitekit-setup-module__title' );

		await expect( page ).toMatchElement( 'h2.googlesitekit-setup-module__title', { text: 'PageSpeed Insights' } );

		await page.type( 'input.mdc-text-field__input', 'PSIKEYTOSUBMITANDTEST' );

		await expect( page ).toClick( 'button.mdc-button', { text: 'Proceed' } );

		await page.waitForSelector( 'h3.googlesitekit-heading-3' );

		// Check that the correct key is saved on the settings page.
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

		await expect( page ).toClick( 'button.mdc-tab', { text: 'Admin Settings' } );

		// Check the API Key text, verifying the submitted value has been stored.
		await expect( page ).toMatchElement( '.googlesitekit-settings-module__meta-item-type', { text: 'API Key' } );
		await expect( page ).toMatchElement( 'h5.googlesitekit-settings-module__meta-item-data', { text: 'PSIKEYTOSUBMITANDTEST' } );
	} );
} );
