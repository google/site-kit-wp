/**
 * Plugin activation Playwright tests.
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
	activatePlugin,
	deactivatePlugin,
	loginAsAdmin,
	withAdminPage,
} = require( '../playwright/utils' );

async function activateSiteKit( page ) {
	await activatePlugin( page, 'google-site-kit' );
}

async function deactivateSiteKit( page ) {
	await deactivatePlugin( page, 'google-site-kit' );
}

test.describe( 'plugin activation notice', () => {
	// Ensure Site Kit is disabled before running each test as it's enabled by default.
	test.beforeEach( async ( { page } ) => {
		await loginAsAdmin( page );
		await deactivateSiteKit( page );
	} );

	test.afterAll( async ( { browser } ) => {
		await withAdminPage( browser, async ( page ) => {
			await activateSiteKit( page );
		} );
	} );

	test.describe( 'using proxy auth', () => {
		test.beforeAll( async ( { browser } ) => {
			await withAdminPage( browser, async ( page ) => {
				await activatePlugin(
					page,
					'e2e-tests-proxy-credentials-plugin'
				);
			} );
		} );

		test.afterAll( async ( { browser } ) => {
			await withAdminPage( browser, async ( page ) => {
				await deactivatePlugin(
					page,
					'e2e-tests-proxy-credentials-plugin'
				);
			} );
		} );

		test( 'should display activation notice with proxy auth', async ( {
			page,
		} ) => {
			await activateSiteKit( page );

			await page.waitForSelector( '.googlesitekit-activation__title' );

			await expect(
				page.locator( '.googlesitekit-activation__title', {
					hasText:
						/Congratulations, the Site Kit plugin is now activated/i,
				} )
			).toBeVisible();

			// Wait for compatibility checks to finish.
			await page.waitForLoadState( 'networkidle' );
		} );

		test( 'should not display noscript notice with proxy auth', async ( {
			page,
		} ) => {
			await activateSiteKit( page );

			await expect(
				page.locator( '.googlesitekit-noscript' )
			).not.toBeVisible();

			// Wait for compatibility checks to finish.
			await page.waitForLoadState( 'networkidle' );
		} );
	} );

	test.describe( 'using GCP auth', () => {
		test.beforeAll( async ( { browser } ) => {
			await withAdminPage( browser, async ( page ) => {
				await activatePlugin(
					page,
					'e2e-tests-gcp-credentials-plugin'
				);
			} );
		} );

		test.afterAll( async ( { browser } ) => {
			await withAdminPage( browser, async ( page ) => {
				await deactivatePlugin(
					page,
					'e2e-tests-gcp-credentials-plugin'
				);
			} );
		} );

		test( 'should display activation notice with GCP auth', async ( {
			page,
		} ) => {
			await activateSiteKit( page );

			await page.waitForSelector( '.googlesitekit-activation__title' );

			await expect(
				page.locator( '.googlesitekit-activation__title', {
					hasText:
						/Congratulations, the Site Kit plugin is now activated/i,
				} )
			).toBeVisible();

			// Wait for compatibility checks to finish.
			await page.waitForLoadState( 'networkidle' );
		} );

		test( 'should not display noscript notice with GCP auth', async ( {
			page,
		} ) => {
			await activateSiteKit( page );

			await expect(
				page.locator( '.googlesitekit-noscript' )
			).not.toBeVisible();

			// Wait for compatibility checks to finish.
			await page.waitForLoadState( 'networkidle' );
		} );

		test( 'should lead you to the setup wizard with GCP auth', async ( {
			page,
		} ) => {
			await activateSiteKit( page );

			await page.waitForSelector( '.googlesitekit-activation__title' );

			await expect(
				page.locator( '.googlesitekit-start-setup', {
					hasText: 'Start setup',
				} )
			).toBeVisible();

			// Wait for compatibility checks to finish.
			await page.waitForLoadState( 'networkidle' );

			await page.click( '.googlesitekit-start-setup' );
			await page.waitForSelector( '.googlesitekit-wizard-step__title' );

			// Ensure we're on the first step.
			await expect(
				page.locator(
					'.googlesitekit-wizard-progress-step__number--inprogress',
					{ hasText: '1' }
				)
			).toBeVisible();
		} );
	} );
} );
