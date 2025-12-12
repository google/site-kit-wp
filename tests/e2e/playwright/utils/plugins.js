/**
 * Playwright plugin utilities.
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

const { expect } = require( '@playwright/test' );
const { visitAdminPage } = require( './navigation' );

/**
 * Ensures a plugin is activated.
 *
 * @since n.e.x.t
 *
 * @param {Object} page       Playwright page object.
 * @param {string} pluginSlug The plugin slug to activate.
 */
async function ensurePluginActive( page, pluginSlug ) {
	await visitAdminPage( page, 'plugins.php' );

	const pluginRow = page.locator( `tr[data-slug="${ pluginSlug }"]` );
	await expect( pluginRow ).toHaveCount( 1 );

	const activateAction = pluginRow.locator( 'span.activate a' );
	if ( await activateAction.count() ) {
		await Promise.all( [
			page.waitForNavigation( { waitUntil: 'networkidle' } ),
			activateAction.first().click(),
		] );
	}
}

/**
 * Activates a plugin by slug.
 *
 * @since n.e.x.t
 *
 * @param {Object} page       Playwright page object.
 * @param {string} pluginSlug The plugin slug to activate.
 */
async function activatePlugin( page, pluginSlug ) {
	await visitAdminPage( page, 'plugins.php' );

	const pluginRow = page.locator( `tr[data-slug="${ pluginSlug }"]` );
	await expect( pluginRow ).toHaveCount( 1 );

	const activateAction = pluginRow.locator( 'span.activate a' );
	if ( await activateAction.count() ) {
		await Promise.all( [
			page.waitForNavigation( { waitUntil: 'networkidle' } ),
			activateAction.first().click(),
		] );
	}
}

/**
 * Deactivates a plugin by slug.
 *
 * @since n.e.x.t
 *
 * @param {Object} page       Playwright page object.
 * @param {string} pluginSlug The plugin slug to deactivate.
 */
async function deactivatePlugin( page, pluginSlug ) {
	await visitAdminPage( page, 'plugins.php' );

	const pluginRow = page.locator( `tr[data-slug="${ pluginSlug }"]` );
	await expect( pluginRow ).toHaveCount( 1 );

	const deactivateAction = pluginRow.locator( 'span.deactivate a' );
	if ( await deactivateAction.count() ) {
		await Promise.all( [
			page.waitForNavigation( { waitUntil: 'networkidle' } ),
			deactivateAction.first().click(),
		] );
	}
}

module.exports = { ensurePluginActive, activatePlugin, deactivatePlugin };
