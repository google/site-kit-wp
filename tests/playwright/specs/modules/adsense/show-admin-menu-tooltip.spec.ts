/**
 * AdSense "show admin menu tooltip" test.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Internal dependencies
 */
import { expect, test } from '../../../playwright';
import { asUser, withConnectedModules, withPlugins } from '../../../wordpress';

// `proxy-auth.php` authenticates the admin (fake access token and granted
// scopes) so the dashboard renders past setup. Search Console is connected via
// module settings — instead of the E2E REST setup endpoint the Puppeteer test
// used — so the main dashboard renders, including the Monetization section that
// hosts the AdSense Connect CTA.
const user = asUser( 'admin' );
const plugins = withPlugins( 'proxy-auth.php' );
const searchConsoleConnected = withConnectedModules( {
	slug: 'search-console',
	settings: { propertyID: 'http://localhost:9002', ownerID: 1 },
} );

test.describe(
	'AdSense admin menu tooltip',
	{ annotation: [ user, plugins, searchConsoleConnected ] },
	() => {
		test( 'should show the tooltip when dismissing the AdSense Connect CTA on a mobile viewport', async ( {
			wp,
		} ) => {
			// This is a test to provide a safety net that will let us know if the
			// hack introduced in #6924 stops working in a future WordPress release.
			//
			// The scenario under test is the mobile case where the admin menu is
			// initially hidden and then shown in response to user interaction. This
			// spec runs only in the mobile project (it is excluded from the desktop
			// project in playwright.config.ts), whose small viewport hides the admin
			// menu and renders the tour tooltip as a centered modal.
			//
			// Unlike the Puppeteer test this replaces, there is no request
			// interception. The fixtures service intercepts every Google API call at
			// the network level and returns an empty response by default, so the
			// Search Console and PageSpeed reports fetched by the dashboard never hit
			// real HTTP.

			await wp.step( 'Visit the dashboard', async () => {
				await wp.visitDashboard();
			} );

			await wp.step( 'Dismiss the AdSense Connect CTA', async () => {
				// Click the Monetization tab to scroll the AdSense Connect CTA into
				// view.
				await wp.page
					.locator( '[data-context-id="monetization"]' )
					.click();

				await wp.page
					.locator( '.googlesitekit-setup__wrapper--adsense-connect' )
					.getByRole( 'button', { name: 'Maybe later' } )
					.click();
			} );

			await wp.step( 'Verify the tooltip', async () => {
				// On a mobile viewport the tour tooltip renders as a centered modal.
				const tooltip = wp.page.locator(
					'.googlesitekit-tour-tooltip.googlesitekit-tour-tooltip__modal_step'
				);

				await expect( tooltip ).toBeVisible();
				await expect( tooltip ).toContainText(
					'You can always connect AdSense from here later'
				);
				await expect(
					tooltip.getByRole( 'button', { name: 'Got it' } )
				).toBeVisible();
			} );
		} );
	}
);
