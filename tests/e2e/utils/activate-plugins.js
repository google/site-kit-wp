/**
 * `activatePlugins` utility.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * WordPress dependencies
 */
import {
	switchUserToAdmin,
	switchUserToTest,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';

/**
 * Performs an action on provided plugins.
 *
 * @since 1.42.0
 *
 * @param {string}         action  An action to perform.
 * @param {Array.<string>} plugins Plugin slugs.
 * @return {Promise<void>} A promise object that indicates when the action ends.
 */
async function bulkPluginsAction( action, plugins ) {
	await switchUserToAdmin();
	await visitAdminPage( 'plugins.php' );

	for ( const plugin of plugins ) {
		await page
			.click( `tr[data-slug="${ plugin }"] input` )
			.catch( () => {} );
	}

	await page.select( '#bulk-action-selector-top', action );
	await page.click( '#doaction' );
	await page.waitForNavigation();

	await switchUserToTest();
}

/**
 * Activates installed plugins.
 *
 * @since 1.27.0
 *
 * @param {Array.<string>} plugins Plugin slugs.
 * @return {Promise<void>} A promise object that indicates when the plugins activation ends.
 */
export function activatePlugins( ...plugins ) {
	return bulkPluginsAction( 'activate-selected', plugins );
}

/**
 * Deactivates installed plugins.
 *
 * @since 1.42.0
 *
 * @param {Array.<string>} plugins Plugin slugs.
 * @return {Promise<void>} A promise object that indicates when the plugins deactivation ends.
 */
export function deactivatePlugins( ...plugins ) {
	return bulkPluginsAction( 'deactivate-selected', plugins );
}
