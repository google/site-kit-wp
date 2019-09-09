/**
 * WordPress dependencies
 */
import { activatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	pasteText,
	setSearchConsoleProperty,
	testClientConfig,
	useRequestInterception,
} from '../utils';

function stubGoogleSignIn( request ) {
	if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
		request.respond( {
			status: 302,
			headers: {
				location: createURL( '/', 'oauth2callback=1&code=valid-test-code&e2e-site-verification=1' ),
			},
		} );
	} else if ( request.url().match( 'google-site-kit/v1/modules/search-console/data/matched-sites' ) ) {
		request.respond( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( {
				exactMatch: {
					siteUrl: process.env.WP_BASE_URL,
				},
			} ),
		} );
	} else {
		request.continue();
	}
}

describe( 'Site Kit set up flow for the first time', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await setSearchConsoleProperty();
	} );

	it( 'authenticates from splash page', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
		await page.waitForSelector( '#client-configuration' );

		await pasteText( '#client-configuration', JSON.stringify( testClientConfig ) );
		await page.click( '#wizard-step-one-proceed' );
		await page.waitForSelector( '.googlesitekit-wizard-step--two .mdc-button' );

		// Sign in with Google
		await page.setRequestInterception( true );
		useRequestInterception( stubGoogleSignIn );
		await page.click( '.googlesitekit-wizard-step--two .mdc-button' );
		await page.waitForNavigation();

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Site Kit!/i } );
	} );
} );

