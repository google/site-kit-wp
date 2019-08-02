/* eslint-env node */
/* global page, jestPuppeteer */

/**
 * WordPress dependencies
 */
import { activatePlugin, deactivatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { deactivateAllOtherPlugins, resetSiteKit } from '../utils';

const oauthClientConfig = JSON.stringify( {
	'web': {
		'client_id': 'test-client-id',
		'client_secret': 'test-client-secret',
		'project_id': 'test-project-id',
		'auth_uri': 'https://accounts.google.com/o/oauth2/auth',
		'token_uri': 'https://accounts.google.com/o/oauth2/token',
		'auth_provider_x509_cert_url': 'https://www.googleapis.com/oauth2/v1/certs'
	}
} );

function stubGoogleSignIn( request ) {
	if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
		request.respond( {
			status: 302,
			headers: {
				location: createURL( '/', 'oauth2callback=1&code=valid-test-code&e2e-site-verification=1' )
			}
		} );
	} else {
		request.continue();
	}
}

describe( 'Site Kit set up flow for the first time', () => {

	beforeAll( async() => {
		await deactivateAllOtherPlugins();
		await resetSiteKit();
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
	} );

	afterAll( async() => {
		await deactivateAllOtherPlugins();
		await resetSiteKit();
	} );

	it( 'authenticates from splash page', async() => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
		await page.waitForSelector( '#client-configuration' );

		await page.type( '#client-configuration', oauthClientConfig );
		await page.click( '#wizard-step-one-proceed' );
		await page.waitForSelector( '.googlesitekit-wizard-step--two .mdc-button' );

		// Sign in with Google
		await page.setRequestInterception( true );
		page.on( 'request', stubGoogleSignIn );
		await page.click( '.googlesitekit-wizard-step--two .mdc-button' );
		await page.waitForNavigation();
		page.removeListener( 'request', stubGoogleSignIn );
		await page.setRequestInterception( false );

		expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: 'Congrats on completing the setup for Site Kit!' } );
	} );
} );

