/**
 * WordPress dependencies
 */
import { createURL, activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateAllOtherPlugins,
	resetSiteKit,
	setAuthToken,
	setClientConfig,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
} from '../../../utils';

async function proceedToAdsenseSetup() {
	await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
	await page.waitForSelector( '.mdc-tab-bar' );
	await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
	await page.waitForSelector( '.googlesitekit-settings-connect-module--adsense' );

	await Promise.all( [
		expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up adsense/i } ),
		page.waitForSelector( '.googlesitekit-setup-module--adsense' ),
		page.waitForResponse( ( res ) => res.url().match( 'modules/adsense/data/accounts' ) ),
	] );
}

describe( 'setting up the AdSense module', () => {
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
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await setSearchConsoleProperty();

		await setClientConfig();
		await setAuthToken();
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		await deactivateAllOtherPlugins();
		await resetSiteKit();
	} );

	it( 'prompts to create an AdSense account if the user does not own or have access to one', async () => {
		await activatePlugin( 'e2e-tests-module-setup-adsense-api-mock-no-account' );
		await proceedToAdsenseSetup();

		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /create your adsense account/i } );

		// Intercept the call to window.open and call our API to simulate a created account.
		await page.evaluate( () => {
			window.open = () => {
				window.wp.apiFetch( {
					path: 'google-site-kit/v1/e2e/setup/adsense/account-created',
					method: 'post',
				} );
			};
		} );

		// Clicking Create Account button will switch API mock plugins on the server to the one that has accounts.
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/e2e/setup/adsense/account-created' ) ),
			expect( page ).toClick( '.googlesitekit-setup-module__action button', { text: /create adsense account/i } ),
		] );
	} );
} );
