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

describe( 'Site Kit set up flow for the first time with search console setup', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.startsWith( 'https://accounts.google.com/o/oauth2/auth' )
			) {
				request.respond(
					{
						status: 302,
						headers: {
							location: createURL(
								'/wp-admin/index.php',
								'oauth2callback=1&code=valid-test-code'
							),
						},
					},
					10
				);
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			) {
				request.respond(
					{ status: 200, body: JSON.stringify( {} ) },
					10
				);
			} else if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
					)
			) {
				request.respond(
					{ status: 200, body: JSON.stringify( {} ) },
					10
				);
			} else {
				request.continue( {}, 5 );
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

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: /Congrats on completing the setup for Site Kit!/i,
			}
		);
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

		await expect( page ).toMatchElement( '#js-googlesitekit-dashboard' );
		await expect( page ).toMatchElement(
			'.googlesitekit-publisher-win__title',
			{
				text: /Congrats on completing the setup for Site Kit!/i,
			}
		);
	} );
} );
