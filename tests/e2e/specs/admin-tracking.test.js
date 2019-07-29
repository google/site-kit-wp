/**
 * WordPress dependencies
 */
import { activatePlugin, deactivatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';
import { resetSiteKit } from '../utils';

describe( 'Providing client configuration', () => {

	beforeAll( async() => {
		await activatePlugin( 'google-site-kit' );
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await resetSiteKit();
	} );

	beforeEach( async() => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-scroller__scroll-content' );
		page.click( '.mdc-tab-scroller__scroll-content button:last-child' );
	} );

	afterAll( async() => {
		await resetSiteKit();
		await deactivatePlugin( 'google-site-kit' );
		await deactivatePlugin( 'e2e-tests-auth-plugin' );
	} );

	it( 'Should select opt-in by default', async() => {

		await page.waitForSelector( '#opt-in' );

		expect( await page.$eval( '#opt-in', el => el.checked ) ).toBe( true );

	} );
	it( 'Should have tracking code when opted in', async() => {

		await page.waitForSelector( '#opt-in' );

		expect( await page.$eval( '#opt-in', el => el.checked ) ).toBe( true );

		const analyticsScriptTag = await page.$x(
			'//script[contains(@src,"https://www.google-analytics.com/analytics.js")]'
		);
		expect( analyticsScriptTag.length ).not.toEqual( 0 );

		const tagManagerScriptTag = await page.$x(
			'//script[contains(@src,"https://www.googletagmanager.com/gtag/js?id=UA-130569087-3")]'
		);
		expect( tagManagerScriptTag.length ).not.toEqual( 0 );

	} );

	it( 'Should uncheck opt-in box when clicked', async() => {

		await page.waitForSelector( '#opt-in' );

		await page.$eval( '#opt-in', elem => elem.click() );

		await page.waitFor( 3000 );

		await page.waitForSelector( '.mdc-checkbox:not(.mdc-checkbox--selected) #opt-in' );

		const optinChecked = await page.$( '.mdc-checkbox--selected #opt-in' );
		expect( optinChecked ).toBeNull();

		const optinUnChecked = await page.$( '.mdc-checkbox:not(.mdc-checkbox--selected) #opt-in' );
		expect( optinUnChecked.length ).not.toEqual( 0 );
	} );

	it( 'Should not have tracking code when not opted in', async() => {

		await page.waitForSelector( '#opt-in' );

		const optinChecked = await page.$( '.mdc-checkbox--selected #opt-in' );
		expect( optinChecked ).toBeNull();

		const optinUnChecked = await page.$( '.mdc-checkbox:not(.mdc-checkbox--selected) #opt-in' );
		expect( optinUnChecked.length ).not.toEqual( 0 );

		const analyticsScriptTag = await page.$x(
			'//script[contains(@src,"https://www.google-analytics.com/analytics.js")]'
		);
		expect( analyticsScriptTag.length ).toEqual( 0 );

		const tagManagerScriptTag = await page.$x(
			'//script[contains(@src,"https://www.googletagmanager.com/gtag/js?id=UA-130569087-3")]'
		);
		expect( tagManagerScriptTag.length ).toEqual( 0 );
	} );

} );
