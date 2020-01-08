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
	setSearchConsoleProperty,
	wpApiFetch,
	useRequestInterception,
} from '../../../utils';

async function proceedToSetUpAnalytics() {
	await Promise.all( [
		expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up analytics/i } ),
		page.waitForSelector( '.googlesitekit-setup-module__inputs' ),
		page.waitForRequest( ( req ) => req.url().match( 'analytics/data' ) ),
	] );
}

const setReferenceURL = async () => {
	return wpApiFetch( {
		path: 'google-site-kit/v1/e2e/reference-url',
		method: 'post',
		data: {
			url: 'http://non-matching-url.test',
		},
	} );
};

describe( 'setting up the Analytics module with an existing account and no existing tag', () => {
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
		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock' );
		await setSearchConsoleProperty();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
		await page.waitForSelector( '.googlesitekit-settings-connect-module--analytics' );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'pre-selects account and property if the tag matches one belonging to the user', async () => {
		await proceedToSetUpAnalytics();

		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account a/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test property x/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test profile x/i } );

		// Select Test Account B
		await expect( page ).toClick( '.mdc-select', { text: /test account a/i } );
		await Promise.all( [
			expect( page ).toClick( '.mdc-menu-surface--open .mdc-list-item', { text: /test account b/i } ),
			page.waitForResponse( ( res ) => res.url().match( 'modules/analytics/data' ) ),
		] );

		// Selects reload with properties and profiles for Test Account B
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account b/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test property y/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test profile y/i } );

		// Select Property Z
		await expect( page ).toClick( '.mdc-select', { text: /test property y/i } );
		await Promise.all( [
			expect( page ).toClick( '.mdc-menu-surface--open .mdc-list-item', { text: /test property z/i } ),
			page.waitForResponse( ( res ) => res.url().match( 'modules/analytics/data' ) ),
		] );

		// Selects reload with properties and profiles for Test Profile Z
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account b/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test property z/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test profile z/i } );

		await page.waitFor( 500 );
		await expect( page ).toClick( 'button', { text: /configure analytics/i } );

		await page.waitForSelector( '.googlesitekit-publisher-win--win-success' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Analytics!/i } );
	} );

	it( 'prompts for account and property if the site URL does not match a property belonging to the user', async () => {
		await setReferenceURL();

		await proceedToSetUpAnalytics();

		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /select one\.\.\./i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /select an account/i } );
		await expect( page ).toMatchElement( 'button[disabled]', { text: /configure analytics/i } );

		// Select Test Account A
		await expect( page ).toClick( '.mdc-select', { text: /select one\.\.\./i } );
		await Promise.all( [
			expect( page ).toClick( '.mdc-menu-surface--open .mdc-list-item', { text: /test account a/i } ),
			page.waitForResponse( ( res ) => res.url().match( 'modules/analytics/data' ) ),
		] );

		// See the selects populate
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account a/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test property x/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test profile x/i } );

		await expect( page ).toClick( '.mdc-select', { text: /test property x/i } );
		await expect( page ).toClick( '.mdc-menu-surface--open .mdc-list-item', { text: /setup a new property/i } );

		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /setup a new property/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /setup a new profile/i } );

		await page.waitFor( 500 );
		await expect( page ).toClick( 'button', { text: /configure analytics/i } );

		await page.waitForSelector( '.googlesitekit-publisher-win--win-success' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Analytics!/i } );
	} );
} );
