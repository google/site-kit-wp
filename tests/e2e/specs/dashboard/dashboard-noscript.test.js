/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';
import { createWaitForFetchRequests } from '../../utils';

describe( 'Site Kit noscript notice', () => {
	let waitForFetchRequests;
	beforeEach( async () => {
		waitForFetchRequests = createWaitForFetchRequests();
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
	} );

	afterEach( () => waitForFetchRequests() ); // Clean up request listeners.

	describe( 'When Javascript is enabled', () => {
		it( 'Should not display noscript notice', async () => {
			await expect( page ).not.toMatchElement( '.googlesitekit-noscript' );
			await waitForFetchRequests(); // Wait for compatibility checks to finish.
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
			await expect( page ).not.toMatchElement( '.googlesitekit-header' );
			await expect( page ).not.toMatchElement( '.googlesitekit-module-page' );
		} );

		it( 'Should display noscript notice', async () => {
			await expect( page ).toMatchElement(
				'.googlesitekit-noscript__text',
				{ text: /The Site Kit by Google plugin requires JavaScript to be enabled in your browser/i },
				{ visible: true }
			);
		} );
	} );
} );
