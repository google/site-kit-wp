/**
 * Key factor landing page label helper.
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getPageURL } from '@/js/modules/analytics-4/components/traffic-overview/utils/getPageURL';
import { untrailingslashit } from '@/js/util/sanitize';

/**
 * Checks whether a landing page is the site's homepage: the page at the site's
 * URL, such as `/` for a site at the root of its domain, or `/blog/` for a site
 * that lives under a folder.
 *
 * @since n.e.x.t
 *
 * @param {string} pagePath The landing page's path, such as `/blog/`.
 * @param {string} siteURL  The site's URL, such as `https://example.com/blog`.
 * @return {boolean} Whether the page is the site's homepage.
 */
function isHomepage( pagePath: string, siteURL: string ): boolean {
	// A value that isn't a path on the site, such as the spam path
	// `//example.org/`, has no URL, so it is never the homepage.
	const pageURL = getPageURL( siteURL, pagePath );

	if ( ! pageURL ) {
		return false;
	}

	const { pathname, search } = new URL( pageURL );

	// A query names another page at the same path, such as `/?p=12` for a post
	// on a site with plain permalinks. Trailing slashes are left out of both
	// paths, so `/blog/` matches a site URL that ends in `/blog`, and `/`
	// matches a site URL without a path.
	return (
		! search &&
		untrailingslashit( pathname ) ===
			untrailingslashit( new URL( siteURL ).pathname )
	);
}

/**
 * Gets the name a key factor shows for a landing page.
 *
 * The site's homepage is named "Homepage", since its path tells a reader
 * little, and any other page is named by its path. Without the site's URL, the
 * homepage is taken to be at `/`, where most sites have it.
 *
 * @since n.e.x.t
 *
 * @param {string} pagePath  The landing page's path, such as `/hello-world/`.
 * @param {string} [siteURL] Optional. The site's URL, such as `https://example.com`.
 * @return {string} The name to show for the page.
 */
export function getLandingPageLabel(
	pagePath: string,
	siteURL?: string
): string {
	const isSiteHomepage = siteURL
		? isHomepage( pagePath, siteURL )
		: pagePath === '/';

	return isSiteHomepage ? __( 'Homepage', 'google-site-kit' ) : pagePath;
}
