/**
 * WordPress dependencies
 */
import { activatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { resetSiteKit, deactivateAllOtherPlugins, pasteText } from '../utils';

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

describe( 'Site Kit set up flow for the first time with site verification', () => {

	beforeAll( async() => {
		await page.setRequestInterception( true );
		page.on( 'request', request => {
			if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/', 'oauth2callback=1&code=valid-test-code' )
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
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-api-mock' );
	} );

	afterEach( async() => {
		await deactivateAllOtherPlugins();
		await resetSiteKit();
	} );

	afterAll( async() => {
		await page.setRequestInterception( false );
	} );

	it( 'prompts for confirmation if user is not verified for the site', async() => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
		await page.waitForSelector( '#client-configuration' );

		await pasteText( '#client-configuration', oauthClientConfig );
		await expect( page ).toClick( '#wizard-step-one-proceed' );
		await page.waitForSelector( '.googlesitekit-wizard-step--two button' );

		await expect( page ).toClick( '.googlesitekit-wizard-step--two button', { text: /sign in with Google/i } );
		await page.waitForNavigation();

		await expect( page ).toMatchElement( '.googlesitekit-wizard-step__title', { text: /Verify URL/i } );

		await page.waitForSelector( '.googlesitekit-wizard-step__inputs [name="siteProperty"]' );

		await expect( page ).toClick( '.googlesitekit-wizard-step__action button', { text: /Continue/i } );

		await page.waitForSelector( '.googlesitekit-wizard-step__action button' );

		await expect( page ).toClick( '.googlesitekit-wizard-step__action button', { text: /Go to Dashboard/i } );

		await page.waitForNavigation();

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Site Kit!/i } );
	} );

	it( 'does not prompt for verification if the user is already verified for the site', async() => {

		// Wait until apiFetch is available
		await page.waitForFunction( () => window.wp !== undefined );
		await page.waitForFunction( () => window.wp.apiFetch !== undefined );

		// Simulate that the user is already verified.
		await page.evaluate( () => {
			return window.wp.apiFetch( {
				path: 'google-site-kit/v1/e2e/verify-site',
				method: 'post',
			} );
		} );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
		await page.waitForSelector( '#client-configuration' );

		await pasteText( '#client-configuration', oauthClientConfig );
		await expect( page ).toClick( '#wizard-step-one-proceed' );
		await page.waitForSelector( '.googlesitekit-wizard-step--two button' );

		await expect( page ).toClick( '.googlesitekit-wizard-step--two button', { text: /sign in with Google/i } );
		await page.waitForNavigation();

		await page.waitForSelector( '.googlesitekit-wizard-step__action button' );
		await expect( page ).toClick( '.googlesitekit-wizard-step__action button', { text: /Go to Dashboard/i } );

		await page.waitForNavigation();

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Site Kit!/i } );
	} );
} );

