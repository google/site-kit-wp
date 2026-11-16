/**
 * Recent activity reference permalink helper.
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
import { untrailingslashit } from '@/js/util/sanitize';

/**
 * Gets the URL of a post on the site that Site Kit reports on.
 *
 * A site can report on another site's URL with the `googlesitekit_site_url`
 * filter, such as a staging site that reports on its live site. The function
 * replaces the home URL at the start of the permalink with the reference site
 * URL, as `Context::filter_reference_url()` does in PHP. The home URL has to be
 * followed by `/`, so a URL on another host that only starts the same way, such
 * as `https://example.com.au/`, stays unchanged. WordPress always adds that `/`,
 * also before the query string of a plain permalink such as `/?p=42`.
 *
 * @since 1.192.0
 *
 * @param {string} permalink        The URL of the post on the WordPress site, such as `https://staging.example.com/hello-world/`.
 * @param {string} homeURL          The home URL of the WordPress site, such as `https://staging.example.com/`.
 * @param {string} referenceSiteURL The URL of the site that Site Kit reports on, such as `https://example.com/`.
 * @return {string} The URL of the post on the site that Site Kit reports on, or the permalink unchanged when it isn't on the home URL.
 */
export function getReferencePermalink(
	permalink: string,
	homeURL: string,
	referenceSiteURL: string
): string {
	const home = untrailingslashit( homeURL ) as string;

	if ( ! permalink.startsWith( `${ home }/` ) ) {
		return permalink;
	}

	return `${ untrailingslashit( referenceSiteURL ) }${ permalink.slice(
		home.length
	) }`;
}
