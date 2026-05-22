/**
 * PDF export utilities.
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
 * Sanitizes a free-form string into a lowercase, hyphen-separated slug
 * suitable for use inside a filename.
 *
 * @since n.e.x.t
 *
 * @param {string} value Input string. Empty and non-string values become an empty slug.
 * @return {string} The sanitized slug.
 */
function slugify( value: unknown ): string {
	if ( typeof value !== 'string' || value.length === 0 ) {
		return '';
	}

	const withoutScheme = value.replace( /^[a-z][a-z0-9+\-.]*:\/\//i, '' );

	return withoutScheme
		.toLowerCase()
		.replace( /[^a-z0-9]+/g, '-' )
		.replace( /^-+|-+$/g, '' );
}

/**
 * Returns the current date as `YYYY-MM-DD` using the local timezone.
 *
 * @since n.e.x.t
 *
 * @param {Date} [now] Optional date instance, defaults to `new Date()`.
 * @return {string} The formatted date.
 */
function getISODate( now: Date = new Date() ): string {
	const year = now.getFullYear();
	const month = String( now.getMonth() + 1 ).padStart( 2, '0' );
	const day = String( now.getDate() ).padStart( 2, '0' );

	return `${ year }-${ month }-${ day }`;
}

/**
 * Builds a sanitized PDF filename for the dashboard export.
 *
 * The result is `site-kit-<site>-<dateRange>-<date>.pdf` when a date range
 * is supplied, or `site-kit-<site>-<date>.pdf` otherwise. The site and date
 * range are passed through `slugify` so the filename is filesystem-safe on
 * every supported OS.
 *
 * @since n.e.x.t
 *
 * @param {string}  siteName    Site name or URL.
 * @param {string} [dateRange]  Optional date range slug, e.g. `last-28-days`.
 * @param {Date}   [now]        Optional date instance, defaults to `new Date()`.
 * @return {string} The composed filename.
 */
export function getPDFFilename(
	siteName: string,
	dateRange?: string,
	now: Date = new Date()
): string {
	const siteSlug = slugify( siteName ) || 'report';
	const rangeSlug = slugify( dateRange );
	const date = getISODate( now );

	const segments = [ 'site-kit', siteSlug ];
	if ( rangeSlug ) {
		segments.push( rangeSlug );
	}
	segments.push( date );

	return `${ segments.join( '-' ) }.pdf`;
}
