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
			await expect( page ).not.toMatchElement( '.googlesitekit-noscript' );
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
			await expect( page ).toMatchElement( '[id^=js-googlesitekit-]', { visible: false } );
		} );

		it( 'Should display noscript notice', async () => {
			await expect( page ).toMatchElement(
				'.googlesitekit-noscript__title',
				{ text: /The Site Kit by Google plugin requires JavaScript to be enabled in your browser/i },
				{ visible: true }
			);
		} );
	} );
} );
