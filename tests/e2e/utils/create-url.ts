/**
 * WordPress URL utilities.
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
import { WP_BASE_URL } from './wp-config';

/**
 * Creates a URL on the test site from a WordPress path and query string.
 *
 * @since 1.191.0
 *
 * @param WPPath Path relative to the site root.
 * @param query  Query string, without the leading `?`.
 * @return Full URL.
 */
export function createURL( WPPath: string, query = '' ) {
	const url = new URL( WP_BASE_URL );
	url.pathname = join( url.pathname, WPPath );
	url.search = query;
	return url.href;
}

/**
 * Checks whether the current page is at the given WordPress path.
 *
 * @since 1.191.0
 *
 * @param WPPath Path relative to the site root.
 * @param query  Query string to compare, without the leading `?`.
 * @return Whether the current URL matches.
 */
export function isCurrentURL( WPPath: string, query = '' ) {
	const currentURL = new URL( page.url() );
	currentURL.search = query;
	return createURL( WPPath, query ) === currentURL.href;
}
