/**
 * WordPress dependencies
 */
import { visitAdminPage, activatePlugin } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
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

	it( 'leads you to the Site Kit dashboard after activation', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await Promise.all( [
			page.waitForNavigation(),
			expect( page ).toClick( '.googlesitekit-cta-link', { text: 'Activate PageSpeed Insights' } ),
		] );

		await page.waitForSelector( '.googlesitekit-publisher-win__title' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for PageSpeed Insights!/i } );
	} );
} );
