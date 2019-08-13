/**
 * WordPress dependencies
 */
import { activatePlugin, createURL, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { resetSiteKit, deactivateAllOtherPlugins, pasteText, wpApiFetch } from '../utils';

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

describe( 'Site Kit set up flow for the first time with search console setup', () => {

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

		// Simulate that the user is already verified.
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/verify-site',
			method: 'post',
		} );
	} );

	afterEach( async() => {
		await deactivateAllOtherPlugins();
		await resetSiteKit();
	} );

	afterAll( async() => {
		await page.setRequestInterception( false );
	} );

	it( 'inserts property to search console when site does not exist', async() => {

		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
		await page.waitForSelector( '#client-configuration' );

		await pasteText( '#client-configuration', oauthClientConfig );
		await expect( page ).toClick( '#wizard-step-one-proceed' );
		await page.waitForSelector( '.googlesitekit-wizard-step--two button' );

		await expect( page ).toClick( '.googlesitekit-wizard-step--two button', { text: /sign in with Google/i } );
		await page.waitForNavigation();

		await page.waitForSelector( '.googlesitekit-setup-module__title' );
		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Search Console/i } );

		await page.waitForSelector( '.googlesitekit-wizard-step__action button' );
		await expect( page ).toClick( '.googlesitekit-wizard-step__action button', { text: /Go to Dashboard/i } );

		await page.waitForNavigation();

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Site Kit!/i } );
	} );

	it( 'saves search console property when site exists', async() => {

		// Simulate that site exists.
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/sc-site-exists',
			method: 'post',
		} );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
		await page.waitForSelector( '#client-configuration' );

		await pasteText( '#client-configuration', oauthClientConfig );
		await expect( page ).toClick( '#wizard-step-one-proceed' );
		await page.waitForSelector( '.googlesitekit-wizard-step--two button' );

		await expect( page ).toClick( '.googlesitekit-wizard-step--two button', { text: /sign in with Google/i } );
		await page.waitForNavigation();

		await page.waitForSelector( '.googlesitekit-setup-module__title' );
		await expect( page ).toMatchElement( '.googlesitekit-setup-module__title', { text: /Search Console/i } );

		await page.waitForSelector( '.googlesitekit-wizard-step__action button' );
		await expect( page ).toClick( '.googlesitekit-wizard-step__action button', { text: /Go to Dashboard/i } );

		await page.waitForNavigation();

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Site Kit!/i } );
	} );
} );

