/**
 * WordPress dependencies
 */
import { activatePlugin, visitAdminPage } from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	deactivateUtilityPlugins,
	setSearchConsoleProperty,
	setSiteVerification,
	useRequestInterception,
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

		// Click on the monetization tab to scroll the AdSense Connect CTA into view.
		await page.click( '[data-context-id="monetization"]' );

		await expect( page ).toClick(
			'.googlesitekit-setup__wrapper--adsense-connect button',
			{
				text: 'Maybe later',
			}
		);

		await page.waitForSelector(
			'.googlesitekit-tour-tooltip.googlesitekit-tour-tooltip__modal_step'
		);

		await expect( page ).toMatchElement(
			'.googlesitekit-tour-tooltip.googlesitekit-tour-tooltip__modal_step',
			{
				text: 'You can always connect AdSense from here later',
			}
		);

		await expect( page ).toMatchElement(
			'.googlesitekit-tour-tooltip.googlesitekit-tour-tooltip__modal_step button',
			{
				text: 'Got it',
			}
		);
	} );
} );
