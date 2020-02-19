/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

describe( 'Site Kit noscript notice', () => {
	beforeEach( async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
	} );

	describe( 'When Javascript is enabled', () => {
		it( 'Should not display noscript notice', async () => {
			const noscript = await page.$( '#wpbody-content' );
			await expect( noscript ).not.toMatchElement( '.googlesitekit-noscript' );
		} );
	} );

	describe( 'When Javascript is disabled', () => {
		beforeAll( async () => {
			await page.setJavaScriptEnabled( false );
		} );

		afterAll( async () => {
			await page.setJavaScriptEnabled( true );
		} );

		it( 'Should not display plugin html', async () => {
			const noscript = await page.$( '#wpbody-content' );
			await expect( noscript ).not.toMatchElement( '.js-googlesitekit-plugin' );
		} );

		it( 'Should display noscript notice', async () => {
			const noscript = await page.waitForSelector( '.googlesitekit-noscript', {
				visible: true,
			} );
			await expect( noscript ).toMatchElement( '.googlesitekit-noscript__title', { text: 'The Site Kit by Google plugin requires JavaScript to be enabled in your browser.' } );
		} );
	} );
} );
