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
	useRequestInterception,
	wpApiFetch,
} from '../../utils';

// IMPORTANT: Review and reactivate this E2E failure caused by the inability
// to activate e2e-tests-site-verification-api-mock on node.js v22.
// eslint-disable-next-line jest/no-disabled-tests
describe.skip( 'Site Kit set up flow for the first time with search console setup', () => {
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
		await activatePlugin( 'e2e-tests-site-verification-api-mock' );

		// Simulate that the user is already verified.
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/verify-site',
			method: 'post',
		} );
	} );

	afterEach( async () => {
		await deactivateUtilityPlugins();
		await resetSiteKit();
	} );

	it( 'inserts property to search console when site does not exist', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await expect( page ).toClick( '.googlesitekit-wizard-step button', {
			text: /sign in with Google/i,
		} );
		await page.waitForNavigation();

		await page.waitForSelector( '.googlesitekit-setup-module__title' );
		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module__title',
			{
				text: /Search Console/i,
			}
		);

		await page.waitForSelector(
			'.googlesitekit-wizard-step__action button'
		);
		await expect( page ).toClick(
			'.googlesitekit-wizard-step__action button',
			{
				text: /Go to Dashboard/i,
			}
		);

		await page.waitForNavigation();

		await page.waitForSelector( '#js-googlesitekit-main-dashboard' );

		await expect( page ).toMatchElement(
			'#js-googlesitekit-main-dashboard'
		);
		await expect( page ).toMatchElement( '.googlesitekit-banner__title', {
			text: /Congrats on completing the setup for Site Kit!/i,
		} );
	} );

	it( 'saves search console property when site exists', async () => {
		await visitAdminPage( 'admin.php', 'page=googlesitekit-splash' );

		await expect( page ).toClick( '.googlesitekit-wizard-step button', {
			text: /sign in with Google/i,
		} );
		await page.waitForNavigation();

		await page.waitForSelector( '.googlesitekit-setup-module__title' );
		await expect( page ).toMatchElement(
			'.googlesitekit-setup-module__title',
			{
				text: /Search Console/i,
			}
		);

		await page.waitForSelector(
			'.googlesitekit-wizard-step__action button'
		);
		await expect( page ).toClick(
			'.googlesitekit-wizard-step__action button',
			{
				text: /Go to Dashboard/i,
			}
		);

		await page.waitForNavigation();

		await page.waitForSelector( '#js-googlesitekit-main-dashboard' );

		await expect( page ).toMatchElement(
			'#js-googlesitekit-main-dashboard'
		);
		await expect( page ).toMatchElement( '.googlesitekit-banner__title', {
			text: /Congrats on completing the setup for Site Kit!/i,
		} );
	} );
} );
