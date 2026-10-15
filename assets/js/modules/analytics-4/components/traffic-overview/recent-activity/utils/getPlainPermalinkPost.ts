/**
 * Recent activity plain permalink post helper.
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

export interface PlainPermalinkPost {
	/** The post type: `post` for the `p` query var, or `page` for the `page_id` query var. */
	type: 'post' | 'page';
	/** The ID of the post or page. */
	id: number;
	/** The path and query string of the URL that `get_permalink()` builds for the post or page, such as `/?p=123` or `/?page_id=45`. */
	path: string;
}

/**
 * Gets the post or page that a URL shows on a site with plain permalinks.
 *
 * The function reads the query string the way `WP_Query::parse_query()` reads
 * it for a post or a page:
 *
 * - `p` holds the ID of a post, or of a page with `post_type=page`.
 * - `page_id` holds the ID of a page.
 *
 * So `/?p=123` and `/?p=123&utm_source=newsletter` show the same post. The
 * function finds no post or page for:
 *
 * - A URL of another post type, such as `/?product=hoodie`.
 * - A URL of no single post, such as the home page or a search.
 * - A URL at a path other than the home URL's, since WordPress builds every
 *   plain permalink at the home URL.
 *
 * @since n.e.x.t
 *
 * @param {string} pagePathPlusQueryString The path and query string of the URL, such as `/?p=123&utm_source=newsletter`.
 * @param {string} siteURL                 The URL of the site, such as `https://example.com`.
 * @return {(Object|undefined)} The post or page, or `undefined` when the URL shows neither.
 */
export function getPlainPermalinkPost(
	pagePathPlusQueryString: string,
	siteURL: string
): PlainPermalinkPost | undefined {
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

	// WordPress builds a plain permalink at the home URL. A request there
	// without the last slash, or to its `index.php` file, reaches WordPress too.
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

	// PHP keeps the last value of a query var that a URL repeats.
	function getQueryVar( name: string ) {
		return url.searchParams.getAll( name ).pop() ?? '';
	}

	const postType = getQueryVar( 'post_type' );

	if ( postType && postType !== 'post' && postType !== 'page' ) {
		return undefined;
	}

	const postID = parseInt( getQueryVar( 'p' ), 10 );

	if ( postID > 0 ) {
		return postType === 'page'
			? {
					type: 'page',
					id: postID,
					path: `${ homePath }?page_id=${ postID }`,
			  }
			: { type: 'post', id: postID, path: `${ homePath }?p=${ postID }` };
	}

	const pageID = parseInt( getQueryVar( 'page_id' ), 10 );

	if ( pageID > 0 ) {
		return {
			type: 'page',
			id: pageID,
			path: `${ homePath }?page_id=${ pageID }`,
		};
	}

	return undefined;
}
