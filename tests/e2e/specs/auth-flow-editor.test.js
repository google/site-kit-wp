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
	setClientConfig,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
} from '../utils';

describe( 'the set up flow for an editor', () => {

	beforeAll( async() => {
		await page.setRequestInterception( true );
		useRequestInterception( request => {
			if ( request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' ) ) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL( '/', 'oauth2callback=1&code=valid-test-code' )
					}
				} );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async() => {
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await setClientConfig();
		await setAuthToken();
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	afterEach( async() => {
		await logoutUser();

		// Restore the default/admin user
		// (switchToAdmin will not work as it is not aware of the current user)
		await loginUser();
	} );

	it( 'allows an editor to connect their Google account from the splash page', async() => {
		await loginUser( 'editor', 'password' );
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await page.waitForSelector( '.googlesitekit-splash-intro button' );
		await expect( page ).toMatchElement( '.googlesitekit-splash-intro__title', { text: /Welcome to Site Kit/i } );

		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-splash-intro button', { text: /connect your account/i } ),
			page.waitForNavigation(),
		] );

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
	} );
} );

