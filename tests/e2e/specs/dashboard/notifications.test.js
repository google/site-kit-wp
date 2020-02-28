/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	setSiteVerification,
	setSearchConsoleProperty,
	testSiteNotification,
	wpApiFetch,
} from '../../utils';

const goToSiteKitDashboard = async () => {
	await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );
};

describe( 'core site notifications', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();
	} );

	it( 'displays core site notifications on the main dashboard', async () => {
		// Add the test notification (by default there are none).
		await wpApiFetch( {
			path: 'google-site-kit/v1/e2e/core/site/notifications',
			method: 'post',
			data: testSiteNotification,
		} );

		// Go to the main dashboard and wait for notifications to be requested.
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/core/site/data/notifications' ) ),
			goToSiteKitDashboard(),
		] );

		// Ensure the notification is displayed.
		await page.waitForSelector( '.googlesitekit-publisher-win--is-open' );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__title', { text: /test notification title/i } );
		await expect( page ).toMatchElement( '.googlesitekit-publisher-win__desc', { text: /test notification content/i } );

		// Dismiss the notification.
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/core/site/data/mark-notification' ) ),
			expect( page ).toClick( '.googlesitekit-publisher-win .googlesitekit-cta-link', { text: /test dismiss site notification/i } ),
		] );
		await page.waitForSelector( '.googlesitekit-publisher-win--is-closed' );

		// Make sure the dismissed notification is no longer shown.
		let hasTestNotification = await page.$$eval( '.googlesitekit-publisher-win:not(.googlesitekit-publisher-win--is-closed) .googlesitekit-publisher-win__title', ( els ) => {
			return els.map( ( el ) => el.textContent )
				.find( ( text ) => text.match( /test notification title/i ) ) || false;
		} );
		expect( hasTestNotification ).toStrictEqual( false );

		// Refresh the page, and make sure that notifications are refetched and does not include the dismissed notification.
		await Promise.all( [
			page.waitForResponse( ( res ) => res.url().match( 'google-site-kit/v1/core/site/data/notifications' ) ),
			page.reload(),
		] );

		// Ensure the notification is not rendered at all, open or closed.
		hasTestNotification = await page.$$eval( '.googlesitekit-publisher-win__title', ( els ) => {
			return els.map( ( el ) => el.textContent )
				.find( ( text ) => text.match( /test notification title/i ) ) || false;
		} );
		expect( hasTestNotification ).toStrictEqual( false );
	} );
} );
