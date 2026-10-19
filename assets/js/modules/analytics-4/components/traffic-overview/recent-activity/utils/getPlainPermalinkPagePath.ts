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
import { buildQueryString, getQueryArgs } from '@wordpress/url';

/**
 * Gets the page path that WordPress reads from a URL on a site with plain
 * permalinks.
 *
 * WordPress builds every plain permalink at the home URL, and reads only its
 * public query vars from a URL. So the page path is the home path followed by
 * the URL's public query vars, in the order of `publicQueryVars`, and every URL
 * of one post gives the same page path, such as `/?p=123` for
 * `/index.php?utm_source=newsletter&p=123`.
 *
 * @since n.e.x.t
 *
 * @param {string}        pagePathPlusQueryString The path and query string of the URL, such as `/?p=123&utm_source=newsletter`.
 * @param {string}        siteURL                 The URL of the site, such as `https://example.com`.
 * @param {Array<string>} publicQueryVars         The query vars WordPress reads from a URL, such as `p` and `page_id`.
 * @return {(string|undefined)} The page path, such as `/?p=123`, or `undefined` for a URL on another origin or at a path other than the home path.
 */
export function getPlainPermalinkPagePath(
	pagePathPlusQueryString: string,
	siteURL: string,
	publicQueryVars: string[]
): string | undefined {
	let site: URL;
	let url: URL;

	try {
		site = new URL( siteURL );
		url = new URL( pagePathPlusQueryString, site );
	} catch {
		return undefined;
	}

	const homePath = site.pathname.endsWith( '/' )
		? site.pathname
		: `${ site.pathname }/`;

	// A request to the home URL without its last slash, or to its `index.php`
	// file, reaches WordPress too.
	if (
		url.origin !== site.origin ||
		! [
			homePath,
			homePath.slice( 0, -1 ),
			`${ homePath }index.php`,
		].includes( url.pathname )
	) {
		return undefined;
	}

	// `getQueryArgs()` keeps the last value of a query var that a URL repeats,
	// as PHP does.
	const queryArgs = getQueryArgs( pagePathPlusQueryString );

	const query = buildQueryString(
		Object.fromEntries(
			publicQueryVars
				.filter( ( name ) => name in queryArgs )
				.map( ( name ) => [ name, queryArgs[ name ] ] )
		)
	);

	return query ? `${ homePath }?${ query }` : homePath;
}
