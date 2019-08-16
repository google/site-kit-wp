/**
 * WordPress dependencies
 */
import { activatePlugin, deactivatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { wpApiFetch, deactivateAllOtherPlugins, resetSiteKit } from '../../../utils';

const setReferenceUrl = async() => {
	return wpApiFetch( {
		path: 'google-site-kit/v1/e2e/reference-url',
		method: 'post',
		data: {
			url: 'http://non-matching-url.test'
		}
	} );
};

describe( 'setting up the Analytics module with no existing account and no existing tag', () => {
	beforeAll( async() => {
		await page.setRequestInterception( true );
		page.on( 'request', request => {
			if ( ! request._allowInterception ) {

				// prevent errors for requests that happen after interception is disabled.
				return;
			}

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

		// wait for create account button
		await expect( page ).toMatchElement( '.mdc-button', { text: /Create an account/i } );

		// Click create account button
		// await expect( page ).toClick( '.mdc-button', { text: /Create an account/i } );
		// await page.waitForSelector( '#initialView' );
		// await page.close();

		// fake account creation
		// disable mock-no-account plugin
		await deactivatePlugin( 'e2e-tests-module-setup-analytics-api-mock-no-account' );

		// enable mock plugin for proper responses on re-fetch
		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock' );

		// check that account info displays
		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await setReferenceUrl();
		await page.waitForSelector( '.googlesitekit-settings-module--analytics' );
		await expect( page ).toClick( '.googlesitekit-settings-module--analytics' );

		await page.waitForSelector( '.googlesitekit-settings-module__edit-button' );
		await expect( page ).toClick( '.googlesitekit-settings-module__edit-button', { text: /continue module setup/i } );

		// wait for create account button
		await page.waitForSelector( '.googlesitekit-setup-module__action .googlesitekit-cta-link' );
		await expect( page ).toClick( '.googlesitekit-cta-link', { text: /Re-fetch My Account/i } );

		await page.waitForSelector( '.googlesitekit-setup-module__inputs' );
		await page.waitForRequest( req => req.url().match( 'analytics/data' ) );

		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account a/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test property x/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test profile x/i } );

		// // Select Test Account B
		// await expect( page ).toClick( '.mdc-select', { text: /test account a/i } );
		// await Promise.all( [
		// 	expect( page ).toClick( '.mdc-menu-surface--open .mdc-list-item', { text: /test account b/i } ),
		// 	page.waitForResponse( res => res.url().match( 'modules/analytics/data' ) ),
		// ] );

		// // Selects reload with properties and profiles for Test Account B
		// await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account b/i } );
		// await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test property y/i } );
		// await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test profile y/i } );

		// // Select Property Z
		// await expect( page ).toClick( '.mdc-select', { text: /test property y/i } );
		// await Promise.all( [
		// 	expect( page ).toClick( '.mdc-menu-surface--open .mdc-list-item', { text: /test property z/i } ),
		// 	page.waitForResponse( res => res.url().match( 'modules/analytics/data' ) ),
		// ] );

		// // Selects reload with properties and profiles for Test Profile Z
		// await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account b/i } );
		// await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test property z/i } );
		// await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test profile z/i } );

		// await Promise.all( [
		// 	expect( page ).toClick( 'button', { text: /configure analytics/i } ),
		// 	page.waitForSelector( '.googlesitekit-publisher-win__title' ),
		// ] );

		// await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Analytics!/i } );
	} );

} );
