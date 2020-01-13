/**
 * WordPress dependencies
 */
import { activatePlugin, deactivatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { resetSiteKit, setSearchConsoleProperty } from '../utils';

async function toggleOptIn() {
	await Promise.all( [
		page.waitForResponse( ( res ) => res.url().match( 'wp/v2/users/me' ) ),
		expect( page ).toClick( '#googlesitekit-opt-in' ),
	] );
}

describe( 'management of tracking opt-in/out via settings page', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
	} );

	beforeEach( async () => {
		await setSearchConsoleProperty();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );

		// Click on Admin Settings Tab.
		await Promise.all( [
			page.waitForSelector( '#googlesitekit-opt-in' ),
			expect( page ).toClick( 'button.mdc-tab', { text: 'Admin Settings' } ),
		] );
	} );

	afterEach( async () => {
		await resetSiteKit();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'e2e-tests-auth-plugin' );
		await deactivatePlugin( 'e2e-tests-site-verification-plugin' );
	} );

	it( 'should be opted-out by default', async () => {
		expect( await page.$eval( '#googlesitekit-opt-in', ( el ) => el.checked ) ).toBe( false );
	} );

	it( 'should have tracking code when opted in', async () => {
		// Make sure the script tags are not yet loaded on the page.
		await expect( page ).not.toMatchElement( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );

		// Opt-in to tracking to ensure the checkbox is selected.
		await toggleOptIn();

		expect( await page.$eval( '#googlesitekit-opt-in', ( el ) => el.checked ) ).toBe( true );

		// Ensure the script tags are injected into the page if they weren't
		// loaded already.
		await page.waitForSelector( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );

		// Ensure tag manager script tag exists.
		await expect( page ).toMatchElement( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );

		// Opt-out again.
		await toggleOptIn();
	} );

	it( 'should check opt-in box when clicked', async () => {
		await toggleOptIn();

		await page.waitForSelector( '.mdc-checkbox.mdc-checkbox--selected #googlesitekit-opt-in' );

		// Ensure checked checkbox exists.
		await expect( page ).toMatchElement( '.mdc-checkbox.mdc-checkbox--selected #googlesitekit-opt-in' );
	} );

	it( 'should uncheck opt-in box when clicked', async () => {
		// Opt-in to tracking to ensure the checkbox is selected.
		await toggleOptIn();

		// Uncheck the checkbox.
		await toggleOptIn();

		await page.waitForSelector( '.mdc-checkbox:not(.mdc-checkbox--selected) #googlesitekit-opt-in' );

		// Ensure unchecked checkbox exists.
		await expect( page ).toMatchElement( '.mdc-checkbox:not(.mdc-checkbox--selected) #googlesitekit-opt-in' );
	} );

	it( 'should not have tracking code when not opted in', async () => {
		// Ensure unchecked checkbox exists.
		await expect( page ).toMatchElement( '.mdc-checkbox:not(.mdc-checkbox--selected) #googlesitekit-opt-in' );

		// Ensure no analytics script tag exists.
		await expect( page ).not.toMatchElement( 'script[src^="https://www.google-analytics.com/analytics.js"]' );

		// Ensure no tag manager script exists.
		await expect( page ).not.toMatchElement( 'script[src^="https://www.googletagmanager.com/gtag/js?id=UA-130569087-3"]' );
	} );
} );
