/**
 * WordPress dependencies
 */
import { activatePlugin, deactivatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { resetSiteKit, setSearchConsoleProperty } from '../utils';

describe( 'management of tracking opt-in/out via settings page', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
	} );

	beforeEach( async () => {
		await setSearchConsoleProperty();
		await resetSiteKit();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );

		// Click on Admin Settings Tab.
		await expect( page ).toClick( 'button.mdc-tab', { text: 'Admin Settings' } );
	} );

	afterEach( async () => {
		await resetSiteKit();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'e2e-tests-auth-plugin' );
		await deactivatePlugin( 'e2e-tests-site-verification-plugin' );
	} );

	it( 'should select opt-in by default', async () => {
		await page.waitForSelector( '#opt-in' );

		await expect( page ).toMatchElement( '#opt-in[checked]' );
	} );

	it( 'should have tracking code when opted in', async () => {
		await page.waitForSelector( '#opt-in' );

		expect( await page.$eval( '#opt-in', ( el ) => el.checked ) ).toBe( true );

		// Ensure analytics script tag exists.
		await expect( page ).toMatchElement( 'script[src^="https://www.google-analytics.com/analytics.js"]' );

		// Ensure tag manager script tag exists.
		await expect( page ).toMatchElement( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );
	} );

	it( 'should uncheck opt-in box when clicked', async () => {
		await page.waitForSelector( '#opt-in' );

		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'wp/v2/settings' ) ),
			expect( page ).toClick( '#opt-in' ),
		] );

		await page.waitForSelector( '.mdc-checkbox:not(.mdc-checkbox--selected) #opt-in' );

		// Ensure unchecked checkbox exists.
		await expect( page ).toMatchElement( '.mdc-checkbox:not(.mdc-checkbox--selected) #opt-in' );
	} );

	it( 'should not have tracking code when not opted in', async () => {
		await page.waitForSelector( '#opt-in' );

		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'wp/v2/settings' ) ),
			expect( page ).toClick( '#opt-in' ),
		] );

		await page.reload();

		// Ensure unchecked checkbox exists.
		await expect( page ).toMatchElement( '.mdc-checkbox:not(.mdc-checkbox--selected) #opt-in' );

		// Ensure no analytics script tag exists.
		await expect( page ).not.toMatchElement( 'script[src^="https://www.google-analytics.com/analytics.js"]' );

		// Ensure no tag manager script exists.
		await expect( page ).not.toMatchElement( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );
	} );
} );
