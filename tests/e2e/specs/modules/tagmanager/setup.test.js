/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateAllOtherPlugins,
	resetSiteKit,
	useRequestInterception,
	setSearchConsoleProperty,
	wpApiFetch,
} from '../../../utils';

async function setupAnalytics() {
	// Activate the module.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/analytics',
		data: { active: true },
	} );
	// Set dummy connection data.
	await wpApiFetch( {
		method: 'post',
		path: 'google-site-kit/v1/modules/analytics/data/connection',
		data: {
			data: {
				accountId: 100,
				propertyId: 200,
				profileId: 300,
				internalWebPropertyId: 400,
			},
		},
		parse: false,
	} );
}

async function proceedToTagManagerSetup() {
	await visitAdminPage( 'admin.php', 'page=googlesitekit-settings' );
	await page.waitForSelector( '.mdc-tab-bar' );
	await expect( page ).toClick( '.mdc-tab', { text: /connect more services/i } );
	await page.waitForSelector( '.googlesitekit-settings-connect-module--tagmanager' );

	await Promise.all( [
		page.waitForSelector( '.googlesitekit-setup-module__action .mdc-button' ),
		expect( page ).toClick( '.googlesitekit-cta-link', { text: /set up tag manager/i } ),
	] );
}

describe( 'setting up the TagManager module with no existing account', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().match( 'google-site-kit/v1/data/' ) ) {
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
		await setSearchConsoleProperty();
		await setupAnalytics();
	} );

	afterEach( async () => {
		await deactivateAllOtherPlugins();
		await resetSiteKit();
	} );

	it( 'displays account creation form when user has no Tag Manager account', async () => {
		await activatePlugin( 'e2e-tests-module-setup-tagmanager-api-mock-no-account' );
		await proceedToTagManagerSetup();

		// Intercept the call to window.open and call our API to simulate a created account.
		await page.evaluate( () => {
			window.open = () => {
				window.wp.apiFetch( {
					path: 'google-site-kit/v1/e2e/setup/tagmanager/account-created',
					method: 'post',
				} );
			};
		} );

		// Clicking Create Account button will switch API mock plugins on the server to the one that has accounts.
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/e2e/setup/tagmanager/account-created' ) ),
			expect( page ).toClick( '.mdc-button', { text: /Create an account/i } ),
		] );

		await Promise.all( [
			page.waitForResponse( ( req ) => req.url().match( 'tagmanager/data/accounts-containers' ) ),
			expect( page ).toClick( '.googlesitekit-cta-link', { text: /Re-fetch My Account/i } ),
		] );
		await page.waitForSelector( '.googlesitekit-setup-module__inputs' );

		// Ensure account and container are selected by default.
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account a/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /gtm-abcxyz/i } );

		// Ensure "Set up a new container" option is present in container select.
		await expect( page ).toClick( '.mdc-select', { text: /gtm-abcxyz/i } );
		await expect( page ).toMatchElement( '.mdc-menu-surface--open .mdc-list-item', { text: /set up a new container/i } );
		await expect( page ).toClick( '.mdc-menu-surface--open .mdc-list-item', { text: /gtm-abcxyz/i } );

		await Promise.all( [
			expect( page ).toClick( 'button', { text: /confirm \& continue/i } ),
			page.waitForSelector( '.googlesitekit-publisher-win__title' ),
		] );

		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Tag Manager!/i } );
	} );

	it( 'displays available accounts and containers for the chosen account', async () => {
		await activatePlugin( 'e2e-tests-module-setup-tagmanager-api-mock' );
		await proceedToTagManagerSetup();

		// Ensure account and container are selected by default.
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account a/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /gtm-abcxyz/i } );

		// Ensure choosing a different account loads the proper values.
		await expect( page ).toClick( '.mdc-select', { text: /test account a/i } );
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'modules/tagmanager/data' ) ),
			expect( page ).toClick( '.mdc-menu-surface--open .mdc-list-item', { text: /test account b/i } ),
		] );

		// Ensure proper account and container are now selected.
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /test account b/i } );
		await expect( page ).toMatchElement( '.mdc-select__selected-text', { text: /gtm-bcdwxy/i } );

		await Promise.all( [
			expect( page ).toClick( 'button', { text: /confirm \& continue/i } ),
			page.waitForSelector( '.googlesitekit-publisher-win__title' ),
		] );

		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Tag Manager!/i } );
	} );
} );
