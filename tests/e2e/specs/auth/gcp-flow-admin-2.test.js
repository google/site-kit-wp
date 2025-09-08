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
	safeLoginUser,
	setAuthToken,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
	wpApiFetch,
} from '../../utils';

describe( 'the set up flow for the second administrator', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();
			if (
				url.startsWith( 'https://accounts.google.com/o/oauth2/v2/auth' )
			) {
				request.respond( {
					status: 302,
					headers: {
						location: createURL(
							'/wp-admin/index.php',
							'oauth2callback=1&code=valid-test-code'
						),
					},
				} );
			} else if ( url.match( 'search-console/data/searchanalytics' ) ) {
				request.respond( { status: 200, body: '[]' } );
			} else if ( url.match( 'pagespeed-insights/data/pagespeed' ) ) {
				request.respond( { status: 200, body: '{}' } );
			} else if ( url.match( 'user/data/survey-timeouts' ) ) {
				request.respond( { status: 200, body: '[]' } );
			} else {
				request.continue();
			}
		} );
	} );

	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );

		// TODO: This plugin activation is timing out on GitHub Actions with Node.js 22.
		// This will be investigated and fixed in a follow-up.
		page.setDefaultTimeout( 20000 );
		await activatePlugin( 'e2e-tests-site-verification-api-mock' );
		page.setDefaultTimeout( 5000 );

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

	it( 'connects a secondary admin after the initial set up', async () => {
		await safeLoginUser( 'admin-2', 'password' );
		// Ensure we're logged in with the correct user.
		await expect( page ).toMatchElement(
			'#wp-admin-bar-user-info .display-name',
			{
				text: 'admin-2',
			}
		);

		// Simulate that the user is already verified.
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/verify-site',
			method: 'post',
		} );
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await expect( page ).toMatchElement(
			'.googlesitekit-wizard-step__title',
			{
				text: /Authenticate with Google/i,
			}
		);

		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-wizard-step button', {
				text: /sign in with google/i,
			} ),
			page.waitForNavigation(),
		] );

		await page.waitForSelector( '.googlesitekit-wizard-step button' );
		await expect( page ).toMatchElement(
			'.googlesitekit-wizard-step__title',
			{
				text: /congratulations!/i,
			}
		);

		await Promise.all( [
			expect( page ).toClick( '.googlesitekit-wizard-step button', {
				text: /go to dashboard/i,
			} ),
			page.waitForNavigation(),
		] );

		await page.waitForSelector( '#js-googlesitekit-main-dashboard' );

		await expect( page ).toMatchElement(
			'#js-googlesitekit-main-dashboard'
		);
		await expect( page ).toMatchElement( '.googlesitekit-banner__title', {
			text: /Congrats on completing the setup for Site Kit!/i,
		} );
	} );
} );
