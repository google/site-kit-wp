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

import { toHaveAdsenseTag } from '../../../matchers';

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

const defaultHandler = ( request ) => request.continue();
const datapointHandlers = {
	accounts: defaultHandler,
	alerts: defaultHandler,
	clients: defaultHandler,
	accountStatus: defaultHandler,
};

const ADSENSE_ACCOUNT = {
	id: 'pub-123456789',
	kind: 'adsense#account',
	name: 'pub-123456789',
	premium: false,
	timezone: 'America/Chicago',
};

expect.extend( {
	toHaveAdsenseTag,
} );

describe( 'setting up the AdSense module', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'modules/adsense/data/accounts' ) ) {
				datapointHandlers.accounts( request );
			} else if ( request.url().match( 'modules/adsense/data/alerts' ) ) {
				datapointHandlers.alerts( request );
			} else if ( request.url().match( 'modules/adsense/data/clients' ) ) {
				datapointHandlers.clients( request );
			} else if ( request.url().match( 'modules/adsense/data/account-status' ) ) {
				datapointHandlers.accountStatus( request );
			} else if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
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
		Object.keys( datapointHandlers ).forEach( ( key ) => datapointHandlers[ key ] = defaultHandler );
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

	/**
	 * Scenario 1: The account is fully created (all details complete), but the API returns “Graylisted” status (accountStatus is ‘ads-display-pending’ and API response is “type: GRAYLISTED_PUBLISHER”):
	 * - Plugin places AdSense code on all pages of the site
	 * - Show screen “We’re getting your site ready for ads” + link to AdSense account
	 * - AdSense settings page should show the following status:
	 *   - Account status: Pending
	 *   - AdSense code: AdSense code is placed on your site
	 */

	/**
	 * Scenario 2: The account is created, but the address is not added or phone not verified
	 * - Plugin places AdSense code on all pages of the site
	 * - Show screen “Your site isn’t ready for ads yet.” + link to AdSense FE
	 * - User needs to go to AdSense FE and complete the missing details
	 * - AdSense settings page should show the following status:
	 *   - Account status: Action required
	 *   - AdSense code: AdSense code is placed on your site
	 */

	/**
	 * Scenario 3: The account is created, but the account is disapproved
	 *  - Plugin places AdSense code on all pages of the site
	 *  - Show screen “Your site isn’t ready for ads yet.” + link to AdSense FE
	 *  - User needs to go to AdSense FE and complete the missing details
	 *  - AdSense settings page should show the following status:
	 *    - Account status: Action required
	 *    - AdSense code: AdSense code is placed on your site
	 */

	/**
	 * Scenario 4: The account is not yet created
	 * - Refresh the page to check for an account. No AdSense account is detected. Show “Create your AdSense account” screen (“Site Kit will place AdSense code on every page across your site.”)
	 * - Settings page: show status "incomplete setup" + link to set up (which is the “Create your AdSense account” page).
	 */
} );
