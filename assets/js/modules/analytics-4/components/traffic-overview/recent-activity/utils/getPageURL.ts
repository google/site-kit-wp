/**
 * Recent activity page URL helper.
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
 * Gets the URL of a page on the site from the page path in an Analytics report.
 *
 * Analytics can record a value that isn't a path, such as `(not set)`. It can
 * also record a path that resolves to another site, such as `//example.org/`
 * or `/\example.org/`, when spam reaches the property. Neither gets a URL, so
 * a link never leaves the site.
 *
 * @since n.e.x.t
 *
 * @param {string} siteURL  The URL of the site, such as `https://example.com`.
 * @param {string} pagePath The page path, such as `/hello-world/`.
 * @return {(string|undefined)} The URL of the page, or `undefined` when the page path is not a path on the site.
 */
export function getPageURL(
	siteURL: string,
	pagePath: string
): string | undefined {
	if ( ! pagePath.startsWith( '/' ) ) {
		return undefined;
	}

	try {
		const site = new URL( siteURL );
		const page = new URL( pagePath, site );

		return page.origin === site.origin ? page.href : undefined;
	} catch {
		return undefined;
	}
}
