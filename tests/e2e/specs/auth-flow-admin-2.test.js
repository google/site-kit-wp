/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	loginUser,
	createURL,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	logoutUser,
	setAuthToken,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
	wpApiFetch,
} from '../utils';

describe( 'the set up flow for the second administrator', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/', 'oauth2callback=1&code=valid-test-code' ),
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
		await activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await activatePlugin( 'e2e-tests-site-verification-api-mock' );
		await setAuthToken();
		await setSiteVerification();
		await setSearchConsoleProperty();
		await logoutUser();
	} );

	afterEach( async () => {
		await logoutUser();

		// Restore the default/admin user
		// (switchToAdmin will not work as it is not aware of the current user)
		await loginUser();
	} );

	it( 'admin 2', async () => {
		await loginUser( 'admin-2', 'password' );
		// Ensure we're logged in with the correct user.
		await expect( page ).toMatchElement( '#wp-admin-bar-user-info .display-name', { text: 'admin-2' } );

		// Simulate that the user is already verified.
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/verify-site',
			method: 'post',
		} );
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await expect( page ).toMatchElement( '.googlesitekit-wizard-step__title', { text: /Authenticate with Google/i } );

		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-wizard-step button', { text: /sign in with google/i } ),
			page.waitForNavigation(),
		] );

		await page.waitForSelector( '.googlesitekit-wizard-step button' );
		await expect( page ).toMatchElement( '.googlesitekit-wizard-step__title', { text: /congratulations!/i } );

		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-wizard-step button', { text: /go to dashboard/i } ),
			page.waitForNavigation(),
		] );

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /Congrats on completing the setup for Site Kit!/i } );
	} );
} );

