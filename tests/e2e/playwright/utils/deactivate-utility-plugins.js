/**
 * Playwright utility plugin deactivation.
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

const { visitAdminPage } = require( './navigation' );

/**
 * Deactivates all Site Kit utility plugins.
 *
 * @since n.e.x.t
 *
 * @param {Object} page Playwright page object.
 */
async function deactivateUtilityPlugins( page ) {
	await visitAdminPage( page, 'plugins.php' );

	// Wait for page to load
	await page.waitForSelector( '#wpfooter' );

	// Get all active utility plugins
	const activeUtilities = await page.$$eval(
		'.active[data-plugin^="google-site-kit-test-plugins/"]',
		( rows ) => rows.map( ( row ) => row.dataset.plugin )
	);

	// Bail if there are no plugins to deactivate
	if ( ! activeUtilities.length ) {
		return;
	}

	// Check the boxes of plugins to deactivate
	await page.$$eval(
		'.active[data-plugin^="google-site-kit-test-plugins/"] input[type="checkbox"]',
		( checkboxes ) => {
			checkboxes.forEach( ( checkbox ) => ( checkbox.checked = true ) );
		}
	);

	// Bulk deactivate
	await page.selectOption(
		'select#bulk-action-selector-bottom',
		'deactivate-selected'
	);

	await Promise.all( [
		page.click( '#doaction2' ),
		page.waitForNavigation(),
	] );
}

module.exports = { deactivateUtilityPlugins };
