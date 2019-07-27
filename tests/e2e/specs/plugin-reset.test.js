/**
 * WordPress dependencies
 */
import { deactivatePlugin, activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

describe( 'Reset plugin', () => {
	beforeAll( async() => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await activatePlugin( 'google-site-kit' );
	} );

	afterAll( async() => {
		await deactivatePlugin( 'e2e-tests-auth-plugin' );
		await deactivatePlugin( 'google-site-kit' );
	} );

	beforeEach( async() => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-scroller__scroll-content' );

		// Click on Admin Settings Tab.
		await page.evaluate( () => {
			Array.apply( null, document.querySelectorAll( '.mdc-tab-scroller__scroll-content button' ) )
				.find( element => 'Admin Settings' === element.textContent )
				.click();
		} );

		// Click on Reset Site Kit.
		await page.evaluate( () => {
			document.evaluate(
				'//button[contains(text(), "Reset Site Kit")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
			).singleNodeValue.click();
		} );

		await page.waitFor( 1000 );
	} );

	it( 'On Reset Site Kit click, confirm dialog displays', async() => {
		const hidden = await page.evaluate( () => {
			return Array.apply( null, document.querySelectorAll( '.mdc-button__label' ) )
				.find( element => 'Reset' === element.textContent )
				.closest( 'div.mdc-dialog' )
				.getAttribute( 'aria-hidden' );
		} );

		expect( hidden ).toBe( true );
	} );

	it( 'Reset dialog button disconnects site kit', async() => {
		await page.waitForSelector( '.mdc-dialog__actions' );
		await page.evaluate( () => {
			Array.apply( null, document.querySelectorAll( '.mdc-dialog__actions button .mdc-button__label' ) )
				.find( element => 'Reset' === element.textContent )
				.click();
		} );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		const setupFlow = await page.$x(
			'//div[contains(@class,"googlesitekit-wizard")]'
		);

		expect( setupFlow.length ).not.toEqual( 0 );
	} );
} );
