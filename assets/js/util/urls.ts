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
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';

/**
 * Returns the path from a URL, omitting its protocol, hostname, query params, and hash.
 *
 * @since 1.24.0
 *
 * @param {string} url The URL to get the path from.
 * @return {string} The URL path.
 */
export function getURLPath( url: string | boolean | null ): string | null {
	try {
		return new URL( url as string ).pathname;
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
export function getFullURL(
	siteURL: string | boolean,
	path: string | boolean
): string {
	try {
		return new URL( path as string, siteURL as string ).href;
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
export function normalizeURL( incomingURL: string ): string {
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
 * @since 1.49.0
 *
 * @param {string} url The URL or Hash string to test.
 * @return {boolean} Returns true if the string is only a hash and not a full URL.
 */
export function isHashOnly( url: string ): boolean {
	return /^#\w[A-Za-z0-9-_]*$/.test( url );
}

/**
 * Shortens a URL to fit a given length.
 *
 * @since 1.49.0
 *
 * @param {string} url      The original URL to shorten.
 * @param {number} maxChars The maximum length of the URL.
 * @return {string} The shortened URL.
 */
export function shortenURL(
	url: string | null | undefined,
	maxChars: number | null | undefined
): string | null | undefined {
	if ( ! isURL( url as string ) ) {
		return url;
	}

	const urlString = url as string;
	const maxCharsValue = maxChars as number;

	if ( urlString.length <= maxCharsValue ) {
		return urlString;
	}

	const urlObject = new URL( urlString );
	const shortenedURL = urlString.replace( urlObject.origin, '' );
	if ( shortenedURL.length < maxCharsValue ) {
		return shortenedURL;
	}

	const extraChars = shortenedURL.length - Math.floor( maxCharsValue ) + 1; // 1 is the length of "…".
	return '…' + shortenedURL.substr( extraChars );
}
