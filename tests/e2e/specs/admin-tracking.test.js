/**
 * External dependencies
 */
import { URL } from 'url';

/**
 * WordPress dependencies
 */
import { activatePlugin, deactivatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { resetSiteKit } from '../utils';

describe( 'Providing client configuration', () => {

	beforeAll( async() => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
	} );

	beforeEach( async() => {
		await resetSiteKit();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );

		// Click on Admin Settings Tab.
		await expect( page ).toClick( 'button.mdc-tab', { text: 'Admin Settings' } );
	} );

	afterAll( async() => {
		await deactivatePlugin( 'e2e-tests-auth-plugin' );
		await deactivatePlugin( 'e2e-tests-site-verification-plugin' );
	} );

	it( 'should select opt-in by default', async() => {

		await page.waitForSelector( '#opt-in' );

		await expect( page ).toMatchElement( '#opt-in[checked]' );

	} );

	it( 'should have tracking code when opted in', async() => {

		await page.waitForSelector( '#opt-in' );

		await expect( page ).toMatchElement( '#opt-in[checked]' );

		// Ensure analytics script tag exists.
		const analyticsScriptTag = await page.$x(
			'//script[contains(@src,"https://www.google-analytics.com/analytics.js")]'
		);
		expect( analyticsScriptTag.length ).not.toEqual( 0 );

		// Ensure tag manager script tag exists.
		const tagManagerScriptTag = await page.$x(
			'//script[contains(@src,"https://www.googletagmanager.com/gtag/js?id=UA-130569087-3")]'
		);
		expect( tagManagerScriptTag.length ).not.toEqual( 0 );

	} );

	it( 'should uncheck opt-in box when clicked', async() => {

		await page.waitForSelector( '#opt-in' );

		await expect( page ).toClick( '#opt-in' );

		await page.waitForResponse( res => {
			const reqURL = new URL( res.url() );

			return '/wp-json/wp/v2/settings' === reqURL.pathname;
		} );

		await page.waitForSelector( '.mdc-checkbox:not(.mdc-checkbox--selected) #opt-in' );

		// Ensure unchecked checkbox exists.
		const optinUnChecked = await page.$( '.mdc-checkbox:not(.mdc-checkbox--selected) #opt-in' );
		expect( optinUnChecked.length ).not.toEqual( 0 );
	} );

	it( 'should not have tracking code when not opted in', async() => {
		await page.waitForSelector( '#opt-in' );

		await expect( page ).toClick( '#opt-in' );

		await page.waitForResponse( res => {
			const reqURL = new URL( res.url() );

			return '/wp-json/wp/v2/settings' === reqURL.pathname;
		} );

		await page.reload();

		// Ensure unchecked checkbox exists.
		const optinUnChecked = await page.$( '.mdc-checkbox:not(.mdc-checkbox--selected) #opt-in' );
		expect( optinUnChecked.length ).not.toEqual( 0 );

		// Ensure no analytics script tag exists.
		const analyticsScriptTag = await page.$x(
			'//script[contains(@src,"https://www.google-analytics.com/analytics.js")]'
		);
		expect( analyticsScriptTag.length ).toEqual( 0 );

		// Ensure no tag manager script exists.
		const tagManagerScriptTag = await page.$x(
			'//script[contains(@src,"https://www.googletagmanager.com/gtag/js?id=UA-130569087-3")]'
		);
		expect( tagManagerScriptTag.length ).toEqual( 0 );
	} );

} );
