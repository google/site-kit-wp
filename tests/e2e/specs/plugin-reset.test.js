/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	setAuthToken,
	setClientConfig,
	setSearchConsoleProperty,
	setSiteVerification,
} from '../utils';

describe( 'Plugin Reset', () => {
	beforeAll( async () => {
		await setClientConfig();
		await setAuthToken();
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	beforeEach( async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await expect( page ).toMatchElement( '.googlesitekit-page-header__title', { text: 'Settings' } );

		await page.waitForSelector( 'button.mdc-tab' );

		// Click on Admin Settings Tab.
		await expect( page ).toClick( 'button.mdc-tab', { text: 'Admin Settings' } );
		await page.waitForSelector( '.googlesitekit-settings-module__footer' );
	} );

	it( 'displays a confirmation dialog when clicking the "Reset Site Kit" link', async () => {
		await expect( page ).toClick( 'button.googlesitekit-cta-link', { text: 'Reset Site Kit' } );
		await page.waitForSelector( '.mdc-dialog--open .mdc-button' );

		await expect( page ).toMatchElement( '.mdc-dialog--open .mdc-button', { text: 'Reset' } );
	} );

	it( 'dismisses the reset confirmation dialog when clicking "Cancel"', async () => {
		await expect( page ).toClick( 'button.googlesitekit-cta-link', { text: 'Reset Site Kit' } );
		await page.waitForSelector( '.mdc-dialog--open button' );

		await expect( page ).toClick( '.mdc-dialog--open button', { text: 'Cancel' } );
	} );

	it( 'disconnects Site Kit by clicking the "Reset" button in the confirmation dialog', async () => {
		await expect( page ).toClick( 'button.googlesitekit-cta-link', { text: 'Reset Site Kit' } );
		await page.waitForSelector( '.mdc-dialog--open .mdc-button' );

		await Promise.all( [
			page.waitForNavigation(),
			expect( page ).toClick( '.mdc-dialog--open .mdc-button', { text: 'Reset' } ),
		] );

		// Ensure we're on the first step.
		await expect( page ).toMatchElement( '.googlesitekit-wizard-progress-step__number--inprogress', { text: '1' } );
	} );
} );
