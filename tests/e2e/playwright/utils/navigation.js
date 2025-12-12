/**
 * Playwright navigation utilities.
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
 * Visits a WordPress admin page.
 *
 * @since n.e.x.t
 *
 * @param {Object} page      Playwright page object.
 * @param {string} adminPath Admin page path (e.g., 'plugins.php' or 'admin.php').
 * @param {string} [query]   Optional query string (e.g., 'page=googlesitekit-dashboard').
 */
async function visitAdminPage( page, adminPath, query = '' ) {
	const url = query
		? `/wp-admin/${ adminPath }?${ query }`
		: `/wp-admin/${ adminPath }`;

	await page.goto( url, { waitUntil: 'load' } );
}

module.exports = { visitAdminPage };
