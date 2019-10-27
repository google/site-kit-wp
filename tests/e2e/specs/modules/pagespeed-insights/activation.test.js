/**
 * WordPress dependencies
 */
import { visitAdminPage, activatePlugin } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
} from '../../../utils';

describe( 'PageSpeed Insights Activation', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( '/wp-json/google-site-kit/v1/data/' ) ) {
				request.respond( {
					status: 200,
				} );
			} else {
				request.continue();
			}
		} );
	} );
	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'leads you to the Site Kit dashboard after activation via CTA', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
		await Promise.all( [
			page.waitForNavigation(),
			expect( page ).toClick( '.googlesitekit-cta-link', { text: /Activate PageSpeed Insights/i } ),
		] );

		await page.waitForSelector( '.googlesitekit-publisher-win__title' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for PageSpeed Insights!/i } );
	} );

	it( 'leads you to the Site Kit dashboard after activation via the settings page', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );

		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
		await page.waitForSelector( '.googlesitekit-settings-connect-module--pagespeed-insights' );

		await Promise.all( [
			page.waitForNavigation(),
			expect( page ).toClick( '.googlesitekit-cta-link', { text: /Set up PageSpeed Insights/i } ),
		] );

		await page.waitForSelector( '.googlesitekit-publisher-win__title' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for PageSpeed Insights!/i } );
	} );
} );
