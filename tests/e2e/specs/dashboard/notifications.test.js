/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	visitAdminPage,
	deactivatePlugin,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	setSiteVerification,
	setSearchConsoleProperty,
	testSiteNotification,
	useRequestInterception,
	wpApiFetch,
} from '../../utils';

const goToSiteKitDashboard = async () => {
	await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
};

describe( 'core site notifications', () => {
	beforeAll( async () => {
		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			const url = request.url();
			if (
				url.match( 'pagespeed-insights/data/pagespeed' ) ||
				url.match( 'user/data/survey-trigger' )
			) {
				request.respond( { status: 200, body: '{}' } );
			} else if (
				url.match( 'search-console/data/searchanalytics' ) ||
				url.match( 'user/data/survey-timeouts' )
			) {
				request.respond( { status: 200, body: '[]' } );
			} else if ( url.match( 'user/data/survey' ) ) {
				request.respond( { status: 200, body: '{"survey":null}' } );
			} else {
				request.continue();
			}
		} );
	} );

	// The proxy test cannot currently be done and needs to be skipped TODO tests need to to be fixed to handle proxy tests.
	describe( 'when using proxy', () => {
		beforeAll( async () => {
			await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
			await setSiteVerification();
			await setSearchConsoleProperty();
		} );

		afterAll( async () => {
			await deactivatePlugin( 'e2e-tests-proxy-auth-plugin' );
		} );

		it( 'displays core site notifications on the main dashboard', async () => {
			// Add the test notification (by default there are none).
			await wpApiFetch( {
				path: 'google-site-kit/v1/e2e/core/site/notifications',
				method: 'post',
				data: testSiteNotification,
			} );

			await goToSiteKitDashboard();

			// Ensure the notification is displayed.
			await page.waitForSelector(
				`#${ testSiteNotification.id }.googlesitekit-publisher-win--is-open`,
				{ timeout: 10_000 } // Core site notifications are delayed 5s for surveys.
			);
			await expect( page ).toMatchElement(
				'.googlesitekit-publisher-win__title',
				{
					text: /test notification title/i,
				}
			);
			await expect( page ).toMatchElement(
				'.googlesitekit-publisher-win__desc',
				{
					text: /Test notification content/i,
				}
			);

			// Dismiss the notification.
			await expect( page ).toClick(
				'.googlesitekit-publisher-win .mdc-button span',
				{
					text: /test dismiss site notification/i,
				}
			);
		} );
	} );

	describe( 'when not using proxy', () => {
		beforeAll( async () => {
			await activatePlugin( 'e2e-tests-gcp-auth-plugin' );
			await setSiteVerification();
			await setSearchConsoleProperty();
		} );

		afterAll( async () => {
			await deactivatePlugin( 'e2e-tests-gcp-auth-plugin' );
		} );
		it( 'does not display core site notifications on the main dashboard', async () => {
			// Add the test notification (by default there are none).
			await wpApiFetch( {
				path: 'google-site-kit/v1/e2e/core/site/notifications',
				method: 'post',
				data: testSiteNotification,
			} );

			// Go to the main dashboard and wait for notifications to be requested.
			await Promise.all( [ goToSiteKitDashboard() ] );

			// Ensure notification is not displayed.
			const notificationTitles = await page.$$(
				'.googlesitekit-publisher-win__title'
			);
			const notificationDescription = await page.$$(
				'.googlesitekit-publisher-win__desc'
			);

			expect(
				notificationTitles.filter( ( { textContent } ) =>
					textContent?.match( /test notification title/i )
				)
			).toHaveLength( 0 );
			expect(
				notificationDescription.filter( ( { textContent } ) =>
					textContent?.match( /test notification content/i )
				)
			).toHaveLength( 0 );
		} );
	} );
} );
