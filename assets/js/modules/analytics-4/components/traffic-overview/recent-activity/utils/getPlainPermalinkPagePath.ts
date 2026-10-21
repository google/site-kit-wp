/**
 * Recent activity plain permalink page path helper.
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
import { addQueryArgs, getQueryArgs } from '@wordpress/url';

/**
 * Gets the page path that WordPress reads from a URL of an Analytics report, on a site with plain permalinks.
 *
 * On plain permalinks, which have no permalink structure, WordPress serves
 * every page at the home path, and reads the post from the query string,
 * such as `/?p=123`. So the page path keeps only the public query vars, in
 * the order of the URL. The URLs of one post with different campaign query
 * args, such as `utm_source`, then share one page path.
 *
 * A URL at any other path isn't a WordPress page, such as a page of another
 * app on the same Analytics property. So the function returns `null` for it.
 *
 * @since n.e.x.t
 *
 * @param {string}        url             The URL of the report row, its path and its query string, such as `/?p=123&utm_source=newsletter`.
 * @param {string}        siteURL         The URL of the site, such as `https://example.com/blog/`, whose path is the home path.
 * @param {Array<string>} publicQueryVars The query vars that WordPress reads from a URL, such as `p` and `page_id`.
 * @return {(string|null)} The page path, such as `/?p=123`, or `null` where the URL isn't a page at the home path.
 */
export function getPlainPermalinkPagePath(
	url: string,
	siteURL: string,
	publicQueryVars: string[]
): string | null {
	// Analytics can record a value that isn't a path, such as `(not set)`.
	if ( ! url.startsWith( '/' ) ) {
		return null;
	}

	let site: URL;
	let page: URL;

	try {
		site = new URL( siteURL );
		page = new URL( url, site );
	} catch {
		return null;
	}

	// A spam path, such as `//example.org/` or `/\example.org/`, resolves to
	// another site.
	if ( page.origin !== site.origin ) {
		return null;
	}

	const homePath = site.pathname.endsWith( '/' )
		? site.pathname
		: `${ site.pathname }/`;

	if (
		page.pathname !== homePath &&
		page.pathname !== `${ homePath }index.php`
	) {
		return null;
	}

	const queryArgs = Object.fromEntries(
		Object.entries( getQueryArgs( url ) ).filter(
			// WordPress ignores a query var with an empty value, such as `p=`.
			( [ key, value ] ) =>
				value !== '' && publicQueryVars.includes( key )
		)
	);

	return addQueryArgs( homePath, queryArgs );
}
