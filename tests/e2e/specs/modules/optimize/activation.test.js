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
	setupAnalytics,
} from '../../../utils';

describe( 'Optimize Activation', () => {
	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
		await setupAnalytics();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'should lead you to the activation page', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

		// Activate the "Connect more services" tab.
		await page.waitForSelector( '.mdc-tab:nth-of-type(2)', { text: 'Connect More Services' } );
		await page.click( '.mdc-tab:nth-of-type(2)', { text: 'Connect More Services' } );

		await page.waitForSelector( '.googlesitekit-settings-connect-module--optimize .googlesitekit-cta-link', { text: 'Set up Optimize' } );
		await page.click( '.googlesitekit-settings-connect-module--optimize .googlesitekit-cta-link', { text: 'Set up Optimize' } );

		await page.waitForSelector( 'h2.googlesitekit-setup-module__title' );
		await expect( page ).toMatchElement( 'h2.googlesitekit-setup-module__title', { text: 'Optimize' } );
	} );
} );
