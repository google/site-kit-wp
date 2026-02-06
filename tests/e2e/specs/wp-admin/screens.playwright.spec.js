/**
 * Screens Playwright test.
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

test.describe( 'screens', () => {
	test.describe( 'googlesitekit-splash', () => {
		test( 'exists with the expected page title', async ( { page } ) => {
			await loginAsAdmin( page );
			await visitAdminPage(
				page,
				'admin.php',
				'page=googlesitekit-splash'
			);

			await expect( page ).toHaveTitle(
				/Site Kit by Google Dashboard\b/i
			);
		} );
	} );

	test.describe( 'googlesitekit-user-input', () => {
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

		test( 'user-input page has the expected title', async ( { page } ) => {
			await loginAsAdmin( page );
			await visitAdminPage(
				page,
				'admin.php',
				'page=googlesitekit-user-input'
			);

			await expect( page ).toHaveTitle(
				/Site Kit by Google User Input\b/i
			);
		} );
	} );

	test.describe( 'googlesitekit-ad-blocking-recovery', () => {
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

		test( 'ad-blocking-recovery page has the expected title', async ( {
			page,
		} ) => {
			await loginAsAdmin( page );
			await visitAdminPage(
				page,
				'admin.php',
				'page=googlesitekit-ad-blocking-recovery'
			);

			await expect( page ).toHaveTitle(
				/Site Kit by Google Ad Blocking Recovery\b/i
			);
		} );
	} );
} );
