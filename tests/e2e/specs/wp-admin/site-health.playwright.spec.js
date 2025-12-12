/**
 * Site Health integration Playwright tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const {
	deactivateUtilityPlugins,
	loginAsAdmin,
	resetSiteKit,
	setupSiteKit,
	visitAdminPage,
	withAdminPage,
} = require( '../../playwright/utils' );

test.describe( 'Site Health', () => {
	test( 'adds debug data to the info tab when Site Kit is active but not setup', async ( {
		page,
	} ) => {
		await loginAsAdmin( page );
		await visitAdminPage( page, 'site-health.php', 'tab=debug' );

		await expect(
			page.locator( '.health-check-accordion button', {
				hasText: /site kit by google/i,
			} )
		).toBeVisible();
	} );

	test.describe( 'with Site Kit setup', () => {
		test.beforeAll( async ( { browser } ) => {
			await withAdminPage( browser, async ( page ) => {
				await setupSiteKit( page );
			} );
		} );

		test.afterAll( async ( { browser } ) => {
			await withAdminPage( browser, async ( page ) => {
				await deactivateUtilityPlugins( page );
				await resetSiteKit( page );
			} );
		} );

		test( 'adds debug data to the info tab when Site Kit is setup', async ( {
			page,
		} ) => {
			await loginAsAdmin( page );
			await visitAdminPage( page, 'site-health.php', 'tab=debug' );

			// Click to expand the Site Kit accordion
			await page
				.locator( '.health-check-accordion button', {
					hasText: /site kit by google/i,
				} )
				.click();

			// The element is a `td` on older versions of WP and `th` on more recent versions.
			await expect(
				page.locator( 'th, td', {
					hasText: /Search Console: Shared Roles/i,
				} )
			).toBeVisible();

			// TODO: Remove this - intentional failure to test report output
			await expect( page ).toHaveTitle( /This will fail/i );
		} );
	} );
} );
