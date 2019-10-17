/**
 * WordPress dependencies
 */
import { visitAdminPage, activatePlugin } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	pasteText,
	resetSiteKit,
	setSearchConsoleProperty,
	setSiteVerification,
} from '../../../utils';

describe( 'PageSpeed Insights Activation', () => {
	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'should lead you to the activation page', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await expect( page ).toMatchElement( 'h3.googlesitekit-cta__title', { text: 'Activate PageSpeed Insights.' } );

		await expect( page ).toClick( '.googlesitekit-cta-link', { text: 'Activate PageSpeed Insights' } );
		await page.waitForSelector( 'h2.googlesitekit-setup-module__title' );

		await expect( page ).toMatchElement( 'h2.googlesitekit-setup-module__title', { text: 'PageSpeed Insights' } );
	} );

	it( 'should submit and save the entered key', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await expect( page ).toClick( '.googlesitekit-cta-link', { text: 'Activate PageSpeed Insights' } );
		await page.waitForSelector( 'h2.googlesitekit-setup-module__title' );

		await expect( page ).toMatchElement( 'h2.googlesitekit-setup-module__title', { text: 'PageSpeed Insights' } );

		await pasteText( 'input.mdc-text-field__input', 'PSIKEYTOSUBMITANDTEST' );

		await expect( page ).toClick( 'button.mdc-button', { text: 'Proceed' } );

		await page.waitForSelector( 'h3.googlesitekit-heading-3' );
	} );
} );
