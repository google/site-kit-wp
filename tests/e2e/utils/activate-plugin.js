/**
 * Single plugin activation utilities.
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
import { switchUserToAdmin, switchUserToTest } from './login-user';
import { visitAdminPage } from './visit-admin-page';

/**
 * Activates an installed plugin, unless it is already active.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Plugin slug, as in the `data-slug` attribute on the Plugins screen.
 */
export async function activatePlugin( slug ) {
	await switchUserToAdmin();
	await visitAdminPage( 'plugins.php' );

	if ( ! ( await page.$( `tr[data-slug="${ slug }"] .deactivate a` ) ) ) {
		await page.click( `tr[data-slug="${ slug }"] .activate a` );
		await page.waitForSelector( `tr[data-slug="${ slug }"] .deactivate a` );
	}

	await switchUserToTest();
}

/**
 * Deactivates an active plugin, unless it is already inactive.
 *
 * @since n.e.x.t
 *
 * @param {string} slug Plugin slug, as in the `data-slug` attribute on the Plugins screen.
 */
export async function deactivatePlugin( slug ) {
	await switchUserToAdmin();
	await visitAdminPage( 'plugins.php' );

	if ( ! ( await page.$( `tr[data-slug="${ slug }"] .delete a` ) ) ) {
		await page.click( `tr[data-slug="${ slug }"] .deactivate a` );
		await page.waitForSelector( `tr[data-slug="${ slug }"] .delete a` );
	}

	await switchUserToTest();
}
