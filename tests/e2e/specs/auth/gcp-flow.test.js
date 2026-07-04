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
	setAuthToken,
	setSearchConsoleProperty,
	setSiteVerification,
	step,
	useRequestInterception,
} from '../../utils';

function handleRequest( request ) {
	const url = request.url();
	if ( url.startsWith( 'https://accounts.google.com/o/oauth2/v2/auth' ) ) {
		request.respond( {
			status: 302,
			headers: {
				location: createURL(
					'/wp-admin/index.php',
					'oauth2callback=1&code=valid-test-code&e2e-site-verification=1'
				),
			},
		} );
	} else if ( url.match( 'search-console/data/searchanalytics' ) ) {
		request.respond( { status: 200, body: '[]' } );
	} else if ( url.match( 'pagespeed-insights/data/pagespeed' ) ) {
		request.respond( { status: 200, body: '{}' } );
	} else if ( url.match( 'user/data/survey-timeouts' ) ) {
		request.respond( { status: 200, body: '[]' } );
	} else if ( url.match( 'search-console/data/matched-sites' ) ) {
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

async function disconnectFromSiteKit() {
	await page.waitForSelector( 'button[aria-controls="user-menu"]' );
	await page.click( 'button[aria-controls="user-menu"]' );

	await page.waitForSelector( '#user-menu #disconnect' );
	await page.click( '#user-menu #disconnect' );

	await page.waitForSelector(
		'.mdc-dialog__container button.mdc-button--danger'
	);
	await page.click( '.mdc-dialog__container button.mdc-button--danger' );
	await page.waitForNavigation();
}

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

		await step(
			'visit splash page',
			visitAdminPage( 'admin.php', 'page=googlesitekit-splash' )
		);

		await step( 'sign in with Google', async () => {
			await page.setRequestInterception( true );
			useRequestInterception( handleRequest );
			await Promise.all( [
				expect( page ).toClick( '.googlesitekit-wizard-step button', {
					text: /sign in with Google/i,
				} ),
				page.waitForNavigation(),
			] );
		} );

		await step( 'wait for the main dashboard to appear', async () => {
			await page.waitForSelector( '#js-googlesitekit-main-dashboard' );

			await expect( page ).toMatchElement(
				'#js-googlesitekit-main-dashboard'
			);
			await expect( page ).toMatchElement(
				'.googlesitekit-banner__title',
				{
					text: /Congrats on completing the setup for Site Kit!/i,
				}
			);
		} );
	} );

	it( 'disconnects user from Site Kit', async () => {
		await setAuthToken();
		await setSiteVerification();

		await step(
			'visit admin dashboard',
			visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' )
		);

		await step( 'disconnect from Site Kit', disconnectFromSiteKit() );

		await step(
			'ensure the user is on step one of the setup wizard',
			expect( page ).toMatchElement(
				'.googlesitekit-wizard-progress-step__number-text--inprogress',
				{ text: '1' }
			)
		);
	} );
} );
