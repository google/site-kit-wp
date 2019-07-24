/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

describe( 'Providing client configuration', () => {
	it( 'accepts the client and secret as a json blob', async() => {
		await activatePlugin( 'google-site-kit' );
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await page.waitForSelector( '#wizard-step-one-proceed' );

		const proceedButton = await page.$( '#wizard-step-one-proceed' );

		expect( await proceedButton.getProperty( 'disabled' ) ).toBe( true );
	} );
} );
