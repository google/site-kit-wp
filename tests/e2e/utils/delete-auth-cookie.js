/**
 * `deleteAuthCookie` utility.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Deletes authentication cookies to sign out the current user.
 */
export async function deleteAuthCookie() {
	const cookies = ( await page.cookies() )
		.filter( ( cookie ) => cookie.name.match( /^wordpress_/ ) )
		.filter( ( cookie ) => cookie.name !== 'wordpress_test_cookie' );
	await page.deleteCookie( ...cookies );
}
