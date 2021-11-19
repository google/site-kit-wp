/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createURL,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	resetSiteKit,
	setSearchConsoleProperty,
	useRequestInterception,
	setAuthToken,
	setSiteVerification,
} from '../../utils';

function handleRequest( request ) {
	if (
		request.url().startsWith( 'https://accounts.google.com/o/oauth2/auth' )
	) {
		request.respond( {
			status: 302,
			headers: {
				location: createURL(
					'/wp-admin/index.php',
					'oauth2callback=1&code=valid-test-code&e2e-site-verification=1'
				),
			},
		} );
	} else if (
		request
			.url()
			.match(
				'google-site-kit/v1/modules/search-console/data/searchanalytics'
			)
	) {
		request.respond( { status: 200, body: JSON.stringify( {} ) } );
	} else if (
		request
			.url()
			.match(
				'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
	) {
		request.respond( { status: 200, body: JSON.stringify( {} ) } );
	} else if (
		request
			.url()
			.match(
				'google-site-kit/v1/modules/search-console/data/matched-sites'
			)
	) {
		request.respond( {
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify( [
				{
					siteURL: process.env.WP_BASE_URL,
					permissionLevel: 'siteOwner',
				},
			] ),
		} );
	} else {
		request.continue();
	}
}

const disconnectFromSiteKit = async () => {
	await page.waitForSelector( 'button[aria-controls="user-menu"]' );
	await page.click( 'button[aria-controls="user-menu"]' );

	await page.waitForSelector( '#user-menu .mdc-list-item' );
	await page.click( '#user-menu .mdc-list-item' );

	await page.waitForSelector(
		'.mdc-dialog__container button.mdc-button--danger'
	);
	await page.click( '.mdc-dialog__container button.mdc-button--danger' );
	await page.waitForNavigation();
};

describe( 'Site Kit set up flow for the first time', () => {
	beforeEach( async () => {
		await activatePlugin( 'e2e-tests-gcp-credentials-plugin' );
		await setSearchConsoleProperty();
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'authenticates from splash page', async () => {
		await activatePlugin( 'e2e-tests-oauth-callback-plugin' );
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );
		// Sign in with Google
		await page.setRequestInterception( true );
		useRequestInterception( handleRequest );
		await expect( page ).toClick( '.googlesitekit-wizard-step button', {
			text: /sign in with Google/i,
		} );
		await page.waitForNavigation();

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: /Congrats on completing the setup for Site Kit!/i,
			}
		);
	} );

	it( 'disconnects user from Site Kit', async () => {
		await setAuthToken();
		await setSiteVerification();
		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		await disconnectFromSiteKit();

		// Ensure the user is on step one of the setup wizard.
		await expect(
			page
		).toMatchElement(
			'.googlesitekit-wizard-progress-step__number-text--inprogress',
			{ text: '1' }
		);
	} );
} );
