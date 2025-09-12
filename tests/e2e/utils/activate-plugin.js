/**
 * `activatePlugin` utility with debug tracing.
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

/**
 * External dependencies (WordPress e2e-test-utils)
 */
import {
	switchUserToAdmin,
	switchUserToTest,
	visitAdminPage,
	isCurrentURL,
} from '@wordpress/e2e-test-utils';

/**
 * Activates an installed plugin (copied from Gutenberg's helper with added debug logs).
 *
 * @param {string} slug Plugin slug.
 */
export async function activatePlugin( slug ) {
	console.debug( `[activatePlugin] start slug=${ slug }` );
	try {
		await switchUserToAdmin();
		console.debug( `[activatePlugin] switched user to admin` );

		await visitAdminPage( 'plugins.php' );
		console.debug( `[activatePlugin] visited plugins.php` );

		const deactivateSelector = `tr[data-slug="${ slug }"] .deactivate a`;
		const activateSelector = `tr[data-slug="${ slug }"] .activate a`;
		const disableLink = await page.$( deactivateSelector );
		console.debug(
			`[activatePlugin] checked deactivate link (${ deactivateSelector }) found=${ !! disableLink }`
		);

		if ( disableLink ) {
			console.debug(
				`[activatePlugin] plugin "${ slug }" already active; switching user to test and returning`
			);
			await switchUserToTest();
			console.debug( `[activatePlugin] done (no action needed)` );
			return;
		}

		console.debug(
			`[activatePlugin] clicking activate link (${ activateSelector })`
		);
		await page.click( activateSelector );

		if ( ! isCurrentURL( 'plugins.php' ) ) {
			console.debug(
				`[activatePlugin] current URL is "${ page.url() }"; navigating back to plugins.php`
			);
			await visitAdminPage( 'plugins.php' );
			console.debug( `[activatePlugin] reloaded plugins.php` );
		}

		console.debug(
			`[activatePlugin] waiting for deactivate link to appear after activation`
		);
		await page.waitForSelector( deactivateSelector );
		console.debug(
			`[activatePlugin] activation confirmed (deactivate link present)`
		);

		await switchUserToTest();
		console.debug( `[activatePlugin] switched user to test; complete` );
	} catch ( error ) {
		console.debug(
			`[activatePlugin] error during activation for slug=${ slug }: ${
				error && error.message ? error.message : String( error )
			}`
		);
		throw error;
	}
}
