/**
 * WordPress dependencies
 */
import { deactivatePlugin, activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

describe( 'Plugin Reset', () => {
	beforeAll( async() => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
	} );

	afterAll( async() => {
		await deactivatePlugin( 'e2e-tests-auth-plugin' );
		await deactivatePlugin( 'e2e-tests-site-verification-plugin' );
	} );

	beforeEach( async() => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await expect( page ).toMatchElement( '.googlesitekit-page-header__title', { text: 'Settings' } );

		await page.waitForSelector( 'button.mdc-tab' );

		// Click on Admin Settings Tab.
		await expect( page ).toClick( 'button.mdc-tab', { text: 'Admin Settings' } );
		await page.waitForSelector( '.googlesitekit-settings-module__footer' );
	} );

	it( 'displays a confirmation dialog when clicking the "Reset Site Kit" link', async() => {

		await expect( page ).toClick( 'button.googlesitekit-cta-link', { text: 'Reset Site Kit' } );
		await page.waitForSelector( '.mdc-dialog--open' );

		await expect( page ).toMatchElement( '.mdc-dialog.mdc-dialog--open .mdc-button', { text: 'Reset' } );
	} );

	it( 'dismisses the reset confirmation dialog when clicking "Cancel"', async() => {
		await expect( page ).toClick( 'button.googlesitekit-cta-link', { text: 'Reset Site Kit' } );
		await page.waitForSelector( '.mdc-dialog--open' );

		await expect( page ).toClick( '.mdc-dialog.mdc-dialog--open button', { text: 'Cancel' } );
	} );

	it( 'disconnects Site Kit by clicking the "Reset" button in the confirmation dialog', async() => {
		await expect( page ).toClick( 'button.googlesitekit-cta-link', { text: 'Reset Site Kit' } );
		await page.waitForSelector( '.mdc-dialog--open' );
		await expect( page ).toClick( '.mdc-dialog.mdc-dialog--open .mdc-button', { text: 'Reset' } );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await expect( page ).toMatchElement( '.googlesitekit-wizard' );
	} );
} );
