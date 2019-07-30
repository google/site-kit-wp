/**
 * WordPress dependencies
 */
import { deactivatePlugin, activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

describe( 'Reset plugin', () => {
	beforeAll( async() => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
	} );

	afterAll( async() => {
		await deactivatePlugin( 'e2e-tests-auth-plugin' );
	} );

	beforeEach( async() => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await expect( page ).toMatchElement( '.googlesitekit-page-header__title', { text: 'Settings' } );

		await page.waitForSelector( 'button.mdc-tab' );

		// Click on Admin Settings Tab.
		await expect( page ).toClick( 'button.mdc-tab', { text: 'Admin Settings' } );
		await page.waitForSelector( '.googlesitekit-settings-module__footer' );
	} );

	it( 'On Reset Site Kit click, confirm dialog displays.', async() => {

		await expect( page ).toClick( 'button.googlesitekit-cta-link', { text: 'Reset Site Kit' } );
		await page.waitForSelector( '.mdc-dialog--open' );

		await expect( page ).toMatchElement( '.mdc-dialog.mdc-dialog--open .mdc-button', { text: 'Reset' } );
	} );

	it( 'On Reset Site Kit click, confirm dialog hides when cancel', async() => {
		await expect( page ).toClick( 'button.googlesitekit-cta-link', { text: 'Reset Site Kit' } );
		await page.waitForSelector( '.mdc-dialog--open' );

		await expect( page ).toClick( '.mdc-dialog.mdc-dialog--open button', { text: 'Cancel' } );
	} );

	it( 'Reset dialog button disconnects site kit', async() => {
		await expect( page ).toClick( 'button.googlesitekit-cta-link', { text: 'Reset Site Kit' } );
		await page.waitForSelector( '.mdc-dialog--open' );
		await expect( page ).toClick( '.mdc-dialog.mdc-dialog--open .mdc-button', { text: 'Reset' } );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		const setupFlow = await page.$x(
			'//div[contains(@class,"googlesitekit-wizard")]'
		);

		expect( setupFlow.length ).not.toEqual( 0 );
	} );
} );
