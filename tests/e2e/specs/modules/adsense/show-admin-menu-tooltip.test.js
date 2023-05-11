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
	useRequestInterception,
	deactivateUtilityPlugins,
} from '../../../utils';

describe( 'Site Kit dashboard post search', () => {
	beforeAll( async () => {
		await activatePlugin( 'e2e-tests-proxy-auth-plugin' );
		await setSiteVerification();
		await setSearchConsoleProperty();

		await page.setRequestInterception( true );
		useRequestInterception( ( request ) => {
			if (
				request
					.url()
					.match(
						'google-site-kit/v1/modules/search-console/data/searchanalytics'
					)
			) {
				request.respond( { status: 200, body: JSON.stringify( [] ) } );
			} else {
				request.continue();
			}
		} );
	} );

	afterAll( async () => {
		await deactivateUtilityPlugins();
	} );

	it( 'shows the admin menu when dismissing the AdSense Connect CTA and showing the tooltip while on a mobile viewport', async () => {
		// This is a test to provide a safety net that will let us know if the hack introduced in #6924 stops working in a future WordPress release.

		// Set the page to a mobile viewport, as the scenario we want to test is the case where the admin menu is initially hidden, and then shown in response to user interaction.
		// The size 375x667 corresponds to the iPhone SE.
		await page.setViewport( {
			width: 375,
			height: 667,
		} );

		await visitAdminPage( 'admin.php', 'page=googlesitekit-dashboard' );

		const maybeLaterButtonSelector =
			'.googlesitekit-setup__wrapper--adsense-connect button.googlesitekit-cta-link';

		await page.waitForSelector( maybeLaterButtonSelector, {
			text: 'Maybe later',
		} );

		// Click on the monetization tab to scroll the AdSense Connect CTA into view.
		await page.click( '[data-context-id="monetization"]' );

		// As our hack involves monkey-patching document.hasFocus() in our click handler to show the menu, we add a tag to the original document.hasFocus()
		// so we can then check if it's been restored after the menu has been shown.
		await page.evaluate( () => {
			document.hasFocus.identityTag = 'this is the original hasFocus';
		} );

		await page.click( maybeLaterButtonSelector, {
			text: 'Maybe later',
		} );

		// Use the same check as `useShowTooltip()` to determine whether the menu is open.
		let isAdminMenuOpen = await page.evaluate( () => {
			const element = document.querySelector( '#adminmenu' );
			return element && element.offsetHeight > 0;
		} );

		expect( isAdminMenuOpen ).toBe( true );

		// Wait for half a second and test again, to ensure the menu is not auto-closed.
		await page.waitForTimeout( 500 );

		isAdminMenuOpen = await page.evaluate( () => {
			const element = document.querySelector( '#adminmenu' );
			return element && element.offsetHeight > 0;
		} );

		expect( isAdminMenuOpen ).toBe( true );

		const isOriginalHasFocus = await page.evaluate( () => {
			return (
				document.hasFocus.identityTag ===
				'this is the original hasFocus'
			);
		} );

		expect( isOriginalHasFocus ).toBe( true );
	} );
} );
