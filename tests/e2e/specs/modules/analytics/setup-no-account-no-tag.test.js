/**
 * WordPress dependencies
 */
import { activatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateAllOtherPlugins,
	resetSiteKit,
	useRequestInterception,
} from '../../../utils';

describe( 'setting up the Analytics module with no existing account and no existing tag', () => {
	beforeAll( async() => {
		await page.setRequestInterception( true );
		useRequestInterception( request => {
			if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/', [
							'oauth2callback=1',
							'code=valid-test-code',
							'e2e-site-verification=1',
							'scope=TEST_ALL_SCOPES',
						].join( '&' ) )
					}
				} );
			} else if ( request.url().match( '/wp-json/google-site-kit/v1/data/' ) ) {
				request.respond( {
					status: 200
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async() => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock-no-account' );
	} );

	afterEach( async() => {
		await deactivateAllOtherPlugins();
		await resetSiteKit();
	} );

	it( 'display create account when user has no analytics account', async() => {

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
		await page.waitForSelector( '.googlesitekit-settings-connect-module--analytics' );

		// await proceedToSetUpAnalytics();
		await expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up analytics/i } );
		await page.waitForSelector( '.googlesitekit-setup-module__action .mdc-button' );


		await page.waitForSelector( '.googlesitekit-settings-module__edit-button' );
		await expect( page ).toClick( '.googlesitekit-settings-module__edit-button', { text: /continue module setup/i } );

		// wait for create account button
		await page.waitForSelector( '.googlesitekit-setup-module__action .googlesitekit-cta-link' );
		await expect( page ).toClick( '.googlesitekit-cta-link', { text: /Re-fetch My Account/i } );

		await page.waitForSelector( '.googlesitekit-setup-module__inputs' );

		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account a/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test property x/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test profile x/i } );


		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Analytics!/i } );
	} );

} );
