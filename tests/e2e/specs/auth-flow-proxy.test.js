/**
 * WordPress dependencies
 */
import { deactivatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { resetSiteKit } from '../utils';

describe( 'Site Kit set up flow for the first time', () => {
	afterEach( async () => {
		await resetSiteKit();
	} );

	it( 'renders a splash page for proxy set up when no GCP credentials are provided', async () => {
		await deactivatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await page.waitForSelector( '.googlesitekit-start-setup' );

		await expect( page ).toMatchElement( '.googlesitekit-setup__title', { text: 'The Site Kit plugin is active but requires setup' } );
		await expect( page ).toMatchElement( '.googlesitekit-start-setup', { text: 'Start setup' } );
		await expect( page ).toMatchElement( '.googlesitekit-start-setup', { href: /^https:\/\/sitekit.withgoogle.com\/site-management\/setup\/\?/i } );
	} );
} );

