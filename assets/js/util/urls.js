/**
 * URL pathname getter utility function.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * Returns the path from a URL, omitting its protocol, hostname, query params, and hash.
 *
 * @since 1.24.0
 *
 * @param {string} url The URL to get the path from.
 * @return {string} The URL path.
 */
export function getURLPath( url ) {
	try {
		return new URL( url ).pathname;
	} catch {}

	return null;
}

/**
 * Returns the absolute URL from a path including the siteURL.
 *
 * @since 1.32.0
 *
 * @param {string} siteURL The siteURL fo the WordPress install.
 * @param {string} path    The path.
 * @return {string} The URL path.
 */
export function getFullURL( siteURL, path ) {
	try {
		return new URL( path, siteURL ).href;
	} catch {}

	return (
		( typeof siteURL === 'string' ? siteURL : '' ) +
		( typeof path === 'string' ? path : '' )
	);
}

/**
 * Normalizes URL by removing protocol, www subdomain and trailing slash.
 *
 * @since 1.33.0
 *
 * @param {string} incomingURL The original URL.
 * @return {string} Normalized URL.
 */
export function normalizeURL( incomingURL ) {
	if ( typeof incomingURL !== 'string' ) {
		return incomingURL;
	}

	return (
		incomingURL
			// Remove protocol and optional "www." prefix from the URL.
			.replace( /^https?:\/\/(www\.)?/i, '' )
			// Remove trailing slash.
			.replace( /\/$/, '' )
	);
}

/**
 * Checks if a string is not a full URL and simply a hash / anchor link.
 *
 * @since n.e.x.t
 *
 * @param {string} url The URL or Hash string to test.
 * @return {boolean} Returns true if the string is only a hash and not a full URL.
 */
export function isHashOnly( url ) {
	return /^#\w[A-Za-z0-9-_]*$/.test( url );
}
