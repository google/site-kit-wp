/**
 * WordPress dependencies
 */
import { visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { pasteText, testClientConfig } from '../utils';

describe( 'Providing client configuration', () => {
	beforeEach( async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
	} );

	it( 'Should have disabled button on load', async () => {
		await page.waitForSelector( '#wizard-step-one-proceed' );

		expect( await page.$eval( '#wizard-step-one-proceed', ( el ) => el.matches( '[disabled]' ) ) ).toBe( true );
	} );

	it( 'Should have disabled button and display error when input is invalid', async () => {
		await page.waitForSelector( '#client-configuration' );
		await pasteText( '#client-configuration', '{ invalid json }' );

		await page.waitForSelector( '.googlesitekit-error-text' );
		await expect( page ).toMatchElement( '.googlesitekit-error-text', { text: 'Unable to parse client configuration values' } );

		expect( await page.$eval( '#wizard-step-one-proceed', ( el ) => el.matches( '[disabled]' ) ) ).toBe( true );
	} );

	it( 'Should have enabled button with valid value', async () => {
		await page.waitForSelector( '#client-configuration' );
		await pasteText( '#client-configuration', JSON.stringify( testClientConfig ) );

		await expect( page ).not.toMatchElement( '.googlesitekit-error-text', { text: 'Unable to parse client configuration values' } );

		expect( await page.$eval( '#wizard-step-one-proceed', ( el ) => el.matches( '[disabled]' ) ) ).toBe( false );

		await page.click( '#wizard-step-one-proceed' );

		await page.waitForSelector( '.googlesitekit-wizard-step--two' );

		await expect( page ).toMatchElement( '.googlesitekit-wizard-step__title', { text: 'Authenticate with Google' } );
	} );
} );
