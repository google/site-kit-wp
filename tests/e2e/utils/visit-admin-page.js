/**
 * WordPress admin navigation utility.
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
 * External dependencies
 */
import { join } from 'path';

/**
 * Internal dependencies
 */
import { createURL, isCurrentURL } from './create-url';
import { loginUser } from './login-user';

/**
 * Matches a PHP error that WordPress displays in the page markup.
 *
 * @since n.e.x.t
 * @see https://github.com/php/php-src/blob/598175e/main/main.c#L1257-L1297
 */
const REGEXP_PHP_ERROR =
	/(<b>)?(Fatal error|Recoverable fatal error|Warning|Parse error|Notice|Strict Standards|Deprecated|Unknown error)(<\/b>)?: (.*?) in (.*?) on line (<b>)?\d+(<\/b>)?/;

/**
 * Visits a WordPress admin page, logging in first when needed.
 *
 * Fails when the page displays a PHP error.
 *
 * @since n.e.x.t
 *
 * @param {string} adminPath Path relative to `wp-admin/`.
 * @param {string} [query]   Query string, without the leading `?`.
 */
export async function visitAdminPage( adminPath, query ) {
	await page.goto( createURL( join( 'wp-admin', adminPath ), query ) );

	if ( isCurrentURL( 'wp-login.php' ) ) {
		await loginUser();
		await visitAdminPage( adminPath, query );
	}

	const error = ( await page.content() ).match( REGEXP_PHP_ERROR );
	if ( error ) {
		throw new Error( `Unexpected error in page content: ${ error[ 0 ] }` );
	}
}
