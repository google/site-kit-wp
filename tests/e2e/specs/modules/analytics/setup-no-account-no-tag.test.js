/**
 * WordPress dependencies
 */
import { activatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	useRequestInterception,
	setSearchConsoleProperty,
} from '../../../utils';

describe( 'setting up the Analytics module with no existing account and no existing tag', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/', [
							'oauth2callback=1',
							'code=valid-test-code',
							'e2e-site-verification=1',
							'scope=TEST_ALL_SCOPES',
						].join( '&' ) ),
					},
				} );
			} else if ( request.url().match( '/wp-json/google-site-kit/v1/data/' ) ) {
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
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock-no-account' );
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'displays account creation form when user has no Analytics account', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
		await page.waitForSelector( '.googlesitekit-settings-connect-module--analytics' );

		await Promise.all( [
			page.waitForSelector( '.googlesitekit-setup-module__action .mdc-button' ),
			expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up analytics/i } ),
		] );

		// Intercept the call to window.open and call our API to simulate a created account.
		await page.evaluate( () => {
			window.open = () => {
				window.wp.apiFetch( {
					path: 'google-site-kit/v1/e2e/setup/analytics/account-created',
					method: 'post',
				} );
			};
		} );

		// Clicking Create Account button will switch API mock plugins on the server to the one that has accounts.
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/e2e/setup/analytics/account-created' ) ),
			expect( page ).toClick( '.mdc-button', { text: /Create an account/i } ),
		] );

		await Promise.all( [
			page.waitForResponse( ( req ) => req.url().match( 'analytics/data/accounts-properties-profiles' ) ),
			expect( page ).toClick( '.googlesitekit-cta-link', { text: /Re-fetch My Account/i } ),
		] );

		await page.waitForSelector( '.googlesitekit-setup-module__inputs' );

		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account a/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test property x/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test profile x/i } );

		await expect( page ).toClick( 'button', { text: /configure analytics/i } );

		await page.waitForSelector( '.googlesitekit-publisher-win__title' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Analytics!/i } );
	} );
} );
