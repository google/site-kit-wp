/**
 * Playwright login utilities.
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
const { WP_ADMIN_USERNAME, WP_ADMIN_PASSWORD } = require( './constants' );

/**
 * Logs in as the admin user.
 *
 * @since n.e.x.t
 *
 * @param {Object} page Playwright page object.
 */
async function loginAsAdmin( page ) {
	await page.goto( '/wp-admin/', { waitUntil: 'load' } );

	if ( await page.locator( '#user_login' ).count() ) {
		await page.fill( '#user_login', WP_ADMIN_USERNAME );
		await page.fill( '#user_pass', WP_ADMIN_PASSWORD );
		await Promise.all( [
			page.waitForNavigation( { waitUntil: 'networkidle' } ),
			page.click( '#wp-submit' ),
		] );
	}

	await expect( page ).toHaveURL( /\/wp-admin\/?/ );
}

module.exports = { loginAsAdmin };
