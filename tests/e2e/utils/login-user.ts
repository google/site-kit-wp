/**
 * WordPress login utilities.
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
import { createURL, isCurrentURL } from './create-url';
import { WP_ADMIN_USER, WP_PASSWORD, WP_USERNAME } from './wp-config';

/**
 * Logs in to WordPress with the given credentials.
 *
 * @since 1.191.0
 *
 * @param username Username. Defaults to the test user.
 * @param password Password. Defaults to the test user's password.
 * @return Resolves once the login form submits.
 */
export async function loginUser(
	username = WP_USERNAME,
	password = WP_PASSWORD
) {
	if ( ! isCurrentURL( 'wp-login.php' ) ) {
		await page.goto( createURL( 'wp-login.php' ) );
	}

	await page.fill( '#user_login', username );
	await page.fill( '#user_pass', password );

	await Promise.all( [
		page.waitForNavigation(),
		page.click( '#wp-submit' ),
	] );
}

/**
 * Logs in as the admin user, unless the tests already run as the admin user.
 *
 * @since 1.191.0
 *
 * @return Resolves once the admin user is logged in.
 */
export async function switchUserToAdmin() {
	if ( WP_USERNAME === WP_ADMIN_USER.username ) {
		return;
	}
	await loginUser( WP_ADMIN_USER.username, WP_ADMIN_USER.password );
}

/**
 * Logs back in as the test user, unless the tests run as the admin user.
 *
 * @since 1.191.0
 *
 * @return Resolves once the test user is logged in.
 */
export async function switchUserToTest() {
	if ( WP_USERNAME === WP_ADMIN_USER.username ) {
		return;
	}
	await loginUser();
}
