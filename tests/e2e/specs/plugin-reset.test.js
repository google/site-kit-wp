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
		await page.$$eval( '.mdc-tab-scroller__scroll-content button', tabs => {
			Array.apply( null, tabs )
				.find( element => 'Admin Settings' === element.textContent )
				.click();
		} );

		// Click on Reset Site Kit.
		await page.evaluate( () => {
			document.evaluate(
				'//button[contains(text(), "Reset Site Kit")]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
			).singleNodeValue.click();
		} );
	} );

	it( 'On Reset Site Kit click, confirm dialog displays', async() => {
		await page.waitForSelector( '.mdc-dialog[aria-hidden="false"]' );

		const isHidden = await page.$eval( '.mdc-dialog[aria-hidden="false"]', dialog => {
			if ( dialog && 'Reset' === dialog.querySelector( '.mdc-button__label' ).textContent ) {
				return false;
			}

			return true;
		} );

		expect( isHidden ).toBe( false );
	} );

	it( 'On Reset Site Kit click, confirm dialog hides when cancel', async() => {
		await page.waitForSelector( '.mdc-dialog[aria-hidden="false"]' );

		const resetDialogFound = await page.$eval( '.mdc-dialog[aria-hidden="false"]', dialog => {
			if ( dialog && 'Reset' === dialog.querySelector( '.mdc-button__label' ).textContent ) {
				dialog.querySelector( '.mdc-dialog__cancel-button' ).click();
			}

			return dialog;
		} );

		expect( resetDialogFound ).not.toEqual( null );

		const isHidden = await page.$$eval( '.mdc-dialog[aria-hidden="true"]', dialogs => {

			// Check reset dialog is hidden.
			const dialog = Array.apply( dialogs ).filter( dialog => {
				const button = dialog.querySelector( '.mdc-button__label' );
				return button && 'Reset' === button.textContent;
			} );
			if ( dialog ) {
				return true;
			}

			return false;
		} );

		expect( isHidden ).toBe( true );
	} );

	it( 'Reset dialog button disconnects site kit', async() => {

		// Click Reset button.
		await page.$$eval( '.mdc-dialog__actions button', buttons => {
			Array.apply( null, buttons ).map( button => {
				const label = button.querySelector( '.mdc-button__label' );
				if ( label && 'Reset' === label.textContent  ) {
					button.click();
				}
			} );
		} );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		const setupFlow = await page.$x(
			'//div[contains(@class,"googlesitekit-wizard")]'
		);

		expect( setupFlow.length ).not.toEqual( 0 );
	} );
} );
