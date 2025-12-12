/**
 * Module Activation Playwright tests.
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
} = require( '../playwright/utils' );

test.describe( 'Module activation', () => {
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

	test( 'should prevent non active modules to be set up', async ( {
		page,
	} ) => {
		await loginAsAdmin( page );
		await visitAdminPage(
			page,
			'admin.php',
			'page=googlesitekit-dashboard&slug=analytics-4&reAuth=true'
		);

		await page.waitForSelector( '.googlesitekit-plugin' );

		await expect(
			page.locator( '.googlesitekit-notice', {
				hasText:
					/The Analytics module cannot be set up as it has not been activated yet./i,
			} )
		).toBeVisible();
	} );

	test( 'should render an error message when an invalid module slug is used to setup the module', async ( {
		page,
	} ) => {
		await loginAsAdmin( page );
		await visitAdminPage(
			page,
			'admin.php',
			'page=googlesitekit-dashboard&slug=foo&reAuth=true'
		);

		await page.waitForSelector( '.googlesitekit-plugin' );

		await expect(
			page.locator( '.googlesitekit-notice', {
				hasText: /Invalid module slug foo./i,
			} )
		).toBeVisible();
	} );
} );
