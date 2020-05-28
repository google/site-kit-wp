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

describe( 'setting up the Analytics module with no existing account and no existing tag via proxy', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().startsWith( 'https://sitekit.withgoogle.com/o/oauth2/auth' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/wp-admin/index.php', [
							'oauth2callback=1',
							'code=valid-test-code',
							// This is how the additional scope is granted.
							'scope=https://www.googleapis.com/auth/analytics.provision',
						].join( '&' ) ),
					},
				} );
			} else if ( request.url().match( '/wp-json/google-site-kit/v1/data/' ) ) {
				request.respond( { status: 200 } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-plugin' );
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await activatePlugin( 'e2e-tests-module-setup-analytics-api-mock-no-account' );
		await setSearchConsoleProperty();

		await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
		await page.waitForSelector( '.mdc-tab-bar' );
		await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
		await page.waitForSelector( '.googlesitekit-settings-connect-module--analytics' );
		await expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up analytics/i } );
		await page.waitForSelector( '.googlesitekit-setup-module--analytics' );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'displays account creation form when user has no Analytics account', async () => {
		await expect( page ).toMatchElement( '.googlesitekit-heading-4', { text: /Create your Analytics account/i, timeout: 5000 } );
		await expect( page ).toMatchElement( '.mdc-button', { text: /create account/i } );
	} );

	it( 'prompts the user for additional permissions when creating an account', async () => {
		await page.waitForSelector( '.googlesitekit-heading-4' );
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'analytics/data/create-account-ticket' ) ),
			expect( page ).toClick( '.mdc-button', { text: /create account/i } ),
		] );

		await expect( page ).toMatchElement( '.mdc-dialog__title', { text: /Additional Permissions Required/i } );
	} );

	it.only( 'preserves user-filled values provided before approving additional permissions', async () => { // eslint-disable-line jest/no-focused-tests
		await page.waitForSelector( '.googlesitekit-heading-4' );

		// Unfortunately, the view does not have a `form`, otherwise we could use `.toFillForm( el, fields )`
		await expect( page ).toFill( '#googlesitekit_analytics_account_create_account', 'Test Account Name' );
		await expect( page ).toFill( '#googlesitekit_analytics_account_create_property', 'Test Property Name' );
		await expect( page ).toFill( '#googlesitekit_analytics_account_create_profile', 'Test View Name' );

		await expect( page ).toClick( '.googlesitekit-analytics__select-country' );
		await expect( page ).toClick( '.mdc-menu-surface--open li', { text: /united kingdom/i } );

		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'analytics/data/create-account-ticket' ) ),
			expect( page ).toClick( '.mdc-button', { text: /create account/i } ),
		] );

		await expect( page ).toMatchElement( '.mdc-dialog__title', { text: /Additional Permissions Required/i } );
		await Promise.all( [
			page.waitForNavigation(),
			expect( page ).toClick( '.mdc-button', { text: /authorize additional permissions/i } ),
		] );

		await page.waitForSelector( '#googlesitekit_analytics_account_create_account' );
		// Ensure all form values were preserved.
		await expect( page ).toHaveValue( '#googlesitekit_analytics_account_create_account', 'Test Account Name' );
		await expect( page ).toHaveValue( '#googlesitekit_analytics_account_create_property', 'Test Property Name' );
		await expect( page ).toHaveValue( '#googlesitekit_analytics_account_create_profile', 'Test View Name' );
		await expect( page ).toMatchElement( '.googlesitekit-analytics__select-country .mdc-select__selected-text', { text: /united kingdom/i } );
	} );
} );
