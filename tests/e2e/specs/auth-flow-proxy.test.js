/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

describe( 'Site Kit set up flow for the first time', () => {
	it( 'renders a splash page for proxy set up when no GCP credentials are provided', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await page.waitForSelector( '.googlesitekit-start-setup' );

		await expect( page ).toMatchElement( '.googlesitekit-setup__title', { text: 'Sign in with Google to set up Site Kit' } );
		await expect( page ).toMatchElement( '.googlesitekit-start-setup', { text: 'Start setup' } );
		await expect( page ).toMatchElement( '.googlesitekit-start-setup', { href: /^https:\/\/sitekit.withgoogle.com\/site-management\/setup\/\?/i } );
	} );
} );

